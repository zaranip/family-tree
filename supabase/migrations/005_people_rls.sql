-- =============================================================================
-- PEOPLE RLS: users can only update what they created
-- =============================================================================

-- Replace the overly-permissive update policy.

DROP POLICY IF EXISTS "Authenticated users can update people" ON public.people;

CREATE POLICY "Users can update people they created"
  ON public.people FOR UPDATE
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
