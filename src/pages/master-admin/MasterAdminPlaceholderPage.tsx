import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface MasterAdminPlaceholderPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export default function MasterAdminPlaceholderPage({ title, description, icon: Icon = Construction }: MasterAdminPlaceholderPageProps) {
  return (
    <section className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-600">
        <Icon size={20} />
      </span>
      <h2 className="mt-5 text-2xl font-semibold tracking-normal text-neutral-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">{description}</p>
    </section>
  );
}
