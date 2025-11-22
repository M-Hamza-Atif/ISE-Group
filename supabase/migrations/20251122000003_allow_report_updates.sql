-- Allow anyone to update reports (since access is restricted by URL)
-- This is needed because the admin check was removed from the page
DROP POLICY IF EXISTS "Anyone can update reports" ON public.reports;
CREATE POLICY "Anyone can update reports"
  ON public.reports FOR UPDATE
  USING (true)
  WITH CHECK (true);
