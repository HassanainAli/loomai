DELETE FROM public.prompt_responses WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'loomtest%@uw.edu');
DELETE FROM public.matching_preferences WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'loomtest%@uw.edu');
DELETE FROM public.match_history WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'loomtest%@uw.edu');
DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE 'loomtest%@uw.edu');
DELETE FROM auth.users WHERE email LIKE 'loomtest%@uw.edu';