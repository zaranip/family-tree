import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout';
import { Button, LoadingOverlay } from '../components/common';
import { FamilyTree } from '../components/tree';
import { usePeople, useRelationships } from '../hooks';

export function Home() {
  const navigate = useNavigate();
  const { data: people = [], isLoading: loadingPeople } = usePeople();
  const { data: relationships = [], isLoading: loadingRelationships } = useRelationships();
  const [selectedPersonId, setSelectedPersonId] = useState<string>();

  const isLoading = loadingPeople || loadingRelationships;

  const handlePersonClick = (personId: string) => {
    setSelectedPersonId(personId);
    navigate(`/people/${personId}`);
  };

  return (
    <PageLayout>
      {isLoading && <LoadingOverlay message="Loading family tree..." />}
      
      {/* Toolbar */}
      <div className="bg-[rgb(var(--color-bg-card))] border-b border-[rgb(var(--color-border))] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-[rgb(var(--color-text-main))]">Family Tree</h1>
            <span className="text-sm text-[rgb(var(--color-text-muted))]">
              {people.length} {people.length === 1 ? 'person' : 'people'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/people">
              <Button variant="ghost" size="sm" leftIcon={<List className="w-4 h-4" />}>
                List View
              </Button>
            </Link>
            <Link to="/people/new">
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Person
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1" style={{ height: 'calc(100vh - 64px - 57px)' }}>
        <FamilyTree
          people={people}
          relationships={relationships}
          onPersonClick={handlePersonClick}
          selectedPersonId={selectedPersonId}
        />
      </div>
    </PageLayout>
  );
}
