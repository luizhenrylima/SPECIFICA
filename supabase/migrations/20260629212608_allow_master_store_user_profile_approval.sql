-- Allow the Master Admin store-user flow to approve profiles created through
-- Supabase Auth admin APIs. The previous trigger only allowed the legacy
-- `admin` app_role, so service_role Edge Functions had approved=true reverted.

create or replace function public.prevent_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  can_manage_sensitive_profile_fields boolean;
begin
  can_manage_sensitive_profile_fields :=
    jwt_role = 'service_role'
    or public.is_master_admin()
    or public.has_role((select auth.uid()), 'admin'::public.app_role);

  if not can_manage_sensitive_profile_fields then
    if new.approved is distinct from old.approved then
      new.approved := old.approved;
    end if;

    if new.seller_id is distinct from old.seller_id then
      new.seller_id := old.seller_id;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_self_approval() from public;

update public.profiles p
set approved = true,
    active = true
where exists (
  select 1
  from public.store_members sm
  where sm.user_id = p.user_id
)
and (p.approved is distinct from true or p.active is distinct from true);
