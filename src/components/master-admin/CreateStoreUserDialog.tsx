import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  STORE_USER_ROLES,
  STORE_USER_STATUSES,
  validateStoreUserForm,
  type StoreUserFormValues,
  type StoreUserRole,
  type StoreUserStatus,
} from "@/services/storeUsersService";

const initialValues: StoreUserFormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "store_admin",
  status: "active",
};

interface CreateStoreUserDialogProps {
  open: boolean;
  loading: boolean;
  error?: string | null;
  allowedRoles?: StoreUserRole[];
  description?: string;
  onClose: () => void;
  onSubmit: (values: StoreUserFormValues) => Promise<void>;
}

export function CreateStoreUserDialog({ open, loading, error, allowedRoles, description, onClose, onSubmit }: CreateStoreUserDialogProps) {
  const [values, setValues] = useState<StoreUserFormValues>(initialValues);
  const [localError, setLocalError] = useState("");
  const roles = allowedRoles?.length ? STORE_USER_ROLES.filter((role) => allowedRoles.includes(role.value)) : STORE_USER_ROLES;
  const firstRole = roles[0]?.value ?? "seller";

  useEffect(() => {
    if (open) {
      setValues({ ...initialValues, role: firstRole });
      setLocalError("");
    }
  }, [firstRole, open]);

  if (!open) return null;

  const setValue = (key: keyof StoreUserFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      validateStoreUserForm(values);
      setLocalError("");
      await onSubmit(values);
    } catch (err: any) {
      setLocalError(err?.message ?? "Confira os dados do usuario.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="w-full max-w-2xl rounded-lg border border-neutral-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
          <div>
            <h3 className="text-lg font-semibold text-neutral-950">Criar usuario</h3>
            <p className="mt-1 text-sm text-neutral-500">{description ?? "Cadastre o acesso da loja com e-mail e senha definidos pelo Master Admin."}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {(localError || error) && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{localError || error}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo" required value={values.fullName} onChange={(value) => setValue("fullName", value)} />
            <Field label="E-mail" type="email" required value={values.email} onChange={(value) => setValue("email", value)} />
            <Field label="Telefone" value={values.phone} onChange={(value) => setValue("phone", value)} />
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Funcao *</span>
              <select
                value={values.role}
                onChange={(event) => setValue("role", event.target.value as StoreUserRole)}
                className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
            <Field label="Senha" type="password" required value={values.password} onChange={(value) => setValue("password", value)} />
            <Field label="Confirmar senha" type="password" required value={values.confirmPassword} onChange={(value) => setValue("confirmPassword", value)} />
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Status inicial</span>
              <select
                value={values.status}
                onChange={(event) => setValue("status", event.target.value as StoreUserStatus)}
                className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
              >
                {STORE_USER_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm text-neutral-600">
              O usuario sera criado no Supabase Auth com e-mail confirmado e podera entrar imediatamente com a senha cadastrada. Se o e-mail ja existir, use futuramente o fluxo de vincular usuario existente.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
              {loading ? "Criando..." : "Criar usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value}
        required={required}
        minLength={type === "password" ? 8 : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      />
    </label>
  );
}
