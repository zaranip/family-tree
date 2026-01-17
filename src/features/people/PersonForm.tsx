import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Textarea, Checkbox, Button, Select, ImageUpload, LocationAutocomplete } from '../../components/common';
import type { Person, PersonFormData } from '../../types';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const personSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  birthday: z.string().min(1, 'Birthday is required'),
  middle_name: z.string().max(100).optional(),
  maiden_name: z.string().max(100).optional(),
  nickname: z.string().max(100).optional(),
  gender: z.string().max(50).optional(),
  birth_place: z.string().max(200).optional(),
  death_date: z.string().optional(),
  death_place: z.string().max(200).optional(),
  is_living: z.boolean().optional(),
  occupation: z.string().max(200).optional(),
  bio: z.string().max(5000).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
});

// =============================================================================
// TYPES
// =============================================================================

interface PersonFormSubmitOptions {
  photoFile: File | null;
  removePhoto: boolean;
}

interface PersonFormProps {
  person?: Person;
  onSubmit: (data: PersonFormData, options: PersonFormSubmitOptions) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PersonForm({ person, onSubmit, onCancel, isLoading = false }: PersonFormProps) {
  const isEditing = !!person;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: person ? {
      first_name: person.first_name,
      last_name: person.last_name,
      birthday: person.birthday,
      middle_name: person.middle_name || '',
      maiden_name: person.maiden_name || '',
      nickname: person.nickname || '',
      gender: person.gender || '',
      birth_place: person.birth_place || '',
      death_date: person.death_date || '',
      death_place: person.death_place || '',
      is_living: person.is_living,
      occupation: person.occupation || '',
      bio: person.bio || '',
      email: person.email || '',
      phone: person.phone || '',
    } : {
      is_living: true,
    },
  });

  const isLiving = watch('is_living');

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, { photoFile, removePhoto }))}
      className="space-y-8"
    >
      {/* Required Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
          Basic Information <span className="text-red-500">*</span>
        </h3>
        <p className="text-[rgb(var(--color-text-muted))] mb-6">These fields are required.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            placeholder="Enter first name"
            error={errors.first_name?.message}
            required
            {...register('first_name')}
          />
          <Input
            label="Last Name"
            placeholder="Enter last name"
            error={errors.last_name?.message}
            required
            {...register('last_name')}
          />
          <Input
            label="Birthday"
            type="date"
            error={errors.birthday?.message}
            required
            {...register('birthday')}
          />
        </div>
      </div>

      {/* Optional Personal Details */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
          Additional Details
        </h3>
        <p className="text-[rgb(var(--color-text-muted))] mb-6">These fields are optional.</p>
        
        <div className="mb-6">
          <ImageUpload
            label="Photo"
            currentImageUrl={person?.photo_url}
            onImageSelect={(file) => {
              setRemovePhoto(false);
              setPhotoFile(file);
            }}
            onImageRemove={() => {
              setPhotoFile(null);
              setRemovePhoto(true);
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Middle Name"
            placeholder="Enter middle name"
            error={errors.middle_name?.message}
            {...register('middle_name')}
          />
          <Input
            label="Maiden Name"
            placeholder="Enter maiden name (if applicable)"
            error={errors.maiden_name?.message}
            {...register('maiden_name')}
          />
          <Input
            label="Nickname"
            placeholder="Enter nickname"
            error={errors.nickname?.message}
            {...register('nickname')}
          />
          <Select
            label="Gender"
            placeholder="Select gender"
            options={genderOptions}
            error={errors.gender?.message}
            {...register('gender')}
          />
          <Controller
            control={control}
            name="birth_place"
            render={({ field }) => (
              <LocationAutocomplete
                label="Birth Place"
                placeholder="City, Country"
                error={errors.birth_place?.message}
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <Input
            label="Occupation"
            placeholder="Enter occupation"
            error={errors.occupation?.message}
            {...register('occupation')}
          />
        </div>
      </div>

      {/* Living Status */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
          Status
        </h3>
        
        <div className="space-y-6">
          <Checkbox
            label="This person is currently living"
            {...register('is_living')}
          />
          
          {!isLiving && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8 border-l-2 border-[rgb(var(--color-border))]">
              <Input
                label="Date of Death"
                type="date"
                error={errors.death_date?.message}
                {...register('death_date')}
              />
              <Input
                label="Place of Death"
                placeholder="City, Country"
                error={errors.death_place?.message}
                {...register('death_place')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
          Contact Information
        </h3>
        <p className="text-[rgb(var(--color-text-muted))] mb-6">Optional contact details.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
      </div>

      {/* Biography */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
          Biography
        </h3>
        <Textarea
          label="About this person"
          placeholder="Write a short biography or any notes about this person..."
          error={errors.bio?.message}
          rows={5}
          {...register('bio')}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-[rgb(var(--color-border))]">
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
          {isEditing ? 'Save Changes' : 'Add Person'}
        </Button>
      </div>
    </form>
  );
}
