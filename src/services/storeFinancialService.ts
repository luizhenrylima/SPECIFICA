import { supabase } from "@/integrations/supabase/client";

const supabaseAny = supabase as any;

export interface StoreSale {
  id: string;
  store_id: string;
  quote_id: string | null;
  project_id: string | null;
  customer_id: string | null;
  seller_id: string | null;
  architect_id: string | null;
  sale_number: string | null;
  title: string | null;
  status: string;
  sale_date: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  cost_amount: number;
  margin_amount: number;
  margin_percent: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialInstallment {
  id: string;
  store_id: string;
  sale_id: string | null;
  customer_id: string | null;
  installment_number: number;
  due_date: string;
  paid_at: string | null;
  amount: number;
  paid_amount: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
}

export interface StoreExpense {
  id: string;
  store_id: string;
  title: string;
  category: string | null;
  supplier: string | null;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
}

export interface ArchitectRtRecord {
  id: string;
  store_id: string;
  sale_id: string | null;
  architect_id: string | null;
  customer_id: string | null;
  base_amount: number;
  rt_percent: number;
  rt_amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
}

export interface SellerCommissionRecord {
  id: string;
  store_id: string;
  sale_id: string | null;
  seller_id: string | null;
  base_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
}

export interface FinancialDashboard {
  salesCount: number;
  salesTotal: number;
  receivableOpen: number;
  receivableOverdue: number;
  expensesOpen: number;
  expensesPaid: number;
  rtPending: number;
  commissionsPending: number;
  marginTotal: number;
}

export interface ManualSaleValues {
  title: string;
  saleDate: string;
  grossAmount: number;
  discountAmount: number;
  costAmount: number;
  paymentMethod?: string;
  notes?: string;
  sellerId?: string | null;
  customerId?: string | null;
  projectId?: string | null;
  createdBy?: string | null;
}

export interface ExpenseValues {
  title: string;
  category?: string;
  supplier?: string;
  amount: number;
  dueDate?: string;
  status?: string;
  paymentMethod?: string;
  notes?: string;
  createdBy?: string | null;
}

function requireStore(storeId: string | null | undefined) {
  if (!storeId) {
    throw new Error("Nenhuma loja ativa selecionada. Selecione uma loja para continuar.");
  }
}

function money(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function nextCode(prefix: string) {
  const stamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replaceAll("T", "")
    .replaceAll("Z", "")
    .slice(0, 14);
  return `${prefix}-${stamp}`;
}

function computeMargin(netAmount: number, costAmount: number) {
  const marginAmount = Math.max(netAmount - costAmount, 0);
  const marginPercent = netAmount > 0 ? (marginAmount / netAmount) * 100 : 0;
  return { marginAmount, marginPercent };
}

export async function getFinancialDashboard(storeId: string): Promise<FinancialDashboard> {
  requireStore(storeId);

  const [sales, installments, expenses, rt, commissions] = await Promise.all([
    supabaseAny.from("store_sales").select("net_amount, margin_amount, status").eq("store_id", storeId),
    supabaseAny.from("financial_installments").select("amount, paid_amount, status, due_date").eq("store_id", storeId),
    supabaseAny.from("store_expenses").select("amount, status").eq("store_id", storeId),
    supabaseAny.from("architect_rt_records").select("rt_amount, status").eq("store_id", storeId),
    supabaseAny.from("seller_commission_records").select("commission_amount, status").eq("store_id", storeId),
  ]);

  const error = sales.error || installments.error || expenses.error || rt.error || commissions.error;
  if (error) throw error;

  const rows = {
    sales: sales.data ?? [],
    installments: installments.data ?? [],
    expenses: expenses.data ?? [],
    rt: rt.data ?? [],
    commissions: commissions.data ?? [],
  };
  const now = todayIsoDate();

  return {
    salesCount: rows.sales.length,
    salesTotal: rows.sales.reduce((sum: number, item: any) => sum + money(item.net_amount), 0),
    receivableOpen: rows.installments.filter((item: any) => item.status === "open").reduce((sum: number, item: any) => sum + money(item.amount) - money(item.paid_amount), 0),
    receivableOverdue: rows.installments.filter((item: any) => item.status === "overdue" || (item.status === "open" && item.due_date < now)).reduce((sum: number, item: any) => sum + money(item.amount) - money(item.paid_amount), 0),
    expensesOpen: rows.expenses.filter((item: any) => item.status === "open" || item.status === "overdue").reduce((sum: number, item: any) => sum + money(item.amount), 0),
    expensesPaid: rows.expenses.filter((item: any) => item.status === "paid").reduce((sum: number, item: any) => sum + money(item.amount), 0),
    rtPending: rows.rt.filter((item: any) => item.status !== "paid" && item.status !== "cancelled").reduce((sum: number, item: any) => sum + money(item.rt_amount), 0),
    commissionsPending: rows.commissions.filter((item: any) => item.status !== "paid" && item.status !== "cancelled").reduce((sum: number, item: any) => sum + money(item.commission_amount), 0),
    marginTotal: rows.sales.reduce((sum: number, item: any) => sum + money(item.margin_amount), 0),
  };
}

export async function listSales(storeId: string): Promise<StoreSale[]> {
  requireStore(storeId);
  const { data, error } = await supabaseAny
    .from("store_sales")
    .select("*")
    .eq("store_id", storeId)
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StoreSale[];
}

export async function listInstallments(storeId: string): Promise<FinancialInstallment[]> {
  requireStore(storeId);
  const { data, error } = await supabaseAny
    .from("financial_installments")
    .select("*")
    .eq("store_id", storeId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FinancialInstallment[];
}

export async function listExpenses(storeId: string): Promise<StoreExpense[]> {
  requireStore(storeId);
  const { data, error } = await supabaseAny
    .from("store_expenses")
    .select("*")
    .eq("store_id", storeId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StoreExpense[];
}

export async function listArchitectRtRecords(storeId: string): Promise<ArchitectRtRecord[]> {
  requireStore(storeId);
  const { data, error } = await supabaseAny
    .from("architect_rt_records")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ArchitectRtRecord[];
}

export async function listSellerCommissions(storeId: string): Promise<SellerCommissionRecord[]> {
  requireStore(storeId);
  const { data, error } = await supabaseAny
    .from("seller_commission_records")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SellerCommissionRecord[];
}

export async function createManualSale(storeId: string, values: ManualSaleValues) {
  requireStore(storeId);
  const grossAmount = money(values.grossAmount);
  const discountAmount = money(values.discountAmount);
  const netAmount = Math.max(grossAmount - discountAmount, 0);
  const costAmount = money(values.costAmount);
  const { marginAmount, marginPercent } = computeMargin(netAmount, costAmount);

  const { data, error } = await supabaseAny
    .from("store_sales")
    .insert({
      store_id: storeId,
      sale_number: nextCode("VEN"),
      title: values.title.trim(),
      sale_date: values.saleDate || todayIsoDate(),
      gross_amount: grossAmount,
      discount_amount: discountAmount,
      net_amount: netAmount,
      cost_amount: costAmount,
      margin_amount: marginAmount,
      margin_percent: marginPercent,
      payment_method: values.paymentMethod?.trim() || null,
      notes: values.notes?.trim() || null,
      seller_id: values.sellerId || null,
      customer_id: values.customerId || null,
      project_id: values.projectId || null,
      status: "confirmed",
      created_by: values.createdBy || null,
      updated_by: values.createdBy || null,
    })
    .select("*")
    .single();

  if (error) throw error;

  await createDefaultInstallment(storeId, data.id, data.customer_id, data.net_amount, data.sale_date, values.createdBy ?? null);
  return data as StoreSale;
}

export async function createExpense(storeId: string, values: ExpenseValues) {
  requireStore(storeId);
  const { error } = await supabaseAny.from("store_expenses").insert({
    store_id: storeId,
    title: values.title.trim(),
    category: values.category?.trim() || null,
    supplier: values.supplier?.trim() || null,
    amount: money(values.amount),
    due_date: values.dueDate || null,
    status: values.status || "open",
    payment_method: values.paymentMethod?.trim() || null,
    notes: values.notes?.trim() || null,
    created_by: values.createdBy || null,
    updated_by: values.createdBy || null,
  });
  if (error) throw error;
}

export async function markInstallmentAsPaid(storeId: string, installment: FinancialInstallment, actorUserId?: string | null) {
  requireStore(storeId);
  const { error } = await supabaseAny
    .from("financial_installments")
    .update({
      status: "paid",
      paid_at: todayIsoDate(),
      paid_amount: installment.amount,
      updated_by: actorUserId ?? null,
    })
    .eq("id", installment.id)
    .eq("store_id", storeId);
  if (error) throw error;
}

export async function updateRtStatus(storeId: string, recordId: string, status: string, actorUserId?: string | null) {
  requireStore(storeId);
  const { error } = await supabaseAny
    .from("architect_rt_records")
    .update({ status, paid_at: status === "paid" ? todayIsoDate() : null, updated_by: actorUserId ?? null })
    .eq("id", recordId)
    .eq("store_id", storeId);
  if (error) throw error;
}

export async function updateCommissionStatus(storeId: string, recordId: string, status: string, actorUserId?: string | null) {
  requireStore(storeId);
  const { error } = await supabaseAny
    .from("seller_commission_records")
    .update({ status, paid_at: status === "paid" ? todayIsoDate() : null, updated_by: actorUserId ?? null })
    .eq("id", recordId)
    .eq("store_id", storeId);
  if (error) throw error;
}

export async function convertQuoteToSale(storeId: string, quoteId: string, actorUserId?: string | null) {
  requireStore(storeId);

  const { data: quote, error: quoteError } = await supabaseAny
    .from("crm_quotes")
    .select("id, store_id, project_id, customer_id, seller_user_id, gross_value, discount_value, final_value, total_value, notes, status")
    .eq("id", quoteId)
    .eq("store_id", storeId)
    .single();
  if (quoteError) throw quoteError;

  const { data: items, error: itemsError } = await supabaseAny
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .eq("store_id", storeId);
  if (itemsError) throw itemsError;

  const grossAmount = money(quote.gross_value);
  const discountAmount = money(quote.discount_value);
  const netAmount = money(quote.total_value || quote.final_value || grossAmount - discountAmount);
  const costAmount = (items ?? []).reduce((sum: number, item: any) => sum + money(item.cost_price) * Number(item.quantity ?? 1), 0);
  const { marginAmount, marginPercent } = computeMargin(netAmount, costAmount);

  const { data: sale, error: saleError } = await supabaseAny
    .from("store_sales")
    .insert({
      store_id: storeId,
      quote_id: quote.id,
      project_id: quote.project_id,
      customer_id: quote.customer_id,
      seller_id: quote.seller_user_id,
      sale_number: nextCode("VEN"),
      title: "Venda gerada por cotacao",
      status: "confirmed",
      sale_date: todayIsoDate(),
      gross_amount: grossAmount,
      discount_amount: discountAmount,
      net_amount: netAmount,
      cost_amount: costAmount,
      margin_amount: marginAmount,
      margin_percent: marginPercent,
      notes: quote.notes,
      created_by: actorUserId ?? null,
      updated_by: actorUserId ?? null,
    })
    .select("*")
    .single();

  if (saleError) throw saleError;

  const saleItems = (items ?? []).map((item: any) => ({
    store_id: storeId,
    sale_id: sale.id,
    quote_item_id: item.id,
    product_id: item.product_id,
    brand_id: item.brand_id,
    quantity: item.quantity,
    unit_price: money(item.unit_price),
    cost_price: money(item.cost_price),
    discount_value: money(item.discount_value),
    discount_percent: money(item.discount_percent),
    total_price: money(item.total_price) || money(item.unit_price) * Number(item.quantity ?? 1),
    margin_value: money(item.margin_value),
    margin_percent: money(item.margin_percent),
    description: item.notes,
  }));

  if (saleItems.length > 0) {
    const { error } = await supabaseAny.from("store_sale_items").insert(saleItems);
    if (error) throw error;
  }

  await Promise.all([
    createDefaultInstallment(storeId, sale.id, sale.customer_id, sale.net_amount, sale.sale_date, actorUserId ?? null),
    createDefaultCommission(storeId, sale, actorUserId ?? null),
  ]);

  const { error: updateQuoteError } = await supabaseAny
    .from("crm_quotes")
    .update({ status: "aprovado", updated_by: actorUserId ?? null, updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("store_id", storeId);
  if (updateQuoteError) throw updateQuoteError;

  return sale as StoreSale;
}

async function createDefaultInstallment(storeId: string, saleId: string, customerId: string | null, amount: number, dueDate: string, actorUserId: string | null) {
  const { error } = await supabaseAny.from("financial_installments").insert({
    store_id: storeId,
    sale_id: saleId,
    customer_id: customerId,
    installment_number: 1,
    due_date: dueDate || todayIsoDate(),
    amount: money(amount),
    status: "open",
    created_by: actorUserId,
    updated_by: actorUserId,
  });
  if (error) throw error;
}

async function createDefaultCommission(storeId: string, sale: StoreSale, actorUserId: string | null) {
  if (!sale.seller_id) return;
  const commissionPercent = 3;
  const commissionAmount = (money(sale.net_amount) * commissionPercent) / 100;
  const { error } = await supabaseAny.from("seller_commission_records").insert({
    store_id: storeId,
    sale_id: sale.id,
    seller_id: sale.seller_id,
    base_amount: money(sale.net_amount),
    commission_percent: commissionPercent,
    commission_amount: commissionAmount,
    status: "pending",
    due_date: sale.sale_date || todayIsoDate(),
    created_by: actorUserId,
    updated_by: actorUserId,
  });
  if (error) throw error;
}
