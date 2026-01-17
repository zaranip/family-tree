import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search } from 'lucide-react';
import { Input, Select, Textarea, Button, Avatar } from '../../components/common';
import { usePeople } from '../../hooks';
import type { RelationshipType, RelationshipFormData } from '../../types';
import { RELATIONSHIP_LABELS, RELATIONSHIP_CATEGORIES } from '../../types';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const relationshipSchema = z.object({
  person2_id: z.string().min(1, 'Please select a person'),
  relationship_type: z.string().min(1, 'Please select a relationship type'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof relationshipSchema>;

// =============================================================================
// TYPES
// =============================================================================

interface AddRelationshipFormProps {
  person1Id: string;
  person1Name: string;
  defaultCategory?: 'parent' | 'spouse' | 'sibling' | 'child';
  onSubmit: (data: RelationshipFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  existingRelationshipIds?: string[];
}

// =============================================================================
// RELATIONSHIP TYPE OPTIONS
// =============================================================================

const getRelationshipOptions = (category?: string) => {
  let types: RelationshipType[] = [];
  
  switch (category) {
    case 'parent':
      types = RELATIONSHIP_CATEGORIES.parent;
      break;
    case 'child':
      // For adding a child, we use parent types but reverse the relationship
      types = RELATIONSHIP_CATEGORIES.parent;
      break;
    case 'spouse':
      types = RELATIONSHIP_CATEGORIES.spouse;
      break;
    case 'sibling':
      types = RELATIONSHIP_CATEGORIES.sibling;
      break;
    default:
      types = [
        ...RELATIONSHIP_CATEGORIES.parent,
        ...RELATIONSHIP_CATEGORIES.spouse,
        ...RELATIONSHIP_CATEGORIES.sibling,
      ];
  }

  return types.map((type) => ({
    value: type,
    label: RELATIONSHIP_LABELS[type],
  }));
};

// =============================================================================
// COMPONENT
// =============================================================================

export function AddRelationshipForm({
  person1Id,
  person1Name,
  defaultCategory,
  onSubmit,
  onCancel,
  isLoading = false,
  existingRelationshipIds = [],
}: AddRelationshipFormProps) {
  const { data: people = [] } = usePeople();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      relationship_type: '',
    },
  });

  const selectedPersonId = watch('person2_id');
  const relationshipType = watch('relationship_type');

  // Filter out the current person and already related people
  const availablePeople = useMemo(() => {
    return people.filter((person) => {
      if (person.id === person1Id) return false;
      if (existingRelationshipIds.includes(person.id)) return false;
      
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        person.first_name.toLowerCase().includes(query) ||
        person.last_name.toLowerCase().includes(query) ||
        person.nickname?.toLowerCase().includes(query)
      );
    });
  }, [people, person1Id, existingRelationshipIds, searchQuery]);

  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  const relationshipOptions = useMemo(() => {
    return getRelationshipOptions(defaultCategory);
  }, [defaultCategory]);

  // Determine if this is a date-relevant relationship (marriage, partnership)
  const showDates = RELATIONSHIP_CATEGORIES.spouse.includes(relationshipType as RelationshipType);

  const handleFormSubmit = (data: FormData) => {
    // For "child" category, we swap the person IDs to make person1 the parent
    const isChildRelationship = defaultCategory === 'child';
    
    onSubmit({
      person1_id: isChildRelationship ? person1Id : data.person2_id,
      person2_id: isChildRelationship ? data.person2_id : person1Id,
      relationship_type: data.relationship_type as RelationshipType,
      start_date: data.start_date,
      end_date: data.end_date,
      notes: data.notes,
    });
  };

  const getCategoryLabel = () => {
    switch (defaultCategory) {
      case 'parent':
        return 'parent';
      case 'child':
        return 'child';
      case 'spouse':
        return 'spouse or partner';
      case 'sibling':
        return 'sibling';
      default:
        return 'family member';
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Context */}
      <div className="bg-[rgb(var(--color-bg-elevated))] rounded-lg p-4">
        <p className="text-[rgb(var(--color-text-muted))]">
          Adding a <strong>{getCategoryLabel()}</strong> for <strong>{person1Name}</strong>
        </p>
      </div>

      {/* Person Search */}
      <div>
        <label className="block text-base font-medium text-[rgb(var(--color-text-main))] mb-2">
          Select Person <span className="text-red-500">*</span>
        </label>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--color-text-muted))]" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Person List */}
        <div className="border border-[rgb(var(--color-border))] rounded-lg max-h-60 overflow-y-auto">
          {availablePeople.length === 0 ? (
            <p className="p-4 text-center text-[rgb(var(--color-text-muted))]">
              {searchQuery ? 'No matching people found' : 'No other people available'}
            </p>
          ) : (
            <div className="divide-y divide-[rgb(var(--color-border))]">
              {availablePeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setValue('person2_id', person.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-[rgb(var(--color-bg-elevated))] transition-colors
                    ${selectedPersonId === person.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''}`}
                >
                  <Avatar
                    src={person.photo_url}
                    name={`${person.first_name} ${person.last_name}`}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[rgb(var(--color-text-main))] truncate">
                      {person.first_name} {person.last_name}
                    </p>
                    {person.nickname && (
                      <p className="text-sm text-[rgb(var(--color-text-muted))]">"{person.nickname}"</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {errors.person2_id && (
          <p className="mt-2 text-sm text-red-600">{errors.person2_id.message}</p>
        )}
      </div>

      {/* Relationship Type */}
      <Select
        label="Relationship Type"
        placeholder="Select relationship type"
        options={relationshipOptions}
        error={errors.relationship_type?.message}
        required
        {...register('relationship_type')}
      />

      {/* Date Range (for marriages/partnerships) */}
      {showDates && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            hint="When the relationship began (e.g., wedding date)"
            {...register('start_date')}
          />
          <Input
            label="End Date"
            type="date"
            hint="Leave blank if still together"
            {...register('end_date')}
          />
        </div>
      )}

      {/* Notes */}
      <Textarea
        label="Notes"
        placeholder="Any additional notes about this relationship..."
        rows={3}
        {...register('notes')}
      />

      {/* Summary */}
      {selectedPerson && relationshipType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>{selectedPerson.first_name} {selectedPerson.last_name}</strong>
            {' '}will be added as{' '}
            <strong>{person1Name}</strong>'s{' '}
            <strong>
              {defaultCategory === 'child' 
                ? 'child' 
                : RELATIONSHIP_LABELS[relationshipType as RelationshipType].toLowerCase()}
            </strong>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-[rgb(var(--color-border))]">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          fullWidth
          className="sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
          className="sm:w-auto"
        >
          Add Relationship
        </Button>
      </div>
    </form>
  );
}
