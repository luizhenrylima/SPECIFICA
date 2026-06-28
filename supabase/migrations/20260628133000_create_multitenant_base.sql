-- Base SaaS multi-tenant for SPECIFICA.
-- This migration adds the new store model alongside the current single-store
-- application. It does not alter existing tenant/price tables or legacy RLS.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  max_users integer,
  max_architects integer,
  max_products integer,
  max_storage_mb integer,
  has_financial_module boolean not null default false,
  has_custom_branding boolean not null default true,
  has_advanced_reports boolean not null default false,
  price_monthly numeric,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_name_not_blank check (btrim(name) <> ''),
  constraint plans_status_check check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  cnpj text,
  slug text unique not null,
  status text not null default 'pending_setup',
  plan_id uuid references public.plans(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  email text,
  phone text,
  city text,
  state text,
  country text not null default 'BR',
  logo_url text,
  primary_color text not null default '#111827',
  secondary_color text not null default '#6B7280',
  accent_color text not null default '#000000',
  background_color text not null default '#FFFFFF',
  text_color text not null default '#111827',
  cover_image_url text,
  custom_welcome_text text,
  max_users integer,
  max_architects integer,
  max_products integer,
  storage_limit_mb integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  constraint stores_name_not_blank check (btrim(name) <> ''),
  constraint stores_slug_not_blank check (btrim(slug) <> ''),
  constraint stores_status_check check (
    status in ('active', 'inactive', 'trial', 'suspended', 'pending_setup', 'cancelled')
  )
);

create table if not exists public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id),
  constraint store_members_role_check check (
    role in ('store_admin', 'manager', 'seller', 'finance', 'architect', 'viewer')
  ),
  constraint store_members_status_check check (status in ('active', 'inactive', 'invited', 'suspended'))
);

alter table public.profiles
  add column if not exists global_role text not null default 'user',
  add column if not exists active boolean not null default true,
  add column if not exists last_login_at timestamptz;

do $$
begin
  alter table public.profiles
    add constraint profiles_global_role_check
    check (global_role in ('super_admin', 'user'))
    not valid;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (store_id, product_id),
  constraint store_products_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.store_brands (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (store_id, brand_id),
  constraint store_brands_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.store_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (store_id, category_id),
  constraint store_categories_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  store_id uuid references public.stores(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (btrim(action) <> '')
);

create index if not exists idx_stores_slug on public.stores(slug);
create index if not exists idx_stores_status on public.stores(status);
create index if not exists idx_store_members_store_id on public.store_members(store_id);
create index if not exists idx_store_members_user_id on public.store_members(user_id);
create index if not exists idx_store_members_role on public.store_members(role);
create index if not exists idx_store_members_status on public.store_members(status);
create index if not exists idx_store_products_store_id on public.store_products(store_id);
create index if not exists idx_store_products_product_id on public.store_products(product_id);
create index if not exists idx_store_brands_store_id on public.store_brands(store_id);
create index if not exists idx_store_brands_brand_id on public.store_brands(brand_id);
create index if not exists idx_store_categories_store_id on public.store_categories(store_id);
create index if not exists idx_store_categories_category_id on public.store_categories(category_id);
create index if not exists idx_audit_logs_store_id on public.audit_logs(store_id);
create index if not exists idx_audit_logs_actor_user_id on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

create or replace function public.set_multitenant_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_plans_multitenant_updated_at on public.plans;
create trigger trg_plans_multitenant_updated_at
before update on public.plans
for each row execute function public.set_multitenant_updated_at();

drop trigger if exists trg_stores_multitenant_updated_at on public.stores;
create trigger trg_stores_multitenant_updated_at
before update on public.stores
for each row execute function public.set_multitenant_updated_at();

drop trigger if exists trg_store_members_multitenant_updated_at on public.store_members;
create trigger trg_store_members_multitenant_updated_at
before update on public.store_members
for each row execute function public.set_multitenant_updated_at();

insert into public.plans (
  name,
  status,
  has_financial_module,
  has_custom_branding,
  has_advanced_reports
)
select
  'Plano Interno',
  'active',
  true,
  true,
  true
where not exists (
  select 1 from public.plans where name = 'Plano Interno'
);

insert into public.stores (
  name,
  slug,
  status,
  plan_id
)
select
  'SPECIFICA Principal',
  'especifica-principal',
  'active',
  (select id from public.plans where name = 'Plano Interno' order by created_at asc limit 1)
on conflict (slug) do update
set plan_id = coalesce(public.stores.plan_id, excluded.plan_id),
    updated_at = now();

create or replace function public.current_user_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.global_role = 'super_admin'
        and coalesce(p.active, true) = true
    ),
    false
  )
$$;

create or replace function public.current_user_store_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select sm.store_id
  from public.store_members sm
  join public.stores s on s.id = sm.store_id
  where sm.user_id = auth.uid()
    and sm.status = 'active'
    and s.status in ('active', 'trial', 'pending_setup')
$$;

create or replace function public.user_has_store_access(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or coalesce(
      exists (
        select 1
        from public.store_members sm
        join public.stores s on s.id = sm.store_id
        where sm.store_id = target_store_id
          and sm.user_id = auth.uid()
          and sm.status = 'active'
          and s.status in ('active', 'trial', 'pending_setup')
      ),
      false
    )
$$;

create or replace function public.user_has_store_role(target_store_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or coalesce(
      exists (
        select 1
        from public.store_members sm
        join public.stores s on s.id = sm.store_id
        where sm.store_id = target_store_id
          and sm.user_id = auth.uid()
          and sm.status = 'active'
          and sm.role = any(allowed_roles)
          and s.status in ('active', 'trial', 'pending_setup')
      ),
      false
    )
$$;

revoke all on function public.current_user_id() from public;
revoke all on function public.is_super_admin() from public;
revoke all on function public.current_user_store_ids() from public;
revoke all on function public.user_has_store_access(uuid) from public;
revoke all on function public.user_has_store_role(uuid, text[]) from public;

grant execute on function public.current_user_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.current_user_store_ids() to authenticated;
grant execute on function public.user_has_store_access(uuid) to authenticated;
grant execute on function public.user_has_store_role(uuid, text[]) to authenticated;

alter table public.plans enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.store_products enable row level security;
alter table public.store_brands enable row level security;
alter table public.store_categories enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Super admins can manage plans" on public.plans;
create policy "Super admins can manage plans"
on public.plans
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Store members can view assigned plans" on public.plans;
create policy "Store members can view assigned plans"
on public.plans
for select
to authenticated
using (
  exists (
    select 1
    from public.stores s
    where s.plan_id = plans.id
      and public.user_has_store_access(s.id)
  )
);

drop policy if exists "Super admins can manage stores" on public.stores;
create policy "Super admins can manage stores"
on public.stores
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Active members can view own stores" on public.stores;
create policy "Active members can view own stores"
on public.stores
for select
to authenticated
using (public.user_has_store_access(id));

drop policy if exists "Super admins can manage store members" on public.store_members;
create policy "Super admins can manage store members"
on public.store_members
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Members can view own memberships" on public.store_members;
create policy "Members can view own memberships"
on public.store_members
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Store admins can view store members" on public.store_members;
create policy "Store admins can view store members"
on public.store_members
for select
to authenticated
using (public.user_has_store_role(store_id, array['store_admin']));

drop policy if exists "Super admins can manage store products" on public.store_products;
create policy "Super admins can manage store products"
on public.store_products
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Active members can view store products" on public.store_products;
create policy "Active members can view store products"
on public.store_products
for select
to authenticated
using (public.user_has_store_access(store_id));

drop policy if exists "Super admins can manage store brands" on public.store_brands;
create policy "Super admins can manage store brands"
on public.store_brands
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Active members can view store brands" on public.store_brands;
create policy "Active members can view store brands"
on public.store_brands
for select
to authenticated
using (public.user_has_store_access(store_id));

drop policy if exists "Super admins can manage store categories" on public.store_categories;
create policy "Super admins can manage store categories"
on public.store_categories
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Active members can view store categories" on public.store_categories;
create policy "Active members can view store categories"
on public.store_categories
for select
to authenticated
using (public.user_has_store_access(store_id));

drop policy if exists "Super admins can manage audit logs" on public.audit_logs;
create policy "Super admins can manage audit logs"
on public.audit_logs
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Store admins can view own audit logs" on public.audit_logs;
create policy "Store admins can view own audit logs"
on public.audit_logs
for select
to authenticated
using (public.user_has_store_role(store_id, array['store_admin']));

grant select on public.plans to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select on public.stores to authenticated;
grant select, insert, update, delete on public.stores to authenticated;
grant select on public.store_members to authenticated;
grant select, insert, update, delete on public.store_members to authenticated;
grant select on public.store_products to authenticated;
grant select, insert, update, delete on public.store_products to authenticated;
grant select on public.store_brands to authenticated;
grant select, insert, update, delete on public.store_brands to authenticated;
grant select on public.store_categories to authenticated;
grant select, insert, update, delete on public.store_categories to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert, update, delete on public.audit_logs to authenticated;

