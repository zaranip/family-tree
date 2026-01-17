// =============================================================================
// DATABASE TYPES
// =============================================================================

// Enum types matching the database
export type RelationshipType =
  | 'biological_parent'
  | 'adoptive_parent'
  | 'step_parent'
  | 'foster_parent'
  | 'guardian'
  | 'spouse'
  | 'ex_spouse'
  | 'partner'
  | 'ex_partner'
  | 'sibling'
  | 'half_sibling'
  | 'step_sibling'
  | 'adopted_sibling';

export type UserRole = 'admin' | 'member';

export type AuditAction =
  | 'created_person'
  | 'updated_person'
  | 'deleted_person'
  | 'created_relationship'
  | 'updated_relationship'
  | 'deleted_relationship'
  | 'restored_relationship';

// =============================================================================
// ENTITY TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  person_id: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  birthday: string; // ISO date string
  middle_name: string | null;
  maiden_name: string | null;
  nickname: string | null;
  gender: string | null;
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  is_living: boolean;
  occupation: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: RelationshipType;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_user_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: 'person' | 'relationship';
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface PersonFormData {
  first_name: string;
  last_name: string;
  birthday: string;
  middle_name?: string;
  maiden_name?: string;
  nickname?: string;
  gender?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  is_living?: boolean;
  occupation?: string;
  bio?: string;
  email?: string;
  phone?: string;
}

export interface RelationshipFormData {
  person1_id: string;
  person2_id: string;
  relationship_type: RelationshipType;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PersonWithRelationships extends Person {
  relationships: RelationshipWithPerson[];
}

export interface RelationshipWithPerson extends Relationship {
  related_person: Person;
  direction: 'from' | 'to'; // 'from' = person1 is the subject, 'to' = person2 is the subject
}

export interface PersonRelationship {
  relationship_id: string;
  related_person_id: string;
  related_person_first_name: string;
  related_person_last_name: string;
  related_person_photo_url: string | null;
  relationship_type: RelationshipType;
  relationship_direction: 'from' | 'to';
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

// =============================================================================
// UI TYPES
// =============================================================================

export interface TreeNode {
  id: string;
  person: Person;
  x: number;
  y: number;
  generation: number;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  label?: string;
}

export interface SearchFilters {
  query?: string;
  isLiving?: boolean;
  generation?: number;
  hasPhoto?: boolean;
}

// =============================================================================
// RELATIONSHIP LABELS & METADATA
// =============================================================================

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  biological_parent: 'Biological Parent',
  adoptive_parent: 'Adoptive Parent',
  step_parent: 'Step Parent',
  foster_parent: 'Foster Parent',
  guardian: 'Guardian',
  spouse: 'Spouse',
  ex_spouse: 'Ex-Spouse',
  partner: 'Partner',
  ex_partner: 'Ex-Partner',
  sibling: 'Sibling',
  half_sibling: 'Half-Sibling',
  step_sibling: 'Step-Sibling',
  adopted_sibling: 'Adopted Sibling',
};

export const RELATIONSHIP_CATEGORIES = {
  parent: ['biological_parent', 'adoptive_parent', 'step_parent', 'foster_parent', 'guardian'] as RelationshipType[],
  spouse: ['spouse', 'ex_spouse', 'partner', 'ex_partner'] as RelationshipType[],
  sibling: ['sibling', 'half_sibling', 'step_sibling', 'adopted_sibling'] as RelationshipType[],
};

// Helper to get inverse relationship (for display purposes)
export const getInverseRelationshipLabel = (type: RelationshipType, direction: 'from' | 'to'): string => {
  if (RELATIONSHIP_CATEGORIES.parent.includes(type)) {
    return direction === 'from' ? RELATIONSHIP_LABELS[type] : 'Child';
  }
  // Spouse and sibling relationships are symmetric
  return RELATIONSHIP_LABELS[type];
};

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
