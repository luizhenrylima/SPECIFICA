import { Link, NavLink } from "react-router-dom";
import { BarChart3, Banknote, Coins, FileText, Landmark, Receipt, ScrollText, WalletCards } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

const links = [
  { to: "/financeiro", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/financeiro/vendas", label: "Vendas", icon: Receipt },
  { to: "/financeiro/receber", label: "Receber", icon: WalletCards },
  { to: "/financeiro/despesas", label: "Despesas", icon: Banknote },
  { to: "/financeiro/rt", label: "RT arquitetos", icon: Landmark },
  { to: "/financeiro/comissoes", label: "Comissoes", icon: Coins },
  { to: "/financeiro/relatorios", label: "Relatorios", icon: FileText },
];

export function FinanceLayout({ children }: { children: React.ReactNode }) {
  const { currentStore } = useStore();
  const storeName = currentStore?.display_name?.trim() || currentStore?.name || "Loja";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 text-neutral-950">
      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-neutral-200 bg-white lg:border-b-0 lg:border-r">
          <div className="p-5">
            <Link to="/financeiro" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-neutral-950 text-white">
                <ScrollText size={18} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{storeName}</span>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">Financeiro</span>
              </span>
            </Link>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-neutral-100 px-3 py-3 lg:block lg:space-y-1 lg:overflow-visible">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</section>
      </div>
    </main>
  );
}
