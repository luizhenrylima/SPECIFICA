import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const supabaseAny = supabase as any;

export type StoreCatalogBrand = Pick<Tables<"brands">, "id" | "name" | "logo_url" | "segment"> & {
  scope?: "global" | "store";
  owner_store_id?: string | null;
  is_hidden?: boolean | null;
};

export type StoreCatalogProduct = Pick<Tables<"products">, "id" | "name" | "brand_id" | "category" | "description" | "images" | "file_3d" | "file_2d" | "tech_sheet" | "finish_link" | "created_at"> & {
  scope?: "global" | "store";
  owner_store_id?: string | null;
  designer_id?: string | null;
  ambient_images?: string[] | null;
  is_hidden?: boolean | null;
};

const PRODUCT_FIELDS = "id, name, brand_id, category, description, images, file_3d, file_2d, tech_sheet, finish_link, created_at, designer_id, ambient_images, scope, owner_store_id, is_hidden";
const PRODUCT_LEGACY_FIELDS = "id, name, brand_id, category, description, images, file_3d, file_2d, tech_sheet, finish_link, created_at, designer_id";
const BRAND_FIELDS = "id, name, logo_url, segment, scope, owner_store_id, is_hidden";

function isHiddenColumnError(error: any) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`;
  return error?.code === "42703" || /is_hidden|scope|owner_store_id|ambient_images/i.test(message);
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

async function selectProducts(ids: string[]): Promise<StoreCatalogProduct[]> {
  if (ids.length === 0) return [];
  let result = await supabaseAny.from("products").select(PRODUCT_FIELDS).in("id", ids).eq("is_hidden", false);
  if (result.error && isHiddenColumnError(result.error)) {
    result = await supabaseAny.from("products").select(PRODUCT_LEGACY_FIELDS).in("id", ids);
  }
  if (result.error) throw result.error;
  return ((result.data ?? []) as StoreCatalogProduct[]).filter(product => product.is_hidden !== true);
}

async function selectBrands(ids: string[]): Promise<StoreCatalogBrand[]> {
  if (ids.length === 0) return [];
  let result = await supabaseAny.from("brands").select(BRAND_FIELDS).in("id", ids).eq("is_hidden", false);
  if (result.error && isHiddenColumnError(result.error)) {
    result = await supabaseAny.from("brands").select("id, name, logo_url, segment").in("id", ids);
  }
  if (result.error) throw result.error;
  return ((result.data ?? []) as StoreCatalogBrand[]).filter(brand => brand.is_hidden !== true);
}

export async function getVisibleBrandsForStore(storeId: string): Promise<StoreCatalogBrand[]> {
  const { data: links, error: linksError } = await supabaseAny
    .from("store_brands")
    .select("brand_id")
    .eq("store_id", storeId)
    .eq("status", "active")
    .eq("is_active", true)
    .eq("hidden_by_store", false);
  if (linksError) throw linksError;

  const linkBrandIds = unique((links ?? []).map((link: any) => link.brand_id));
  const [{ data: owned, error: ownedError }, linkedBrands] = await Promise.all([
    supabaseAny
      .from("brands")
      .select(BRAND_FIELDS)
      .eq("scope", "store")
      .eq("owner_store_id", storeId)
      .eq("is_hidden", false),
    selectBrands(linkBrandIds),
  ]);
  if (ownedError && !isHiddenColumnError(ownedError)) throw ownedError;

  const rows = new Map<string, StoreCatalogBrand>();
  linkedBrands.forEach(brand => rows.set(brand.id, { ...brand, scope: brand.scope ?? "global" }));
  ((owned ?? []) as StoreCatalogBrand[]).filter(brand => brand.is_hidden !== true).forEach(brand => rows.set(brand.id, { ...brand, scope: "store" }));
  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getVisibleProductsForStore(storeId: string): Promise<StoreCatalogProduct[]> {
  const visibleBrands = await getVisibleBrandsForStore(storeId);
  const visibleBrandIds = new Set(visibleBrands.map(brand => brand.id));
  if (visibleBrandIds.size === 0) return [];

  const { data: links, error: linksError } = await supabaseAny
    .from("store_products")
    .select("product_id")
    .eq("store_id", storeId)
    .eq("status", "active")
    .eq("is_active", true)
    .eq("hidden_by_store", false);
  if (linksError) throw linksError;

  const linkProductIds = unique((links ?? []).map((link: any) => link.product_id));
  const [{ data: owned, error: ownedError }, linkedProducts] = await Promise.all([
    supabaseAny
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("scope", "store")
      .eq("owner_store_id", storeId)
      .eq("is_hidden", false),
    selectProducts(linkProductIds),
  ]);
  if (ownedError && !isHiddenColumnError(ownedError)) throw ownedError;

  const rows = new Map<string, StoreCatalogProduct>();
  linkedProducts
    .filter(product => visibleBrandIds.has(product.brand_id))
    .forEach(product => rows.set(product.id, { ...product, scope: product.scope ?? "global" }));
  ((owned ?? []) as StoreCatalogProduct[])
    .filter(product => product.is_hidden !== true && visibleBrandIds.has(product.brand_id))
    .forEach(product => rows.set(product.id, { ...product, scope: "store" }));

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getVisibleProductForStore(storeId: string, productId: string): Promise<StoreCatalogProduct | null> {
  const products = await getVisibleProductsForStore(storeId);
  return products.find(product => product.id === productId) ?? null;
}

export async function recordStorePerformanceEvent(storeId: string, eventType: string, values: { userId?: string | null; productId?: string | null; brandId?: string | null; metadata?: Record<string, unknown> } = {}) {
  try {
    await supabaseAny.from("performance_events").insert({
      store_id: storeId,
      user_id: values.userId ?? null,
      product_id: values.productId ?? null,
      brand_id: values.brandId ?? null,
      event_type: eventType,
      metadata: values.metadata ?? {},
    });
  } catch (error) {
    console.warn("Performance event write failed:", error);
  }
}
