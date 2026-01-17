import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationshipsApi } from '../lib/supabase';
import type { RelationshipFormData } from '../types';
import { peopleKeys } from './usePeople';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const relationshipKeys = {
  all: ['relationships'] as const,
  lists: () => [...relationshipKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...relationshipKeys.lists(), filters] as const,
  details: () => [...relationshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...relationshipKeys.details(), id] as const,
  withPeople: () => [...relationshipKeys.all, 'withPeople'] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

// Get all relationships
export function useRelationships() {
  return useQuery({
    queryKey: relationshipKeys.lists(),
    queryFn: () => relationshipsApi.getAll(),
  });
}

// Get all relationships with person details
export function useRelationshipsWithPeople() {
  return useQuery({
    queryKey: relationshipKeys.withPeople(),
    queryFn: () => relationshipsApi.getAllWithPeople(),
  });
}

// Get single relationship
export function useRelationship(id: string | undefined) {
  return useQuery({
    queryKey: relationshipKeys.detail(id!),
    queryFn: () => relationshipsApi.getById(id!),
    enabled: !!id,
  });
}

// Create relationship
export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RelationshipFormData) => {
      return relationshipsApi.create({
        person1_id: data.person1_id,
        person2_id: data.person2_id,
        relationship_type: data.relationship_type,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
        created_by_user_id: null,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      // Invalidate both people's details
      queryClient.invalidateQueries({ queryKey: peopleKeys.detail(variables.person1_id) });
      queryClient.invalidateQueries({ queryKey: peopleKeys.detail(variables.person2_id) });
    },
  });
}

// Soft delete relationship (admin only)
export function useSoftDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => relationshipsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}

// Restore relationship (admin only)
export function useRestoreRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => relationshipsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}

// Check if relationship exists
export function useCheckRelationshipExists() {
  return useMutation({
    mutationFn: ({ person1_id, person2_id, relationship_type }: {
      person1_id: string;
      person2_id: string;
      relationship_type: string;
    }) => relationshipsApi.exists(person1_id, person2_id, relationship_type),
  });
}
