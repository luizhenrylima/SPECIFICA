import { supabase } from "@/integrations/supabase/client";

const supabaseAny = supabase as any;

export interface StoreQuote {
  id: string;
  project_id: string;
  customer_id: string | null;
  seller_user_id: string;
  gross_value: number;
  discount_value: number;
  final_value: number;
  payment_terms: string | null;
  valid_until: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects?: { name: string | null; client_name: string | null; user_id: string | null } | null;
  crm_customers?: { name: string | null; architect_name: string | null } | null;
  profiles?: { full_name: string | null } | null;
}

export async function listStoreQuotes(storeId: string): Promise<StoreQuote[]> {
  const { data, error } = await supabaseAny
    .from("crm_quotes")
    .select("id, project_id, customer_id, seller_user_id, gross_value, discount_value, final_value, payment_terms, valid_until, status, notes, created_at, updated_at, projects(name, client_name, user_id), crm_customers(name, architect_name), profiles!crm_quotes_seller_user_id_fkey(full_name)")
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

export async function updateStoreQuoteStatus(storeId: string, quoteId: string, status: string) {
  const { error } = await supabaseAny
    .from("crm_quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("store_id", storeId);
  if (error) throw error;
}
