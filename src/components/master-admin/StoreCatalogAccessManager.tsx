import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  grantAllBrandsAndProducts,
  grantBrandAccessWithProducts,
  listStoreCatalogAccess,
  setAllStoreBrandsReleased,
  setAllStoreProductsReleased,
  setStoreBrandReleased,
  setStoreProductReleased,
  type StoreCatalogAccessBrand,
  type StoreCatalogAccessProduct,
} from "@/services/masterAdminService";

export function StoreCatalogAccessManager({ storeId, mode }: { storeId: string; mode: "brands" | "products" }) {
  const { user } = useAuth();
  const [brands, setBrands] = useState<StoreCatalogAccessBrand[]>([]);
  const [products, setProducts] = useState<StoreCatalogAccessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "released" | "pending">("all");

  const reload = async () => {
    setLoading(true);
    try {
      const data = await listStoreCatalogAccess(storeId);
      setBrands(data.brands);
      setProducts(data.products);
    } catch (error: any) {
      toast({ title: "Erro ao carregar liberacoes", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [storeId]);

  const filteredBrands = useMemo(() => {
    const term = search.trim().toLowerCase();
    return brands.filter((brand) =>
      (!term || `${brand.name} ${brand.segment ?? ""}`.toLowerCase().includes(term))
      && (statusFilter === "all" || (statusFilter === "released" ? brand.released : !brand.released))
    );
  }, [brands, search, statusFilter]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) =>
      (!term || `${product.name} ${product.brand_name ?? ""} ${product.category ?? ""}`.toLowerCase().includes(term))
      && (!brandFilter || product.brand_id === brandFilter)
      && (statusFilter === "all" || (statusFilter === "released" ? product.released : !product.released))
    );
  }, [products, search, brandFilter, statusFilter]);

  const run = async (action: () => Promise<void>, title: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await action();
      await reload();
      toast({ title });
    } catch (error: any) {
      toast({ title: "Erro ao salvar liberacao", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const runWithMessage = async (action: () => Promise<string>) => {
    if (!user) return;
    setSaving(true);
    try {
      const title = await action();
      await reload();
      toast({ title });
    } catch (error: any) {
      toast({ title: "Erro ao salvar liberacao", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const releaseBrand = async (brand: StoreCatalogAccessBrand) => {
    if (!user) return;
    const missingProducts = Math.max(0, brand.products_count - brand.released_products_count);
    const shouldReleaseProducts = !brand.released && missingProducts > 0
      ? window.confirm(`Liberar tambem ${missingProducts} produto(s) ativo(s) desta marca para a loja?`)
      : false;

    if (shouldReleaseProducts) {
      await runWithMessage(async () => {
        const count = await grantBrandAccessWithProducts(storeId, brand.id, user.id);
        return `Marca liberada e ${count} produto(s) foram liberados para esta loja.`;
      });
      return;
    }

    await run(() => setStoreBrandReleased(storeId, brand.id, true, user.id), "Marca liberada");
  };

  const releaseBrandProducts = async (brand: StoreCatalogAccessBrand) => {
    if (!user) return;
    await runWithMessage(async () => {
      const count = await grantBrandAccessWithProducts(storeId, brand.id, user.id);
      return `Marca liberada e ${count} produto(s) foram liberados para esta loja.`;
    });
  };

  const releaseEverything = async () => {
    if (!user) return;
    const confirmation = window.prompt("Para liberar todas as marcas e todos os produtos para esta loja, digite LIBERAR.");
    if (confirmation !== "LIBERAR") return;

    await runWithMessage(async () => {
      const result = await grantAllBrandsAndProducts(storeId, user.id);
      return `${result.brandsCount} marca(s) e ${result.productsCount} produto(s) liberados para esta loja.`;
    });
  };

  const releasedCount = mode === "brands" ? brands.filter(item => item.released).length : products.filter(item => item.released).length;
  const totalCount = mode === "brands" ? brands.length : products.length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-medium text-neutral-950">
            {releasedCount} de {totalCount} {mode === "brands" ? "marcas liberadas" : "produtos liberados"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">As alteracoes afetam apenas esta loja.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "brands" ? (
            <>
              <Button size="sm" disabled={saving} onClick={() => run(() => setAllStoreBrandsReleased(storeId, true, user!.id), "Todas as marcas foram liberadas")}>Liberar todas</Button>
              <Button size="sm" disabled={saving} onClick={() => void releaseEverything()}>Liberar todas + produtos</Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => run(() => setAllStoreBrandsReleased(storeId, false, user!.id), "Todas as marcas foram removidas")}>Remover todas</Button>
            </>
          ) : (
            <>
              <Button size="sm" disabled={saving} onClick={() => run(() => setAllStoreProductsReleased(storeId, true, user!.id, brandFilter || undefined), "Produtos liberados")}>Liberar produtos</Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => run(() => setAllStoreProductsReleased(storeId, false, user!.id, brandFilter || undefined), "Produtos removidos")}>Remover produtos</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_180px_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" className="pl-9" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Todos</option>
          <option value="released">Liberados</option>
          <option value="pending">Nao liberados</option>
        </select>
        {mode === "products" ? (
          <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todas as marcas</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        ) : <div />}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Carregando...</p>
        ) : mode === "brands" ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              <tr><th className="px-4 py-3">Marca</th><th className="px-4 py-3">Segmento</th><th className="px-4 py-3">Produtos</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Acoes</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredBrands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-4 py-4 font-medium">{brand.name}</td>
                  <td className="px-4 py-4 text-neutral-600">{brand.segment || "-"}</td>
                  <td className="px-4 py-4 text-neutral-600">{brand.released_products_count} / {brand.products_count}</td>
                  <td className="px-4 py-4"><StatusBadge released={brand.released} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {brand.released ? (
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => run(() => setStoreBrandReleased(storeId, brand.id, false, user!.id), "Marca removida")}>
                          Remover
                        </Button>
                      ) : (
                        <Button size="sm" disabled={saving} onClick={() => void releaseBrand(brand)}>
                          Liberar marca
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={saving || brand.products_count === 0} onClick={() => void releaseBrandProducts(brand)}>
                        Liberar produtos da marca
                      </Button>
                      {!brand.released && (
                        <Button size="sm" variant="secondary" disabled={saving || brand.products_count === 0} onClick={() => void releaseBrandProducts(brand)}>
                          Marca + produtos
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              <tr><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Marca</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Acao</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4 font-medium">{product.name}</td>
                  <td className="px-4 py-4 text-neutral-600">{product.brand_name || "-"}</td>
                  <td className="px-4 py-4 text-neutral-600">{product.category || "-"}</td>
                  <td className="px-4 py-4"><StatusBadge released={product.released} /></td>
                  <td className="px-4 py-4">
                    <Button size="sm" variant={product.released ? "outline" : "default"} disabled={saving} onClick={() => run(() => setStoreProductReleased(storeId, product.id, !product.released, user!.id), product.released ? "Produto removido" : "Produto liberado")}>
                      {product.released ? "Remover" : "Liberar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ released }: { released: boolean }) {
  return released ? (
    <Badge className="gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"><CheckCircle2 size={13} /> Liberado</Badge>
  ) : (
    <Badge variant="secondary" className="gap-1"><XCircle size={13} /> Nao liberado</Badge>
  );
}
