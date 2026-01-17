-- Family Tree Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Relationship types enum
CREATE TYPE relationship_type AS ENUM (
  'biological_parent',
  'adoptive_parent',
  'step_parent',
  'foster_parent',
  'guardian',
  'spouse',
  'ex_spouse',
  'partner',
  'ex_partner',
  'sibling',
  'half_sibling',
  'step_sibling',
  'adopted_sibling'
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'member');

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'created_person',
  'updated_person',
  'deleted_person',
  'created_relationship',
  'updated_relationship',
  'deleted_relationship',
  'restored_relationship'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  person_id UUID, -- Link to their person record (set after they create their profile)
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- People in the family tree
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Required fields
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthday DATE NOT NULL,
  
  -- Optional fields
  middle_name TEXT,
  maiden_name TEXT,
  nickname TEXT,
  gender TEXT, -- Open text field for inclusivity
  birth_place TEXT,
  death_date DATE,
  death_place TEXT,
  is_living BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Additional info
  occupation TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  
  -- Photo
  photo_url TEXT,
  
  -- Metadata
  created_by_user_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key from user_profiles to people (after people table exists)
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_person 
FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL;

-- Relationships between people
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- The two people in the relationship
  person1_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  
  -- Relationship details
  relationship_type relationship_type NOT NULL,
  
  -- Date range (for marriages, partnerships, etc.)
  start_date DATE,
  end_date DATE,
  
  -- Additional notes
  notes TEXT,
  
  -- Soft delete (members cannot delete, only admin)
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by_user_id UUID REFERENCES user_profiles(id),
  
-- Metadata
  created_by_user_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Use a comma here, NOT a semicolon

  -- Person cannot have relationship with themselves
  CONSTRAINT different_people CHECK (person1_id <> person2_id)
); -- The semicolon goes here at the very end of the table definition

-- NOW you can start a new command
CREATE UNIQUE INDEX unique_active_relationship 
ON relationships (person1_id, person2_id, relationship_type) 
WHERE (is_deleted = FALSE);

-- Audit log for tracking all changes
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID REFERENCES user_profiles(id),
  action audit_action NOT NULL,
  
  entity_type TEXT NOT NULL, -- 'person' or 'relationship'
  entity_id UUID NOT NULL,
  
  -- Store the old and new data as JSON
  old_data JSONB,
  new_data JSONB,
  
  -- Additional context
  description TEXT,
  ip_address TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- People indexes
CREATE INDEX idx_people_name ON people(last_name, first_name);
CREATE INDEX idx_people_birthday ON people(birthday);
CREATE INDEX idx_people_created_by ON people(created_by_user_id);

-- Relationships indexes
CREATE INDEX idx_relationships_person1 ON relationships(person1_id) WHERE NOT is_deleted;
CREATE INDEX idx_relationships_person2 ON relationships(person2_id) WHERE NOT is_deleted;
CREATE INDEX idx_relationships_type ON relationships(relationship_type) WHERE NOT is_deleted;

-- Audit log indexes
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action audit_action,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data, new_data, description)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data, p_description)
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all relationships for a person
CREATE OR REPLACE FUNCTION get_person_relationships(p_person_id UUID)
RETURNS TABLE (
  relationship_id UUID,
  related_person_id UUID,
  related_person_first_name TEXT,
  related_person_last_name TEXT,
  related_person_photo_url TEXT,
  relationship_type relationship_type,
  relationship_direction TEXT, -- 'from' or 'to' indicating the direction
  start_date DATE,
  end_date DATE,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id AS relationship_id,
    CASE WHEN r.person1_id = p_person_id THEN r.person2_id ELSE r.person1_id END AS related_person_id,
    p.first_name AS related_person_first_name,
    p.last_name AS related_person_last_name,
    p.photo_url AS related_person_photo_url,
    r.relationship_type,
    CASE WHEN r.person1_id = p_person_id THEN 'from' ELSE 'to' END AS relationship_direction,
    r.start_date,
    r.end_date,
    r.notes
  FROM relationships r
  JOIN people p ON p.id = CASE WHEN r.person1_id = p_person_id THEN r.person2_id ELSE r.person1_id END
  WHERE (r.person1_id = p_person_id OR r.person2_id = p_person_id)
    AND r.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- People policies
CREATE POLICY "Authenticated users can view all people"
  ON people FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert people"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own person record"
  ON people FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT person_id FROM user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    id = (SELECT person_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any person"
  ON people FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete people"
  ON people FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Relationships policies
CREATE POLICY "Authenticated users can view all active relationships"
  ON relationships FOR SELECT
  TO authenticated
  USING (is_deleted = FALSE OR EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Authenticated users can insert relationships"
  ON relationships FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update relationships"
  ON relationships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete relationships"
  ON relationships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit log policies
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- STORAGE BUCKET FOR PHOTOS
-- =============================================================================

-- Create storage bucket for photos (run this in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies would be:
-- CREATE POLICY "Anyone can view photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'photos');

-- CREATE POLICY "Authenticated users can upload photos"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'photos');

-- CREATE POLICY "Users can update their own photos"
--   ON storage.objects FOR UPDATE
--   TO authenticated
--   USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Admins can delete any photo"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'photos' AND EXISTS (
--     SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
--   ));