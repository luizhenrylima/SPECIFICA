import { supabase } from "@/integrations/supabase/client";
import type { StoreBrandingValues } from "@/services/storesService";
import { normalizeStoreBrandingValues } from "@/services/storesService";
import { recordStorePerformanceEvent } from "@/services/storeCatalogService";

const supabaseAny = supabase as any;

export interface StoreAdminBrand {
  id: string;
  name: string;
  logo_url: string | null;
  segment: string | null;
  scope: "global" | "store";
  owner_store_id: string | null;
  access_id: string | null;
  access_status: string | null;
  hidden_by_store: boolean;
  is_active: boolean;
  products_count: number;
}

export interface StoreAdminProduct {
  id: string;
  name: string;
  brand_id: string;
  brand_name: string | null;
  category: string;
  description: string | null;
  images: string[] | null;
  scope: "global" | "store";
  owner_store_id: string | null;
  access_id: string | null;
  access_status: string | null;
  hidden_by_store: boolean;
  is_active: boolean;
}

export interface StoreOwnedBrandValues {
  name: string;
  logoUrl: string;
  segment: string;
}

export interface StoreOwnedProductValues {
  name: string;
  brandId: string;
  category: string;
  description: string;
  imageUrl: string;
}

function cleanText(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length ? trimmed : null;
}

function isReleasedCatalogLink(link: any) {
  return (link.status ?? "active") === "active"
    && link.is_active !== false
    && link.hidden_by_store !== true
    && link.custom_visibility !== false;
}

function isActiveCatalogLink(link: any) {
  return (link.status ?? "active") === "active" && link.is_active !== false;
}

function isHiddenCatalogRow(row: any) {
  return row?.is_hidden === true;
}

async function writeAuditLog(actorUserId: string, storeId: string, action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown>) {
  try {
    await supabaseAny.from("audit_logs").insert({
      actor_user_id: actorUserId,
      actor_role: "store_admin",
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

export async function getStoreAdminSummary(storeId: string) {
  const [
    members,
    productLinks,
    brandLinks,
    ownedProducts,
    ownedBrands,
  ] = await Promise.all([
    supabaseAny.from("store_members").select("role,status").eq("store_id", storeId),
    supabaseAny.from("store_products").select("hidden_by_store,is_active,status,custom_visibility").eq("store_id", storeId),
    supabaseAny.from("store_brands").select("hidden_by_store,is_active,status").eq("store_id", storeId),
    supabaseAny.from("products").select("id,is_hidden").eq("scope", "store").eq("owner_store_id", storeId),
    supabaseAny.from("brands").select("id,is_hidden").eq("scope", "store").eq("owner_store_id", storeId),
  ]);

  const error = members.error || productLinks.error || brandLinks.error || ownedProducts.error || ownedBrands.error;
  if (error) throw error;

  const activeMembers = (members.data ?? []).filter((item: any) => item.status === "active");
  const visibleProducts = [
    ...(productLinks.data ?? []).filter(isReleasedCatalogLink),
    ...(ownedProducts.data ?? []).filter((item: any) => !isHiddenCatalogRow(item)),
  ];
  const hiddenProducts = [
    ...(productLinks.data ?? []).filter((item: any) => !isReleasedCatalogLink(item)),
    ...(ownedProducts.data ?? []).filter(isHiddenCatalogRow),
  ];
  const visibleBrands = [
    ...(brandLinks.data ?? []).filter(isReleasedCatalogLink),
    ...(ownedBrands.data ?? []).filter((item: any) => !isHiddenCatalogRow(item)),
  ];
  const hiddenBrands = [
    ...(brandLinks.data ?? []).filter((item: any) => !isReleasedCatalogLink(item)),
    ...(ownedBrands.data ?? []).filter(isHiddenCatalogRow),
  ];

  return {
    users: activeMembers.length,
    sellers: activeMembers.filter((item: any) => item.role === "seller").length,
    architects: activeMembers.filter((item: any) => item.role === "architect").length,
    financial: activeMembers.filter((item: any) => item.role === "financial").length,
    managers: activeMembers.filter((item: any) => item.role === "manager").length,
    visibleProducts: visibleProducts.length,
    hiddenProducts: hiddenProducts.length,
    visibleBrands: visibleBrands.length,
    hiddenBrands: hiddenBrands.length,
  };
}

export async function listStoreAdminBrands(storeId: string): Promise<StoreAdminBrand[]> {
  const [{ data: links, error: linksError }, { data: owned, error: ownedError }, { data: productCounts, error: countsError }] = await Promise.all([
    supabaseAny
      .from("store_brands")
      .select("id, brand_id, status, is_active, hidden_by_store, brands(id, name, logo_url, segment, scope, owner_store_id, is_hidden)")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false }),
    supabaseAny
      .from("brands")
      .select("id, name, logo_url, segment, scope, owner_store_id, is_hidden")
      .eq("scope", "store")
      .eq("owner_store_id", storeId)
      .order("name"),
    supabaseAny
      .from("products")
      .select("brand_id, is_hidden")
      .or(`owner_store_id.eq.${storeId},scope.eq.global`),
  ]);

  const error = linksError || ownedError || countsError;
  if (error) throw error;

  const counts = new Map<string, number>();
  (productCounts ?? [])
    .filter((row: any) => !isHiddenCatalogRow(row))
    .forEach((row: any) => counts.set(row.brand_id, (counts.get(row.brand_id) ?? 0) + 1));
  const rows = new Map<string, StoreAdminBrand>();

  (links ?? []).forEach((link: any) => {
    const brand = link.brands;
    if (!brand || isHiddenCatalogRow(brand)) return;
    rows.set(brand.id, {
      id: brand.id,
      name: brand.name,
      logo_url: brand.logo_url,
      segment: brand.segment,
      scope: brand.scope ?? "global",
      owner_store_id: brand.owner_store_id,
      access_id: link.id,
      access_status: link.status,
      hidden_by_store: link.hidden_by_store === true,
      is_active: isActiveCatalogLink(link),
      products_count: counts.get(brand.id) ?? 0,
    });
  });

  (owned ?? []).forEach((brand: any) => {
    rows.set(brand.id, {
      id: brand.id,
      name: brand.name,
      logo_url: brand.logo_url,
      segment: brand.segment,
      scope: "store",
      owner_store_id: brand.owner_store_id,
      access_id: null,
      access_status: "active",
      hidden_by_store: isHiddenCatalogRow(brand),
      is_active: !isHiddenCatalogRow(brand),
      products_count: counts.get(brand.id) ?? 0,
    });
  });

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function listStoreAdminProducts(storeId: string): Promise<StoreAdminProduct[]> {
  const [{ data: links, error: linksError }, { data: owned, error: ownedError }] = await Promise.all([
    supabaseAny
      .from("store_products")
      .select("id, product_id, status, is_active, hidden_by_store, custom_visibility, products(id, name, brand_id, category, description, images, scope, owner_store_id, is_hidden, brands(id, name))")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false }),
    supabaseAny
      .from("products")
      .select("id, name, brand_id, category, description, images, scope, owner_store_id, is_hidden, brands(id, name)")
      .eq("scope", "store")
      .eq("owner_store_id", storeId)
      .order("name"),
  ]);

  const error = linksError || ownedError;
  if (error) throw error;

  const rows = new Map<string, StoreAdminProduct>();
  (links ?? []).forEach((link: any) => {
    const product = link.products;
    if (!product || isHiddenCatalogRow(product)) return;
    rows.set(product.id, {
      id: product.id,
      name: product.name,
      brand_id: product.brand_id,
      brand_name: product.brands?.name ?? null,
      category: product.category,
      description: product.description,
      images: product.images,
      scope: product.scope ?? "global",
      owner_store_id: product.owner_store_id,
      access_id: link.id,
      access_status: link.status,
      hidden_by_store: link.hidden_by_store === true || link.custom_visibility === false,
      is_active: isActiveCatalogLink(link),
    });
  });

  (owned ?? []).forEach((product: any) => {
    rows.set(product.id, {
      id: product.id,
      name: product.name,
      brand_id: product.brand_id,
      brand_name: product.brands?.name ?? null,
      category: product.category,
      description: product.description,
      images: product.images,
      scope: "store",
      owner_store_id: product.owner_store_id,
      access_id: null,
      access_status: "active",
      hidden_by_store: isHiddenCatalogRow(product),
      is_active: !isHiddenCatalogRow(product),
    });
  });

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function setStoreProductHidden(storeId: string, product: StoreAdminProduct, hidden: boolean, actorUserId: string) {
  if (product.scope === "store") {
    const { error } = await supabaseAny
      .from("products")
      .update({ is_hidden: hidden })
      .eq("id", product.id)
      .eq("owner_store_id", storeId)
      .eq("scope", "store");
    if (error) throw error;
  } else {
    const { error } = await supabaseAny
      .from("store_products")
      .update({ hidden_by_store: hidden, hidden_at: hidden ? new Date().toISOString() : null, hidden_by: hidden ? actorUserId : null })
      .eq("store_id", storeId)
      .eq("product_id", product.id);
    if (error) throw error;
  }

  await writeAuditLog(actorUserId, storeId, hidden ? "store_product_hidden" : "store_product_unhidden", "product", product.id, { scope: product.scope });
  await recordStorePerformanceEvent(storeId, hidden ? "product_hidden" : "product_unhidden", { userId: actorUserId, productId: product.id, brandId: product.brand_id });
}

export async function setStoreBrandHidden(storeId: string, brand: StoreAdminBrand, hidden: boolean, actorUserId: string) {
  if (brand.scope === "store") {
    const { error } = await supabaseAny
      .from("brands")
      .update({ is_hidden: hidden })
      .eq("id", brand.id)
      .eq("owner_store_id", storeId)
      .eq("scope", "store");
    if (error) throw error;
  } else {
    const { error } = await supabaseAny
      .from("store_brands")
      .update({ hidden_by_store: hidden, hidden_at: hidden ? new Date().toISOString() : null, hidden_by: hidden ? actorUserId : null })
      .eq("store_id", storeId)
      .eq("brand_id", brand.id);
    if (error) throw error;
  }

  await writeAuditLog(actorUserId, storeId, hidden ? "store_brand_hidden" : "store_brand_unhidden", "brand", brand.id, { scope: brand.scope });
  await recordStorePerformanceEvent(storeId, hidden ? "brand_hidden" : "brand_unhidden", { userId: actorUserId, brandId: brand.id });
}

export async function createStoreOwnedBrand(storeId: string, values: StoreOwnedBrandValues, actorUserId: string) {
  const name = cleanText(values.name);
  if (!name) throw new Error("Informe o nome da marca.");

  const { data: brand, error: brandError } = await supabaseAny
    .from("brands")
    .insert({
      name,
      logo_url: cleanText(values.logoUrl),
      segment: cleanText(values.segment) ?? "premium",
      scope: "store",
      owner_store_id: storeId,
      is_hidden: false,
    })
    .select("id, name")
    .single();
  if (brandError) throw brandError;

  await supabaseAny.from("store_brands").insert({
    store_id: storeId,
    brand_id: brand.id,
    status: "active",
    is_active: true,
    hidden_by_store: false,
    created_by: actorUserId,
  });

  await writeAuditLog(actorUserId, storeId, "store_owned_brand_created", "brand", brand.id, { name });
  return brand;
}

export async function createStoreOwnedProduct(storeId: string, values: StoreOwnedProductValues, actorUserId: string) {
  const name = cleanText(values.name);
  const category = cleanText(values.category);
  if (!name) throw new Error("Informe o nome do produto.");
  if (!values.brandId) throw new Error("Selecione uma marca.");
  if (!category) throw new Error("Informe a categoria.");

  const imageUrl = cleanText(values.imageUrl);
  const { data: product, error: productError } = await supabaseAny
    .from("products")
    .insert({
      name,
      brand_id: values.brandId,
      category,
      description: cleanText(values.description),
      images: imageUrl ? [imageUrl] : [],
      ambient_images: [],
      scope: "store",
      owner_store_id: storeId,
      is_hidden: false,
    })
    .select("id, name")
    .single();
  if (productError) throw productError;

  await supabaseAny.from("store_products").insert({
    store_id: storeId,
    product_id: product.id,
    status: "active",
    is_active: true,
    custom_visibility: true,
    hidden_by_store: false,
    created_by: actorUserId,
  });

  await writeAuditLog(actorUserId, storeId, "store_owned_product_created", "product", product.id, { name, brand_id: values.brandId });
  return product;
}

export async function updateStoreAdminBranding(storeId: string, values: StoreBrandingValues, actorUserId: string) {
  const payload = {
    ...normalizeStoreBrandingValues(values),
    updated_by: actorUserId,
  };

  const { data, error } = await supabaseAny
    .from("stores")
    .update(payload)
    .eq("id", storeId)
    .select("id, name, display_name, slug, status, logo_url, favicon_url, primary_color, secondary_color, accent_color, background_color, text_color, theme_mode")
    .single();
  if (error) throw error;

  await writeAuditLog(actorUserId, storeId, "store_branding_updated_by_store_admin", "store", storeId, { changed: Object.keys(payload) });
  return data;
}
