-- =============================================================================
-- PEOPLE HISTORY / VERSIONING
-- =============================================================================

-- Tracks every update to `public.people` for simple version history.

CREATE TABLE IF NOT EXISTS public.people_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  changed_by_user_id UUID REFERENCES public.user_profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_people_history_person_id_changed_at
  ON public.people_history(person_id, changed_at DESC);

ALTER TABLE public.people_history ENABLE ROW LEVEL SECURITY;

-- Only admins can read history.
CREATE POLICY "Admins can view people history"
  ON public.people_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow inserts from authenticated users via trigger context.
CREATE POLICY "Authenticated users can insert people history"
  ON public.people_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No updates/deletes for history.

-- =============================================================================
-- TRIGGER: write history on UPDATE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_people_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.people_history (
    person_id,
    changed_by_user_id,
    old_data,
    new_data
  ) VALUES (
    NEW.id,
    auth.uid(),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS people_update_history ON public.people;

CREATE TRIGGER people_update_history
  AFTER UPDATE ON public.people
  FOR EACH ROW
  EXECUTE FUNCTION public.log_people_update();
