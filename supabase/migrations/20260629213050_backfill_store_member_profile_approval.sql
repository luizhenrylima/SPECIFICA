-- Backfill profiles for users already linked to stores.
-- The approval protection trigger is temporarily disabled because migrations do
-- not run with a request JWT role, while Edge Functions do.

alter table public.profiles disable trigger trg_prevent_self_approval;

update public.profiles p
set approved = true,
    active = true
where exists (
  select 1
  from public.store_members sm
  where sm.user_id = p.user_id
)
and (p.approved is distinct from true or p.active is distinct from true);

alter table public.profiles enable trigger trg_prevent_self_approval;
