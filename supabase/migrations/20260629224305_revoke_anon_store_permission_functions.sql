revoke execute on function public.current_user_has_store_access(uuid) from anon;
revoke execute on function public.current_user_can_manage_store(uuid) from anon;
revoke execute on function public.current_user_can_manage_store_catalog(uuid) from anon;
revoke execute on function public.current_user_can_manage_store_branding(uuid) from anon;
revoke execute on function public.current_user_can_manage_store_users(uuid) from anon;
revoke execute on function public.current_user_is_store_admin(uuid) from anon;
revoke execute on function public.current_user_store_role(uuid) from anon;

grant execute on function public.current_user_has_store_access(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store_catalog(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store_branding(uuid) to authenticated;
grant execute on function public.current_user_can_manage_store_users(uuid) to authenticated;
grant execute on function public.current_user_is_store_admin(uuid) to authenticated;
grant execute on function public.current_user_store_role(uuid) to authenticated;
