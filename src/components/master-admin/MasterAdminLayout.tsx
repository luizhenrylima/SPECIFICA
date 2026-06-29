import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, Database, Home, Menu } from "lucide-react";
import { MasterAdminSidebar } from "@/components/master-admin/MasterAdminSidebar";
import { MasterAdminTopbar } from "@/components/master-admin/MasterAdminTopbar";

export function MasterAdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="flex min-h-screen">
        <MasterAdminSidebar />
        <section className="min-w-0 flex-1">
          <MasterAdminTopbar />
          <div className="border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Menu size={16} className="shrink-0 text-neutral-400" />
              <Link to="/admin" className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                <Home size={15} />
                Geral
              </Link>
              <Link to="/admin/stores" className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                <Building2 size={15} />
                Lojas
              </Link>
              <Link to="/admin/catalog" className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                <Database size={15} />
                Catalogo
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
