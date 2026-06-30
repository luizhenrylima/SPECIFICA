import { useEffect, useMemo, useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { convertQuoteToSale } from "@/services/storeFinancialService";
import {
  createStoreQuote,
  listQuoteProducts,
  listQuoteProjects,
  listStoreQuotes,
  updateStoreQuoteStatus,
  type CreateQuoteValues,
  type QuoteProductOption,
  type QuoteProjectOption,
  type StoreQuote,
} from "@/services/storeQuotesService";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";
const STATUS_OPTIONS = ["rascunho", "enviado", "em_negociacao", "aprovado", "recusado", "vencido", "nova", "em_analise", "respondida", "aguardando_cliente", "perdida", "cancelada"];

export default function StoreAdminQuotesPage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const [quotes, setQuotes] = useState<StoreQuote[]>([]);
  const [projects, setProjects] = useState<QuoteProjectOption[]>([]);
  const [products, setProducts] = useState<QuoteProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    if (!currentStoreId) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [quoteRows, projectRows, productRows] = await Promise.all([
        listStoreQuotes(currentStoreId),
        listQuoteProjects(currentStoreId),
        listQuoteProducts(currentStoreId),
      ]);
      setQuotes(quoteRows);
      setProjects(projectRows);
      setProducts(productRows);
    } catch (error: any) {
      toast({ title: "Erro ao carregar cotacoes", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [currentStoreId]);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      const projectName = quote.projects?.name ?? "";
      const clientName = quote.crm_customers?.name ?? quote.projects?.client_name ?? "";
      const sellerName = quote.profiles?.full_name ?? "";
      return (!term || `${projectName} ${clientName} ${sellerName} ${quote.status}`.toLowerCase().includes(term))
        && (status === "all" || quote.status === status);
    });
  }, [quotes, search, status]);

  const changeStatus = async (quoteId: string, nextStatus: string) => {
    if (!currentStoreId) return;
    try {
      await updateStoreQuoteStatus(currentStoreId, quoteId, nextStatus);
      await reload();
      toast({ title: "Status atualizado" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar cotacao", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const createQuote = async (values: CreateQuoteValues) => {
    if (!currentStoreId || !user) return;
    setSaving(true);
    try {
      await createStoreQuote(currentStoreId, { ...values, actorUserId: user.id });
      setOpen(false);
      await reload();
      toast({ title: "Cotacao criada" });
    } catch (error: any) {
      toast({ title: "Erro ao criar cotacao", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const convertToSale = async (quoteId: string) => {
    if (!currentStoreId) return;
    try {
      await convertQuoteToSale(currentStoreId, quoteId, user?.id ?? null);
      await reload();
      toast({ title: "Venda criada", description: "A cotacao foi convertida e enviada para o financeiro." });
    } catch (error: any) {
      toast({ title: "Erro ao converter cotacao", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  if (!currentStoreId) {
    return <Card className="rounded-lg"><CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent></Card>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cotacoes da loja</h1>
          <p className="mt-1 text-sm text-neutral-500">Crie cotacoes comerciais e converta aprovadas em vendas financeiras.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} className="mr-2" />
          Nova cotacao
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por projeto, cliente, vendedor ou status" className="pl-9" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
      </div>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Carregando cotacoes...</p>
        ) : filteredQuotes.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">Nenhuma cotacao encontrada para esta loja.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Numero</th>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-4 py-4 font-mono text-xs">{quote.quote_number ?? quote.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 font-medium">{quote.projects?.name ?? "-"}</td>
                    <td className="px-4 py-4 text-neutral-600">{quote.crm_customers?.name ?? quote.projects?.client_name ?? "-"}</td>
                    <td className="px-4 py-4 text-neutral-600">{quote.profiles?.full_name ?? "-"}</td>
                    <td className="px-4 py-4 text-neutral-600">{Number(quote.total_value ?? quote.final_value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className="px-4 py-4"><Badge variant="secondary">{quote.status.replaceAll("_", " ")}</Badge></td>
                    <td className="px-4 py-4 text-neutral-600">{new Date(quote.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <select value={quote.status} onChange={(event) => void changeStatus(quote.id, event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
                          {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                        </select>
                        <Button type="button" size="sm" variant="outline" onClick={() => void convertToSale(quote.id)}>
                          <ShoppingCart size={14} className="mr-1.5" />
                          Venda
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <QuoteDialog
        open={open}
        projects={projects}
        products={products}
        currentUserId={user?.id ?? ""}
        saving={saving}
        onClose={() => setOpen(false)}
        onSubmit={createQuote}
      />
    </div>
  );
}

function QuoteDialog({
  open,
  projects,
  products,
  currentUserId,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  projects: QuoteProjectOption[];
  products: QuoteProductOption[];
  currentUserId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: CreateQuoteValues) => Promise<void>;
}) {
  const [values, setValues] = useState({
    projectId: "",
    productId: "",
    quantity: "1",
    unitPrice: "",
    costPrice: "",
    discountValue: "",
    discountPercent: "",
    paymentTerms: "",
    validUntil: "",
    notes: "",
    internalNotes: "",
  });

  useEffect(() => {
    if (!open) return;
    setValues((current) => ({ ...current, projectId: projects[0]?.id ?? "", productId: products[0]?.id ?? "" }));
  }, [open, projects, products]);

  const selectedProject = projects.find((project) => project.id === values.projectId);
  const selectedProduct = products.find((product) => product.id === values.productId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!values.projectId || !currentUserId) return;
    await onSubmit({
      projectId: values.projectId,
      customerId: selectedProject?.crm_customer_id ?? null,
      sellerUserId: selectedProject?.seller_user_id || selectedProject?.user_id || currentUserId,
      productId: values.productId || null,
      brandId: selectedProduct?.brand_id ?? null,
      quantity: Number(values.quantity || 1),
      unitPrice: Number(values.unitPrice || 0),
      costPrice: Number(values.costPrice || 0),
      discountValue: Number(values.discountValue || 0),
      discountPercent: Number(values.discountPercent || 0),
      paymentTerms: values.paymentTerms,
      validUntil: values.validUntil,
      notes: values.notes,
      internalNotes: values.internalNotes,
      actorUserId: currentUserId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova cotacao</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Projeto</span>
              <select value={values.projectId} onChange={(event) => setValues((current) => ({ ...current, projectId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>
                <option value="">Selecione</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name || project.client_name || project.id.slice(0, 8)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Produto</span>
              <select value={values.productId} onChange={(event) => setValues((current) => ({ ...current, productId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Sem produto definido</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <Field label="Quantidade" value={values.quantity} type="number" min="1" onChange={(value) => setValues((current) => ({ ...current, quantity: value }))} />
            <Field label="Preco unitario" value={values.unitPrice} type="number" min="0" step="0.01" onChange={(value) => setValues((current) => ({ ...current, unitPrice: value }))} />
            <Field label="Custo unitario" value={values.costPrice} type="number" min="0" step="0.01" onChange={(value) => setValues((current) => ({ ...current, costPrice: value }))} />
            <Field label="Desconto R$" value={values.discountValue} type="number" min="0" step="0.01" onChange={(value) => setValues((current) => ({ ...current, discountValue: value }))} />
            <Field label="Desconto %" value={values.discountPercent} type="number" min="0" step="0.01" onChange={(value) => setValues((current) => ({ ...current, discountPercent: value }))} />
            <Field label="Validade" value={values.validUntil} type="date" onChange={(value) => setValues((current) => ({ ...current, validUntil: value }))} />
          </div>
          <Input value={values.paymentTerms} onChange={(event) => setValues((current) => ({ ...current, paymentTerms: event.target.value }))} placeholder="Condicao de pagamento" />
          <Textarea value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Observacoes para o cliente" />
          <Textarea value={values.internalNotes} onChange={(event) => setValues((current) => ({ ...current, internalNotes: event.target.value }))} placeholder="Notas internas" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !values.projectId}>{saving ? "Salvando..." : "Criar cotacao"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}
