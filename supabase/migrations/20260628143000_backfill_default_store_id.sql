-- Fase 3: backfill seguro da loja padrao para preparar o modelo multi-tenant.
-- Nao altera frontend, rotas, AuthContext, tenants, price_* ou RLS antiga.
-- Nao torna store_id NOT NULL nesta fase.

do $$
declare
  default_store_id uuid;
  table_name text;
  tables_to_backfill text[] := array[
    'favorites',
    'architect_brand_favorites',
    'projects',
    'project_items',
    'project_environment_images',
    'project_item_checklist',
    'crm_customers',
    'crm_leads',
    'crm_interactions',
    'crm_quotes',
    'crm_orders',
    'crm_order_approvals',
    'crm_support_tickets',
    'crm_agenda_events',
    'crm_sales_targets',
    'crm_technical_notebooks',
    'marketing_events',
    'relationship_posts'
  ];
begin
  select id
    into default_store_id
  from public.stores
  where slug = 'especifica-principal'
  limit 1;

  if default_store_id is null then
    raise exception 'Default store with slug especifica-principal was not found.';
  end if;

  foreach table_name in array tables_to_backfill loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format(
        'alter table public.%I add column if not exists store_id uuid references public.stores(id)',
        table_name
      );

      execute format(
        'update public.%I set store_id = $1 where store_id is null',
        table_name
      )
      using default_store_id;

      execute format(
        'create index if not exists %I on public.%I(store_id)',
        'idx_' || table_name || '_store_id',
        table_name
      );
    end if;
  end loop;
end $$;

do $$
declare
  default_store_id uuid;
begin
  select id
    into default_store_id
  from public.stores
  where slug = 'especifica-principal'
  limit 1;

  if default_store_id is null then
    raise exception 'Default store with slug especifica-principal was not found.';
  end if;

  insert into public.store_members (
    store_id,
    user_id,
    role,
    status,
    accepted_at
  )
  select
    default_store_id,
    p.user_id,
    case
      when p.global_role = 'super_admin' then 'store_admin'
      when exists (
        select 1 from public.user_roles ur
        where ur.user_id = p.user_id and ur.role::text = 'admin'
      ) then 'store_admin'
      when exists (
        select 1 from public.user_roles ur
        where ur.user_id = p.user_id and ur.role::text = 'gestor'
      ) then 'manager'
      when exists (
        select 1 from public.user_roles ur
        where ur.user_id = p.user_id and ur.role::text = 'vendedor'
      ) then 'seller'
      when exists (
        select 1 from public.user_roles ur
        where ur.user_id = p.user_id and ur.role::text = 'arquiteto'
      ) then 'architect'
      when exists (
        select 1 from public.user_roles ur
        where ur.user_id = p.user_id and ur.role::text = 'user'
      ) then 'architect'
      else 'architect'
    end,
    'active',
    now()
  from public.profiles p
  join auth.users u on u.id = p.user_id
  on conflict (store_id, user_id) do update
  set role = case
        when public.store_members.role = 'store_admin' then public.store_members.role
        when public.store_members.role = 'manager' and excluded.role in ('seller', 'architect') then public.store_members.role
        when public.store_members.role = 'seller' and excluded.role = 'architect' then public.store_members.role
        else excluded.role
      end,
      status = 'active',
      accepted_at = coalesce(public.store_members.accepted_at, excluded.accepted_at),
      updated_at = now();
end $$;

