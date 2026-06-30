alter table public.crm_quotes
  add column if not exists quote_number text,
  add column if not exists subtotal numeric(14,2) not null default 0,
  add column if not exists discount_percent numeric(7,4) not null default 0,
  add column if not exists total_value numeric(14,2) not null default 0,
  add column if not exists internal_notes text;

update public.crm_quotes
set
  subtotal = coalesce(nullif(subtotal, 0), gross_value, 0),
  total_value = coalesce(nullif(total_value, 0), final_value, gross_value, 0)
where subtotal = 0 or total_value = 0;

create unique index if not exists crm_quotes_store_quote_number_unique
on public.crm_quotes(store_id, quote_number)
where quote_number is not null;

alter table public.quote_items
  add column if not exists unit_price numeric(14,2) not null default 0,
  add column if not exists cost_price numeric(14,2) not null default 0,
  add column if not exists discount_value numeric(14,2) not null default 0,
  add column if not exists discount_percent numeric(7,4) not null default 0,
  add column if not exists total_price numeric(14,2) not null default 0,
  add column if not exists margin_value numeric(14,2) not null default 0,
  add column if not exists margin_percent numeric(7,4) not null default 0;

create or replace function public.current_user_can_manage_financial(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master_admin()
    or exists (
      select 1
      from public.store_members sm
      where sm.store_id = target_store_id
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role in ('store_admin', 'manager', 'financial', 'finance')
    );
$$;

create or replace function public.current_user_can_view_financial(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_can_manage_financial(target_store_id);
$$;

revoke all on function public.current_user_can_manage_financial(uuid) from public;
revoke all on function public.current_user_can_view_financial(uuid) from public;
revoke execute on function public.current_user_can_manage_financial(uuid) from anon;
revoke execute on function public.current_user_can_view_financial(uuid) from anon;
grant execute on function public.current_user_can_manage_financial(uuid) to authenticated;
grant execute on function public.current_user_can_view_financial(uuid) to authenticated;

create table if not exists public.store_sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  quote_id uuid references public.crm_quotes(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  customer_id uuid references public.crm_customers(id) on delete set null,
  seller_id uuid references auth.users(id) on delete set null,
  architect_id uuid references auth.users(id) on delete set null,
  sale_number text,
  title text,
  status text not null default 'pending',
  sale_date date not null default current_date,
  gross_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  cost_amount numeric(14,2) not null default 0,
  margin_amount numeric(14,2) not null default 0,
  margin_percent numeric(7,4) not null default 0,
  payment_method text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_sales_status_check check (status in ('pending', 'confirmed', 'invoiced', 'paid', 'cancelled')),
  constraint store_sales_amounts_check check (gross_amount >= 0 and discount_amount >= 0 and net_amount >= 0 and cost_amount >= 0)
);

create table if not exists public.store_sale_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null references public.store_sales(id) on delete cascade,
  quote_item_id uuid references public.quote_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  description text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  cost_price numeric(14,2) not null default 0,
  discount_value numeric(14,2) not null default 0,
  discount_percent numeric(7,4) not null default 0,
  total_price numeric(14,2) not null default 0,
  margin_value numeric(14,2) not null default 0,
  margin_percent numeric(7,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_installments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid references public.store_sales(id) on delete cascade,
  customer_id uuid references public.crm_customers(id) on delete set null,
  installment_number integer not null default 1 check (installment_number > 0),
  due_date date not null,
  paid_at date,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'open',
  payment_method text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_installments_status_check check (status in ('open', 'paid', 'overdue', 'cancelled'))
);

create table if not exists public.store_expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  category text,
  supplier text,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  due_date date,
  paid_at date,
  status text not null default 'open',
  payment_method text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_expenses_status_check check (status in ('open', 'paid', 'overdue', 'cancelled'))
);

create table if not exists public.architect_rt_records (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid references public.store_sales(id) on delete cascade,
  architect_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.crm_customers(id) on delete set null,
  base_amount numeric(14,2) not null default 0 check (base_amount >= 0),
  rt_percent numeric(7,4) not null default 0,
  rt_amount numeric(14,2) not null default 0 check (rt_amount >= 0),
  status text not null default 'pending',
  due_date date,
  paid_at date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint architect_rt_records_status_check check (status in ('pending', 'approved', 'paid', 'cancelled'))
);

create table if not exists public.seller_commission_records (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid references public.store_sales(id) on delete cascade,
  seller_id uuid references auth.users(id) on delete set null,
  base_amount numeric(14,2) not null default 0 check (base_amount >= 0),
  commission_percent numeric(7,4) not null default 0,
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  status text not null default 'pending',
  due_date date,
  paid_at date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_commission_records_status_check check (status in ('pending', 'approved', 'paid', 'cancelled'))
);

create unique index if not exists store_sales_store_sale_number_unique
on public.store_sales(store_id, sale_number)
where sale_number is not null;

create index if not exists idx_store_sales_store_date on public.store_sales(store_id, sale_date desc);
create index if not exists idx_store_sales_quote_id on public.store_sales(quote_id);
create index if not exists idx_store_sales_seller_id on public.store_sales(seller_id);
create index if not exists idx_store_sale_items_store_sale on public.store_sale_items(store_id, sale_id);
create index if not exists idx_financial_installments_store_due on public.financial_installments(store_id, due_date);
create index if not exists idx_financial_installments_sale_id on public.financial_installments(sale_id);
create index if not exists idx_store_expenses_store_due on public.store_expenses(store_id, due_date);
create index if not exists idx_architect_rt_store_status on public.architect_rt_records(store_id, status);
create index if not exists idx_architect_rt_architect_id on public.architect_rt_records(architect_id);
create index if not exists idx_seller_commission_store_status on public.seller_commission_records(store_id, status);
create index if not exists idx_seller_commission_seller_id on public.seller_commission_records(seller_id);

drop trigger if exists trg_store_sales_updated_at on public.store_sales;
create trigger trg_store_sales_updated_at before update on public.store_sales for each row execute function public.set_multitenant_updated_at();

drop trigger if exists trg_store_sale_items_updated_at on public.store_sale_items;
create trigger trg_store_sale_items_updated_at before update on public.store_sale_items for each row execute function public.set_multitenant_updated_at();

drop trigger if exists trg_financial_installments_updated_at on public.financial_installments;
create trigger trg_financial_installments_updated_at before update on public.financial_installments for each row execute function public.set_multitenant_updated_at();

drop trigger if exists trg_store_expenses_updated_at on public.store_expenses;
create trigger trg_store_expenses_updated_at before update on public.store_expenses for each row execute function public.set_multitenant_updated_at();

drop trigger if exists trg_architect_rt_records_updated_at on public.architect_rt_records;
create trigger trg_architect_rt_records_updated_at before update on public.architect_rt_records for each row execute function public.set_multitenant_updated_at();

drop trigger if exists trg_seller_commission_records_updated_at on public.seller_commission_records;
create trigger trg_seller_commission_records_updated_at before update on public.seller_commission_records for each row execute function public.set_multitenant_updated_at();

alter table public.store_sales enable row level security;
alter table public.store_sale_items enable row level security;
alter table public.financial_installments enable row level security;
alter table public.store_expenses enable row level security;
alter table public.architect_rt_records enable row level security;
alter table public.seller_commission_records enable row level security;

grant select, insert, update, delete on public.store_sales to authenticated;
grant select, insert, update, delete on public.store_sale_items to authenticated;
grant select, insert, update, delete on public.financial_installments to authenticated;
grant select, insert, update, delete on public.store_expenses to authenticated;
grant select, insert, update, delete on public.architect_rt_records to authenticated;
grant select, insert, update, delete on public.seller_commission_records to authenticated;

drop policy if exists "Financial managers can view store sales" on public.store_sales;
drop policy if exists "Financial managers can insert store sales" on public.store_sales;
drop policy if exists "Financial managers can update store sales" on public.store_sales;
drop policy if exists "Financial managers can delete store sales" on public.store_sales;

create policy "Financial managers can view store sales"
on public.store_sales for select to authenticated
using (public.current_user_can_view_financial(store_id) or seller_id = (select auth.uid()));

create policy "Financial managers can insert store sales"
on public.store_sales for insert to authenticated
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can update store sales"
on public.store_sales for update to authenticated
using (public.current_user_can_manage_financial(store_id))
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can delete store sales"
on public.store_sales for delete to authenticated
using (public.current_user_can_manage_financial(store_id));

drop policy if exists "Financial managers can view sale items" on public.store_sale_items;
drop policy if exists "Financial managers can insert sale items" on public.store_sale_items;
drop policy if exists "Financial managers can update sale items" on public.store_sale_items;
drop policy if exists "Financial managers can delete sale items" on public.store_sale_items;

create policy "Financial managers can view sale items"
on public.store_sale_items for select to authenticated
using (
  public.current_user_can_view_financial(store_id)
  or exists (
    select 1 from public.store_sales s
    where s.id = store_sale_items.sale_id
      and s.store_id = store_sale_items.store_id
      and s.seller_id = (select auth.uid())
  )
);

create policy "Financial managers can insert sale items"
on public.store_sale_items for insert to authenticated
with check (
  public.current_user_can_manage_financial(store_id)
  and exists (
    select 1 from public.store_sales s
    where s.id = store_sale_items.sale_id
      and s.store_id = store_sale_items.store_id
  )
);

create policy "Financial managers can update sale items"
on public.store_sale_items for update to authenticated
using (public.current_user_can_manage_financial(store_id))
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can delete sale items"
on public.store_sale_items for delete to authenticated
using (public.current_user_can_manage_financial(store_id));

drop policy if exists "Financial managers can view installments" on public.financial_installments;
drop policy if exists "Financial managers can insert installments" on public.financial_installments;
drop policy if exists "Financial managers can update installments" on public.financial_installments;
drop policy if exists "Financial managers can delete installments" on public.financial_installments;

create policy "Financial managers can view installments"
on public.financial_installments for select to authenticated
using (public.current_user_can_view_financial(store_id));

create policy "Financial managers can insert installments"
on public.financial_installments for insert to authenticated
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can update installments"
on public.financial_installments for update to authenticated
using (public.current_user_can_manage_financial(store_id))
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can delete installments"
on public.financial_installments for delete to authenticated
using (public.current_user_can_manage_financial(store_id));

drop policy if exists "Financial managers can view expenses" on public.store_expenses;
drop policy if exists "Financial managers can insert expenses" on public.store_expenses;
drop policy if exists "Financial managers can update expenses" on public.store_expenses;
drop policy if exists "Financial managers can delete expenses" on public.store_expenses;

create policy "Financial managers can view expenses"
on public.store_expenses for select to authenticated
using (public.current_user_can_view_financial(store_id));

create policy "Financial managers can insert expenses"
on public.store_expenses for insert to authenticated
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can update expenses"
on public.store_expenses for update to authenticated
using (public.current_user_can_manage_financial(store_id))
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can delete expenses"
on public.store_expenses for delete to authenticated
using (public.current_user_can_manage_financial(store_id));

drop policy if exists "Financial managers can view architect rt" on public.architect_rt_records;
drop policy if exists "Financial managers can insert architect rt" on public.architect_rt_records;
drop policy if exists "Financial managers can update architect rt" on public.architect_rt_records;
drop policy if exists "Financial managers can delete architect rt" on public.architect_rt_records;

create policy "Financial managers can view architect rt"
on public.architect_rt_records for select to authenticated
using (public.current_user_can_view_financial(store_id) or architect_id = (select auth.uid()));

create policy "Financial managers can insert architect rt"
on public.architect_rt_records for insert to authenticated
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can update architect rt"
on public.architect_rt_records for update to authenticated
using (public.current_user_can_manage_financial(store_id))
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can delete architect rt"
on public.architect_rt_records for delete to authenticated
using (public.current_user_can_manage_financial(store_id));

drop policy if exists "Financial managers can view seller commissions" on public.seller_commission_records;
drop policy if exists "Financial managers can insert seller commissions" on public.seller_commission_records;
drop policy if exists "Financial managers can update seller commissions" on public.seller_commission_records;
drop policy if exists "Financial managers can delete seller commissions" on public.seller_commission_records;

create policy "Financial managers can view seller commissions"
on public.seller_commission_records for select to authenticated
using (public.current_user_can_view_financial(store_id) or seller_id = (select auth.uid()));

create policy "Financial managers can insert seller commissions"
on public.seller_commission_records for insert to authenticated
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can update seller commissions"
on public.seller_commission_records for update to authenticated
using (public.current_user_can_manage_financial(store_id))
with check (public.current_user_can_manage_financial(store_id));

create policy "Financial managers can delete seller commissions"
on public.seller_commission_records for delete to authenticated
using (public.current_user_can_manage_financial(store_id));
