import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, EyeOff, Palette, Plus, Tags, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/contexts/StoreContext";
import { getStoreAdminSummary } from "@/services/storeAdminCatalogService";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";

export default function StoreAdminDashboardPage() {
  const { currentStore, currentStoreId } = useStore();
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getStoreAdminSummary>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentStoreId) {
        setSummary(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getStoreAdminSummary(currentStoreId);
        if (active) setSummary(data);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [currentStoreId]);

  if (!currentStoreId) return <EmptyStore />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Painel administrativo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">{currentStore?.display_name || currentStore?.name || "Loja"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">Gerencie usuarios, catalogo e identidade visual da sua propria loja.</p>
        </div>
        {currentStore?.logo_url && (
          <span className="flex h-16 max-w-44 items-center rounded-md border border-neutral-200 bg-white px-3">
            <img src={currentStore.logo_url} alt={currentStore.display_name || currentStore.name} className="max-h-11 w-auto object-contain" />
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-lg" />)}
        </div>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="Usuarios ativos" value={summary.users} />
          <Metric icon={Users} label="Vendedores" value={summary.sellers} />
          <Metric icon={Users} label="Arquitetos" value={summary.architects} />
          <Metric icon={Users} label="Gerentes" value={summary.managers} />
          <Metric icon={Boxes} label="Produtos visiveis" value={summary.visibleProducts} />
          <Metric icon={EyeOff} label="Produtos ocultos" value={summary.hiddenProducts} />
          <Metric icon={Tags} label="Marcas visiveis" value={summary.visibleBrands} />
          <Metric icon={EyeOff} label="Marcas ocultas" value={summary.hiddenBrands} />
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <QuickAction to="/gestao/usuarios" icon={Users} label="Cadastrar usuario" />
        <QuickAction to="/gestao/produtos" icon={Plus} label="Cadastrar produto" />
        <QuickAction to="/gestao/marcas" icon={Tags} label="Cadastrar marca" />
        <QuickAction to="/gestao/configuracoes" icon={Palette} label="Configurar loja" />
      </section>
    </div>
  );
}

function EmptyStore() {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent>
    </Card>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex h-full flex-col justify-between gap-4 p-4">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-neutral-100 text-neutral-700">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Users; label: string }) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon size={16} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link to={to}>Abrir</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
