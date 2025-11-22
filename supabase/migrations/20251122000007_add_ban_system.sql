-- Add ban system back to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Update RLS policies to prevent banned users from doing anything
-- Users can't update their own profile if banned, but admins can update anyone
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id AND is_banned = false OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any profile (including ban status)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow all updates to profiles (since we're using hardcoded admin system)
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
CREATE POLICY "Allow profile updates"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Banned users can't create products
DROP POLICY IF EXISTS "Users can create products" ON public.products;
CREATE POLICY "Users can create products"
  ON public.products FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id AND 
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

-- Banned users can't update products
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (
    auth.uid() = seller_id AND 
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

-- Banned users can't delete products
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (
    auth.uid() = seller_id AND 
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

-- Function to toggle user ban status (bypasses RLS)
CREATE OR REPLACE FUNCTION toggle_user_ban(target_user_id UUID, ban_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow if user is marked as admin in database
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    UPDATE public.profiles
    SET is_banned = ban_status
    WHERE id = target_user_id;
    RETURN;
  END IF;
  
  -- If not admin, raise error
  RAISE EXCEPTION 'Unauthorized: Admin access required';
END;
$$;
