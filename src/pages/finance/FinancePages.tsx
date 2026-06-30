import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { BarChart3, CheckCircle2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import {
  createExpense,
  createManualSale,
  getFinancialDashboard,
  listArchitectRtRecords,
  listExpenses,
  listInstallments,
  listSales,
  listSellerCommissions,
  markInstallmentAsPaid,
  updateCommissionStatus,
  updateRtStatus,
  type ArchitectRtRecord,
  type FinancialDashboard,
  type FinancialInstallment,
  type SellerCommissionRecord,
  type StoreExpense,
  type StoreSale,
} from "@/services/storeFinancialService";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";

function currency(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function useStoreGuard() {
  const { currentStoreId } = useStore();
  return currentStoreId;
}

function EmptyStore() {
  return <Card className="rounded-lg"><CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent></Card>;
}

function LoadingState({ label = "Carregando financeiro..." }: { label?: string }) {
  return <p className="text-sm text-neutral-500">{label}</p>;
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function FinanceDashboardPage() {
  const currentStoreId = useStoreGuard();
  const [data, setData] = useState<FinancialDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentStoreId) {
        setData(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const summary = await getFinancialDashboard(currentStoreId);
        if (active) setData(summary);
      } catch (error: any) {
        toast({ title: "Erro ao carregar financeiro", description: error?.message ?? "Tente novamente.", variant: "destructive" });
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [currentStoreId]);

  if (!currentStoreId) return <EmptyStore />;
  if (loading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Visao consolidada da loja ativa." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Vendas" value={currency(data.salesTotal)} hint={`${data.salesCount} registros`} />
        <Metric label="A receber" value={currency(data.receivableOpen)} hint="Parcelas em aberto" />
        <Metric label="Vencido" value={currency(data.receivableOverdue)} hint="Recebiveis atrasados" />
        <Metric label="Margem" value={currency(data.marginTotal)} hint="Margem bruta" />
        <Metric label="Despesas abertas" value={currency(data.expensesOpen)} hint="Contas pendentes" />
        <Metric label="Despesas pagas" value={currency(data.expensesPaid)} hint="Baixadas no periodo" />
        <Metric label="RT pendente" value={currency(data.rtPending)} hint="Arquitetos" />
        <Metric label="Comissoes" value={currency(data.commissionsPending)} hint="Vendedores" />
      </section>
    </div>
  );
}

export function FinanceSalesPage() {
  const { user } = useAuth();
  const currentStoreId = useStoreGuard();
  const [rows, setRows] = useState<StoreSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    if (!currentStoreId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listSales(currentStoreId));
    } catch (error: any) {
      toast({ title: "Erro ao carregar vendas", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, [currentStoreId]);

  const createSale = async (values: SaleFormValues) => {
    if (!currentStoreId) return;
    try {
      await createManualSale(currentStoreId, { ...values, createdBy: user?.id ?? null });
      setOpen(false);
      await reload();
      toast({ title: "Venda criada" });
    } catch (error: any) {
      toast({ title: "Erro ao criar venda", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) return <EmptyStore />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendas e pedidos"
        description="Vendas manuais e vendas geradas a partir de cotacoes aprovadas."
        action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova venda</Button>}
      />
      <SalesTable rows={rows} loading={loading} />
      <SaleDialog open={open} onClose={() => setOpen(false)} onSubmit={createSale} />
    </div>
  );
}

export function FinanceReceivablesPage() {
  const { user } = useAuth();
  const currentStoreId = useStoreGuard();
  const [rows, setRows] = useState<FinancialInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!currentStoreId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listInstallments(currentStoreId));
    } catch (error: any) {
      toast({ title: "Erro ao carregar parcelas", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, [currentStoreId]);

  const markPaid = async (row: FinancialInstallment) => {
    if (!currentStoreId) return;
    try {
      await markInstallmentAsPaid(currentStoreId, row, user?.id ?? null);
      await reload();
      toast({ title: "Parcela marcada como paga" });
    } catch (error: any) {
      toast({ title: "Erro ao baixar parcela", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) return <EmptyStore />;

  return (
    <div className="space-y-5">
      <PageHeader title="Receber e parcelas" description="Controle de parcelas, vencimentos e recebimentos da loja." />
      <DataTable
        loading={loading}
        empty="Nenhuma parcela encontrada."
        headers={["Parcela", "Vencimento", "Valor", "Pago", "Status", "Acoes"]}
        rows={rows.map((row) => [
          `#${row.installment_number}`,
          row.due_date ? new Date(row.due_date).toLocaleDateString("pt-BR") : "-",
          currency(row.amount),
          currency(row.paid_amount),
          row.status,
          row.status === "paid" ? "Pago" : <Button key={row.id} size="sm" variant="outline" onClick={() => void markPaid(row)}><CheckCircle2 size={14} className="mr-1.5" />Baixar</Button>,
        ])}
      />
    </div>
  );
}

export function FinanceExpensesPage() {
  const { user } = useAuth();
  const currentStoreId = useStoreGuard();
  const [rows, setRows] = useState<StoreExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    if (!currentStoreId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listExpenses(currentStoreId));
    } catch (error: any) {
      toast({ title: "Erro ao carregar despesas", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, [currentStoreId]);

  const submit = async (values: ExpenseFormValues) => {
    if (!currentStoreId) return;
    try {
      await createExpense(currentStoreId, { ...values, createdBy: user?.id ?? null });
      setOpen(false);
      await reload();
      toast({ title: "Despesa criada" });
    } catch (error: any) {
      toast({ title: "Erro ao criar despesa", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) return <EmptyStore />;

  return (
    <div className="space-y-5">
      <PageHeader title="Despesas" description="Contas e custos operacionais da loja." action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova despesa</Button>} />
      <DataTable
        loading={loading}
        empty="Nenhuma despesa cadastrada."
        headers={["Titulo", "Categoria", "Fornecedor", "Vencimento", "Valor", "Status"]}
        rows={rows.map((row) => [row.title, row.category ?? "-", row.supplier ?? "-", row.due_date ? new Date(row.due_date).toLocaleDateString("pt-BR") : "-", currency(row.amount), row.status])}
      />
      <ExpenseDialog open={open} onClose={() => setOpen(false)} onSubmit={submit} />
    </div>
  );
}

export function FinanceRtPage() {
  const { user } = useAuth();
  const currentStoreId = useStoreGuard();
  const [rows, setRows] = useState<ArchitectRtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!currentStoreId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listArchitectRtRecords(currentStoreId));
    } catch (error: any) {
      toast({ title: "Erro ao carregar RT", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, [currentStoreId]);

  const changeStatus = async (recordId: string, status: string) => {
    if (!currentStoreId) return;
    try {
      await updateRtStatus(currentStoreId, recordId, status, user?.id ?? null);
      await reload();
      toast({ title: "RT atualizada" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar RT", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) return <EmptyStore />;

  return (
    <div className="space-y-5">
      <PageHeader title="RT de arquitetos" description="Registro e baixas de reserva tecnica por venda." />
      <DataTable
        loading={loading}
        empty="Nenhum RT registrado."
        headers={["Base", "%", "Valor", "Vencimento", "Status", "Acoes"]}
        rows={rows.map((row) => [
          currency(row.base_amount),
          `${Number(row.rt_percent ?? 0).toLocaleString("pt-BR")}%`,
          currency(row.rt_amount),
          row.due_date ? new Date(row.due_date).toLocaleDateString("pt-BR") : "-",
          row.status,
          <StatusSelect key={row.id} value={row.status} options={["pending", "approved", "paid", "cancelled"]} onChange={(value) => void changeStatus(row.id, value)} />,
        ])}
      />
    </div>
  );
}

export function FinanceCommissionsPage() {
  const { user } = useAuth();
  const currentStoreId = useStoreGuard();
  const [rows, setRows] = useState<SellerCommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!currentStoreId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listSellerCommissions(currentStoreId));
    } catch (error: any) {
      toast({ title: "Erro ao carregar comissoes", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, [currentStoreId]);

  const changeStatus = async (recordId: string, status: string) => {
    if (!currentStoreId) return;
    try {
      await updateCommissionStatus(currentStoreId, recordId, status, user?.id ?? null);
      await reload();
      toast({ title: "Comissao atualizada" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar comissao", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) return <EmptyStore />;

  return (
    <div className="space-y-5">
      <PageHeader title="Comissoes" description="Comissoes geradas para vendedores da loja." />
      <DataTable
        loading={loading}
        empty="Nenhuma comissao registrada."
        headers={["Base", "%", "Valor", "Vencimento", "Status", "Acoes"]}
        rows={rows.map((row) => [
          currency(row.base_amount),
          `${Number(row.commission_percent ?? 0).toLocaleString("pt-BR")}%`,
          currency(row.commission_amount),
          row.due_date ? new Date(row.due_date).toLocaleDateString("pt-BR") : "-",
          row.status,
          <StatusSelect key={row.id} value={row.status} options={["pending", "approved", "paid", "cancelled"]} onChange={(value) => void changeStatus(row.id, value)} />,
        ])}
      />
    </div>
  );
}

export function FinanceReportsPage() {
  const currentStoreId = useStoreGuard();
  const [data, setData] = useState<FinancialDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentStoreId) {
        setData(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const summary = await getFinancialDashboard(currentStoreId);
        if (active) setData(summary);
      } catch (error: any) {
        toast({ title: "Erro ao carregar relatorios", description: error?.message ?? "Tente novamente.", variant: "destructive" });
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [currentStoreId]);

  const rows = useMemo(() => {
    if (!data) return [];
    return [
      ["Receita total", currency(data.salesTotal)],
      ["Margem bruta", currency(data.marginTotal)],
      ["A receber aberto", currency(data.receivableOpen)],
      ["A receber vencido", currency(data.receivableOverdue)],
      ["Despesas abertas", currency(data.expensesOpen)],
      ["RT pendente", currency(data.rtPending)],
      ["Comissoes pendentes", currency(data.commissionsPending)],
    ];
  }, [data]);

  if (!currentStoreId) return <EmptyStore />;

  return (
    <div className="space-y-5">
      <PageHeader title="Relatorios financeiros" description="Resumo executivo calculado por loja ativa." />
      <DataTable loading={loading} empty="Sem dados financeiros." headers={["Indicador", "Valor"]} rows={rows} />
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
        <BarChart3 size={17} className="text-neutral-400" />
      </div>
      <p className="mt-4 text-2xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </article>
  );
}

function SalesTable({ rows, loading }: { rows: StoreSale[]; loading: boolean }) {
  return (
    <DataTable
      loading={loading}
      empty="Nenhuma venda encontrada."
      headers={["Numero", "Data", "Titulo", "Bruto", "Liquido", "Margem", "Status"]}
      rows={rows.map((row) => [
        row.sale_number ?? row.id.slice(0, 8),
        row.sale_date ? new Date(row.sale_date).toLocaleDateString("pt-BR") : "-",
        row.title ?? "Venda",
        currency(row.gross_amount),
        currency(row.net_amount),
        currency(row.margin_amount),
        row.status,
      ])}
    />
  );
}

function DataTable({ headers, rows, loading, empty }: { headers: string[]; rows: Array<Array<ReactNode>>; loading: boolean; empty: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {loading ? (
        <p className="p-6 text-sm text-neutral-500">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-neutral-500">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-4 text-neutral-700">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

interface SaleFormValues {
  title: string;
  saleDate: string;
  grossAmount: number;
  discountAmount: number;
  costAmount: number;
  paymentMethod?: string;
  notes?: string;
}

function SaleDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (values: SaleFormValues) => Promise<void> }) {
  const [values, setValues] = useState({ title: "", saleDate: new Date().toISOString().slice(0, 10), grossAmount: "", discountAmount: "", costAmount: "", paymentMethod: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        title: values.title,
        saleDate: values.saleDate,
        grossAmount: Number(values.grossAmount || 0),
        discountAmount: Number(values.discountAmount || 0),
        costAmount: Number(values.costAmount || 0),
        paymentMethod: values.paymentMethod,
        notes: values.notes,
      });
      setValues({ title: "", saleDate: new Date().toISOString().slice(0, 10), grossAmount: "", discountAmount: "", costAmount: "", paymentMethod: "", notes: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova venda</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo da venda" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" value={values.saleDate} onChange={(event) => setValues((current) => ({ ...current, saleDate: event.target.value }))} required />
            <Input value={values.paymentMethod} onChange={(event) => setValues((current) => ({ ...current, paymentMethod: event.target.value }))} placeholder="Forma de pagamento" />
            <Input type="number" min="0" step="0.01" value={values.grossAmount} onChange={(event) => setValues((current) => ({ ...current, grossAmount: event.target.value }))} placeholder="Valor bruto" required />
            <Input type="number" min="0" step="0.01" value={values.discountAmount} onChange={(event) => setValues((current) => ({ ...current, discountAmount: event.target.value }))} placeholder="Desconto" />
            <Input type="number" min="0" step="0.01" value={values.costAmount} onChange={(event) => setValues((current) => ({ ...current, costAmount: event.target.value }))} placeholder="Custo" />
          </div>
          <Textarea value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Observacoes" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar venda"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ExpenseFormValues {
  title: string;
  category?: string;
  supplier?: string;
  amount: number;
  dueDate?: string;
  paymentMethod?: string;
  notes?: string;
}

function ExpenseDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (values: ExpenseFormValues) => Promise<void> }) {
  const [values, setValues] = useState({ title: "", category: "", supplier: "", amount: "", dueDate: "", paymentMethod: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        title: values.title,
        category: values.category,
        supplier: values.supplier,
        amount: Number(values.amount || 0),
        dueDate: values.dueDate,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
      });
      setValues({ title: "", category: "", supplier: "", amount: "", dueDate: "", paymentMethod: "", notes: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo da despesa" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={values.category} onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))} placeholder="Categoria" />
            <Input value={values.supplier} onChange={(event) => setValues((current) => ({ ...current, supplier: event.target.value }))} placeholder="Fornecedor" />
            <Input type="number" min="0" step="0.01" value={values.amount} onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))} placeholder="Valor" required />
            <Input type="date" value={values.dueDate} onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))} />
            <Input value={values.paymentMethod} onChange={(event) => setValues((current) => ({ ...current, paymentMethod: event.target.value }))} placeholder="Forma de pagamento" />
          </div>
          <Textarea value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Observacoes" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar despesa"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}
