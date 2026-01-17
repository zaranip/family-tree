import { useState, useMemo } from 'react';
import { Search as SearchIcon, Filter, X, Users } from 'lucide-react';
import { PageLayout, PageContainer, PageHeader } from '../components/layout';
import { Input, Select, Checkbox, Button, EmptyState, LoadingCard } from '../components/common';
import { PersonCard } from '../features/people';
import { usePeople } from '../hooks';

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const sortOptions = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'age_asc', label: 'Age (Youngest first)' },
  { value: 'age_desc', label: 'Age (Oldest first)' },
  { value: 'added_desc', label: 'Recently added' },
  { value: 'added_asc', label: 'Oldest added' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function Search() {
  const { data: people = [], isLoading, error } = usePeople();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [showLivingOnly, setShowLivingOnly] = useState(false);
  const [showDeceasedOnly, setShowDeceasedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort people
  const filteredPeople = useMemo(() => {
    let result = [...people];

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((person) =>
        person.first_name.toLowerCase().includes(query) ||
        person.last_name.toLowerCase().includes(query) ||
        person.middle_name?.toLowerCase().includes(query) ||
        person.maiden_name?.toLowerCase().includes(query) ||
        person.nickname?.toLowerCase().includes(query) ||
        person.birth_place?.toLowerCase().includes(query) ||
        person.occupation?.toLowerCase().includes(query)
      );
    }

    // Living/Deceased filter
    if (showLivingOnly) {
      result = result.filter((p) => p.is_living);
    }
    if (showDeceasedOnly) {
      result = result.filter((p) => !p.is_living);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
        case 'name_desc':
          return `${b.last_name} ${b.first_name}`.localeCompare(`${a.last_name} ${a.first_name}`);
        case 'age_asc':
          return new Date(b.birthday).getTime() - new Date(a.birthday).getTime();
        case 'age_desc':
          return new Date(a.birthday).getTime() - new Date(b.birthday).getTime();
        case 'added_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'added_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [people, searchQuery, sortBy, showLivingOnly, showDeceasedOnly]);

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('name_asc');
    setShowLivingOnly(false);
    setShowDeceasedOnly(false);
  };

  const hasActiveFilters = searchQuery || sortBy !== 'name_asc' || showLivingOnly || showDeceasedOnly;

  return (
    <PageLayout>
      <PageContainer>
        <PageHeader
          title="Search"
          subtitle="Find family members by name, location, or other details"
        />

        {/* Search Bar */}
        <div className="bg-[rgb(var(--color-bg-card))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--color-text-muted))]" />
              <Input
                placeholder="Search by name, location, occupation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 text-lg"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Filters
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Active
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-[rgb(var(--color-border))]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  label="Sort By"
                  options={sortOptions}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                />
                
                <div className="space-y-4">
                  <label className="block text-base font-medium text-[rgb(var(--color-text-main))]">
                    Status
                  </label>
                  <div className="space-y-2">
                    <Checkbox
                      label="Living only"
                      checked={showLivingOnly}
                      onChange={(e) => {
                        setShowLivingOnly(e.target.checked);
                        if (e.target.checked) setShowDeceasedOnly(false);
                      }}
                    />
                    <Checkbox
                      label="Deceased only"
                      checked={showDeceasedOnly}
                      onChange={(e) => {
                        setShowDeceasedOnly(e.target.checked);
                        if (e.target.checked) setShowLivingOnly(false);
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading && <LoadingCard message="Searching..." />}

        {error && (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Unable to search"
            description="There was an error loading the data. Please try again."
            action={
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            }
          />
        )}

        {!isLoading && !error && (
          <>
            {/* Results count */}
            <p className="text-[rgb(var(--color-text-muted))] mb-6">
              {filteredPeople.length === 0
                ? 'No results found'
                : `Found ${filteredPeople.length} ${filteredPeople.length === 1 ? 'person' : 'people'}`}
            </p>

            {filteredPeople.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="w-8 h-8" />}
                title="No results found"
                description="Try adjusting your search terms or filters."
                action={
                  hasActiveFilters && (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )
                }
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPeople.map((person) => (
                  <PersonCard key={person.id} person={person} compact />
                ))}
              </div>
            )}
          </>
        )}
      </PageContainer>
    </PageLayout>
  );
}
