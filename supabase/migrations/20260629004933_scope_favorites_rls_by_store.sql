-- Scope favorites RLS by the active store membership.
-- Projects/project_items RLS is intentionally left untouched here because those
-- policies include shared-link and legacy ownership behavior that needs a
-- dedicated compatibility pass.

drop policy if exists "Favorites read own rows" on public.favorites;
drop policy if exists "Favorites insert own rows" on public.favorites;
drop policy if exists "Favorites delete own rows" on public.favorites;

create policy "Favorites read by current store access"
on public.favorites
for select
to authenticated
using (
  public.is_super_admin()
  or (
    user_id = (select auth.uid())
    and public.user_has_store_access(store_id)
  )
);

create policy "Favorites insert by current store access"
on public.favorites
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    user_id = (select auth.uid())
    and public.user_has_store_access(store_id)
  )
);

create policy "Favorites delete by current store access"
on public.favorites
for delete
to authenticated
using (
  public.is_super_admin()
  or (
    user_id = (select auth.uid())
    and public.user_has_store_access(store_id)
  )
);

drop policy if exists "Favorite brands read own rows" on public.architect_brand_favorites;
drop policy if exists "Favorite brands insert own rows" on public.architect_brand_favorites;
drop policy if exists "Favorite brands delete own rows" on public.architect_brand_favorites;

create policy "Favorite brands read by current store access"
on public.architect_brand_favorites
for select
to authenticated
using (
  public.is_super_admin()
  or (
    user_id = (select auth.uid())
    and public.user_has_store_access(store_id)
  )
);

create policy "Favorite brands insert by current store access"
on public.architect_brand_favorites
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    user_id = (select auth.uid())
    and public.user_has_store_access(store_id)
  )
);

create policy "Favorite brands delete by current store access"
on public.architect_brand_favorites
for delete
to authenticated
using (
  public.is_super_admin()
  or (
    user_id = (select auth.uid())
    and public.user_has_store_access(store_id)
  )
);
