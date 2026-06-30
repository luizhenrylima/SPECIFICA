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
    left join public.store_brands sb
      on sb.store_id = target_store_id
     and sb.brand_id = p.brand_id
    where p.id = target_product_id
      and coalesce(p.scope, 'global') = 'store'
      and p.owner_store_id = target_store_id
      and not coalesce(p.is_hidden, false)
      and coalesce(sb.hidden_by_store, false) = false
      and coalesce(sb.is_active, true) = true
      and coalesce(sb.status, 'active') = 'active'
  )
  or exists (
    select 1
    from public.store_products sp
    join public.products p on p.id = sp.product_id
    left join public.store_brands sb
      on sb.store_id = sp.store_id
     and sb.brand_id = p.brand_id
    where sp.store_id = target_store_id
      and sp.product_id = target_product_id
      and coalesce(sp.status, 'active') = 'active'
      and coalesce(sp.is_active, true) = true
      and coalesce(sp.hidden_by_store, false) = false
      and coalesce(sp.custom_visibility, true) = true
      and coalesce(p.scope, 'global') = 'global'
      and not coalesce(p.is_hidden, false)
      and coalesce(sb.hidden_by_store, false) = false
      and coalesce(sb.is_active, true) = true
      and coalesce(sb.status, 'active') = 'active'
  );
$$;

revoke all on function public.product_is_visible_for_store(uuid, uuid) from public;
revoke execute on function public.product_is_visible_for_store(uuid, uuid) from anon;
grant execute on function public.product_is_visible_for_store(uuid, uuid) to authenticated;

drop policy if exists "Store users can view visible store products" on public.products;
create policy "Store users can view visible store products"
on public.products
for select
to authenticated
using (
  public.is_master_admin()
  or (
    coalesce(scope, 'global') = 'store'
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
      and coalesce(sp.is_active, true) = true
      and coalesce(sp.status, 'active') = 'active'
      and coalesce(sp.hidden_by_store, false) = false
      and coalesce(sp.custom_visibility, true) = true
      and coalesce(sb.hidden_by_store, false) = false
      and coalesce(sb.is_active, true) = true
      and coalesce(sb.status, 'active') = 'active'
      and public.current_user_has_store_access(sp.store_id)
      and not coalesce(products.is_hidden, false)
  )
);

drop policy if exists "Store users can view visible store brands" on public.brands;
create policy "Store users can view visible store brands"
on public.brands
for select
to authenticated
using (
  public.is_master_admin()
  or (
    coalesce(scope, 'global') = 'store'
    and owner_store_id is not null
    and public.current_user_has_store_access(owner_store_id)
    and not coalesce(is_hidden, false)
  )
  or exists (
    select 1
    from public.store_brands sb
    where sb.brand_id = brands.id
      and coalesce(sb.is_active, true) = true
      and coalesce(sb.status, 'active') = 'active'
      and coalesce(sb.hidden_by_store, false) = false
      and public.current_user_has_store_access(sb.store_id)
      and not coalesce(brands.is_hidden, false)
  )
  or exists (
    select 1
    from public.store_products sp
    join public.products p on p.id = sp.product_id
    where p.brand_id = brands.id
      and coalesce(sp.is_active, true) = true
      and coalesce(sp.status, 'active') = 'active'
      and coalesce(sp.hidden_by_store, false) = false
      and coalesce(sp.custom_visibility, true) = true
      and public.current_user_has_store_access(sp.store_id)
      and not coalesce(p.is_hidden, false)
      and not coalesce(brands.is_hidden, false)
  )
);

drop policy if exists "Store admins can insert own product links" on public.store_products;
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
      and not coalesce(p.is_hidden, false)
      and (
        coalesce(p.scope, 'global') = 'global'
        or (coalesce(p.scope, 'global') = 'store' and p.owner_store_id = store_id)
      )
  )
);

drop policy if exists "Store admins can insert own brand links" on public.store_brands;
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
      and not coalesce(b.is_hidden, false)
      and (
        coalesce(b.scope, 'global') = 'global'
        or (coalesce(b.scope, 'global') = 'store' and b.owner_store_id = store_id)
      )
  )
);

drop policy if exists "Projects visible by role and ownership" on public.projects;
drop policy if exists "Projects created by valid owner" on public.projects;
drop policy if exists "Projects updated by valid owner" on public.projects;
drop policy if exists "Projects deleted only by management" on public.projects;
drop policy if exists "Projects visible by current store" on public.projects;
drop policy if exists "Projects created by current store" on public.projects;
drop policy if exists "Projects updated by current store" on public.projects;
drop policy if exists "Projects deleted by current store managers" on public.projects;

create policy "Projects visible by current store"
on public.projects
for select
to authenticated
using (
  archived_at is null
  and store_id is not null
  and public.current_user_has_store_access(store_id)
  and (
    public.current_user_can_manage_store(store_id)
    or user_id = (select auth.uid())
    or seller_user_id = (select auth.uid())
    or crm_architect_profile_id = (select auth.uid())
  )
);

create policy "Projects created by current store"
on public.projects
for insert
to authenticated
with check (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and (
    public.current_user_can_manage_store(store_id)
    or user_id = (select auth.uid())
    or seller_user_id = (select auth.uid())
    or crm_architect_profile_id = (select auth.uid())
  )
);

create policy "Projects updated by current store"
on public.projects
for update
to authenticated
using (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and (
    public.current_user_can_manage_store(store_id)
    or user_id = (select auth.uid())
    or seller_user_id = (select auth.uid())
    or crm_architect_profile_id = (select auth.uid())
  )
)
with check (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and (
    public.current_user_can_manage_store(store_id)
    or user_id = (select auth.uid())
    or seller_user_id = (select auth.uid())
    or crm_architect_profile_id = (select auth.uid())
  )
);

create policy "Projects deleted by current store managers"
on public.projects
for delete
to authenticated
using (
  store_id is not null
  and public.current_user_can_manage_store(store_id)
);

drop policy if exists "Project items visible by project access" on public.project_items;
drop policy if exists "Project items inserted by project access" on public.project_items;
drop policy if exists "Project items updated by project access" on public.project_items;
drop policy if exists "Project items deleted by project access" on public.project_items;

create policy "Project items visible by project access"
on public.project_items
for select
to authenticated
using (
  archived_at is null
  and store_id is not null
  and public.current_user_has_store_access(store_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.store_id = project_items.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
        or p.crm_architect_profile_id = (select auth.uid())
      )
  )
);

create policy "Project items inserted by project access"
on public.project_items
for insert
to authenticated
with check (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and (product_id is null or public.product_is_visible_for_store(store_id, product_id))
  and exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.store_id = project_items.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
        or p.crm_architect_profile_id = (select auth.uid())
      )
  )
);

create policy "Project items updated by project access"
on public.project_items
for update
to authenticated
using (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.store_id = project_items.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
        or p.crm_architect_profile_id = (select auth.uid())
      )
  )
)
with check (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and (product_id is null or public.product_is_visible_for_store(store_id, product_id))
);

create policy "Project items deleted by project access"
on public.project_items
for delete
to authenticated
using (
  store_id is not null
  and public.current_user_has_store_access(store_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.store_id = project_items.store_id
      and (
        public.current_user_can_manage_store(p.store_id)
        or p.user_id = (select auth.uid())
        or p.seller_user_id = (select auth.uid())
        or p.crm_architect_profile_id = (select auth.uid())
      )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets',
  'store-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[];

drop policy if exists "Public can read store assets" on storage.objects;
drop policy if exists "Store managers can upload store assets" on storage.objects;
drop policy if exists "Store managers can update store assets" on storage.objects;
drop policy if exists "Store managers can delete store assets" on storage.objects;

create policy "Public can read store assets"
on storage.objects
for select
to public
using (bucket_id = 'store-assets');

create policy "Store managers can upload store assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'store-assets'
  and (storage.foldername(name))[1] = 'stores'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.current_user_can_manage_store_branding(((storage.foldername(name))[2])::uuid)
);

create policy "Store managers can update store assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'store-assets'
  and (storage.foldername(name))[1] = 'stores'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.current_user_can_manage_store_branding(((storage.foldername(name))[2])::uuid)
)
with check (
  bucket_id = 'store-assets'
  and (storage.foldername(name))[1] = 'stores'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.current_user_can_manage_store_branding(((storage.foldername(name))[2])::uuid)
);

create policy "Store managers can delete store assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'store-assets'
  and (storage.foldername(name))[1] = 'stores'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.current_user_can_manage_store_branding(((storage.foldername(name))[2])::uuid)
);
