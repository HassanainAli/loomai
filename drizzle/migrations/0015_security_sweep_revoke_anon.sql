ALTER FUNCTION public.guard_test_flag() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.end_connection(uuid, text, text), public.get_drop_state(), public.get_my_matches(),
  public.mark_thread_read(uuid), public.get_campus_status(), public.has_role(uuid, public.app_role),
  public.is_thread_member(uuid, uuid), public.bump_thread_activity(), public.sync_match_partner_status(),
  public.validate_match_message() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bump_thread_activity(), public.sync_match_partner_status(), public.validate_match_message() FROM authenticated;