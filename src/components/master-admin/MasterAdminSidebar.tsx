import { Link, NavLink } from "react-router-dom";
import { BarChart3, Boxes, Building2, ClipboardList, Cog, Database, FileClock, Package, ShieldCheck, Store, Tags, Users } from "lucide-react";
import logoSpecifica from "@/assets/logo-specifica.png";

const navItems = [
  { label: "Visao Geral", to: "/admin", icon: BarChart3, end: true },
  { label: "Lojas", to: "/admin/stores", icon: Building2 },
  { label: "Nova Loja", to: "/admin/stores/new", icon: Store },
  { label: "Catalogo", to: "/admin/catalog", icon: Database },
  { label: "Produtos", to: "/admin/products", icon: Package },
  { label: "Marcas", to: "/admin/brands", icon: Tags },
  { label: "Usuarios", to: "/admin/users", icon: Users },
  { label: "Acessos", to: "/admin/access", icon: ShieldCheck },
  { label: "Auditoria", to: "/admin/audit", icon: FileClock },
  { label: "Configuracoes", to: "/admin/settings", icon: Cog },
];

export function MasterAdminSidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-neutral-200 bg-white px-5 py-6 lg:block">
      <Link to="/admin" className="flex items-center gap-3">
        <img src={logoSpecifica} alt="SPECIFICA" className="h-11 w-auto" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">SPECIFICA</p>
          <p className="text-sm font-medium text-neutral-950">Master Admin</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          <Boxes size={14} />
          SaaS multi-loja
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Controle central das lojas, acessos e liberacoes da plataforma.
        </p>
      </div>
    </aside>
  );
}
