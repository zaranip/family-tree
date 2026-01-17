import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PageLayout, PageContainer, PageHeader } from '../../components/layout';
import { useToast, LoadingCard, EmptyState, Button } from '../../components/common';
import { AddRelationshipForm } from '../../features/relationships';
import { usePersonWithRelationships, useCreateRelationship } from '../../hooks';
import type { RelationshipFormData } from '../../types';

export function AddRelationship() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const defaultCategory = searchParams.get('type') as 'parent' | 'spouse' | 'sibling' | 'child' | undefined;

  const { data, isLoading, error } = usePersonWithRelationships(id);
  const createRelationship = useCreateRelationship();

  if (isLoading) {
    return (
      <PageLayout>
        <PageContainer>
          <LoadingCard message="Loading..." />
        </PageContainer>
      </PageLayout>
    );
  }

  if (error || !data) {
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

  const { person, relationships } = data;
  const personName = `${person.first_name} ${person.last_name}`;
  const existingRelationshipIds = relationships.map((r) => r.related_person_id);

  const handleSubmit = async (formData: RelationshipFormData) => {
    try {
      await createRelationship.mutateAsync(formData);
      success('Relationship added!', 'The relationship has been created successfully.');
      navigate(`/people/${person.id}`);
    } catch (err) {
      showError('Failed to add relationship', 'An error occurred. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/people/${person.id}`);
  };

  const getCategoryTitle = () => {
    switch (defaultCategory) {
      case 'parent':
        return 'Add Parent';
      case 'child':
        return 'Add Child';
      case 'spouse':
        return 'Add Spouse/Partner';
      case 'sibling':
        return 'Add Sibling';
      default:
        return 'Add Relationship';
    }
  };

  return (
    <PageLayout>
      <PageContainer maxWidth="md">
        <PageHeader
          title={getCategoryTitle()}
          subtitle={`Add a family connection for ${personName}`}
          breadcrumbs={[
            { label: 'People', to: '/people' },
            { label: personName, to: `/people/${person.id}` },
            { label: getCategoryTitle() },
          ]}
        />

        <div className="bg-[rgb(var(--color-bg-card))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-6 md:p-8">
          <AddRelationshipForm
            person1Id={person.id}
            person1Name={personName}
            defaultCategory={defaultCategory}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createRelationship.isPending}
            existingRelationshipIds={existingRelationshipIds}
          />
        </div>
      </PageContainer>
    </PageLayout>
  );
}
