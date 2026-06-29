import { roleLabel, type StoreUserRole } from "@/services/storeUsersService";

const roleClasses: Record<StoreUserRole, string> = {
  store_admin: "border-neutral-300 bg-neutral-950 text-white",
  manager: "border-sky-200 bg-sky-50 text-sky-700",
  seller: "border-emerald-200 bg-emerald-50 text-emerald-700",
  financial: "border-violet-200 bg-violet-50 text-violet-700",
  architect: "border-amber-200 bg-amber-50 text-amber-700",
};

export function StoreUserRoleBadge({ role }: { role: StoreUserRole }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${roleClasses[role]}`}>
      {roleLabel(role)}
    </span>
  );
}
