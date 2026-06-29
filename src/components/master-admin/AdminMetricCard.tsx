import type { LucideIcon } from "lucide-react";

interface AdminMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  detail?: string;
}

export function AdminMetricCard({ icon: Icon, label, value, detail }: AdminMetricCardProps) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
          <Icon size={18} />
        </span>
      </div>
      {detail && <p className="mt-4 text-sm text-neutral-500">{detail}</p>}
    </article>
  );
}
