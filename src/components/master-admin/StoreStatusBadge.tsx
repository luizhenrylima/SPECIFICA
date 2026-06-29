import type { StoreStatus } from "@/services/storesService";

const statusLabels: Record<StoreStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
  trial: "Teste",
  suspended: "Suspensa",
  pending_setup: "Config.",
  cancelled: "Cancelada",
};

const statusClasses: Record<StoreStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-neutral-200 bg-neutral-100 text-neutral-600",
  trial: "border-sky-200 bg-sky-50 text-sky-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
  pending_setup: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-neutral-300 bg-neutral-100 text-neutral-500",
};

export function StoreStatusBadge({ status }: { status: StoreStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${statusClasses[status] ?? statusClasses.inactive}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
