ALTER TABLE public.profiles ADD COLUMN photo_paths text[] NOT NULL DEFAULT '{}';
CREATE OR REPLACE FUNCTION public.can_view_profile_photos(p_owner uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT auth.uid() IS NOT NULL AND (auth.uid() = p_owner OR (
 NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p_owner) OR (b.blocker_id = p_owner AND b.blocked_id = auth.uid()))
 AND EXISTS (SELECT 1 FROM matches m WHERE m.user_id = auth.uid() AND m.matched_user_id = p_owner AND (
 (m.status IN ('pending','greenlit') AND m.drop_date >= current_drop_date() - 1 AND m.drop_date = (SELECT max(x.drop_date) FROM matches x WHERE x.user_id = auth.uid()))
 OR (m.status = 'mutual' AND EXISTS (SELECT 1 FROM match_threads t WHERE t.status = 'active' AND t.drop_date = m.drop_date AND t.user_a = least(m.user_id,m.matched_user_id) AND t.user_b = greatest(m.user_id,m.matched_user_id)))))));
$$;
REVOKE ALL ON FUNCTION public.can_view_profile_photos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile_photos(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.can_read_profile_photo(p_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM profiles p WHERE p_name = ANY(p.photo_paths) AND public.can_view_profile_photos(p.id));
$$;
REVOKE ALL ON FUNCTION public.can_read_profile_photo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_profile_photo(text) TO authenticated, service_role;
CREATE POLICY profile_photos_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$');
CREATE POLICY profile_photos_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'profile-photos' AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.can_read_profile_photo(name)));
CREATE POLICY profile_photos_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE OR REPLACE FUNCTION public.validate_profile_photos() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE path text;
BEGIN
 IF cardinality(NEW.photo_paths) > 3 OR cardinality(NEW.photo_paths) <> (SELECT count(DISTINCT v) FROM unnest(NEW.photo_paths) v) THEN RAISE EXCEPTION 'Choose up to three different photos.'; END IF;
 FOREACH path IN ARRAY NEW.photo_paths LOOP
  IF path IS NULL OR path !~ ('^' || NEW.id::text || '/[0-9a-f-]{36}\.webp$') OR NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'profile-photos' AND o.name = path) THEN RAISE EXCEPTION 'Upload the photo before saving.'; END IF;
 END LOOP;
 IF NEW.gender IS NOT NULL AND NEW.campus_hub IS NOT NULL AND NEW.target_preference IS NOT NULL AND cardinality(NEW.photo_paths) = 0 AND (TG_OP = 'INSERT' OR OLD.gender IS NULL OR OLD.campus_hub IS NULL OR OLD.target_preference IS NULL OR NEW.photo_paths IS DISTINCT FROM OLD.photo_paths) THEN RAISE EXCEPTION 'Add a photo before completing your profile.'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_validate_photos BEFORE INSERT OR UPDATE OF photo_paths, gender, campus_hub, target_preference ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_photos();
CREATE OR REPLACE FUNCTION public.set_my_profile_photos(p_paths text[], p_expected text[]) RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_paths text[];
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to save photos.'; END IF;
 SELECT photo_paths INTO current_paths FROM profiles WHERE id = auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found.'; END IF;
 IF current_paths IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'Photos changed in another tab. Reload before editing.'; END IF;
 IF p_paths IS NULL THEN RAISE EXCEPTION 'Invalid photos.'; END IF;
 UPDATE profiles SET photo_paths = p_paths WHERE id = auth.uid();
 RETURN p_paths;
END;
$$;
REVOKE ALL ON FUNCTION public.set_my_profile_photos(text[],text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_profile_photos(text[],text[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_profile_photo_paths(p_owner uuid) RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.can_view_profile_photos(p_owner) THEN RAISE EXCEPTION 'Photo access is not available.' USING ERRCODE = '42501'; END IF;
 RETURN coalesce((SELECT photo_paths FROM profiles WHERE id = p_owner), '{}');
END;
$$;
REVOKE ALL ON FUNCTION public.get_profile_photo_paths(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_photo_paths(uuid) TO authenticated;