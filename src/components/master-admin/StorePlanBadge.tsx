export function StorePlanBadge({ plan }: { plan?: string | null }) {
  return (
    <span className="inline-flex rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-neutral-600">
      {plan?.trim() || "Sem plano"}
    </span>
  );
}
