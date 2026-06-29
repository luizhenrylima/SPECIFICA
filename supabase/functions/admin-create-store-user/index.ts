import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const roles = new Set(["store_admin", "manager", "seller", "financial", "architect"]);
const statuses = new Set(["active", "inactive", "invited", "pending", "suspended"]);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length ? text : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("") + "Aa1!";
}

async function requireMasterAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { response: jsonResponse({ error: "Supabase environment is not configured" }, 500) };
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) return { response: jsonResponse({ error: "Unauthorized" }, 401) };

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: isMasterAdmin, error: roleError } = await adminClient.rpc("is_master_admin_user", {
    target_user_id: user.id,
  });
  if (roleError || !isMasterAdmin) return { response: jsonResponse({ error: "Master Admin only" }, 403) };

  return { supabase: adminClient, user };
}

async function findAuthUserByEmail(supabase: any, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data?.users?.find((user: any) => String(user.email ?? "").toLowerCase() === email);
    if (found) return found;
    if (!data?.users || data.users.length < 1000) return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await requireMasterAdmin(req);
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => ({}));
    const storeId = body.store_id;
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = cleanText(body.full_name);
    const phone = cleanText(body.phone);
    const role = String(body.role ?? "");
    const status = String(body.status ?? "invited");

    if (!isUuid(storeId)) return jsonResponse({ error: "Loja invalida" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: "Email invalido" }, 400);
    if (!roles.has(role)) return jsonResponse({ error: "Role invalida" }, 400);
    if (!statuses.has(status)) return jsonResponse({ error: "Status invalido" }, 400);

    const { data: store, error: storeError } = await auth.supabase
      .from("stores")
      .select("id, name")
      .eq("id", storeId)
      .maybeSingle();
    if (storeError) throw storeError;
    if (!store) return jsonResponse({ error: "Loja nao encontrada" }, 404);

    const { data: existingProfile, error: profileLookupError } = await auth.supabase
      .from("profiles")
      .select("user_id, full_name, email, phone, active, approved, last_login_at, created_at")
      .ilike("email", email)
      .limit(1);
    if (profileLookupError) throw profileLookupError;

    let userId = existingProfile?.[0]?.user_id ?? null;
    let createdAuthUser = false;

    if (!userId) {
      const authUser = await findAuthUserByEmail(auth.supabase, email);
      if (authUser?.id) {
        userId = authUser.id;
      } else {
        const { data: created, error: createError } = await auth.supabase.auth.admin.createUser({
          email,
          password: randomPassword(),
          email_confirm: true,
          user_metadata: { full_name: fullName ?? email },
        });
        if (createError) return jsonResponse({ error: createError.message }, 400);
        userId = created.user?.id ?? null;
        createdAuthUser = true;
      }
    }

    if (!userId) return jsonResponse({ error: "Usuario nao foi criado" }, 500);

    const { data: duplicated, error: duplicatedError } = await auth.supabase
      .from("store_members")
      .select("id")
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .maybeSingle();
    if (duplicatedError) throw duplicatedError;
    if (duplicated) return jsonResponse({ error: "Este usuario ja esta vinculado a esta loja." }, 409);

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        email,
        full_name: fullName ?? existingProfile?.[0]?.full_name ?? email,
        phone: phone ?? existingProfile?.[0]?.phone ?? null,
        approved: true,
        active: true,
      }, { onConflict: "user_id" })
      .select("user_id, full_name, email, phone, active, approved, last_login_at, created_at")
      .single();
    if (profileError) throw profileError;

    const now = new Date().toISOString();
    const { data: member, error: memberError } = await auth.supabase
      .from("store_members")
      .insert({
        store_id: storeId,
        user_id: userId,
        role,
        status,
        invited_by: auth.user.id,
        invited_at: status === "invited" ? now : null,
        accepted_at: status === "active" ? now : null,
      })
      .select("id, store_id, user_id, role, status, invited_by, invited_at, accepted_at, created_at, updated_at")
      .single();
    if (memberError) throw memberError;

    await auth.supabase.from("audit_logs").insert({
      actor_user_id: auth.user.id,
      actor_role: "master_admin",
      store_id: storeId,
      action: createdAuthUser ? "store_user.invited" : "store_user.linked",
      entity_type: "store_member",
      entity_id: member.id,
      metadata: { user_id: userId, email, role, status, created_auth_user: createdAuthUser },
    });

    return jsonResponse({
      success: true,
      member,
      profile,
      created_auth_user: createdAuthUser,
      message: createdAuthUser
        ? "Usuario vinculado a loja. O envio automatico de convite podera ser implementado depois."
        : "Usuario vinculado a loja.",
    });
  } catch (error) {
    console.error("admin-create-store-user error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});
