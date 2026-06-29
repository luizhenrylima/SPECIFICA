import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, PackageCheck, RotateCcw, ShieldOff, Tags, UserRound, UsersRound } from "lucide-react";
import { AdminMetricCard } from "@/components/master-admin/AdminMetricCard";
import { StorePlanBadge } from "@/components/master-admin/StorePlanBadge";
import { StoreStatusBadge } from "@/components/master-admin/StoreStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";
import { useUpdateStore } from "@/hooks/useStoreMutations";
import type { StoreStatus } from "@/services/storesService";

const tabs = [
  "Visao geral",
  "Dados da loja",
  "Identidade visual",
  "Usuarios",
  "Produtos liberados",
  "Marcas liberadas",
  "Auditoria",
];

export default function StoreDetailsPage() {
  const { storeId } = useParams();
  const { user } = useAuth();
  const { store, loading, error, reload } = useStore(storeId);
  const { updateStoreStatus, loading: statusLoading } = useUpdateStore();
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const setStatus = async (status: StoreStatus) => {
    if (!user || !storeId) return;
    await updateStoreStatus(storeId, status, user.id);
    await reload();
  };

  if (loading) return <p className="text-sm text-neutral-500">Carregando loja...</p>;
  if (error || !store) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Loja nao encontrada."}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin/stores" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950">
            <ArrowLeft size={15} />
            Voltar para lojas
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-normal text-neutral-950">{store.name}</h2>
            <StoreStatusBadge status={store.status} />
            <StorePlanBadge plan={store.plan} />
          </div>
          <p className="mt-2 text-sm text-neutral-500">/{store.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/stores/${store.id}/edit`} className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
            <Edit3 size={15} />
            Editar
          </Link>
          <button type="button" disabled={statusLoading} onClick={() => setStatus("suspended")} className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            <ShieldOff size={15} />
            Suspender
          </button>
          <button type="button" disabled={statusLoading} onClick={() => setStatus("active")} className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            <RotateCcw size={15} />
            Reativar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-neutral-200">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-3 py-3 text-sm transition-colors ${
                activeTab === tab ? "border-neutral-950 text-neutral-950" : "border-transparent text-neutral-500 hover:text-neutral-950"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Visao geral" && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AdminMetricCard icon={UsersRound} label="Usuarios" value={store.users_count} />
          <AdminMetricCard icon={UserRound} label="Arquitetos" value={store.architects_count} />
          <AdminMetricCard icon={UserRound} label="Vendedores" value={store.sellers_count} />
          <AdminMetricCard icon={PackageCheck} label="Produtos" value={store.products_count} />
          <AdminMetricCard icon={Tags} label="Marcas" value={store.brands_count} />
        </section>
      )}

      {activeTab === "Dados da loja" && (
        <section className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <Info label="Razao social" value={store.legal_name} />
          <Info label="Documento" value={store.document ?? store.cnpj} />
          <Info label="E-mail" value={store.email} />
          <Info label="Telefone" value={store.phone} />
          <Info label="Site" value={store.website} />
          <Info label="Criada em" value={new Date(store.created_at).toLocaleString("pt-BR")} />
          <Info label="Limite de usuarios" value={store.max_users?.toString()} />
          <Info label="Limite de arquitetos" value={store.max_architects?.toString()} />
          <Info label="Limite de produtos" value={store.max_products?.toString()} />
          <Info label="Observacoes" value={store.notes} wide />
        </section>
      )}

      {activeTab === "Identidade visual" && (
        <section className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <Info label="Logo" value={store.logo_url} />
          <Info label="Favicon" value={store.favicon_url} />
          <ColorInfo label="Cor primaria" value={store.primary_color} />
          <ColorInfo label="Cor secundaria" value={store.secondary_color} />
          <ColorInfo label="Cor de destaque" value={store.accent_color} />
          <Info label="Tema" value={store.theme_mode} />
        </section>
      )}

      {activeTab === "Usuarios" && <Prepared text="Gestao de usuarios por loja sera implementada na proxima fase." />}
      {activeTab === "Produtos liberados" && <Prepared text="Liberacao de produtos por loja sera implementada na proxima fase." />}
      {activeTab === "Marcas liberadas" && <Prepared text="Liberacao de marcas por loja sera implementada na proxima fase." />}
      {activeTab === "Auditoria" && <Prepared text="Auditoria detalhada sera implementada em fase futura." />}
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-2 text-sm text-neutral-900">{value || "-"}</p>
    </div>
  );
}

function ColorInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-sm text-neutral-900">
        <span className="h-6 w-6 rounded-md border border-neutral-200" style={{ backgroundColor: value }} />
        {value}
      </div>
    </div>
  );
}

function Prepared({ text }: { text: string }) {
  return (
    <section className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
      <p className="text-sm text-neutral-500">{text}</p>
    </section>
  );
}
