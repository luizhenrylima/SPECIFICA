-- Store Admin SaaS architecture: separate global Master Admin from store-scoped admin.

alter table public.products
  add column if not exists owner_store_id uuid references public.stores(id) on delete cascade,
  add column if not exists scope text not null default 'global';

alter table public.products
  drop constraint if exists products_scope_check;

alter table public.products
  add constraint products_scope_check
  check (
    (scope = 'global' and owner_store_id is null)
    or
    (scope = 'store' and owner_store_id is not null)
  );

alter table public.brands
  add column if not exists owner_store_id uuid references public.stores(id) on delete cascade,
  add column if not exists scope text not null default 'global';

alter table public.brands
  drop constraint if exists brands_scope_check;

alter table public.brands
  add constraint brands_scope_check
  check (
    (scope = 'global' and owner_store_id is null)
    or
    (scope = 'store' and owner_store_id is not null)
  );

alter table public.store_products
  add column if not exists is_active boolean not null default true,
  add column if not exists custom_visibility boolean not null default true,
  add column if not exists custom_price numeric(12,2),
  add column if not exists hidden_by_store boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

update public.store_products
set is_active = (status = 'active')
where is_active is distinct from (status = 'active');

alter table public.store_brands
  add column if not exists is_active boolean not null default true,
  add column if not exists hidden_by_store boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

update public.store_brands
set is_active = (status = 'active')
where is_active is distinct from (status = 'active');

create index if not exists idx_products_scope_owner_store on public.products(scope, owner_store_id);
create index if not exists idx_brands_scope_owner_store on public.brands(scope, owner_store_id);
create index if not exists idx_store_products_visibility on public.store_products(store_id, product_id, is_active, hidden_by_store);
create index if not exists idx_store_brands_visibility on public.store_brands(store_id, brand_id, is_active, hidden_by_store);

create or replace function public.current_user_has_store_access(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master_admin()
    or coalesce(
      exists (
        select 1
        from public.store_members sm
        where sm.store_id = target_store_id
          and sm.user_id = (select auth.uid())
          and sm.status = 'active'
      ),
      false
    )
$$;

create or replace function public.current_user_can_manage_store(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master_admin()
    or coalesce(
      exists (
        select 1
        from public.store_members sm
        join public.stores s on s.id = sm.store_id
        where sm.store_id = target_store_id
          and sm.user_id = (select auth.uid())
          and sm.role in ('store_admin', 'manager')
          and sm.status = 'active'
          and s.status in ('active', 'trial', 'pending_setup')
      ),
      false
    )
$$;

create or replace function public.current_user_can_manage_store_catalog(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master_admin()
    or coalesce(
      exists (
        select 1
        from public.store_members sm
        join public.stores s on s.id = sm.store_id
        where sm.store_id = target_store_id
          and sm.user_id = (select auth.uid())
          and sm.role in ('store_admin', 'manager')
          and sm.status = 'active'
          and s.status in ('active', 'trial', 'pending_setup')
      ),
      false
    )
$$;

create or replace function public.current_user_can_manage_store_branding(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master_admin()
    or coalesce(
      exists (
        select 1
        from public.store_members sm
        join public.stores s on s.id = sm.store_id
        where sm.store_id = target_store_id
          and sm.user_id = (select auth.uid())
          and sm.role = 'store_admin'
          and sm.status = 'active'
          and s.status in ('active', 'trial', 'pending_setup')
      ),
      false
    )
$$;

revoke all on function public.current_user_has_store_access(uuid) from public;
revoke all on function public.current_user_can_manage_store(uuid) from public;
revoke all on function public.current_user_can_manage_store_catalog(uuid) from public;
revoke all on function public.current_user_can_manage_store_branding(uuid) from public;

grant execute on function public.current_user_has_store_access(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store_catalog(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store_branding(uuid) to authenticated;

drop policy if exists "Store admins can manage own store members" on public.store_members;
drop policy if exists "Store admins can view store members" on public.store_members;

create policy "Store managers can view own store members"
on public.store_members
for select
to authenticated
using (public.current_user_can_manage_store_users(store_id));

create policy "Store admins can insert allowed own store members"
on public.store_members
for insert
to authenticated
with check (
  public.current_user_can_manage_store_users(store_id)
  and role in ('manager', 'seller', 'financial', 'architect')
);

create policy "Store admins can update allowed own store members"
on public.store_members
for update
to authenticated
using (
  public.current_user_can_manage_store_users(store_id)
  and role in ('manager', 'seller', 'financial', 'architect')
)
with check (
  public.current_user_can_manage_store_users(store_id)
  and role in ('manager', 'seller', 'financial', 'architect')
);

create policy "Store admins can delete allowed own store members"
on public.store_members
for delete
to authenticated
using (
  public.current_user_can_manage_store_users(store_id)
  and role in ('manager', 'seller', 'financial', 'architect')
);

drop policy if exists "Store admins can update own store branding" on public.stores;
create policy "Store admins can update own store branding"
on public.stores
for update
to authenticated
using (public.current_user_can_manage_store_branding(id))
with check (public.current_user_can_manage_store_branding(id));

drop policy if exists "Anyone authenticated can view products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;
drop policy if exists "Master admins can manage global products" on public.products;
drop policy if exists "Store users can view visible store products" on public.products;
drop policy if exists "Store admins can insert own products" on public.products;
drop policy if exists "Store admins can update own products" on public.products;

create policy "Master admins can manage global products"
on public.products
for all
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

create policy "Store users can view visible store products"
on public.products
for select
to authenticated
using (
  public.is_master_admin()
  or (
    scope = 'store'
    and owner_store_id is not null
    and public.current_user_has_store_access(owner_store_id)
    and not coalesce(is_hidden, false)
  )
  or exists (
    select 1
    from public.store_products sp
    left join public.store_brands sb
      on sb.store_id = sp.store_id
      and sb.brand_id = products.brand_id
    where sp.product_id = products.id
      and sp.is_active = true
      and sp.status = 'active'
      and sp.hidden_by_store = false
      and coalesce(sb.hidden_by_store, false) = false
      and coalesce(sb.is_active, true) = true
      and public.current_user_has_store_access(sp.store_id)
      and not coalesce(products.is_hidden, false)
  )
);

create policy "Store admins can insert own products"
on public.products
for insert
to authenticated
with check (
  scope = 'store'
  and owner_store_id is not null
  and public.current_user_can_manage_store_catalog(owner_store_id)
);

create policy "Store admins can update own products"
on public.products
for update
to authenticated
using (
  scope = 'store'
  and owner_store_id is not null
  and public.current_user_can_manage_store_catalog(owner_store_id)
)
with check (
  scope = 'store'
  and owner_store_id is not null
  and public.current_user_can_manage_store_catalog(owner_store_id)
);

drop policy if exists "Anyone authenticated can view brands" on public.brands;
drop policy if exists "Admins can insert brands" on public.brands;
drop policy if exists "Admins can update brands" on public.brands;
drop policy if exists "Admins can delete brands" on public.brands;
drop policy if exists "Master admins can manage global brands" on public.brands;
drop policy if exists "Store users can view visible store brands" on public.brands;
drop policy if exists "Store admins can insert own brands" on public.brands;
drop policy if exists "Store admins can update own brands" on public.brands;

create policy "Master admins can manage global brands"
on public.brands
for all
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

create policy "Store users can view visible store brands"
on public.brands
for select
to authenticated
using (
  public.is_master_admin()
  or (
    scope = 'store'
    and owner_store_id is not null
    and public.current_user_has_store_access(owner_store_id)
    and not coalesce(is_hidden, false)
  )
  or exists (
    select 1
    from public.store_brands sb
    where sb.brand_id = brands.id
      and sb.is_active = true
      and sb.status = 'active'
      and sb.hidden_by_store = false
      and public.current_user_has_store_access(sb.store_id)
      and not coalesce(brands.is_hidden, false)
  )
  or exists (
    select 1
    from public.store_products sp
    join public.products p on p.id = sp.product_id
    where p.brand_id = brands.id
      and sp.is_active = true
      and sp.status = 'active'
      and sp.hidden_by_store = false
      and public.current_user_has_store_access(sp.store_id)
      and not coalesce(p.is_hidden, false)
      and not coalesce(brands.is_hidden, false)
  )
);

create policy "Store admins can insert own brands"
on public.brands
for insert
to authenticated
with check (
  scope = 'store'
  and owner_store_id is not null
  and public.current_user_can_manage_store_catalog(owner_store_id)
);

create policy "Store admins can update own brands"
on public.brands
for update
to authenticated
using (
  scope = 'store'
  and owner_store_id is not null
  and public.current_user_can_manage_store_catalog(owner_store_id)
)
with check (
  scope = 'store'
  and owner_store_id is not null
  and public.current_user_can_manage_store_catalog(owner_store_id)
);

alter table public.store_products enable row level security;
alter table public.store_brands enable row level security;

drop policy if exists "Master admins can manage store products" on public.store_products;
drop policy if exists "Store users can view own store products" on public.store_products;
drop policy if exists "Store admins can update own store product visibility" on public.store_products;
drop policy if exists "Store admins can insert own product links" on public.store_products;

create policy "Master admins can manage store products"
on public.store_products
for all
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

create policy "Store users can view own store products"
on public.store_products
for select
to authenticated
using (public.current_user_has_store_access(store_id));

create policy "Store admins can update own store product visibility"
on public.store_products
for update
to authenticated
using (public.current_user_can_manage_store_catalog(store_id))
with check (public.current_user_can_manage_store_catalog(store_id));

create policy "Store admins can insert own product links"
on public.store_products
for insert
to authenticated
with check (
  public.current_user_can_manage_store_catalog(store_id)
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.scope = 'store'
      and p.owner_store_id = store_id
  )
);

drop policy if exists "Master admins can manage store brands" on public.store_brands;
drop policy if exists "Store users can view own store brands" on public.store_brands;
drop policy if exists "Store admins can update own store brand visibility" on public.store_brands;
drop policy if exists "Store admins can insert own brand links" on public.store_brands;

create policy "Master admins can manage store brands"
on public.store_brands
for all
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

create policy "Store users can view own store brands"
on public.store_brands
for select
to authenticated
using (public.current_user_has_store_access(store_id));

create policy "Store admins can update own store brand visibility"
on public.store_brands
for update
to authenticated
using (public.current_user_can_manage_store_catalog(store_id))
with check (public.current_user_can_manage_store_catalog(store_id));

create policy "Store admins can insert own brand links"
on public.store_brands
for insert
to authenticated
with check (
  public.current_user_can_manage_store_catalog(store_id)
  and exists (
    select 1
    from public.brands b
    where b.id = brand_id
      and b.scope = 'store'
      and b.owner_store_id = store_id
  )
);
