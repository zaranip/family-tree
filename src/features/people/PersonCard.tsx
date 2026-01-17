import { Link } from 'react-router-dom';
import { Calendar, MapPin, Briefcase, Heart } from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { Avatar, Card } from '../../components/common';
import type { Person } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface PersonCardProps {
  person: Person;
  showLink?: boolean;
  compact?: boolean;
}

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

// =============================================================================
// COMPONENT
// =============================================================================

export function PersonCard({ person, showLink = true, compact = false }: PersonCardProps) {
  const fullName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(' ');
  
  const displayName = person.nickname 
    ? `${fullName} "${person.nickname}"`
    : fullName;

  const age = calculateAge(person.birthday, person.death_date);

  const content = (
    <Card className={`transition-shadow hover:shadow-md ${showLink ? 'cursor-pointer' : ''}`}>
      <div className={`flex ${compact ? 'items-center gap-4' : 'flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6'}`}>
        <Avatar
          src={person.photo_url}
          name={fullName}
          size={compact ? 'lg' : '2xl'}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-xl'}`}>
            {displayName}
          </h3>
          
          {person.maiden_name && (
            <p className="text-sm text-gray-500">née {person.maiden_name}</p>
          )}
          
          <div className={`mt-2 space-y-1 text-gray-600 ${compact ? 'text-sm' : 'text-base'}`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>
                {formatDate(person.birthday)}
                {' • '}
                {person.is_living ? (
                  <span>{age} years old</span>
                ) : (
                  <span className="text-gray-500">
                    Passed away {person.death_date ? formatDate(person.death_date) : ''} 
                    (age {age})
                  </span>
                )}
              </span>
            </div>
            
            {person.birth_place && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{person.birth_place}</span>
              </div>
            )}
            
            {person.occupation && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{person.occupation}</span>
              </div>
            )}
          </div>
          
          {!compact && person.bio && (
            <p className="mt-3 text-gray-600 line-clamp-2">{person.bio}</p>
          )}
          
          {!person.is_living && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <Heart className="w-3 h-3" />
                In Memoriam
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (showLink) {
    return (
      <Link to={`/people/${person.id}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// =============================================================================
// MINI CARD (for relationship displays)
// =============================================================================

interface PersonMiniCardProps {
  person: Pick<Person, 'id' | 'first_name' | 'last_name' | 'photo_url'>;
  subtitle?: string;
  onClick?: () => void;
}

export function PersonMiniCard({ person, subtitle, onClick }: PersonMiniCardProps) {
  const fullName = `${person.first_name} ${person.last_name}`;

  const content = (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
      <Avatar src={person.photo_url} name={fullName} size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 truncate">{fullName}</p>
        {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link to={`/people/${person.id}`} className="block">
      {content}
    </Link>
  );
}
