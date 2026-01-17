import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peopleApi, peopleHistoryApi } from '../lib/supabase';
import type { Person, PersonFormData } from '../types';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const peopleKeys = {
  all: ['people'] as const,
  lists: () => [...peopleKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...peopleKeys.lists(), filters] as const,
  details: () => [...peopleKeys.all, 'detail'] as const,
  detail: (id: string) => [...peopleKeys.details(), id] as const,
  withRelationships: (id: string) => [...peopleKeys.detail(id), 'relationships'] as const,
  search: (query: string) => [...peopleKeys.all, 'search', query] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

// Get all people
export function usePeople() {
  return useQuery({
    queryKey: peopleKeys.lists(),
    queryFn: () => peopleApi.getAll(),
  });
}

// Get single person
export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: peopleKeys.detail(id!),
    queryFn: () => peopleApi.getById(id!),
    enabled: !!id,
  });
}

// Get person with relationships
export function usePersonWithRelationships(id: string | undefined) {
  return useQuery({
    queryKey: peopleKeys.withRelationships(id!),
    queryFn: () => peopleApi.getWithRelationships(id!),
    enabled: !!id,
  });
}

export function usePersonHistory(personId: string | undefined) {
  return useQuery({
    queryKey: [...peopleKeys.detail(personId!), 'history'] as const,
    queryFn: () => peopleHistoryApi.getByPersonId(personId!),
    enabled: !!personId,
  });
}

// Search people
export function useSearchPeople(query: string) {
  return useQuery({
    queryKey: peopleKeys.search(query),
    queryFn: () => peopleApi.search(query),
    enabled: query.length > 0,
  });
}

// Create person
export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PersonFormData) => {
      const personData: Omit<Person, 'id' | 'created_at' | 'updated_at'> = {
        first_name: data.first_name,
        last_name: data.last_name,
        birthday: data.birthday,
        middle_name: data.middle_name || null,
        maiden_name: data.maiden_name || null,
        nickname: data.nickname || null,
        gender: data.gender || null,
        birth_place: data.birth_place || null,
        death_date: data.death_date || null,
        death_place: data.death_place || null,
        is_living: data.is_living ?? true,
        occupation: data.occupation || null,
        bio: data.bio || null,
        email: data.email || null,
        phone: data.phone || null,
        photo_url: null,
        created_by_user_id: null,
      };
      return peopleApi.create(personData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}

// Update person
export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonFormData> }) => {
      return peopleApi.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
      queryClient.invalidateQueries({ queryKey: peopleKeys.detail(variables.id) });
    },
  });
}

// Delete person
export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => peopleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}
