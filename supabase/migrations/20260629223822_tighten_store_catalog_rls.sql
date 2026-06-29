-- Remove legacy broad catalog read policies after store-scoped catalog policies are active.

drop policy if exists "Authenticated users can view visible products" on public.products;
drop policy if exists "Authenticated users can view visible brands" on public.brands;
