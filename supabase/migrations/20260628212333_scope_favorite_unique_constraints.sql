do $$
begin
  if exists (
    select 1
    from public.favorites
    where store_id is null
  ) then
    raise exception 'Cannot add scoped favorites unique constraint: favorites.store_id has null rows';
  end if;

  if exists (
    select 1
    from public.architect_brand_favorites
    where store_id is null
  ) then
    raise exception 'Cannot add scoped brand favorites unique constraint: architect_brand_favorites.store_id has null rows';
  end if;

  if exists (
    select 1
    from (
      select store_id, user_id, product_id
      from public.favorites
      group by store_id, user_id, product_id
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Cannot add scoped favorites unique constraint: duplicate store/user/product rows exist';
  end if;

  if exists (
    select 1
    from (
      select store_id, user_id, brand_id
      from public.architect_brand_favorites
      group by store_id, user_id, brand_id
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Cannot add scoped brand favorites unique constraint: duplicate store/user/brand rows exist';
  end if;
end $$;

alter table public.favorites
  alter column store_id set not null;

alter table public.architect_brand_favorites
  alter column store_id set not null;

alter table public.favorites
  drop constraint if exists favorites_user_id_product_id_key;

alter table public.favorites
  add constraint favorites_store_id_user_id_product_id_key
  unique (store_id, user_id, product_id);

alter table public.architect_brand_favorites
  drop constraint if exists architect_brand_favorites_pkey;

alter table public.architect_brand_favorites
  add constraint architect_brand_favorites_pkey
  primary key (store_id, user_id, brand_id);
