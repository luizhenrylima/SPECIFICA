import { Link } from "react-router-dom";
import { Edit3, Eye, Plus, RotateCcw, Search, ShieldOff, Store, XCircle } from "lucide-react";
import { StorePlanBadge } from "@/components/master-admin/StorePlanBadge";
import { StoreStatusBadge } from "@/components/master-admin/StoreStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useStores } from "@/hooks/useStores";
import { useUpdateStore } from "@/hooks/useStoreMutations";
import type { MasterStore, StoreStatus } from "@/services/storesService";

export default function StoresPage() {
  const { user } = useAuth();
  const { filteredStores, plans, loading, error, search, setSearch, status, setStatus, plan, setPlan, reload } = useStores();
  const { updateStoreStatus, loading: statusLoading } = useUpdateStore();

  const changeStatus = async (store: MasterStore, nextStatus: StoreStatus) => {
    if (!user) return;
    await updateStoreStatus(store.id, nextStatus, user.id);
    await reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">Gerencie tenants, status e limites de uso.</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-neutral-950">Lojas</h2>
        </div>
        <Link
          to="/admin/stores/new"
          className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <Plus size={16} />
          Nova Loja
        </Link>
      </div>

      <section className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou slug"
            className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-neutral-950"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StoreStatus | "all")}
          className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="trial">Em teste</option>
          <option value="suspended">Suspensas</option>
          <option value="inactive">Inativas</option>
          <option value="pending_setup">Configuracao</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
          aria-label="Filtrar por plano"
        >
          <option value="all">Todos os planos</option>
          {plans.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Carregando lojas...</p>
        ) : filteredStores.length === 0 ? (
          <div className="p-8 text-center">
            <Store className="mx-auto text-neutral-300" size={32} />
            <p className="mt-3 text-sm text-neutral-500">Nenhuma loja encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Usuarios</th>
                  <th className="px-4 py-3 font-medium">Arquitetos</th>
                  <th className="px-4 py-3 font-medium">Produtos</th>
                  <th className="px-4 py-3 font-medium">Criada em</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="align-middle">
                    <td className="px-4 py-4 font-medium text-neutral-950">{store.name}</td>
                    <td className="px-4 py-4 text-neutral-500">/{store.slug}</td>
                    <td className="px-4 py-4"><StoreStatusBadge status={store.status} /></td>
                    <td className="px-4 py-4"><StorePlanBadge plan={store.plan} /></td>
                    <td className="px-4 py-4 text-neutral-700">{store.users_count}</td>
                    <td className="px-4 py-4 text-neutral-700">{store.architects_count}</td>
                    <td className="px-4 py-4 text-neutral-700">{store.products_count}</td>
                    <td className="px-4 py-4 text-neutral-500">{new Date(store.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/stores/${store.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title="Ver detalhes" aria-label={`Ver detalhes de ${store.name}`}>
                          <Eye size={15} />
                        </Link>
                        <Link to={`/admin/stores/${store.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title="Editar" aria-label={`Editar ${store.name}`}>
                          <Edit3 size={15} />
                        </Link>
                        <button type="button" disabled={statusLoading} onClick={() => changeStatus(store, "suspended")} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title="Suspender" aria-label={`Suspender ${store.name}`}>
                          <ShieldOff size={15} />
                        </button>
                        <button type="button" disabled={statusLoading} onClick={() => changeStatus(store, "active")} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title="Reativar" aria-label={`Reativar ${store.name}`}>
                          <RotateCcw size={15} />
                        </button>
                        <button type="button" disabled={statusLoading} onClick={() => changeStatus(store, "inactive")} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title="Inativar" aria-label={`Inativar ${store.name}`}>
                          <XCircle size={15} />
                        </button>
                      </div>
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
