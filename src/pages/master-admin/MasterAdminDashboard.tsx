import { Link } from "react-router-dom";
import { ArrowRight, Building2, PackageCheck, Store, Tags, UserRound, UsersRound } from "lucide-react";
import { AdminMetricCard } from "@/components/master-admin/AdminMetricCard";
import { StorePlanBadge } from "@/components/master-admin/StorePlanBadge";
import { StoreStatusBadge } from "@/components/master-admin/StoreStatusBadge";
import { useMasterAdminStats } from "@/hooks/useMasterAdminStats";

export default function MasterAdminDashboard() {
  const { stats, loading, error } = useMasterAdminStats();

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando painel...</p>;
  }

  if (error) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  }

  const safeStats = stats ?? {
    totalStores: 0,
    activeStores: 0,
    trialStores: 0,
    suspendedStores: 0,
    totalUsers: 0,
    totalArchitects: 0,
    totalSellers: 0,
    totalProductsReleased: 0,
    totalBrands: 0,
    recentStores: [],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">Controle central de lojas, acessos e catalogo liberado.</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-neutral-950">Operacao SPECIFICA</h2>
        </div>
        <Link
          to="/admin/stores/new"
          className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Nova Loja
          <ArrowRight size={16} />
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={Building2} label="Total de lojas" value={safeStats.totalStores} />
        <AdminMetricCard icon={Store} label="Lojas ativas" value={safeStats.activeStores} />
        <AdminMetricCard icon={Store} label="Lojas em teste" value={safeStats.trialStores} />
        <AdminMetricCard icon={Store} label="Lojas suspensas" value={safeStats.suspendedStores} />
        <AdminMetricCard icon={UsersRound} label="Total de usuarios" value={safeStats.totalUsers} />
        <AdminMetricCard icon={UserRound} label="Arquitetos" value={safeStats.totalArchitects} />
        <AdminMetricCard icon={UserRound} label="Vendedores" value={safeStats.totalSellers} />
        <AdminMetricCard icon={PackageCheck} label="Produtos liberados" value={safeStats.totalProductsReleased} />
        <AdminMetricCard icon={Tags} label="Marcas liberadas" value={safeStats.totalBrands} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-950">Lojas recentes</h3>
            <p className="text-sm text-neutral-500">Ultimas lojas criadas na plataforma.</p>
          </div>
          <Link to="/admin/stores" className="text-sm font-medium text-neutral-700 hover:text-neutral-950">
            Ver todas
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {safeStats.recentStores.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">Nenhuma loja cadastrada ainda.</p>
          ) : (
            <div className="divide-y divide-neutral-200">
              {safeStats.recentStores.map((store) => (
                <Link key={store.id} to={`/admin/stores/${store.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-950">{store.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">/{store.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StorePlanBadge plan={store.plan} />
                    <StoreStatusBadge status={store.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
