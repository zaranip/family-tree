import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PageLayout, PageContainer, PageHeader } from '../../components/layout';
import { useToast, LoadingCard, EmptyState, Button } from '../../components/common';
import { PersonForm } from '../../features/people';
import { usePerson, useUpdatePerson } from '../../hooks';
import { peopleApi, storageApi } from '../../lib/supabase';
import type { PersonFormData } from '../../types';

export function EditPerson() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const { data: person, isLoading, error } = usePerson(id);
  const updatePerson = useUpdatePerson();

  if (isLoading) {
    return (
      <PageLayout>
        <PageContainer>
          <LoadingCard message="Loading person..." />
        </PageContainer>
      </PageLayout>
    );
  }

  if (error || !person) {
    return (
      <PageLayout>
        <PageContainer>
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Person not found"
            description="This person may have been removed or doesn't exist."
            action={
              <Link to="/people">
                <Button>View All People</Button>
              </Link>
            }
          />
        </PageContainer>
      </PageLayout>
    );
  }

  const handleSubmit = async (data: PersonFormData, options: { photoFile: File | null; removePhoto: boolean }) => {
    try {
      await updatePerson.mutateAsync({ id: person.id, data });

      if (options.removePhoto && person.photo_url) {
        await storageApi.deletePhoto(person.photo_url);
        await peopleApi.update(person.id, { photo_url: null });
      } else if (options.photoFile) {
        const photoUrl = await storageApi.uploadPhoto(options.photoFile, person.id);
        await peopleApi.update(person.id, { photo_url: photoUrl });
      }

      success('Changes saved!', `${data.first_name} ${data.last_name}'s information has been updated.`);
      navigate(`/people/${person.id}`);
    } catch (err) {
      showError('Failed to save changes', 'An error occurred while updating this person. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/people/${person.id}`);
  };

  return (
    <PageLayout>
      <PageContainer maxWidth="lg">
        <PageHeader
          title="Edit Person"
          subtitle={`Update ${person.first_name} ${person.last_name}'s information`}
          breadcrumbs={[
            { label: 'People', to: '/people' },
            { label: `${person.first_name} ${person.last_name}`, to: `/people/${person.id}` },
            { label: 'Edit' },
          ]}
        />

        <div className="bg-[rgb(var(--color-bg-card))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-6 md:p-8">
          <PersonForm
            person={person}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updatePerson.isPending}
          />
        </div>
      </PageContainer>
    </PageLayout>
  );
}
