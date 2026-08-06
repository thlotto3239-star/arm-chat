-- Seed file for Arm Chat testing (Supabase SQL Editor)
-- Run schema.sql first before executing this seed.

-- Note: Since profiles reference auth.users(id), insert test rows into public.profiles 
-- after creating test users via Supabase Auth Dashboard or sign-up flow.

-- Example SQL to create test rooms and test broadcast messages:
INSERT INTO public.rooms (id, name, is_group) 
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'General Discussion', true),
  ('a0000000-0000-0000-0000-000000000002', 'Announcements & Updates', true)
ON CONFLICT (id) DO NOTHING;

-- Verification query to check database connectivity
SELECT 
  'rooms' as table_name, COUNT(*) as record_count FROM public.rooms
UNION ALL
SELECT 
  'messages' as table_name, COUNT(*) as record_count FROM public.messages
UNION ALL
SELECT 
  'profiles' as table_name, COUNT(*) as record_count FROM public.profiles;
