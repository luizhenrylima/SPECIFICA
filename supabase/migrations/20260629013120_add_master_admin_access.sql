-- Master Admin access layer for SPECIFICA.
-- This complements the existing SaaS tables (stores, store_members, store_products,
-- store_brands, audit_logs) without duplicating them.

create table if not exists public.master_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'master_admin',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  constraint master_users_role_check check (role in ('master_admin')),
  constraint master_users_status_check check (status in ('active', 'inactive', 'suspended'))
);

create index if not exists idx_master_users_user_id on public.master_users(user_id);
create index if not exists idx_master_users_status on public.master_users(status);

drop trigger if exists trg_master_users_updated_at on public.master_users;
create trigger trg_master_users_updated_at
before update on public.master_users
for each row execute function public.set_multitenant_updated_at();

insert into public.master_users (user_id, role, status)
values ('b4f5cb9e-ca24-4246-b48c-46160eec98fc', 'master_admin', 'active')
on conflict (user_id) do update
set role = 'master_admin',
    status = 'active',
    updated_at = now();

do $$
begin
  if to_regclass('public.profiles') is not null then
    insert into public.profiles (user_id, full_name)
    values ('b4f5cb9e-ca24-4246-b48c-46160eec98fc', 'Master Admin SPECIFICA')
    on conflict (user_id) do update
    set full_name = coalesce(public.profiles.full_name, excluded.full_name);

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'approved'
    ) then
      update public.profiles
      set approved = true
      where user_id = 'b4f5cb9e-ca24-4246-b48c-46160eec98fc';
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'active'
    ) then
      update public.profiles
      set active = true
      where user_id = 'b4f5cb9e-ca24-4246-b48c-46160eec98fc';
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'global_role'
    ) then
      update public.profiles
      set global_role = 'super_admin'
      where user_id = 'b4f5cb9e-ca24-4246-b48c-46160eec98fc';
    end if;
  end if;
end $$;

create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.master_users mu
      where mu.user_id = (select auth.uid())
        and mu.role = 'master_admin'
        and mu.status = 'active'
    ),
    false
  )
$$;

create or replace function public.is_master_admin_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.master_users mu
      where mu.user_id = target_user_id
        and mu.role = 'master_admin'
        and mu.status = 'active'
    ),
    false
  )
$$;

create or replace function public.is_super_admin()
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
        from public.profiles p
        where p.user_id = (select auth.uid())
          and p.global_role = 'super_admin'
          and coalesce(p.active, true) = true
      ),
      false
    )
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when _role = 'admin'::public.app_role and public.is_master_admin_user(_user_id) then true
    else exists (
      select 1
      from public.user_roles
      where user_id = _user_id
        and role = _role
    )
  end
$$;

create or replace function public.current_user_store_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from public.stores s
  where public.is_master_admin()
    and s.status in ('active', 'trial', 'pending_setup')
  union
  select sm.store_id
  from public.store_members sm
  join public.stores s on s.id = sm.store_id
  where sm.user_id = (select auth.uid())
    and sm.status = 'active'
    and s.status in ('active', 'trial', 'pending_setup')
$$;

create or replace function public.current_user_has_store_access(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_store_access(target_store_id)
$$;

create or replace function public.current_user_role(target_store_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_master_admin() then 'master_admin'
    else (
      select sm.role
      from public.store_members sm
      where sm.store_id = target_store_id
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
      limit 1
    )
  end
$$;

alter table public.master_users enable row level security;

drop policy if exists "Master admins can manage master users" on public.master_users;
create policy "Master admins can manage master users"
on public.master_users
for all
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

drop policy if exists "Users can view own master admin status" on public.master_users;
create policy "Users can view own master admin status"
on public.master_users
for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on function public.is_master_admin() from public;
revoke all on function public.is_master_admin_user(uuid) from public;
revoke all on function public.current_user_has_store_access(uuid) from public;
revoke all on function public.current_user_role(uuid) from public;

grant execute on function public.is_master_admin() to authenticated;
grant execute on function public.current_user_has_store_access(uuid) to authenticated;
grant execute on function public.current_user_role(uuid) to authenticated;
grant select, insert, update, delete on public.master_users to authenticated;
