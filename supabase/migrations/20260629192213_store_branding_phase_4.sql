-- Fase 4: store-level visual identity.
-- Adds the optional public display name used by tenant-facing UI.

alter table public.stores
  add column if not exists display_name text;

comment on column public.stores.display_name is
  'Optional storefront display name. Falls back to stores.name when empty.';

-- Keep explicit tenant read access for branding/theme data.
-- Master admins keep the existing manage policies; regular members can only read
-- their own store through public.user_has_store_access(id).
drop policy if exists "Active members can view own stores" on public.stores;
create policy "Active members can view own stores"
on public.stores
for select
to authenticated
using (public.user_has_store_access(id));
