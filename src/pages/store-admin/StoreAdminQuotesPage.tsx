import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStore } from "@/contexts/StoreContext";
import { listStoreQuotes, updateStoreQuoteStatus, type StoreQuote } from "@/services/storeQuotesService";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";
const STATUS_OPTIONS = ["rascunho", "enviado", "em_negociacao", "aprovado", "recusado", "vencido", "nova", "em_analise", "respondida", "aguardando_cliente", "perdida", "cancelada"];

export default function StoreAdminQuotesPage() {
  const { currentStoreId } = useStore();
  const [quotes, setQuotes] = useState<StoreQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const reload = async () => {
    if (!currentStoreId) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setQuotes(await listStoreQuotes(currentStoreId));
    } catch (error: any) {
      toast({ title: "Erro ao carregar cotacoes", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [currentStoreId]);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      const projectName = quote.projects?.name ?? "";
      const clientName = quote.crm_customers?.name ?? quote.projects?.client_name ?? "";
      const sellerName = quote.profiles?.full_name ?? "";
      return (!term || `${projectName} ${clientName} ${sellerName} ${quote.status}`.toLowerCase().includes(term))
        && (status === "all" || quote.status === status);
    });
  }, [quotes, search, status]);

  const changeStatus = async (quoteId: string, nextStatus: string) => {
    if (!currentStoreId) return;
    try {
      await updateStoreQuoteStatus(currentStoreId, quoteId, nextStatus);
      await reload();
      toast({ title: "Status atualizado" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar cotacao", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) {
    return <Card className="rounded-lg"><CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent></Card>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Cotacoes da loja</h1>
        <p className="mt-1 text-sm text-neutral-500">Acompanhe solicitacoes, status e valores vinculados somente a esta loja.</p>
      </div>

      <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por projeto, cliente, vendedor ou status" className="pl-9" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
      </div>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Carregando cotacoes...</p>
        ) : filteredQuotes.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">Nenhuma cotacao encontrada para esta loja.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Numero</th>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-4 py-4 font-mono text-xs">{quote.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 font-medium">{quote.projects?.name ?? "-"}</td>
                    <td className="px-4 py-4 text-neutral-600">{quote.crm_customers?.name ?? quote.projects?.client_name ?? "-"}</td>
                    <td className="px-4 py-4 text-neutral-600">{quote.profiles?.full_name ?? "-"}</td>
                    <td className="px-4 py-4 text-neutral-600">{Number(quote.final_value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className="px-4 py-4"><Badge variant="secondary">{quote.status.replaceAll("_", " ")}</Badge></td>
                    <td className="px-4 py-4 text-neutral-600">{new Date(quote.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-4">
                      <select value={quote.status} onChange={(event) => void changeStatus(quote.id, event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
                        {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
