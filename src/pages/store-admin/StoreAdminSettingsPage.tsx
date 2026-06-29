import { FormEvent, useEffect, useMemo, useState } from "react";
import { ImageUp, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import {
  normalizeStoreBrandingValues,
  storeToBrandingValues,
  type StoreBrandingValues,
} from "@/services/storesService";
import { updateStoreAdminBranding } from "@/services/storeAdminCatalogService";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";

export default function StoreAdminSettingsPage() {
  const { user } = useAuth();
  const { currentStore, currentStoreId, refreshStores } = useStore();
  const [values, setValues] = useState<StoreBrandingValues>(() => storeToBrandingValues(currentStore as any));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentStore) setValues(storeToBrandingValues(currentStore as any));
  }, [currentStore]);

  const preview = useMemo(() => {
    try {
      return normalizeStoreBrandingValues(values);
    } catch {
      return normalizeStoreBrandingValues(storeToBrandingValues(currentStore as any));
    }
  }, [currentStore, values]);

  const setValue = (key: keyof StoreBrandingValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentStoreId || !user) return;
    setLoading(true);
    setError("");
    try {
      normalizeStoreBrandingValues(values);
      await updateStoreAdminBranding(currentStoreId, values, user.id);
      await refreshStores();
      toast({ title: "Configuracoes salvas" });
    } catch (err: any) {
      const message = err?.message ?? "Nao foi possivel salvar as configuracoes.";
      setError(message);
      toast({ title: "Erro ao salvar configuracoes", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!currentStoreId || !currentStore) {
    return (
      <Card className="rounded-lg">
        <CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <form onSubmit={submit} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Configuracoes da loja</h1>
          <p className="mt-1 text-sm text-neutral-500">Ajuste a identidade visual vista por vendedores, arquitetos e usuarios da loja.</p>
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome exibido" value={values.display_name} onChange={(value) => setValue("display_name", value)} placeholder={currentStore.name} />
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Tema</span>
            <select value={values.theme_mode} onChange={(event) => setValue("theme_mode", event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="system">Sistema</option>
            </select>
          </label>
          <Field label="Logo URL" value={values.logo_url} onChange={(value) => setValue("logo_url", value)} placeholder="https://..." />
          <Field label="Favicon URL" value={values.favicon_url} onChange={(value) => setValue("favicon_url", value)} placeholder="https://..." />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ColorInput label="Cor primaria" value={values.primary_color} onChange={(value) => setValue("primary_color", value)} />
          <ColorInput label="Cor secundaria" value={values.secondary_color} onChange={(value) => setValue("secondary_color", value)} />
          <ColorInput label="Cor de destaque" value={values.accent_color} onChange={(value) => setValue("accent_color", value)} />
          <ColorInput label="Cor de fundo" value={values.background_color} onChange={(value) => setValue("background_color", value)} />
          <ColorInput label="Cor do texto" value={values.text_color} onChange={(value) => setValue("text_color", value)} />
        </div>

        <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Upload de logo</p>
              <p className="mt-1 text-xs text-neutral-500">Por enquanto use uma URL publica da imagem.</p>
            </div>
            <Button type="button" variant="outline" disabled className="gap-2">
              <ImageUp size={15} />
              Upload
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            <Save size={15} />
            {loading ? "Salvando..." : "Salvar configuracoes"}
          </Button>
        </div>
      </form>

      <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Previa</p>
        <div className="mt-4 overflow-hidden rounded-lg border" style={{ backgroundColor: preview.background_color, color: preview.text_color }}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" style={{ backgroundColor: preview.primary_color }}>
            {preview.logo_url ? <img src={preview.logo_url} alt={preview.display_name || currentStore.name} className="max-h-9 rounded bg-white px-2 py-1" /> : <span className="font-semibold">{preview.display_name || currentStore.name}</span>}
            <span className="rounded-full px-2 py-1 text-[10px]" style={{ backgroundColor: preview.accent_color }}>Loja</span>
          </div>
          <div className="space-y-3 p-4">
            <h2 className="text-xl font-semibold">{preview.display_name || currentStore.name}</h2>
            <p className="text-sm opacity-70">Catalogo personalizado da loja.</p>
            <div className="h-24 rounded-md" style={{ background: `linear-gradient(135deg, ${preview.secondary_color}44, ${preview.accent_color}33)` }} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2" />
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</span>
      <div className="mt-2 flex h-10 overflow-hidden rounded-md border border-input bg-background">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#111827"} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-10 w-12 border-0 bg-transparent p-1" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 border-0 px-3 text-sm uppercase outline-none" />
      </div>
    </label>
  );
}
