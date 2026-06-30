import { supabase } from "@/integrations/supabase/client";
import { getVisibleProductsForStore } from "@/services/storeCatalogService";

const supabaseAny = supabase as any;

export interface StoreQuote {
  id: string;
  quote_number?: string | null;
  project_id: string;
  customer_id: string | null;
  seller_user_id: string;
  gross_value: number;
  discount_value: number;
  final_value: number;
  subtotal?: number;
  discount_percent?: number;
  total_value?: number;
  payment_terms: string | null;
  valid_until: string | null;
  status: string;
  notes: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: { name: string | null; client_name: string | null; user_id: string | null } | null;
  crm_customers?: { name: string | null; architect_name: string | null } | null;
  profiles?: { full_name: string | null } | null;
}

export interface QuoteProjectOption {
  id: string;
  name: string | null;
  client_name: string | null;
  crm_customer_id: string | null;
  seller_user_id: string | null;
  user_id: string | null;
}

export interface QuoteProductOption {
  id: string;
  name: string;
  brand_id: string | null;
  brands?: { name: string | null } | null;
}

export interface CreateQuoteValues {
  projectId: string;
  customerId?: string | null;
  sellerUserId: string;
  productId?: string | null;
  brandId?: string | null;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountValue: number;
  discountPercent: number;
  paymentTerms?: string;
  validUntil?: string;
  notes?: string;
  internalNotes?: string;
  actorUserId?: string | null;
}

function money(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function nextQuoteNumber() {
  const stamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replaceAll("T", "")
    .replaceAll("Z", "")
    .slice(0, 14);
  return `COT-${stamp}`;
}

export async function listStoreQuotes(storeId: string): Promise<StoreQuote[]> {
  const { data, error } = await supabaseAny
    .from("crm_quotes")
    .select("id, quote_number, project_id, customer_id, seller_user_id, gross_value, discount_value, final_value, subtotal, discount_percent, total_value, payment_terms, valid_until, status, notes, internal_notes, created_at, updated_at, projects(name, client_name, user_id), crm_customers(name, architect_name), profiles!crm_quotes_seller_user_id_fkey(full_name)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabaseAny
      .from("crm_quotes")
      .select("id, project_id, customer_id, seller_user_id, gross_value, discount_value, final_value, payment_terms, valid_until, status, notes, created_at, updated_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []) as StoreQuote[];
  }

  return (data ?? []) as StoreQuote[];
}

export async function listQuoteProjects(storeId: string): Promise<QuoteProjectOption[]> {
  const { data, error } = await supabaseAny
    .from("projects")
    .select("id, name, client_name, crm_customer_id, seller_user_id, user_id")
    .eq("store_id", storeId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const fallback = await supabaseAny
      .from("projects")
      .select("id, name, client_name, user_id")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []).map((project: any) => ({ ...project, crm_customer_id: null, seller_user_id: null })) as QuoteProjectOption[];
  }

  return (data ?? []) as QuoteProjectOption[];
}

export async function listQuoteProducts(storeId: string): Promise<QuoteProductOption[]> {
  const products = await getVisibleProductsForStore(storeId);
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    brand_id: product.brand_id,
  }));
}

export async function createStoreQuote(storeId: string, values: CreateQuoteValues) {
  const quantity = Math.max(Number(values.quantity || 1), 1);
  const unitPrice = money(values.unitPrice);
  const costPrice = money(values.costPrice);
  const discountValue = money(values.discountValue);
  const discountPercent = money(values.discountPercent);
  const subtotal = unitPrice * quantity;
  const percentDiscount = subtotal * (discountPercent / 100);
  const totalDiscount = Math.min(subtotal, discountValue + percentDiscount);
  const totalValue = Math.max(subtotal - totalDiscount, 0);
  const totalCost = costPrice * quantity;
  const marginValue = Math.max(totalValue - totalCost, 0);
  const marginPercent = totalValue > 0 ? (marginValue / totalValue) * 100 : 0;

  const { data: quote, error } = await supabaseAny
    .from("crm_quotes")
    .insert({
      store_id: storeId,
      quote_number: nextQuoteNumber(),
      project_id: values.projectId,
      customer_id: values.customerId || null,
      seller_user_id: values.sellerUserId,
      gross_value: subtotal,
      subtotal,
      discount_value: totalDiscount,
      discount_percent: discountPercent,
      final_value: totalValue,
      total_value: totalValue,
      payment_terms: values.paymentTerms?.trim() || null,
      valid_until: values.validUntil || null,
      status: "rascunho",
      notes: values.notes?.trim() || null,
      internal_notes: values.internalNotes?.trim() || null,
      created_by: values.actorUserId || null,
      updated_by: values.actorUserId || null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: itemError } = await supabaseAny.from("quote_items").insert({
    store_id: storeId,
    quote_id: quote.id,
    product_id: values.productId || null,
    brand_id: values.brandId || null,
    quantity,
    unit_price: unitPrice,
    cost_price: costPrice,
    discount_value: totalDiscount,
    discount_percent: discountPercent,
    total_price: totalValue,
    margin_value: marginValue,
    margin_percent: marginPercent,
    status: "quoted",
  });

  if (itemError) throw itemError;
  return quote.id as string;
}

export async function updateStoreQuoteStatus(storeId: string, quoteId: string, status: string) {
  const { error } = await supabaseAny
    .from("crm_quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("store_id", storeId);
  if (error) throw error;
}
