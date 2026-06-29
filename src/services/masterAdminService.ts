import { supabase } from "@/integrations/supabase/client";

const supabaseAny = supabase as any;

export type StoreStatus = "active" | "inactive" | "trial" | "suspended" | "pending_setup" | "cancelled";
export type StoreThemeMode = "light" | "dark" | "system";

export interface MasterStore {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  document: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  display_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  theme_mode: StoreThemeMode;
  status: StoreStatus;
  plan: string | null;
  plan_id: string | null;
  max_users: number | null;
  max_architects: number | null;
  max_products: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  users_count: number;
  architects_count: number;
  sellers_count: number;
  products_count: number;
  brands_count: number;
}

export interface StoreFormValues {
  name: string;
  slug: string;
  legal_name: string;
  document: string;
  email: string;
  phone: string;
  website: string;
  status: StoreStatus;
  plan: string;
  max_users: string;
  max_architects: string;
  max_products: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  theme_mode: StoreThemeMode;
  notes: string;
}

export interface MasterAdminStats {
  totalStores: number;
  activeStores: number;
  trialStores: number;
  suspendedStores: number;
  totalUsers: number;
  totalArchitects: number;
  totalSellers: number;
  totalProductsReleased: number;
  totalBrands: number;
  recentStores: MasterStore[];
}

const STORE_SELECT = [
  "id",
  "name",
  "slug",
  "legal_name",
  "document",
  "cnpj",
  "email",
  "phone",
  "website",
  "display_name",
  "logo_url",
  "favicon_url",
  "primary_color",
  "secondary_color",
  "accent_color",
  "background_color",
  "text_color",
  "theme_mode",
  "status",
  "plan",
  "plan_id",
  "max_users",
  "max_architects",
  "max_products",
  "notes",
  "created_by",
  "created_at",
  "updated_at",
].join(", ");

function cleanText(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toNullableNumber(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function emptyStoreFormValues(): StoreFormValues {
  return {
    name: "",
    slug: "",
    legal_name: "",
    document: "",
    email: "",
    phone: "",
    website: "",
    status: "active",
    plan: "",
    max_users: "",
    max_architects: "",
    max_products: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#111827",
    secondary_color: "#6B7280",
    accent_color: "#000000",
    theme_mode: "light",
    notes: "",
  };
}

export interface StoreBrandingValues {
  display_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  theme_mode: StoreThemeMode;
}

export const STORE_BRANDING_FALLBACK = {
  primary_color: "#111827",
  secondary_color: "#6B7280",
  accent_color: "#C9952F",
  background_color: "#FFFFFF",
  text_color: "#111827",
  theme_mode: "light" as StoreThemeMode,
};

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function normalizeHexColor(value: string, fallback: string) {
  const color = value.trim();
  if (!color) return fallback;
  if (!HEX_COLOR_PATTERN.test(color)) throw new Error("Informe cores em HEX valido, como #111111.");
  return color.toUpperCase();
}

function validateOptionalUrl(value: string, fieldLabel: string) {
  const url = value.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid");
    return url;
  } catch {
    throw new Error(`${fieldLabel} precisa ser uma URL valida.`);
  }
}

export function storeToBrandingValues(store: MasterStore): StoreBrandingValues {
  return {
    display_name: store.display_name ?? "",
    logo_url: store.logo_url ?? "",
    favicon_url: store.favicon_url ?? "",
    primary_color: store.primary_color ?? STORE_BRANDING_FALLBACK.primary_color,
    secondary_color: store.secondary_color ?? STORE_BRANDING_FALLBACK.secondary_color,
    accent_color: store.accent_color ?? STORE_BRANDING_FALLBACK.accent_color,
    background_color: store.background_color ?? STORE_BRANDING_FALLBACK.background_color,
    text_color: store.text_color ?? STORE_BRANDING_FALLBACK.text_color,
    theme_mode: store.theme_mode ?? STORE_BRANDING_FALLBACK.theme_mode,
  };
}

export function normalizeStoreBrandingValues(values: StoreBrandingValues) {
  if (!["light", "dark", "system"].includes(values.theme_mode)) {
    throw new Error("Modo de tema invalido.");
  }

  return {
    display_name: cleanText(values.display_name),
    logo_url: validateOptionalUrl(values.logo_url, "Logo URL"),
    favicon_url: validateOptionalUrl(values.favicon_url, "Favicon URL"),
    primary_color: normalizeHexColor(values.primary_color, STORE_BRANDING_FALLBACK.primary_color),
    secondary_color: normalizeHexColor(values.secondary_color, STORE_BRANDING_FALLBACK.secondary_color),
    accent_color: normalizeHexColor(values.accent_color, STORE_BRANDING_FALLBACK.accent_color),
    background_color: normalizeHexColor(values.background_color, STORE_BRANDING_FALLBACK.background_color),
    text_color: normalizeHexColor(values.text_color, STORE_BRANDING_FALLBACK.text_color),
    theme_mode: values.theme_mode,
  };
}

export function storeToFormValues(store: MasterStore): StoreFormValues {
  return {
    name: store.name ?? "",
    slug: store.slug ?? "",
    legal_name: store.legal_name ?? "",
    document: store.document ?? store.cnpj ?? "",
    email: store.email ?? "",
    phone: store.phone ?? "",
    website: store.website ?? "",
    status: store.status ?? "active",
    plan: store.plan ?? "",
    max_users: store.max_users?.toString() ?? "",
    max_architects: store.max_architects?.toString() ?? "",
    max_products: store.max_products?.toString() ?? "",
    logo_url: store.logo_url ?? "",
    favicon_url: store.favicon_url ?? "",
    primary_color: store.primary_color ?? "#111827",
    secondary_color: store.secondary_color ?? "#6B7280",
    accent_color: store.accent_color ?? "#000000",
    theme_mode: store.theme_mode ?? "light",
    notes: store.notes ?? "",
  };
}

function storePayload(values: StoreFormValues, userId: string) {
  return {
    name: values.name.trim(),
    slug: values.slug.trim().toLowerCase(),
    legal_name: cleanText(values.legal_name),
    document: cleanText(values.document),
    cnpj: cleanText(values.document),
    email: cleanText(values.email),
    phone: cleanText(values.phone),
    website: cleanText(values.website),
    logo_url: cleanText(values.logo_url),
    favicon_url: cleanText(values.favicon_url),
    primary_color: values.primary_color || "#111827",
    secondary_color: values.secondary_color || "#6B7280",
    accent_color: values.accent_color || "#000000",
    theme_mode: values.theme_mode,
    status: values.status,
    plan: cleanText(values.plan),
    max_users: toNullableNumber(values.max_users),
    max_architects: toNullableNumber(values.max_architects),
    max_products: toNullableNumber(values.max_products),
    notes: cleanText(values.notes),
    updated_by: userId,
  };
}

function applyCounts(stores: any[], memberships: any[], products: any[], brands: any[]): MasterStore[] {
  const membershipCounts = new Map<string, { users: number; architects: number; sellers: number }>();
  const productCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();

  memberships.forEach((member) => {
    const current = membershipCounts.get(member.store_id) ?? { users: 0, architects: 0, sellers: 0 };
    current.users += 1;
    if (member.role === "architect") current.architects += 1;
    if (member.role === "seller") current.sellers += 1;
    membershipCounts.set(member.store_id, current);
  });

  products.forEach((item) => productCounts.set(item.store_id, (productCounts.get(item.store_id) ?? 0) + 1));
  brands.forEach((item) => brandCounts.set(item.store_id, (brandCounts.get(item.store_id) ?? 0) + 1));

  return stores.map((store) => {
    const counts = membershipCounts.get(store.id) ?? { users: 0, architects: 0, sellers: 0 };
    return {
      ...store,
      theme_mode: store.theme_mode ?? "light",
      document: store.document ?? store.cnpj ?? null,
      display_name: store.display_name ?? null,
      primary_color: store.primary_color ?? STORE_BRANDING_FALLBACK.primary_color,
      secondary_color: store.secondary_color ?? STORE_BRANDING_FALLBACK.secondary_color,
      accent_color: store.accent_color ?? STORE_BRANDING_FALLBACK.accent_color,
      background_color: store.background_color ?? STORE_BRANDING_FALLBACK.background_color,
      text_color: store.text_color ?? STORE_BRANDING_FALLBACK.text_color,
      users_count: counts.users,
      architects_count: counts.architects,
      sellers_count: counts.sellers,
      products_count: productCounts.get(store.id) ?? 0,
      brands_count: brandCounts.get(store.id) ?? 0,
    } as MasterStore;
  });
}

export async function listStores() {
  const [{ data: stores, error: storesError }, { data: memberships, error: membershipsError }, { data: products, error: productsError }, { data: brands, error: brandsError }] = await Promise.all([
    supabaseAny.from("stores").select(STORE_SELECT).order("created_at", { ascending: false }),
    supabaseAny.from("store_members").select("store_id, role, status").eq("status", "active"),
    supabaseAny.from("store_products").select("store_id, status").eq("status", "active"),
    supabaseAny.from("store_brands").select("store_id, status").eq("status", "active"),
  ]);

  const error = storesError || membershipsError || productsError || brandsError;
  if (error) throw error;

  return applyCounts(stores ?? [], memberships ?? [], products ?? [], brands ?? []);
}

export async function getStore(storeId: string) {
  const stores = await listStores();
  return stores.find((store) => store.id === storeId) ?? null;
}

export async function listPlans() {
  const [{ data: plans }, { data: stores }] = await Promise.all([
    supabaseAny.from("plans").select("name").eq("status", "active").order("name"),
    supabaseAny.from("stores").select("plan").not("plan", "is", null).order("plan"),
  ]);

  return Array.from(new Set([...(plans ?? []).map((plan: any) => plan.name), ...(stores ?? []).map((store: any) => store.plan)].filter(Boolean))) as string[];
}

export async function getMasterAdminStats(): Promise<MasterAdminStats> {
  const stores = await listStores();
  const totalBrands = stores.reduce((sum, store) => sum + store.brands_count, 0);

  return {
    totalStores: stores.length,
    activeStores: stores.filter((store) => store.status === "active").length,
    trialStores: stores.filter((store) => store.status === "trial").length,
    suspendedStores: stores.filter((store) => store.status === "suspended").length,
    totalUsers: stores.reduce((sum, store) => sum + store.users_count, 0),
    totalArchitects: stores.reduce((sum, store) => sum + store.architects_count, 0),
    totalSellers: stores.reduce((sum, store) => sum + store.sellers_count, 0),
    totalProductsReleased: stores.reduce((sum, store) => sum + store.products_count, 0),
    totalBrands,
    recentStores: stores.slice(0, 5),
  };
}

export async function assertUniqueSlug(slug: string, currentStoreId?: string) {
  const { data, error } = await supabaseAny.from("stores").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (data && data.id !== currentStoreId) {
    throw new Error("Este slug ja esta em uso por outra loja.");
  }
}

export async function createStore(values: StoreFormValues, userId: string) {
  await assertUniqueSlug(values.slug);
  const payload = {
    ...storePayload(values, userId),
    created_by: userId,
  };

  const { data, error } = await supabaseAny.from("stores").insert(payload).select(STORE_SELECT).single();
  if (error) throw error;
  await writeAuditLog(userId, data.id, "store.created", "store", data.id, { store: data });
  return data as MasterStore;
}

export async function updateStore(storeId: string, values: StoreFormValues, userId: string) {
  await assertUniqueSlug(values.slug, storeId);
  const payload = storePayload(values, userId);
  const { data, error } = await supabaseAny.from("stores").update(payload).eq("id", storeId).select(STORE_SELECT).single();
  if (error) throw error;
  await writeAuditLog(userId, storeId, "store.updated", "store", storeId, { store: data });
  return data as MasterStore;
}

export async function updateStoreStatus(storeId: string, status: StoreStatus, userId: string) {
  const { data, error } = await supabaseAny
    .from("stores")
    .update({ status, updated_by: userId })
    .eq("id", storeId)
    .select(STORE_SELECT)
    .single();

  if (error) throw error;
  await writeAuditLog(userId, storeId, `store.status.${status}`, "store", storeId, { status });
  return data as MasterStore;
}

export async function updateStoreBranding(storeId: string, values: StoreBrandingValues, userId: string) {
  const payload = {
    ...normalizeStoreBrandingValues(values),
    updated_by: userId,
  };

  const { data: previous, error: previousError } = await supabaseAny
    .from("stores")
    .select(STORE_SELECT)
    .eq("id", storeId)
    .maybeSingle();

  if (previousError) throw previousError;
  if (!previous) throw new Error("Loja nao encontrada.");

  const { data, error } = await supabaseAny
    .from("stores")
    .update(payload)
    .eq("id", storeId)
    .select(STORE_SELECT)
    .single();

  if (error) throw error;

  const changedFields = Object.keys(payload)
    .filter((key) => key !== "updated_by")
    .filter((key) => (previous as any)[key] !== (data as any)[key]);

  await writeAuditLog(userId, storeId, "store_branding_updated", "store", storeId, {
    changed_fields: changedFields,
    before: changedFields.reduce((acc, key) => ({ ...acc, [key]: (previous as any)[key] ?? null }), {}),
    after: changedFields.reduce((acc, key) => ({ ...acc, [key]: (data as any)[key] ?? null }), {}),
  });

  return data as MasterStore;
}

async function writeAuditLog(userId: string, storeId: string | null, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  try {
    await supabaseAny.from("audit_logs").insert({
      actor_user_id: userId,
      actor_role: "master_admin",
      store_id: storeId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (error) {
    console.warn("Audit log write failed:", error);
  }
}
