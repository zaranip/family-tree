-- =============================================================================
-- SIMPLIFIED SCHEMA - Run this in Supabase SQL Editor
-- This is the COMPLETE schema - run this if you haven't set up the database yet
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Drop existing objects if they exist (for clean slate)
-- =============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TYPE IF EXISTS relationship_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

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

CREATE TYPE user_role AS ENUM ('admin', 'member');

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
  person_id UUID,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- People in the family tree
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthday DATE NOT NULL,
  middle_name TEXT,
  maiden_name TEXT,
  nickname TEXT,
  gender TEXT,
  birth_place TEXT,
  death_date DATE,
  death_place TEXT,
  is_living BOOLEAN NOT NULL DEFAULT TRUE,
  occupation TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  created_by_user_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key from user_profiles to people
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_person 
FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL;

-- Relationships between people
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person1_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by_user_id UUID REFERENCES user_profiles(id),
  created_by_user_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_people CHECK (person1_id <> person2_id)
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  description TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_people_name ON people(last_name, first_name);
CREATE INDEX idx_people_birthday ON people(birthday);
CREATE INDEX idx_relationships_person1 ON relationships(person1_id) WHERE NOT is_deleted;
CREATE INDEX idx_relationships_person2 ON relationships(person2_id) WHERE NOT is_deleted;
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get person relationships function
CREATE OR REPLACE FUNCTION get_person_relationships(p_person_id UUID)
RETURNS TABLE (
  relationship_id UUID,
  related_person_id UUID,
  related_person_first_name TEXT,
  related_person_last_name TEXT,
  related_person_photo_url TEXT,
  relationship_type relationship_type,
  relationship_direction TEXT,
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

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
-- Users can view all profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- People policies
CREATE POLICY "Authenticated users can view all people"
  ON people FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert people"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update people"
  ON people FOR UPDATE
  TO authenticated
  USING (true);

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
CREATE POLICY "Authenticated users can view relationships"
  ON relationships FOR SELECT
  TO authenticated
  USING (true);

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

CREATE POLICY "Authenticated users can insert audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
