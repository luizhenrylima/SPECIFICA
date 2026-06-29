import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

const supabaseAny = supabase as any;

export type StoreUserRole = "store_admin" | "manager" | "seller" | "financial" | "architect";
export type StoreUserStatus = "active" | "inactive" | "invited" | "pending" | "suspended";

export const STORE_USER_ROLES: Array<{ value: StoreUserRole; label: string; description: string }> = [
  { value: "store_admin", label: "Admin da loja", description: "Gerencia acessos, loja, operacao e configuracoes." },
  { value: "manager", label: "Gerente", description: "Acompanha operacao, equipe, projetos e indicadores." },
  { value: "seller", label: "Vendedor", description: "Atua em clientes, projetos, orcamentos e pedidos." },
  { value: "financial", label: "Financeiro", description: "Acessa aprovacoes, pagamentos e relatorios financeiros." },
  { value: "architect", label: "Arquiteto", description: "Acessa catalogo, favoritos, projetos e orcamentos." },
];

export const STORE_USER_STATUSES: Array<{ value: StoreUserStatus; label: string }> = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "invited", label: "Convidado" },
  { value: "pending", label: "Pendente" },
  { value: "suspended", label: "Suspenso" },
];

export interface StoreUserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  approved: boolean | null;
  last_login_at: string | null;
  created_at: string | null;
}

export interface StoreUserMember {
  id: string;
  store_id: string;
  user_id: string;
  role: StoreUserRole;
  status: StoreUserStatus;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  profile: StoreUserProfile | null;
}

export interface StoreUserFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: StoreUserRole;
  status: StoreUserStatus;
}

const MEMBER_SELECT = "id, store_id, user_id, role, status, invited_by, invited_at, accepted_at, created_at, updated_at";
const PROFILE_SELECT = "user_id, full_name, email, phone, active, approved, last_login_at, created_at";

function cleanText(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length ? trimmed : null;
}

async function getFunctionErrorMessage(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return body.error;
      if (typeof body?.message === "string") return body.message;
    } catch {
      // Fall back to the SDK message below.
    }
  }

  if (error instanceof Error) return error.message;
  return "Nao foi possivel criar o usuario. Tente novamente.";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function roleLabel(role: StoreUserRole | string) {
  return STORE_USER_ROLES.find((item) => item.value === role)?.label ?? role;
}

export function statusLabel(status: StoreUserStatus | string) {
  return STORE_USER_STATUSES.find((item) => item.value === status)?.label ?? status;
}

function validateRole(role: string): asserts role is StoreUserRole {
  if (!STORE_USER_ROLES.some((item) => item.value === role)) {
    throw new Error("Role invalida para usuario da loja.");
  }
}

function validateStatus(status: string): asserts status is StoreUserStatus {
  if (!STORE_USER_STATUSES.some((item) => item.value === status)) {
    throw new Error("Status invalido para usuario da loja.");
  }
}

export function validateStoreUserForm(values: StoreUserFormValues) {
  const email = normalizeEmail(values.email);
  if (!values.fullName.trim()) throw new Error("Informe o nome completo do usuario.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail valido.");
  if (!values.password) throw new Error("Informe a senha do usuario.");
  if (!values.confirmPassword) throw new Error("Confirme a senha do usuario.");
  if (values.password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  if (values.password !== values.confirmPassword) throw new Error("Senha e confirmacao precisam ser iguais.");
  validateRole(values.role);
  validateStatus(values.status);
}

async function writeAuditLog(actorUserId: string, storeId: string, action: string, memberId: string | null, metadata: Record<string, unknown>) {
  try {
    await supabaseAny.from("audit_logs").insert({
      actor_user_id: actorUserId,
      actor_role: "master_admin",
      store_id: storeId,
      action,
      entity_type: "store_member",
      entity_id: memberId,
      metadata,
    });
  } catch (error) {
    console.warn("Audit log write failed:", error);
  }
}

function mergeMembersWithProfiles(members: any[], profiles: any[]): StoreUserMember[] {
  const profileByUserId = new Map<string, StoreUserProfile>();
  profiles.forEach((profile) => profileByUserId.set(profile.user_id, profile as StoreUserProfile));

  return members.map((member) => ({
    ...member,
    role: member.role as StoreUserRole,
    status: member.status as StoreUserStatus,
    profile: profileByUserId.get(member.user_id) ?? null,
  }));
}

export async function listStoreUsers(storeId: string): Promise<StoreUserMember[]> {
  const { data: members, error: membersError } = await supabaseAny
    .from("store_members")
    .select(MEMBER_SELECT)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (membersError) throw membersError;
  const userIds = Array.from(new Set((members ?? []).map((member: any) => member.user_id).filter(Boolean)));
  if (userIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabaseAny
    .from("profiles")
    .select(PROFILE_SELECT)
    .in("user_id", userIds);

  if (profilesError) throw profilesError;
  return mergeMembersWithProfiles(members ?? [], profiles ?? []);
}

async function assertCanChangeLastStoreAdmin(member: StoreUserMember, nextRole?: StoreUserRole, nextStatus?: StoreUserStatus) {
  const isLosingActiveAdmin =
    member.role === "store_admin"
    && member.status === "active"
    && ((nextRole && nextRole !== "store_admin") || (nextStatus && nextStatus !== "active"));

  if (!isLosingActiveAdmin) return;

  const { count, error } = await supabaseAny
    .from("store_members")
    .select("id", { count: "exact", head: true })
    .eq("store_id", member.store_id)
    .eq("role", "store_admin")
    .eq("status", "active");

  if (error) throw error;
  if ((count ?? 0) <= 1) {
    throw new Error("Nao e permitido remover ou inativar o ultimo admin ativo da loja.");
  }
}

export async function createStoreUser(storeId: string, values: StoreUserFormValues): Promise<StoreUserMember> {
  validateStoreUserForm(values);
  const email = normalizeEmail(values.email);

  const { data, error } = await supabase.functions.invoke("master-create-store-user", {
    body: {
      store_id: storeId,
      email,
      full_name: cleanText(values.fullName),
      phone: cleanText(values.phone),
      password: values.password,
      role: values.role,
      status: values.status,
    },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(data.error);
  return {
    ...data.member,
    profile: data.profile,
  } as StoreUserMember;
}

export async function updateStoreUserRole(member: StoreUserMember, role: StoreUserRole, actorUserId: string) {
  validateRole(role);
  await assertCanChangeLastStoreAdmin(member, role);

  const { data, error } = await supabaseAny
    .from("store_members")
    .update({ role })
    .eq("id", member.id)
    .eq("store_id", member.store_id)
    .select(MEMBER_SELECT)
    .single();

  if (error) throw error;
  await writeAuditLog(actorUserId, member.store_id, "store_user_role_changed", member.id, { user_id: member.user_id, from: member.role, to: role });
  return { ...(data as StoreUserMember), profile: member.profile };
}

export async function updateStoreUserStatus(member: StoreUserMember, status: StoreUserStatus, actorUserId: string) {
  validateStatus(status);
  await assertCanChangeLastStoreAdmin(member, undefined, status);

  const payload: Record<string, string | null> = { status };
  if (status === "invited") payload.invited_at = new Date().toISOString();
  if (status === "active" && !member.accepted_at) payload.accepted_at = new Date().toISOString();

  const { data, error } = await supabaseAny
    .from("store_members")
    .update(payload)
    .eq("id", member.id)
    .eq("store_id", member.store_id)
    .select(MEMBER_SELECT)
    .single();

  if (error) throw error;
  await writeAuditLog(actorUserId, member.store_id, "store_user_status_changed", member.id, { user_id: member.user_id, from: member.status, to: status });
  return { ...(data as StoreUserMember), profile: member.profile };
}

export async function removeStoreUser(member: StoreUserMember, actorUserId: string) {
  await assertCanChangeLastStoreAdmin(member, member.role === "store_admin" ? "seller" : member.role);

  const { error } = await supabaseAny
    .from("store_members")
    .delete()
    .eq("id", member.id)
    .eq("store_id", member.store_id);

  if (error) throw error;
  await writeAuditLog(actorUserId, member.store_id, "store_user_removed", member.id, { user_id: member.user_id, role: member.role });
}

export async function resendStoreUserInvite(member: StoreUserMember, actorUserId: string) {
  const { data, error } = await supabaseAny
    .from("store_members")
    .update({ status: "invited", invited_by: actorUserId, invited_at: new Date().toISOString() })
    .eq("id", member.id)
    .eq("store_id", member.store_id)
    .select(MEMBER_SELECT)
    .single();

  if (error) throw error;
  await writeAuditLog(actorUserId, member.store_id, "store_user.invite_resent", member.id, { user_id: member.user_id });
  return { ...(data as StoreUserMember), profile: member.profile };
}
