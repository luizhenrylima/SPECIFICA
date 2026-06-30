create or replace function public.current_user_can_view_store_performance(target_store_id uuid)
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
      join public.stores s on s.id = sm.store_id
      where sm.store_id = target_store_id
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role in ('store_admin', 'manager', 'seller', 'financial')
        and s.status in ('active', 'trial', 'pending_setup')
    );
$$;

create or replace function public.current_user_can_manage_quotes(target_store_id uuid)
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
      join public.stores s on s.id = sm.store_id
      where sm.store_id = target_store_id
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role in ('store_admin', 'manager', 'seller', 'financial')
        and s.status in ('active', 'trial', 'pending_setup')
    );
$$;

create or replace function public.product_is_visible_for_store(target_store_id uuid, target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products p
    join public.store_brands sb
      on sb.store_id = target_store_id
     and sb.brand_id = p.brand_id
     and sb.status = 'active'
     and sb.is_active = true
     and sb.hidden_by_store = false
    where p.id = target_product_id
      and p.scope = 'store'
      and p.owner_store_id = target_store_id
      and p.is_hidden = false
  )
  or exists (
    select 1
    from public.store_products sp
    join public.products p on p.id = sp.product_id
    join public.store_brands sb
      on sb.store_id = sp.store_id
     and sb.brand_id = p.brand_id
     and sb.status = 'active'
     and sb.is_active = true
     and sb.hidden_by_store = false
    where sp.store_id = target_store_id
      and sp.product_id = target_product_id
      and sp.status = 'active'
      and sp.is_active = true
      and sp.hidden_by_store = false
      and p.scope = 'global'
      and p.is_hidden = false
  );
$$;

revoke all on function public.current_user_can_view_store_performance(uuid) from public;
revoke all on function public.current_user_can_manage_quotes(uuid) from public;
revoke all on function public.product_is_visible_for_store(uuid, uuid) from public;
revoke execute on function public.current_user_can_view_store_performance(uuid) from anon;
revoke execute on function public.current_user_can_manage_quotes(uuid) from anon;
revoke execute on function public.product_is_visible_for_store(uuid, uuid) from anon;
grant execute on function public.current_user_can_view_store_performance(uuid) to authenticated;
grant execute on function public.current_user_can_manage_quotes(uuid) to authenticated;
grant execute on function public.product_is_visible_for_store(uuid, uuid) to authenticated;

create table if not exists public.performance_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint performance_events_event_type_check check (
    event_type in (
      'product_view',
      'product_favorite',
      'product_added_to_project',
      'quote_requested',
      'quote_status_changed',
      'product_hidden',
      'product_unhidden',
      'brand_hidden',
      'brand_unhidden'
    )
  )
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.crm_quotes(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_performance_events_store_created on public.performance_events(store_id, created_at desc);
create index if not exists idx_performance_events_store_type on public.performance_events(store_id, event_type);
create index if not exists idx_performance_events_product on public.performance_events(product_id);
create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_quote_items_store_id on public.quote_items(store_id);
create index if not exists idx_quote_items_product_id on public.quote_items(product_id);

alter table public.performance_events enable row level security;
alter table public.quote_items enable row level security;

grant select, insert, update, delete on public.performance_events to authenticated;
grant select, insert, update, delete on public.quote_items to authenticated;

drop policy if exists "Store members can view own performance events" on public.performance_events;
drop policy if exists "Store members can insert own performance events" on public.performance_events;
drop policy if exists "Managers can manage own performance events" on public.performance_events;

create policy "Store members can view own performance events"
on public.performance_events
for select
to authenticated
using (
  public.current_user_can_view_store_performance(store_id)
  or (
    user_id = (select auth.uid())
    and public.current_user_has_store_access(store_id)
  )
);

create policy "Store members can insert own performance events"
on public.performance_events
for insert
to authenticated
with check (
  public.current_user_has_store_access(store_id)
  and (user_id is null or user_id = (select auth.uid()) or public.current_user_can_view_store_performance(store_id))
);

create policy "Managers can manage own performance events"
on public.performance_events
for update
to authenticated
using (public.current_user_can_view_store_performance(store_id))
with check (public.current_user_can_view_store_performance(store_id));

drop policy if exists "Quote items visible by store" on public.quote_items;
drop policy if exists "Quote items inserted by store" on public.quote_items;
drop policy if exists "Quote items updated by store" on public.quote_items;
drop policy if exists "Quote items deleted by store" on public.quote_items;

create policy "Quote items visible by store"
on public.quote_items
for select
to authenticated
using (
  public.current_user_can_manage_quotes(store_id)
  or exists (
    select 1
    from public.crm_quotes q
    join public.projects p on p.id = q.project_id
    where q.id = quote_items.quote_id
      and q.store_id = quote_items.store_id
      and p.user_id = (select auth.uid())
  )
);

create policy "Quote items inserted by store"
on public.quote_items
for insert
to authenticated
with check (
  public.current_user_can_manage_quotes(store_id)
  and exists (
    select 1
    from public.crm_quotes q
    where q.id = quote_items.quote_id
      and q.store_id = quote_items.store_id
  )
  and (product_id is null or public.product_is_visible_for_store(store_id, product_id))
);

create policy "Quote items updated by store"
on public.quote_items
for update
to authenticated
using (public.current_user_can_manage_quotes(store_id))
with check (
  public.current_user_can_manage_quotes(store_id)
  and (product_id is null or public.product_is_visible_for_store(store_id, product_id))
);

create policy "Quote items deleted by store"
on public.quote_items
for delete
to authenticated
using (public.current_user_can_manage_quotes(store_id));

drop policy if exists "CRM quotes visible to staff owners" on public.crm_quotes;
drop policy if exists "CRM quotes managed by staff owners" on public.crm_quotes;

create policy "CRM quotes visible by current store"
on public.crm_quotes
for select
to authenticated
using (
  public.current_user_can_manage_quotes(store_id)
  or seller_user_id = (select auth.uid())
  or exists (
    select 1
    from public.projects p
    where p.id = crm_quotes.project_id
      and p.store_id = crm_quotes.store_id
      and p.user_id = (select auth.uid())
  )
);

create policy "CRM quotes inserted by current store"
on public.crm_quotes
for insert
to authenticated
with check (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and (
    public.current_user_can_manage_quotes(store_id)
    or seller_user_id = (select auth.uid())
    or exists (
      select 1
      from public.projects p
      where p.id = crm_quotes.project_id
        and p.store_id = crm_quotes.store_id
        and p.user_id = (select auth.uid())
    )
  )
);

create policy "CRM quotes updated by current store"
on public.crm_quotes
for update
to authenticated
using (
  public.current_user_can_manage_quotes(store_id)
  or seller_user_id = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_quotes(store_id)
    or seller_user_id = (select auth.uid())
  )
);

create policy "CRM quotes deleted by current store managers"
on public.crm_quotes
for delete
to authenticated
using (public.current_user_can_manage_quotes(store_id));

drop policy if exists "CRM orders visible to staff owners" on public.crm_orders;
drop policy if exists "CRM orders managed by staff owners" on public.crm_orders;

create policy "CRM orders visible by current store"
on public.crm_orders
for select
to authenticated
using (
  public.current_user_can_manage_quotes(store_id)
  or seller_user_id = (select auth.uid())
);

create policy "CRM orders inserted by current store"
on public.crm_orders
for insert
to authenticated
with check (
  store_id is not null
  and (
    public.current_user_can_manage_quotes(store_id)
    or seller_user_id = (select auth.uid())
  )
);

create policy "CRM orders updated by current store"
on public.crm_orders
for update
to authenticated
using (
  public.current_user_can_manage_quotes(store_id)
  or seller_user_id = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_quotes(store_id)
    or seller_user_id = (select auth.uid())
  )
);

create policy "CRM orders deleted by current store managers"
on public.crm_orders
for delete
to authenticated
using (public.current_user_can_manage_quotes(store_id));

drop policy if exists "CRM customers visible by seller" on public.crm_customers;
drop policy if exists "CRM customers created by seller" on public.crm_customers;
drop policy if exists "CRM customers updated by seller" on public.crm_customers;
drop policy if exists "CRM customers deleted only by management" on public.crm_customers;

create policy "CRM customers visible by current store"
on public.crm_customers
for select
to authenticated
using (
  archived_at is null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
    or architect_profile_id = (select auth.uid())
  )
);

create policy "CRM customers inserted by current store"
on public.crm_customers
for insert
to authenticated
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
    or architect_profile_id = (select auth.uid())
  )
);

create policy "CRM customers updated by current store"
on public.crm_customers
for update
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or seller_user_id = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
  )
);

create policy "CRM customers deleted by current store managers"
on public.crm_customers
for delete
to authenticated
using (public.current_user_can_manage_store(store_id));

drop policy if exists "CRM leads visible by seller" on public.crm_leads;
drop policy if exists "CRM leads created by seller" on public.crm_leads;
drop policy if exists "CRM leads updated by seller" on public.crm_leads;
drop policy if exists "CRM leads deleted only by management" on public.crm_leads;

create policy "CRM leads visible by current store"
on public.crm_leads
for select
to authenticated
using (
  archived_at is null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
    or architect_profile_id = (select auth.uid())
  )
);

create policy "CRM leads inserted by current store"
on public.crm_leads
for insert
to authenticated
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
    or architect_profile_id = (select auth.uid())
  )
);

create policy "CRM leads updated by current store"
on public.crm_leads
for update
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or seller_user_id = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
  )
);

create policy "CRM leads deleted by current store managers"
on public.crm_leads
for delete
to authenticated
using (public.current_user_can_manage_store(store_id));

drop policy if exists "CRM interactions visible to project or customer owners" on public.crm_interactions;
drop policy if exists "CRM interactions insert by staff owners" on public.crm_interactions;
drop policy if exists "CRM interactions update by staff owners" on public.crm_interactions;

create policy "CRM interactions visible by current store"
on public.crm_interactions
for select
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or user_id = (select auth.uid())
  or exists (
    select 1
    from public.crm_customers c
    where c.id = crm_interactions.customer_id
      and c.store_id = crm_interactions.store_id
      and (c.seller_user_id = (select auth.uid()) or c.architect_profile_id = (select auth.uid()))
  )
  or exists (
    select 1
    from public.projects p
    where p.id = crm_interactions.project_id
      and p.store_id = crm_interactions.store_id
      and p.user_id = (select auth.uid())
  )
);

create policy "CRM interactions inserted by current store"
on public.crm_interactions
for insert
to authenticated
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or user_id = (select auth.uid())
  )
);

create policy "CRM interactions updated by current store"
on public.crm_interactions
for update
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or user_id = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or user_id = (select auth.uid())
  )
);

drop policy if exists "Staff can view accessible agenda events" on public.crm_agenda_events;
drop policy if exists "Staff can manage accessible agenda events" on public.crm_agenda_events;

create policy "CRM agenda visible by current store"
on public.crm_agenda_events
for select
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or seller_user_id = (select auth.uid())
  or architect_profile_id = (select auth.uid())
);

create policy "CRM agenda inserted by current store"
on public.crm_agenda_events
for insert
to authenticated
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
    or architect_profile_id = (select auth.uid())
  )
);

create policy "CRM agenda updated by current store"
on public.crm_agenda_events
for update
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or seller_user_id = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or seller_user_id = (select auth.uid())
  )
);

create policy "CRM agenda deleted by current store managers"
on public.crm_agenda_events
for delete
to authenticated
using (public.current_user_can_manage_store(store_id));

drop policy if exists "CRM support tickets visible to staff owners" on public.crm_support_tickets;
drop policy if exists "CRM support tickets managed by staff owners" on public.crm_support_tickets;

create policy "CRM support tickets visible by current store"
on public.crm_support_tickets
for select
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or responsible_user_id = (select auth.uid())
);

create policy "CRM support tickets inserted by current store"
on public.crm_support_tickets
for insert
to authenticated
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or responsible_user_id = (select auth.uid())
  )
);

create policy "CRM support tickets updated by current store"
on public.crm_support_tickets
for update
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or responsible_user_id = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or responsible_user_id = (select auth.uid())
  )
);

create policy "CRM support tickets deleted by current store managers"
on public.crm_support_tickets
for delete
to authenticated
using (public.current_user_can_manage_store(store_id));

drop policy if exists "Staff can view technical notebooks" on public.crm_technical_notebooks;
drop policy if exists "Staff can manage technical notebooks" on public.crm_technical_notebooks;

create policy "CRM technical notebooks visible by current store"
on public.crm_technical_notebooks
for select
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or generated_by = (select auth.uid())
  or exists (
    select 1
    from public.projects p
    where p.id = crm_technical_notebooks.project_id
      and p.store_id = crm_technical_notebooks.store_id
      and p.user_id = (select auth.uid())
  )
);

create policy "CRM technical notebooks inserted by current store"
on public.crm_technical_notebooks
for insert
to authenticated
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or generated_by = (select auth.uid())
  )
);

create policy "CRM technical notebooks updated by current store"
on public.crm_technical_notebooks
for update
to authenticated
using (
  public.current_user_can_manage_store(store_id)
  or generated_by = (select auth.uid())
)
with check (
  store_id is not null
  and (
    public.current_user_can_manage_store(store_id)
    or generated_by = (select auth.uid())
  )
);

drop policy if exists "Admins and managers can manage sales targets" on public.crm_sales_targets;
drop policy if exists "Sellers can view own sales targets" on public.crm_sales_targets;

create policy "CRM sales targets visible by current store"
on public.crm_sales_targets
for select
to authenticated
using (
  public.current_user_can_view_store_performance(store_id)
  or seller_user_id = (select auth.uid())
);

create policy "CRM sales targets managed by current store"
on public.crm_sales_targets
for all
to authenticated
using (public.current_user_can_manage_store(store_id))
with check (public.current_user_can_manage_store(store_id));

drop policy if exists "Users can view own project env images" on public.project_environment_images;
drop policy if exists "Users can insert own project env images" on public.project_environment_images;
drop policy if exists "Users can update own project env images" on public.project_environment_images;
drop policy if exists "Users can delete own project env images" on public.project_environment_images;

create policy "Project env images visible by current store"
on public.project_environment_images
for select
to authenticated
using (
  public.current_user_has_store_access(store_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_environment_images.project_id
      and p.store_id = project_environment_images.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
      )
  )
);

create policy "Project env images inserted by current store"
on public.project_environment_images
for insert
to authenticated
with check (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_environment_images.project_id
      and p.store_id = project_environment_images.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
      )
  )
);

create policy "Project env images updated by current store"
on public.project_environment_images
for update
to authenticated
using (
  public.current_user_has_store_access(store_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_environment_images.project_id
      and p.store_id = project_environment_images.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
      )
  )
)
with check (
  store_id is not null
  and public.current_user_has_store_access(store_id)
);

create policy "Project env images deleted by current store"
on public.project_environment_images
for delete
to authenticated
using (
  public.current_user_has_store_access(store_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_environment_images.project_id
      and p.store_id = project_environment_images.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
      )
  )
);
