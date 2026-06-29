-- Fase 2 Master Admin: fields used by the SaaS store management panel.
-- Keeps the existing store model and adds only missing admin-facing columns.

alter table public.stores
  add column if not exists document text,
  add column if not exists website text,
  add column if not exists favicon_url text,
  add column if not exists theme_mode text not null default 'light',
  add column if not exists plan text,
  add column if not exists notes text;

update public.stores
set document = coalesce(document, cnpj),
    plan = coalesce(
      plan,
      (
        select p.name
        from public.plans p
        where p.id = public.stores.plan_id
        limit 1
      )
    )
where document is null
   or plan is null;

do $$
begin
  alter table public.stores
    add constraint stores_theme_mode_check
    check (theme_mode in ('light', 'dark', 'system'))
    not valid;
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_stores_plan on public.stores(plan);

drop policy if exists "Super admins can manage stores" on public.stores;
drop policy if exists "Master admins can manage stores" on public.stores;
create policy "Master admins can manage stores"
on public.stores
for all
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

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
