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

export interface StoreCatalogAccessBrand {
  id: string;
  name: string;
  logo_url: string | null;
  segment: string | null;
  released: boolean;
  products_count: number;
  released_products_count: number;
}

export interface StoreCatalogAccessProduct {
  id: string;
  name: string;
  brand_id: string;
  brand_name: string | null;
  category: string | null;
  released: boolean;
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

function nowIso() {
  return new Date().toISOString();
}

function activeGlobalProductsQuery() {
  return supabaseAny
    .from("products")
    .select("id, brand_id")
    .or("scope.eq.global,scope.is.null")
    .eq("is_hidden", false);
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

export async function listStoreCatalogAccess(storeId: string) {
  const [{ data: brands, error: brandsError }, { data: products, error: productsError }, { data: brandLinks, error: brandLinksError }, { data: productLinks, error: productLinksError }] = await Promise.all([
    supabaseAny.from("brands").select("id, name, logo_url, segment").eq("scope", "global").eq("is_hidden", false).order("name"),
    supabaseAny.from("products").select("id, name, brand_id, category, brands(id, name)").or("scope.eq.global,scope.is.null").eq("is_hidden", false).order("name"),
    supabaseAny.from("store_brands").select("brand_id").eq("store_id", storeId).eq("status", "active").eq("is_active", true),
    supabaseAny.from("store_products").select("product_id").eq("store_id", storeId).eq("status", "active").eq("is_active", true),
  ]);

  const error = brandsError || productsError || brandLinksError || productLinksError;
  if (error) throw error;

  const releasedBrandIds = new Set((brandLinks ?? []).map((item: any) => item.brand_id));
  const releasedProductIds = new Set((productLinks ?? []).map((item: any) => item.product_id));
  const productCounts = new Map<string, number>();
  const releasedProductCounts = new Map<string, number>();
  (products ?? []).forEach((product: any) => productCounts.set(product.brand_id, (productCounts.get(product.brand_id) ?? 0) + 1));
  (products ?? []).forEach((product: any) => {
    if (releasedProductIds.has(product.id)) {
      releasedProductCounts.set(product.brand_id, (releasedProductCounts.get(product.brand_id) ?? 0) + 1);
    }
  });

  return {
    brands: ((brands ?? []) as any[]).map((brand) => ({
      id: brand.id,
      name: brand.name,
      logo_url: brand.logo_url,
      segment: brand.segment,
      released: releasedBrandIds.has(brand.id),
      products_count: productCounts.get(brand.id) ?? 0,
      released_products_count: releasedProductCounts.get(brand.id) ?? 0,
    })) as StoreCatalogAccessBrand[],
    products: ((products ?? []) as any[]).map((product) => ({
      id: product.id,
      name: product.name,
      brand_id: product.brand_id,
      brand_name: product.brands?.name ?? null,
      category: product.category,
      released: releasedProductIds.has(product.id),
    })) as StoreCatalogAccessProduct[],
  };
}

export async function setStoreBrandReleased(storeId: string, brandId: string, released: boolean, actorUserId: string) {
  if (released) {
    const { error } = await supabaseAny.from("store_brands").upsert({
      store_id: storeId,
      brand_id: brandId,
      status: "active",
      is_active: true,
      hidden_by_store: false,
      created_by: actorUserId,
      updated_at: nowIso(),
    }, { onConflict: "store_id,brand_id" });
    if (error) throw error;
  } else {
    const { error } = await supabaseAny.from("store_brands").delete().eq("store_id", storeId).eq("brand_id", brandId);
    if (error) throw error;
  }
  await writeAuditLog(actorUserId, storeId, released ? "store_brand_released" : "store_brand_removed", "brand", brandId, {});
}

export async function grantBrandAccessWithProducts(storeId: string, brandId: string, actorUserId: string) {
  await setStoreBrandReleased(storeId, brandId, true, actorUserId);

  const { data: products, error } = await activeGlobalProductsQuery().eq("brand_id", brandId);
  if (error) throw error;

  const rows = (products ?? []).map((product: any) => ({
    store_id: storeId,
    product_id: product.id,
    status: "active",
    is_active: true,
    custom_visibility: true,
    hidden_by_store: false,
    created_by: actorUserId,
    updated_at: nowIso(),
  }));

  if (rows.length > 0) {
    const { error: productError } = await supabaseAny.from("store_products").upsert(rows, { onConflict: "store_id,product_id" });
    if (productError) throw productError;
  }

  await writeAuditLog(actorUserId, storeId, "store_brand_products_released", "brand", brandId, { products_count: rows.length });
  return rows.length;
}

export async function setStoreProductReleased(storeId: string, productId: string, released: boolean, actorUserId: string) {
  if (released) {
    const { data: product, error: productError } = await supabaseAny.from("products").select("brand_id").eq("id", productId).maybeSingle();
    if (productError) throw productError;
    if (product?.brand_id) await setStoreBrandReleased(storeId, product.brand_id, true, actorUserId);
    const { error } = await supabaseAny.from("store_products").upsert({
      store_id: storeId,
      product_id: productId,
      status: "active",
      is_active: true,
      custom_visibility: true,
      hidden_by_store: false,
      created_by: actorUserId,
      updated_at: nowIso(),
    }, { onConflict: "store_id,product_id" });
    if (error) throw error;
  } else {
    const { error } = await supabaseAny.from("store_products").delete().eq("store_id", storeId).eq("product_id", productId);
    if (error) throw error;
  }
  await writeAuditLog(actorUserId, storeId, released ? "store_product_released" : "store_product_removed", "product", productId, {});
}

export async function setAllStoreBrandsReleased(storeId: string, released: boolean, actorUserId: string) {
  const { data: brands, error } = await supabaseAny.from("brands").select("id").or("scope.eq.global,scope.is.null").eq("is_hidden", false);
  if (error) throw error;
  if (released) {
    const rows = (brands ?? []).map((brand: any) => ({ store_id: storeId, brand_id: brand.id, status: "active", is_active: true, hidden_by_store: false, created_by: actorUserId, updated_at: nowIso() }));
    if (rows.length) {
      const { error: upsertError } = await supabaseAny.from("store_brands").upsert(rows, { onConflict: "store_id,brand_id" });
      if (upsertError) throw upsertError;
    }
  } else {
    const { error: deleteError } = await supabaseAny.from("store_brands").delete().eq("store_id", storeId);
    if (deleteError) throw deleteError;
  }
  await writeAuditLog(actorUserId, storeId, released ? "store_all_brands_released" : "store_all_brands_removed", "store", storeId, {});
}

export async function grantAllBrandsAndProducts(storeId: string, actorUserId: string) {
  const [{ data: brands, error: brandsError }, { data: products, error: productsError }] = await Promise.all([
    supabaseAny.from("brands").select("id").or("scope.eq.global,scope.is.null").eq("is_hidden", false),
    activeGlobalProductsQuery(),
  ]);

  const error = brandsError || productsError;
  if (error) throw error;

  const timestamp = nowIso();
  const brandRows = (brands ?? []).map((brand: any) => ({
    store_id: storeId,
    brand_id: brand.id,
    status: "active",
    is_active: true,
    hidden_by_store: false,
    created_by: actorUserId,
    updated_at: timestamp,
  }));
  const productRows = (products ?? []).map((product: any) => ({
    store_id: storeId,
    product_id: product.id,
    status: "active",
    is_active: true,
    custom_visibility: true,
    hidden_by_store: false,
    created_by: actorUserId,
    updated_at: timestamp,
  }));

  if (brandRows.length > 0) {
    const { error: brandError } = await supabaseAny.from("store_brands").upsert(brandRows, { onConflict: "store_id,brand_id" });
    if (brandError) throw brandError;
  }
  if (productRows.length > 0) {
    const { error: productError } = await supabaseAny.from("store_products").upsert(productRows, { onConflict: "store_id,product_id" });
    if (productError) throw productError;
  }

  await writeAuditLog(actorUserId, storeId, "store_all_brands_products_released", "store", storeId, {
    brands_count: brandRows.length,
    products_count: productRows.length,
  });

  return { brandsCount: brandRows.length, productsCount: productRows.length };
}

export async function setAllStoreProductsReleased(storeId: string, released: boolean, actorUserId: string, brandId?: string) {
  let query = activeGlobalProductsQuery();
  if (brandId) query = query.eq("brand_id", brandId);
  const { data: products, error } = await query;
  if (error) throw error;

  if (released) {
    const brandIds = [...new Set((products ?? []).map((product: any) => product.brand_id).filter(Boolean))];
    if (brandIds.length) {
      const brandRows = brandIds.map((id) => ({ store_id: storeId, brand_id: id, status: "active", is_active: true, hidden_by_store: false, created_by: actorUserId, updated_at: nowIso() }));
      const { error: brandError } = await supabaseAny.from("store_brands").upsert(brandRows, { onConflict: "store_id,brand_id" });
      if (brandError) throw brandError;
    }
    const productRows = (products ?? []).map((product: any) => ({ store_id: storeId, product_id: product.id, status: "active", is_active: true, custom_visibility: true, hidden_by_store: false, created_by: actorUserId, updated_at: nowIso() }));
    if (productRows.length) {
      const { error: productError } = await supabaseAny.from("store_products").upsert(productRows, { onConflict: "store_id,product_id" });
      if (productError) throw productError;
    }
  } else if (brandId) {
    const ids = (products ?? []).map((product: any) => product.id);
    if (ids.length) {
      const { error: deleteError } = await supabaseAny.from("store_products").delete().eq("store_id", storeId).in("product_id", ids);
      if (deleteError) throw deleteError;
    }
  } else {
    const { error: deleteError } = await supabaseAny.from("store_products").delete().eq("store_id", storeId);
    if (deleteError) throw deleteError;
  }
  await writeAuditLog(actorUserId, storeId, released ? "store_products_released" : "store_products_removed", "store", storeId, { brand_id: brandId ?? null });
  return products?.length ?? 0;
}
