import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Calendar, MapPin, Briefcase, Mail, Phone, 
  Heart, Users, Plus, ArrowLeft 
} from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { PageLayout, PageContainer } from '../../components/layout';
import { 
  Button, Avatar, Card, CardWithHeader, LoadingCard, EmptyState, 
  ConfirmModal, useToast 
} from '../../components/common';
import { PersonMiniCard } from '../../features/people';
import { usePersonWithRelationships, useDeletePerson, usePersonHistory } from '../../hooks';
import { useAuth } from '../../features/auth/AuthContext';
import { RELATIONSHIP_LABELS, getInverseRelationshipLabel, RELATIONSHIP_CATEGORIES } from '../../types';
import type { PersonRelationship } from '../../types';

// =============================================================================
// HELPERS
// =============================================================================

function calculateAge(birthday: string, deathDate?: string | null): number {
  const birthDate = parseISO(birthday);
  const endDate = deathDate ? parseISO(deathDate) : new Date();
  return differenceInYears(endDate, birthDate);
}

function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMMM d, yyyy');
}

function groupRelationships(relationships: PersonRelationship[]) {
  const groups: Record<string, PersonRelationship[]> = {
    parents: [],
    children: [],
    spouses: [],
    siblings: [],
  };

  relationships.forEach((rel) => {
    if (RELATIONSHIP_CATEGORIES.parent.includes(rel.relationship_type)) {
      if (rel.relationship_direction === 'to') {
        // This person is the child, so related person is parent
        groups.parents.push(rel);
      } else {
        // This person is the parent, so related person is child
        groups.children.push(rel);
      }
    } else if (RELATIONSHIP_CATEGORIES.spouse.includes(rel.relationship_type)) {
      groups.spouses.push(rel);
    } else if (RELATIONSHIP_CATEGORIES.sibling.includes(rel.relationship_type)) {
      groups.siblings.push(rel);
    }
  });

  return groups;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { data, isLoading, error } = usePersonWithRelationships(id);
  const deletePerson = useDeletePerson();
  const historyQuery = usePersonHistory(id);

  if (isLoading) {
    return (
      <PageLayout>
        <PageContainer>
          <LoadingCard message="Loading person..." />
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
  const groupedRelationships = groupRelationships(relationships);

  const fullName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(' ');
  
  const displayName = person.nickname 
    ? `${fullName} "${person.nickname}"`
    : fullName;

  const age = calculateAge(person.birthday, person.death_date);

  const handleDelete = async () => {
    try {
      await deletePerson.mutateAsync(person.id);
      success('Person deleted', `${fullName} has been removed from the family tree.`);
      navigate('/people');
    } catch (err) {
      showError('Failed to delete', 'An error occurred while deleting this person.');
    }
    setShowDeleteModal(false);
  };

  return (
    <PageLayout>
      <PageContainer>
        {/* Back Button */}
        <Link
          to="/people"
          className="inline-flex items-center gap-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-main))] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to People
        </Link>

        {/* Main Profile Card */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Photo */}
            <div className="flex-shrink-0">
              <Avatar
                src={person.photo_url}
                name={fullName}
                size="2xl"
                className="mx-auto md:mx-0"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-[rgb(var(--color-text-main))]">{displayName}</h1>
                  {person.maiden_name && (
                    <p className="text-lg text-[rgb(var(--color-text-muted))]">née {person.maiden_name}</p>
                  )}
                  {!person.is_living && (
                    <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-medium bg-[rgb(var(--color-bg-elevated))] text-[rgb(var(--color-text-muted))]">
                      <Heart className="w-4 h-4" />
                      In Memoriam
                    </span>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Link to={`/people/${person.id}/edit`}>
                    <Button variant="secondary" leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button
                      variant="danger"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-[rgb(var(--color-text-muted))]">
                  <Calendar className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
                  <div>
                    <p className="font-medium">Born {formatDate(person.birthday)}</p>
                    <p className="text-sm">
                      {person.is_living 
                        ? `${age} years old`
                        : `Passed away ${person.death_date ? formatDate(person.death_date) : ''} (age ${age})`
                      }
                    </p>
                  </div>
                </div>

                {person.birth_place && (
                  <div className="flex items-center gap-3 text-[rgb(var(--color-text-muted))]">
                    <MapPin className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
                    <div>
                      <p className="font-medium">Birth Place</p>
                      <p className="text-sm">{person.birth_place}</p>
                    </div>
                  </div>
                )}

                {person.occupation && (
                  <div className="flex items-center gap-3 text-[rgb(var(--color-text-muted))]">
                    <Briefcase className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
                    <div>
                      <p className="font-medium">Occupation</p>
                      <p className="text-sm">{person.occupation}</p>
                    </div>
                  </div>
                )}

                {person.email && (
                  <div className="flex items-center gap-3 text-[rgb(var(--color-text-muted))]">
                    <Mail className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${person.email}`} className="text-sm link">
                        {person.email}
                      </a>
                    </div>
                  </div>
                )}

                {person.phone && (
                  <div className="flex items-center gap-3 text-[rgb(var(--color-text-muted))]">
                    <Phone className="w-5 h-5 text-[rgb(var(--color-text-muted))]" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href={`tel:${person.phone}`} className="text-sm link">
                        {person.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              {person.bio && (
                <div className="mt-6 pt-6 border-t border-[rgb(var(--color-border))]">
                  <h3 className="font-semibold text-[rgb(var(--color-text-main))] mb-2">About</h3>
                  <p className="text-[rgb(var(--color-text-muted))] whitespace-pre-wrap">{person.bio}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Relationships */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Parents */}
          <CardWithHeader
            title="Parents"
            action={
              <Link to={`/people/${person.id}/add-relationship?type=parent`}>
                <Button variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </Link>
            }
          >
            {groupedRelationships.parents.length === 0 ? (
              <p className="text-[rgb(var(--color-text-muted))] text-center py-4">No parents added</p>
            ) : (
              <div className="space-y-3">
                {groupedRelationships.parents.map((rel) => (
                  <PersonMiniCard
                    key={rel.relationship_id}
                    person={{
                      id: rel.related_person_id,
                      first_name: rel.related_person_first_name,
                      last_name: rel.related_person_last_name,
                      photo_url: rel.related_person_photo_url,
                    }}
                    subtitle={RELATIONSHIP_LABELS[rel.relationship_type]}
                  />
                ))}
              </div>
            )}
          </CardWithHeader>

          {/* Spouses/Partners */}
          <CardWithHeader
            title="Spouses & Partners"
            action={
              <Link to={`/people/${person.id}/add-relationship?type=spouse`}>
                <Button variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </Link>
            }
          >
            {groupedRelationships.spouses.length === 0 ? (
              <p className="text-[rgb(var(--color-text-muted))] text-center py-4">No spouses or partners added</p>
            ) : (
              <div className="space-y-3">
                {groupedRelationships.spouses.map((rel) => (
                  <PersonMiniCard
                    key={rel.relationship_id}
                    person={{
                      id: rel.related_person_id,
                      first_name: rel.related_person_first_name,
                      last_name: rel.related_person_last_name,
                      photo_url: rel.related_person_photo_url,
                    }}
                    subtitle={
                      rel.start_date
                        ? `${RELATIONSHIP_LABELS[rel.relationship_type]} (${format(parseISO(rel.start_date), 'yyyy')}${rel.end_date ? ` - ${format(parseISO(rel.end_date), 'yyyy')}` : ''})`
                        : RELATIONSHIP_LABELS[rel.relationship_type]
                    }
                  />
                ))}
              </div>
            )}
          </CardWithHeader>

          {/* Siblings */}
          <CardWithHeader
            title="Siblings"
            action={
              <Link to={`/people/${person.id}/add-relationship?type=sibling`}>
                <Button variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </Link>
            }
          >
            {groupedRelationships.siblings.length === 0 ? (
              <p className="text-[rgb(var(--color-text-muted))] text-center py-4">No siblings added</p>
            ) : (
              <div className="space-y-3">
                {groupedRelationships.siblings.map((rel) => (
                  <PersonMiniCard
                    key={rel.relationship_id}
                    person={{
                      id: rel.related_person_id,
                      first_name: rel.related_person_first_name,
                      last_name: rel.related_person_last_name,
                      photo_url: rel.related_person_photo_url,
                    }}
                    subtitle={RELATIONSHIP_LABELS[rel.relationship_type]}
                  />
                ))}
              </div>
            )}
          </CardWithHeader>

          {/* Children */}
          <CardWithHeader
            title="Children"
            action={
              <Link to={`/people/${person.id}/add-relationship?type=child`}>
                <Button variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </Link>
            }
          >
            {groupedRelationships.children.length === 0 ? (
              <p className="text-[rgb(var(--color-text-muted))] text-center py-4">No children added</p>
            ) : (
              <div className="space-y-3">
                {groupedRelationships.children.map((rel) => (
                  <PersonMiniCard
                    key={rel.relationship_id}
                    person={{
                      id: rel.related_person_id,
                      first_name: rel.related_person_first_name,
                      last_name: rel.related_person_last_name,
                      photo_url: rel.related_person_photo_url,
                    }}
                    subtitle={getInverseRelationshipLabel(rel.relationship_type, 'from')}
                  />
                ))}
              </div>
            )}
          </CardWithHeader>
        </div>

        {/* Version History */}
        {isAdmin && (
          <div className="mt-8">
            <CardWithHeader
              title="Version History"
              subtitle="Most recent edits to this profile"
            >
              {historyQuery.isLoading ? (
                <p className="text-[rgb(var(--color-text-muted))] text-center py-4">Loading history...</p>
              ) : historyQuery.error ? (
                <p className="text-[rgb(var(--color-text-muted))] text-center py-4">Unable to load history.</p>
              ) : !historyQuery.data || historyQuery.data.length === 0 ? (
                <p className="text-[rgb(var(--color-text-muted))] text-center py-4">No changes recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {historyQuery.data.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-card))] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[rgb(var(--color-text-main))]">Profile updated</p>
                        <p className="text-sm text-[rgb(var(--color-text-muted))]">
                          {format(parseISO(entry.changed_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="text-sm text-[rgb(var(--color-text-muted))]">{entry.changed_by_user_id ? 'User' : 'System'}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardWithHeader>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Person"
          message={`Are you sure you want to delete ${fullName}? This will also remove all their relationships. This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deletePerson.isPending}
        />
      </PageContainer>
    </PageLayout>
  );
}
