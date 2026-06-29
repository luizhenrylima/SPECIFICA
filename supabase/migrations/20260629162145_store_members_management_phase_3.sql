-- Fase 3: store user management for the Master Admin panel.
-- Uses the existing public.store_members table; no duplicate store_users table.

update public.store_members
set role = 'financial'
where role = 'finance';

alter table public.store_members
  drop constraint if exists store_members_role_check;

alter table public.store_members
  add constraint store_members_role_check
  check (role in ('store_admin', 'manager', 'seller', 'financial', 'architect'));

alter table public.store_members
  drop constraint if exists store_members_status_check;

alter table public.store_members
  add constraint store_members_status_check
  check (status in ('active', 'inactive', 'invited', 'pending', 'suspended'));

create or replace function public.current_user_store_role(target_store_id uuid)
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

create or replace function public.current_user_is_store_admin(target_store_id uuid)
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
          and sm.role = 'store_admin'
          and sm.status = 'active'
      ),
      false
    )
$$;

create or replace function public.current_user_can_manage_store_users(target_store_id uuid)
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

revoke all on function public.current_user_store_role(uuid) from public;
revoke all on function public.current_user_is_store_admin(uuid) from public;
revoke all on function public.current_user_can_manage_store_users(uuid) from public;

grant execute on function public.current_user_store_role(uuid) to authenticated;
grant execute on function public.current_user_is_store_admin(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store_users(uuid) to authenticated;

drop policy if exists "Super admins can manage store members" on public.store_members;
drop policy if exists "Master admins can manage store members" on public.store_members;
create policy "Master admins can manage store members"
on public.store_members
for all
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

drop policy if exists "Store admins can view store members" on public.store_members;
drop policy if exists "Store admins can manage own store members" on public.store_members;
create policy "Store admins can manage own store members"
on public.store_members
for all
to authenticated
using (public.current_user_can_manage_store_users(store_id))
with check (public.current_user_can_manage_store_users(store_id));

drop policy if exists "Master admins can view profiles" on public.profiles;
create policy "Master admins can view profiles"
on public.profiles
for select
to authenticated
using (public.is_master_admin());

drop policy if exists "Store admins can view store member profiles" on public.profiles;
create policy "Store admins can view store member profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.store_members sm
    where sm.user_id = profiles.user_id
      and public.current_user_can_manage_store_users(sm.store_id)
  )
);

drop policy if exists "Master admins can update profiles" on public.profiles;
create policy "Master admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_master_admin())
with check (public.is_master_admin());

create index if not exists idx_profiles_email_lower on public.profiles(lower(email));
