-- Fase 4: consolidate store RLS policies used by branding/theme reads.
-- Keeps master admin management and active member read access without a broad
-- permissive ALL policy on public.stores.

drop policy if exists "Super admins can manage stores" on public.stores;
drop policy if exists "Master admins can manage stores" on public.stores;
drop policy if exists "Active members can view own stores" on public.stores;
drop policy if exists "Master admins can view stores" on public.stores;
drop policy if exists "Master admins and active members can view stores" on public.stores;

create policy "Master admins and active members can view stores"
on public.stores
for select
to authenticated
using (
  public.is_master_admin()
  or public.user_has_store_access(id)
);

drop policy if exists "Master admins can insert stores" on public.stores;
create policy "Master admins can insert stores"
on public.stores
for insert
to authenticated
with check (public.is_master_admin());

drop policy if exists "Master admins can update stores" on public.stores;
create policy "Master admins can update stores"
on public.stores
for update
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

drop policy if exists "Master admins can delete stores" on public.stores;
create policy "Master admins can delete stores"
on public.stores
for delete
to authenticated
using (public.is_master_admin());
