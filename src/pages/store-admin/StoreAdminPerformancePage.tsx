import { useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, Building2, Heart, Quote, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/contexts/StoreContext";
import { getStorePerformanceSummary, type StorePerformanceSummary } from "@/services/storePerformanceService";
import { toast } from "@/hooks/use-toast";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";

export default function StoreAdminPerformancePage() {
  const { currentStoreId } = useStore();
  const [summary, setSummary] = useState<StorePerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentStoreId) {
        setSummary(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getStorePerformanceSummary(currentStoreId);
        if (!cancelled) setSummary(data);
      } catch (error: any) {
        toast({ title: "Erro ao carregar performance", description: error?.message ?? "Tente novamente.", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [currentStoreId]);

  const quoteRows = useMemo(() => Object.entries(summary?.quotesByStatus ?? {}).sort((a, b) => b[1] - a[1]), [summary]);
  const eventRows = useMemo(() => Object.entries(summary?.eventsByType ?? {}).sort((a, b) => b[1] - a[1]), [summary]);

  if (!currentStoreId) {
    return <Card className="rounded-lg"><CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent></Card>;
  }

  if (loading || !summary) {
    return <p className="text-sm text-neutral-500">Carregando performance...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Performance da loja</h1>
        <p className="mt-1 text-sm text-neutral-500">Indicadores calculados apenas com dados da loja ativa.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Boxes} label="Produtos visiveis" value={summary.visibleProducts} />
        <Metric icon={Building2} label="Marcas visiveis" value={summary.visibleBrands} />
        <Metric icon={Quote} label="Cotacoes abertas" value={summary.quotesOpen} />
        <Metric icon={BarChart3} label="Projetos" value={summary.projectsTotal} />
        <Metric icon={Users} label="Arquitetos" value={summary.architects} />
        <Metric icon={Users} label="Vendedores" value={summary.sellers} />
        <Metric icon={Heart} label="Produtos favoritados" value={summary.eventsByType.product_favorite ?? 0} />
        <Metric icon={Quote} label="Cotacoes aprovadas" value={summary.quotesWon} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cotacoes por status" rows={quoteRows} empty="Sem cotacoes registradas." />
        <Panel title="Eventos recentes por tipo" rows={eventRows} empty="Sem eventos de performance ainda." />
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: number }) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
        <Icon size={17} className="text-neutral-400" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-neutral-950">{value}</p>
    </article>
  );
}

function Panel({ title, rows, empty }: { title: string; rows: Array<[string, number]>; empty: string }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500">{empty}</p>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0">
              <span className="text-sm text-neutral-600">{label.replaceAll("_", " ")}</span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800">{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
