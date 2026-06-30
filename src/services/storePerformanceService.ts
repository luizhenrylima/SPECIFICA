import { supabase } from "@/integrations/supabase/client";
import { getStoreAdminSummary } from "@/services/storeAdminCatalogService";

const supabaseAny = supabase as any;

export interface StorePerformanceSummary {
  visibleProducts: number;
  hiddenProducts: number;
  visibleBrands: number;
  hiddenBrands: number;
  architects: number;
  sellers: number;
  quotesTotal: number;
  quotesOpen: number;
  quotesWon: number;
  projectsTotal: number;
  eventsByType: Record<string, number>;
  quotesByStatus: Record<string, number>;
}

export async function getStorePerformanceSummary(storeId: string): Promise<StorePerformanceSummary> {
  const [catalog, quotes, projects, events] = await Promise.all([
    getStoreAdminSummary(storeId),
    supabaseAny.from("crm_quotes").select("status").eq("store_id", storeId),
    supabaseAny.from("projects").select("id").eq("store_id", storeId).is("archived_at", null),
    supabaseAny.from("performance_events").select("event_type").eq("store_id", storeId).gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()),
  ]);

  const error = quotes.error || projects.error || events.error;
  if (error) throw error;

  const quotesByStatus: Record<string, number> = {};
  (quotes.data ?? []).forEach((quote: any) => {
    quotesByStatus[quote.status] = (quotesByStatus[quote.status] ?? 0) + 1;
  });

  const eventsByType: Record<string, number> = {};
  (events.data ?? []).forEach((event: any) => {
    eventsByType[event.event_type] = (eventsByType[event.event_type] ?? 0) + 1;
  });

  const openStatuses = new Set(["rascunho", "enviado", "em_negociacao", "nova", "em_analise", "aguardando_cliente"]);
  const wonStatuses = new Set(["aprovado", "aprovada"]);

  return {
    visibleProducts: catalog.visibleProducts,
    hiddenProducts: catalog.hiddenProducts,
    visibleBrands: catalog.visibleBrands,
    hiddenBrands: catalog.hiddenBrands,
    architects: catalog.architects,
    sellers: catalog.sellers,
    quotesTotal: quotes.data?.length ?? 0,
    quotesOpen: (quotes.data ?? []).filter((quote: any) => openStatuses.has(quote.status)).length,
    quotesWon: (quotes.data ?? []).filter((quote: any) => wonStatuses.has(quote.status)).length,
    projectsTotal: projects.data?.length ?? 0,
    eventsByType,
    quotesByStatus,
  };
}
