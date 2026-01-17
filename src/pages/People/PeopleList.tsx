import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { PageLayout, PageContainer, PageHeader } from '../../components/layout';
import { Button, Input, EmptyState, LoadingCard } from '../../components/common';
import { PersonCard } from '../../features/people';
import { usePeople } from '../../hooks';

export function PeopleList() {
  const { data: people, isLoading, error } = usePeople();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter people based on search query
  const filteredPeople = people?.filter((person) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      person.first_name.toLowerCase().includes(query) ||
      person.last_name.toLowerCase().includes(query) ||
      person.nickname?.toLowerCase().includes(query) ||
      person.maiden_name?.toLowerCase().includes(query)
    );
  });

  return (
    <PageLayout>
      <PageContainer>
        <PageHeader
          title="Family Members"
          subtitle={`${people?.length || 0} people in your family tree`}
          action={
            <Link to="/people/new">
              <Button leftIcon={<Plus className="w-5 h-5" />}>
                Add Person
              </Button>
            </Link>
          }
        />

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading && <LoadingCard message="Loading family members..." />}

        {error && (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Unable to load people"
            description="There was an error loading your family members. Please try again."
            action={
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            }
          />
        )}

        {!isLoading && !error && filteredPeople?.length === 0 && (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={searchQuery ? 'No results found' : 'No family members yet'}
            description={
              searchQuery
                ? 'Try adjusting your search terms.'
                : 'Start building your family tree by adding the first person.'
            }
            action={
              !searchQuery && (
                <Link to="/people/new">
                  <Button leftIcon={<Plus className="w-5 h-5" />}>
                    Add First Person
                  </Button>
                </Link>
              )
            }
          />
        )}

        {!isLoading && !error && filteredPeople && filteredPeople.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map((person) => (
              <PersonCard key={person.id} person={person} compact />
            ))}
          </div>
        )}
      </PageContainer>
    </PageLayout>
  );
}
