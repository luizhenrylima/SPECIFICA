import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import {
  createStoreOwnedProduct,
  listStoreAdminBrands,
  listStoreAdminProducts,
  setStoreProductHidden,
  type StoreAdminBrand,
  type StoreAdminProduct,
} from "@/services/storeAdminCatalogService";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";

export default function StoreAdminProductsPage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const [products, setProducts] = useState<StoreAdminProduct[]>([]);
  const [brands, setBrands] = useState<StoreAdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "visible" | "hidden">("all");
  const [open, setOpen] = useState(false);

  const reload = async () => {
    if (!currentStoreId) {
      setProducts([]);
      setBrands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextProducts, nextBrands] = await Promise.all([
        listStoreAdminProducts(currentStoreId),
        listStoreAdminBrands(currentStoreId),
      ]);
      setProducts(nextProducts);
      setBrands(nextBrands);
    } catch (error: any) {
      toast({ title: "Erro ao carregar produtos", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [currentStoreId]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const visible = product.is_active && !product.hidden_by_store;
      return (!term || `${product.name} ${product.brand_name ?? ""} ${product.category}`.toLowerCase().includes(term))
        && (status === "all" || (status === "visible" ? visible : !visible));
    });
  }, [products, search, status]);

  const toggleHidden = async (product: StoreAdminProduct) => {
    if (!currentStoreId || !user) return;
    const nextHidden = !product.hidden_by_store;
    try {
      await setStoreProductHidden(currentStoreId, product, nextHidden, user.id);
      await reload();
      toast({ title: nextHidden ? "Produto ocultado" : "Produto reexibido" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar produto", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const createProduct = async (values: ProductFormValues) => {
    if (!currentStoreId || !user) return;
    try {
      await createStoreOwnedProduct(currentStoreId, values, user.id);
      await reload();
      setOpen(false);
      toast({ title: "Produto proprio criado" });
    } catch (error: any) {
      toast({ title: "Erro ao criar produto", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) {
    return (
      <Card className="rounded-lg">
        <CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Produtos da loja</h1>
          <p className="mt-1 text-sm text-neutral-500">Produtos globais liberados e produtos proprios da loja.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} />
          Novo produto
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por produto, marca ou categoria" className="pl-9" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Todos</option>
          <option value="visible">Visiveis</option>
          <option value="hidden">Ocultos</option>
        </select>
      </div>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Carregando produtos...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">Nenhum produto encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4 font-medium">{product.name}</td>
                    <td className="px-4 py-4 text-neutral-600">{product.brand_name || "-"}</td>
                    <td className="px-4 py-4 text-neutral-600">{product.category}</td>
                    <td className="px-4 py-4"><Badge variant="secondary">{product.scope === "store" ? "Proprio" : "Global"}</Badge></td>
                    <td className="px-4 py-4">{product.is_active && !product.hidden_by_store ? "Visivel" : "Oculto"}</td>
                    <td className="px-4 py-4">
                      <Button size="sm" variant="outline" onClick={() => void toggleHidden(product)} className="gap-2">
                        {product.hidden_by_store ? <Eye size={14} /> : <EyeOff size={14} />}
                        {product.hidden_by_store ? "Reexibir" : "Ocultar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ProductDialog open={open} brands={brands.filter((brand) => brand.is_active && !brand.hidden_by_store)} onClose={() => setOpen(false)} onSubmit={createProduct} />
    </div>
  );
}

interface ProductFormValues {
  name: string;
  brandId: string;
  category: string;
  description: string;
  imageUrl: string;
}

function ProductDialog({ open, brands, onClose, onSubmit }: { open: boolean; brands: StoreAdminBrand[]; onClose: () => void; onSubmit: (values: ProductFormValues) => Promise<void> }) {
  const [values, setValues] = useState<ProductFormValues>({ name: "", brandId: "", category: "", description: "", imageUrl: "" });

  useEffect(() => {
    if (open) setValues({ name: "", brandId: brands[0]?.id ?? "", category: "", description: "", imageUrl: "" });
  }, [brands, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo produto proprio</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input required value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do produto" />
          <select required value={values.brandId} onChange={(event) => setValues((current) => ({ ...current, brandId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Selecione a marca</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
          <Input required value={values.category} onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))} placeholder="Categoria" />
          <Input value={values.imageUrl} onChange={(event) => setValues((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="URL da imagem principal" />
          <Textarea value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} placeholder="Descricao" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Criar produto</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
