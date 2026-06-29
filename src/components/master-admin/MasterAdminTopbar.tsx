import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const titles: Record<string, string> = {
  "/admin": "Visao Geral",
  "/admin/stores": "Lojas",
  "/admin/stores/new": "Nova Loja",
  "/admin/catalog": "Catalogo Central",
  "/admin/products": "Produtos",
  "/admin/brands": "Marcas",
  "/admin/users": "Usuarios",
  "/admin/access": "Acessos",
  "/admin/audit": "Auditoria",
  "/admin/settings": "Configuracoes",
};

function resolveTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.includes("/stores/") && pathname.endsWith("/edit")) return "Editar Loja";
  if (pathname.includes("/stores/")) return "Detalhe da Loja";
  return "Master Admin";
}

export function MasterAdminTopbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">Painel geral da plataforma</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-neutral-950">{resolveTitle(location.pathname)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={15} />
            Catalogo
          </Link>
          <div className="hidden items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 sm:flex">
            <User size={15} />
            {user?.email ?? "Master Admin"}
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
