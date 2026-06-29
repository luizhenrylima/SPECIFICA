import { statusLabel, type StoreUserStatus } from "@/services/storeUsersService";

const statusClasses: Record<StoreUserStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-neutral-200 bg-neutral-100 text-neutral-600",
  invited: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
};

export function StoreUserStatusBadge({ status }: { status: StoreUserStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${statusClasses[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
