-- Set the first user as admin
-- Replace with your actual email or run this manually in Supabase SQL Editor
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Alternatively, you can set a specific user as admin by email:
-- UPDATE public.profiles 
-- SET is_admin = true 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
