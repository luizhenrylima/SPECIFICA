import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RotateCcw, Save, ShieldOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";
import { useCreateStore, useUpdateStore } from "@/hooks/useStoreMutations";
import {
  createSlug,
  emptyStoreFormValues,
  storeToFormValues,
  type StoreFormValues,
  type StoreStatus,
  type StoreThemeMode,
} from "@/services/storesService";

const statusOptions: Array<{ value: StoreStatus; label: string }> = [
  { value: "active", label: "Ativa" },
  { value: "trial", label: "Teste" },
  { value: "pending_setup", label: "Configuracao" },
  { value: "inactive", label: "Inativa" },
  { value: "suspended", label: "Suspensa" },
  { value: "cancelled", label: "Cancelada" },
];

const themeOptions: Array<{ value: StoreThemeMode; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export default function StoreFormPage({ mode }: { mode: "create" | "edit" }) {
  const { user } = useAuth();
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { store, loading: loadingStore, error: storeError } = useStore(mode === "edit" ? storeId : undefined);
  const { createStore, loading: creating, error: createError } = useCreateStore();
  const { updateStore, updateStoreStatus, loading: updating, error: updateError } = useUpdateStore();
  const [values, setValues] = useState<StoreFormValues>(() => emptyStoreFormValues());
  const [slugTouched, setSlugTouched] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (mode === "edit" && store) {
      setValues(storeToFormValues(store));
      setSlugTouched(true);
    }
  }, [mode, store]);

  const setValue = (key: keyof StoreFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setValues((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : createSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setValue("slug", createSlug(value));
  };

  const validate = () => {
    if (!values.name.trim()) return "Informe o nome da loja.";
    if (!values.slug.trim()) return "Informe o slug da loja.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) return "Use apenas letras, numeros e hifens no slug.";
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const validation = validate();
    if (validation) {
      setLocalError(validation);
      return;
    }

    setLocalError("");
    try {
      if (mode === "create") {
        const created = await createStore(values, user.id);
        navigate(`/admin/stores/${created.id}`);
      } else if (storeId) {
        const updated = await updateStore(storeId, values, user.id);
        navigate(`/admin/stores/${updated.id}`);
      }
    } catch {
      // The hook exposes the visible error.
    }
  };

  const quickStatus = async (status: StoreStatus) => {
    if (!user || !storeId) return;
    await updateStoreStatus(storeId, status, user.id);
    setValues((current) => ({ ...current, status }));
  };

  const disabled = creating || updating;

  if (mode === "edit" && loadingStore) {
    return <p className="text-sm text-neutral-500">Carregando loja...</p>;
  }

  if (mode === "edit" && (storeError || !store)) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{storeError || "Loja nao encontrada."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={mode === "edit" && storeId ? `/admin/stores/${storeId}` : "/admin/stores"} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950">
            <ArrowLeft size={15} />
            Voltar
          </Link>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950">{mode === "create" ? "Nova Loja" : "Editar Loja"}</h2>
          <p className="mt-2 text-sm text-neutral-500">Configure dados cadastrais, limites e identidade basica.</p>
        </div>
        {mode === "edit" && (
          <div className="flex gap-2">
            <button type="button" onClick={() => quickStatus("suspended")} disabled={disabled} className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              <ShieldOff size={15} />
              Suspender
            </button>
            <button type="button" onClick={() => quickStatus("active")} disabled={disabled} className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              <RotateCcw size={15} />
              Reativar
            </button>
          </div>
        )}
      </div>

      {(localError || createError || updateError) && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{localError || createError || updateError}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-950">Dados principais</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nome da loja" required value={values.name} onChange={handleNameChange} placeholder="SPECIFICA Cuiaba" />
            <Field label="Slug" required value={values.slug} onChange={handleSlugChange} placeholder="specifica-cuiaba" prefix="/" />
            <Field label="Razao social" value={values.legal_name} onChange={(value) => setValue("legal_name", value)} />
            <Field label="Documento/CNPJ" value={values.document} onChange={(value) => setValue("document", value)} />
            <Field label="E-mail" type="email" value={values.email} onChange={(value) => setValue("email", value)} />
            <Field label="Telefone" value={values.phone} onChange={(value) => setValue("phone", value)} />
            <Field label="Site" value={values.website} onChange={(value) => setValue("website", value)} placeholder="https://..." />
            <SelectField label="Status" value={values.status} onChange={(value) => setValue("status", value)} options={statusOptions} />
            <Field label="Plano" value={values.plan} onChange={(value) => setValue("plan", value)} placeholder="Plano Pro" />
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-950">Limites</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Limite de usuarios" type="number" value={values.max_users} onChange={(value) => setValue("max_users", value)} />
            <Field label="Limite de arquitetos" type="number" value={values.max_architects} onChange={(value) => setValue("max_architects", value)} />
            <Field label="Limite de produtos" type="number" value={values.max_products} onChange={(value) => setValue("max_products", value)} />
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-950">Identidade visual</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Logo URL" value={values.logo_url} onChange={(value) => setValue("logo_url", value)} />
            <Field label="Favicon URL" value={values.favicon_url} onChange={(value) => setValue("favicon_url", value)} />
            <ColorField label="Cor primaria" value={values.primary_color} onChange={(value) => setValue("primary_color", value)} />
            <ColorField label="Cor secundaria" value={values.secondary_color} onChange={(value) => setValue("secondary_color", value)} />
            <ColorField label="Cor de destaque" value={values.accent_color} onChange={(value) => setValue("accent_color", value)} />
            <SelectField label="Modo de tema" value={values.theme_mode} onChange={(value) => setValue("theme_mode", value)} options={themeOptions} />
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-950">Observacoes</h3>
          <textarea
            value={values.notes}
            onChange={(event) => setValue("notes", event.target.value)}
            rows={4}
            className="mt-4 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-950"
          />
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <Link to={mode === "edit" && storeId ? `/admin/stores/${storeId}` : "/admin/stores"} className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50">
            Cancelar
          </Link>
          <button type="submit" disabled={disabled} className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
            <Save size={16} />
            {disabled ? "Salvando..." : "Salvar alteracoes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type = "text", prefix }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; type?: string; prefix?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}{required ? " *" : ""}</span>
      <div className="mt-2 flex rounded-md border border-neutral-200 bg-white focus-within:border-neutral-950">
        {prefix && <span className="flex items-center border-r border-neutral-200 px-3 text-sm text-neutral-400">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className="h-10 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</span>
      <div className="mt-2 flex h-10 rounded-md border border-neutral-200 bg-white focus-within:border-neutral-950">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-full w-12 border-r border-neutral-200 bg-transparent p-1" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none" />
      </div>
    </label>
  );
}

function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: Array<{ value: T; label: string }> }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
