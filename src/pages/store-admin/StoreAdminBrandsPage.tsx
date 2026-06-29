import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import {
  createStoreOwnedBrand,
  listStoreAdminBrands,
  setStoreBrandHidden,
  type StoreAdminBrand,
} from "@/services/storeAdminCatalogService";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";

export default function StoreAdminBrandsPage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const [brands, setBrands] = useState<StoreAdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "visible" | "hidden">("all");
  const [open, setOpen] = useState(false);

  const reload = async () => {
    if (!currentStoreId) {
      setBrands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setBrands(await listStoreAdminBrands(currentStoreId));
    } catch (error: any) {
      toast({ title: "Erro ao carregar marcas", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [currentStoreId]);

  const filteredBrands = useMemo(() => {
    const term = search.trim().toLowerCase();
    return brands.filter((brand) => {
      const visible = brand.is_active && !brand.hidden_by_store;
      return (!term || `${brand.name} ${brand.segment ?? ""}`.toLowerCase().includes(term))
        && (status === "all" || (status === "visible" ? visible : !visible));
    });
  }, [brands, search, status]);

  const toggleHidden = async (brand: StoreAdminBrand) => {
    if (!currentStoreId || !user) return;
    const nextHidden = !brand.hidden_by_store;
    try {
      await setStoreBrandHidden(currentStoreId, brand, nextHidden, user.id);
      await reload();
      toast({ title: nextHidden ? "Marca ocultada" : "Marca reexibida" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar marca", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const createBrand = async (values: BrandFormValues) => {
    if (!currentStoreId || !user) return;
    try {
      await createStoreOwnedBrand(currentStoreId, values, user.id);
      await reload();
      setOpen(false);
      toast({ title: "Marca propria criada" });
    } catch (error: any) {
      toast({ title: "Erro ao criar marca", description: error?.message ?? "Tente novamente.", variant: "destructive" });
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
          <h1 className="text-2xl font-semibold">Marcas da loja</h1>
          <p className="mt-1 text-sm text-neutral-500">Marcas globais liberadas e marcas proprias da loja.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} />
          Nova marca
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar marca" className="pl-9" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Todas</option>
          <option value="visible">Visiveis</option>
          <option value="hidden">Ocultas</option>
        </select>
      </div>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Carregando marcas...</p>
        ) : filteredBrands.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">Nenhuma marca encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Produtos</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredBrands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {brand.logo_url && <img src={brand.logo_url} alt={brand.name} className="h-8 w-12 rounded object-contain" />}
                        <span className="font-medium">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><Badge variant="secondary">{brand.scope === "store" ? "Propria" : "Global"}</Badge></td>
                    <td className="px-4 py-4 text-neutral-600">{brand.products_count}</td>
                    <td className="px-4 py-4">{brand.is_active && !brand.hidden_by_store ? "Visivel" : "Oculta"}</td>
                    <td className="px-4 py-4">
                      <Button size="sm" variant="outline" onClick={() => void toggleHidden(brand)} className="gap-2">
                        {brand.hidden_by_store ? <Eye size={14} /> : <EyeOff size={14} />}
                        {brand.hidden_by_store ? "Reexibir" : "Ocultar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BrandDialog open={open} onClose={() => setOpen(false)} onSubmit={createBrand} />
    </div>
  );
}

interface BrandFormValues {
  name: string;
  logoUrl: string;
  segment: string;
}

function BrandDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (values: BrandFormValues) => Promise<void> }) {
  const [values, setValues] = useState<BrandFormValues>({ name: "", logoUrl: "", segment: "premium" });

  useEffect(() => {
    if (open) setValues({ name: "", logoUrl: "", segment: "premium" });
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova marca propria</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input required value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Nome da marca" />
          <Input value={values.logoUrl} onChange={(event) => setValues((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="Logo URL" />
          <Input value={values.segment} onChange={(event) => setValues((current) => ({ ...current, segment: event.target.value }))} placeholder="Segmento" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Criar marca</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
