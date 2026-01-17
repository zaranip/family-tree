import { createClient } from '@supabase/supabase-js';
import type { Person, Relationship, UserProfile, AuditLogEntry, PersonRelationship } from '../types';

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================================================
// DATABASE TYPES FOR SUPABASE
// =============================================================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      people: {
        Row: Person;
        Insert: Omit<Person, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>;
      };
      relationships: {
        Row: Relationship;
        Insert: Omit<Relationship, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by_user_id'>;
        Update: Partial<Omit<Relationship, 'id' | 'created_at' | 'updated_at'>>;
      };
      audit_log: {
        Row: AuditLogEntry;
        Insert: Omit<AuditLogEntry, 'id' | 'created_at'>;
        Update: never; // Audit log should not be updated
      };
      people_history: {
        Row: {
          id: string;
          person_id: string;
          changed_by_user_id: string | null;
          changed_at: string;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          person_id: string;
          changed_by_user_id?: string | null;
          changed_at?: string;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
        };
        Update: never;
      };
    };
    Functions: {
      get_person_relationships: {
        Args: { p_person_id: string };
        Returns: PersonRelationship[];
      };
      create_audit_log: {
        Args: {
          p_user_id: string;
          p_action: string;
          p_entity_type: string;
          p_entity_id: string;
          p_old_data?: Record<string, unknown>;
          p_new_data?: Record<string, unknown>;
          p_description?: string;
        };
        Returns: string;
      };
    };
  };
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

export const isAdmin = async (): Promise<boolean> => {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin';
};

// =============================================================================
// PEOPLE API
// =============================================================================

export const peopleApi = {
  // Get all people
  getAll: async (): Promise<Person[]> => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get single person by ID
  getById: async (id: string): Promise<Person | null> => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Create new person
  create: async (person: Omit<Person, 'id' | 'created_at' | 'updated_at'>): Promise<Person> => {
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('people')
      .insert({
        ...person,
        created_by_user_id: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Create audit log
    if (user && data) {
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'created_person',
        p_entity_type: 'person',
        p_entity_id: data.id,
        p_new_data: data as Record<string, unknown>,
        p_description: `Created person: ${data.first_name} ${data.last_name}`,
      });
    }

    return data;
  },

  // Update person
  update: async (id: string, updates: Partial<Person>): Promise<Person> => {
    const user = await getCurrentUser();
    
    // Get current data for audit
    const { data: oldData } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('people')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    if (user && data) {
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'updated_person',
        p_entity_type: 'person',
        p_entity_id: data.id,
        p_old_data: oldData as Record<string, unknown>,
        p_new_data: data as Record<string, unknown>,
        p_description: `Updated person: ${data.first_name} ${data.last_name}`,
      });
    }

    return data;
  },

  // Delete person (admin only)
  delete: async (id: string): Promise<void> => {
    const user = await getCurrentUser();
    
    // Get person data for audit
    const { data: person } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Create audit log
    if (user && person) {
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'deleted_person',
        p_entity_type: 'person',
        p_entity_id: id,
        p_old_data: person as Record<string, unknown>,
        p_description: `Deleted person: ${person.first_name} ${person.last_name}`,
      });
    }
  },

  // Search people
  search: async (query: string): Promise<Person[]> => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,maiden_name.ilike.%${query}%,nickname.ilike.%${query}%`)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get person with all relationships
  getWithRelationships: async (id: string): Promise<{ person: Person; relationships: PersonRelationship[] } | null> => {
    const person = await peopleApi.getById(id);
    if (!person) return null;

    const { data: relationships, error } = await supabase
      .rpc('get_person_relationships', { p_person_id: id });

    if (error) throw error;

    return {
      person,
      relationships: relationships || [],
    };
  },
};

// =============================================================================
// RELATIONSHIPS API
// =============================================================================

export const relationshipsApi = {
  // Get all relationships
  getAll: async (): Promise<Relationship[]> => {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .eq('is_deleted', false);

    if (error) throw error;
    return data || [];
  },

  // Get relationships with person details
  getAllWithPeople: async (): Promise<(Relationship & { person1: Person; person2: Person })[]> => {
    const { data, error } = await supabase
      .from('relationships')
      .select(`
        *,
        person1:people!relationships_person1_id_fkey(*),
        person2:people!relationships_person2_id_fkey(*)
      `)
      .eq('is_deleted', false);

    if (error) throw error;
    return data || [];
  },

  // Get single relationship
  getById: async (id: string): Promise<Relationship | null> => {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Create relationship
  create: async (relationship: Omit<Relationship, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by_user_id'>): Promise<Relationship> => {
    const user = await getCurrentUser();

    // Normalize person IDs to ensure consistent ordering (prevents duplicates)
    const [person1_id, person2_id] = [relationship.person1_id, relationship.person2_id].sort();

    const { data, error } = await supabase
      .from('relationships')
      .insert({
        ...relationship,
        person1_id,
        person2_id,
        created_by_user_id: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    if (user && data) {
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'created_relationship',
        p_entity_type: 'relationship',
        p_entity_id: data.id,
        p_new_data: data as Record<string, unknown>,
        p_description: `Created ${relationship.relationship_type} relationship`,
      });
    }

    return data;
  },

  // Soft delete relationship (admin only)
  softDelete: async (id: string): Promise<void> => {
    const user = await getCurrentUser();

    const { data: oldData } = await supabase
      .from('relationships')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('relationships')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by_user_id: user?.id,
      })
      .eq('id', id);

    if (error) throw error;

    // Create audit log
    if (user && oldData) {
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'deleted_relationship',
        p_entity_type: 'relationship',
        p_entity_id: id,
        p_old_data: oldData as Record<string, unknown>,
        p_description: `Soft-deleted ${oldData.relationship_type} relationship`,
      });
    }
  },

  // Restore soft-deleted relationship (admin only)
  restore: async (id: string): Promise<void> => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from('relationships')
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by_user_id: null,
      })
      .eq('id', id);

    if (error) throw error;

    // Create audit log
    if (user) {
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'restored_relationship',
        p_entity_type: 'relationship',
        p_entity_id: id,
        p_description: 'Restored soft-deleted relationship',
      });
    }
  },

  // Check if relationship exists
  exists: async (person1_id: string, person2_id: string, relationship_type: string): Promise<boolean> => {
    const [id1, id2] = [person1_id, person2_id].sort();
    
    const { data, error } = await supabase
      .from('relationships')
      .select('id')
      .eq('person1_id', id1)
      .eq('person2_id', id2)
      .eq('relationship_type', relationship_type)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },
};

// =============================================================================
// AUDIT LOG API
// =============================================================================

export const peopleHistoryApi = {
  getByPersonId: async (personId: string, limit = 50): Promise<Array<{ id: string; person_id: string; changed_by_user_id: string | null; changed_at: string; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null }>> => {
    const { data, error } = await supabase
      .from('people_history')
      .select('*')
      .eq('person_id', personId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

export const auditLogApi = {
  // Get audit log (admin only)
  getAll: async (limit = 100): Promise<AuditLogEntry[]> => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get audit log for specific entity
  getByEntity: async (entityType: string, entityId: string): Promise<AuditLogEntry[]> => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// =============================================================================
// USER PROFILES API
// =============================================================================

export const userProfilesApi = {
  // Get all user profiles (admin only)
  getAll: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update user profile
  update: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Link person to user profile
  linkPerson: async (userId: string, personId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ person_id: personId })
      .eq('id', userId);

    if (error) throw error;
  },

  // Set user role (admin only)
  setRole: async (userId: string, role: 'admin' | 'member'): Promise<void> => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },
};

// =============================================================================
// STORAGE HELPERS
// =============================================================================

export const storageApi = {
  // Upload photo
  uploadPhoto: async (file: File, personId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${personId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  // Delete photo
  deletePhoto: async (photoUrl: string): Promise<void> => {
    // Extract path from URL
    const url = new URL(photoUrl);
    const path = url.pathname.split('/photos/')[1];
    
    if (path) {
      const { error } = await supabase.storage
        .from('photos')
        .remove([path]);

      if (error) throw error;
    }
  },
};
