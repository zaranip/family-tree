import { useNavigate } from 'react-router-dom';
import { PageLayout, PageContainer, PageHeader } from '../../components/layout';
import { useToast } from '../../components/common';
import { PersonForm } from '../../features/people';
import { useCreatePerson } from '../../hooks';
import { peopleApi, storageApi } from '../../lib/supabase';
import type { PersonFormData } from '../../types';

export function AddPerson() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const createPerson = useCreatePerson();

  const handleSubmit = async (data: PersonFormData, options: { photoFile: File | null; removePhoto: boolean }) => {
    try {
      const person = await createPerson.mutateAsync(data);

      if (options.photoFile) {
        const photoUrl = await storageApi.uploadPhoto(options.photoFile, person.id);
        await peopleApi.update(person.id, { photo_url: photoUrl });
      }

      success('Person added!', `${data.first_name} ${data.last_name} has been added to the family tree.`);
      navigate(`/people/${person.id}`);
    } catch (err) {
      showError('Failed to add person', 'An error occurred while adding this person. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/people');
  };

  return (
    <PageLayout>
      <PageContainer maxWidth="lg">
        <PageHeader
          title="Add Family Member"
          subtitle="Add a new person to your family tree"
          breadcrumbs={[
            { label: 'People', to: '/people' },
            { label: 'Add Person' },
          ]}
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <PersonForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createPerson.isPending}
          />
        </div>
      </PageContainer>
    </PageLayout>
  );
}
