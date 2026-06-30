import { FormEvent, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { StoreLogoUploader } from "@/components/store-assets/StoreLogoUploader";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateStoreBranding } from "@/hooks/useStoreMutations";
import {
  normalizeStoreBrandingValues,
  storeToBrandingValues,
  type MasterStore,
  type StoreBrandingValues,
  type StoreThemeMode,
} from "@/services/storesService";

const themeModes: Array<{ value: StoreThemeMode; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export function StoreBrandingManager({ store, onSaved }: { store: MasterStore; onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const mutation = useUpdateStoreBranding();
  const [values, setValues] = useState<StoreBrandingValues>(() => storeToBrandingValues(store));
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setValues(storeToBrandingValues(store));
    setLocalError("");
  }, [store]);

  const previewValues = useMemo(() => {
    try {
      return normalizeStoreBrandingValues(values);
    } catch {
      return normalizeStoreBrandingValues(storeToBrandingValues(store));
    }
  }, [store, values]);

  const setValue = (key: keyof StoreBrandingValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      normalizeStoreBrandingValues(values);
      setLocalError("");
      await mutation.updateStoreBranding(store.id, values, user.id);
      await onSaved();
      toast({ title: "Identidade visual salva", description: "A loja ja pode carregar a nova aparencia para seus usuarios." });
    } catch (err: any) {
      const message = err?.message ?? "Confira os dados da identidade visual.";
      setLocalError(message);
      toast({ title: "Erro ao salvar identidade visual", description: message, variant: "destructive" });
    }
  };

  const handleLogoChange = async (logoUrl: string) => {
    if (!user) return;
    const nextValues = { ...values, logo_url: logoUrl };
    const normalizedValues = normalizeStoreBrandingValues(nextValues);
    await mutation.updateStoreBranding(store.id, normalizedValues, user.id);
    setValues(normalizedValues);
    await onSaved();
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-xl font-semibold tracking-normal text-neutral-950">Identidade visual</h3>
          <p className="mt-1 text-sm text-neutral-500">Configure a aparencia que os usuarios desta loja veem fora do painel Master Admin.</p>
        </div>

        {(localError || mutation.error) && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{localError || mutation.error}</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nome exibido da loja" value={values.display_name} onChange={(value) => setValue("display_name", value)} placeholder={store.name} />
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Modo do tema</span>
            <select
              value={values.theme_mode}
              onChange={(event) => setValue("theme_mode", event.target.value as StoreThemeMode)}
              className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
            >
              {themeModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
          </label>
          <TextField label="Logo URL" value={values.logo_url} onChange={(value) => setValue("logo_url", value)} placeholder="https://..." />
          <TextField label="Favicon URL" value={values.favicon_url} onChange={(value) => setValue("favicon_url", value)} placeholder="https://..." />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ColorInput label="Cor primaria" value={values.primary_color} onChange={(value) => setValue("primary_color", value)} />
          <ColorInput label="Cor secundaria" value={values.secondary_color} onChange={(value) => setValue("secondary_color", value)} />
          <ColorInput label="Cor de destaque" value={values.accent_color} onChange={(value) => setValue("accent_color", value)} />
          <ColorInput label="Cor de fundo" value={values.background_color} onChange={(value) => setValue("background_color", value)} />
          <ColorInput label="Cor do texto" value={values.text_color} onChange={(value) => setValue("text_color", value)} />
        </div>

        <StoreLogoUploader storeId={store.id} logoUrl={values.logo_url} onChange={handleLogoChange} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.loading}
            className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            <Save size={15} />
            {mutation.loading ? "Salvando..." : "Salvar identidade"}
          </button>
        </div>
      </form>

      <BrandPreviewCard store={store} values={previewValues} />
    </section>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      />
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</span>
      <div className="mt-2 flex h-10 overflow-hidden rounded-md border border-neutral-200 bg-white focus-within:border-neutral-950">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#111827"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-12 border-0 bg-transparent p-1"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#111111"
          className="min-w-0 flex-1 border-0 px-3 text-sm uppercase outline-none"
        />
      </div>
    </label>
  );
}

function BrandPreviewCard({ store, values }: { store: MasterStore; values: ReturnType<typeof normalizeStoreBrandingValues> }) {
  const displayName = values.display_name || store.name;
  const isDark = values.theme_mode === "dark";
  const background = isDark ? "#111827" : values.background_color;
  const foreground = isDark ? "#F9FAFB" : values.text_color;

  return (
    <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Previa visual da loja</p>
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200" style={{ backgroundColor: background, color: foreground }}>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: `${values.secondary_color}44`, backgroundColor: values.primary_color, color: "#FFFFFF" }}>
          {values.logo_url ? (
            <span className="flex h-10 max-w-36 items-center rounded-md bg-white px-2">
              <img src={values.logo_url} alt={displayName} className="max-h-7 w-auto object-contain" />
            </span>
          ) : (
            <span className="max-w-40 truncate text-sm font-semibold uppercase tracking-[0.16em]">{displayName}</span>
          )}
          <span className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]" style={{ backgroundColor: values.accent_color, color: "#FFFFFF" }}>
            Destaque
          </span>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <h4 className="font-serif text-2xl">{displayName}</h4>
            <p className="mt-1 text-sm opacity-70">Catalogo personalizado para arquitetos, vendedores e gestores.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: values.primary_color }}>
              Botao primario
            </button>
            <button type="button" className="rounded-md border px-3 py-2 text-sm font-medium" style={{ borderColor: values.secondary_color, color: foreground }}>
              Botao secundario
            </button>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: `${values.secondary_color}55`, backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }}>
            <div className="h-28 rounded-md" style={{ background: `linear-gradient(135deg, ${values.secondary_color}33, ${values.accent_color}44)` }} />
            <p className="mt-3 text-sm font-medium">Exemplo de produto</p>
            <p className="mt-1 text-xs opacity-65">Cores e marca aplicadas ao ambiente da loja.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
