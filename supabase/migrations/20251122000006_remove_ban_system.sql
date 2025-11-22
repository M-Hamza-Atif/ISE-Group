-- Remove ban system completely
-- Drop is_banned column from profiles if it exists
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_banned;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ban_reason;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS banned_at;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS banned_by;
