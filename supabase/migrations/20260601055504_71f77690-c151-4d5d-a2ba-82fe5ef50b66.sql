ALTER TABLE public.profiles
  ADD CONSTRAINT chk_display_name_len CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_gender_len CHECK (gender IS NULL OR char_length(gender) <= 50),
  ADD CONSTRAINT chk_campus_hub_len CHECK (campus_hub IS NULL OR char_length(campus_hub) <= 100),
  ADD CONSTRAINT chk_target_pref_len CHECK (target_preference IS NULL OR char_length(target_preference) <= 50);