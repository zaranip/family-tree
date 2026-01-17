import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Calendar, Heart } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { Avatar } from '../common/Avatar';
import type { Person } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface PersonNodeData {
  person: Person;
  isSelected?: boolean;
  onClick?: (personId: string) => void;
}

interface PersonNodeProps {
  data: PersonNodeData;
  selected?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function calculateAge(birthday: string, deathDate?: string | null): number {
  const birthDate = parseISO(birthday);
  const endDate = deathDate ? parseISO(deathDate) : new Date();
  return differenceInYears(endDate, birthDate);
}

// =============================================================================
// COMPONENT
// =============================================================================

function PersonNodeComponent({ data, selected }: PersonNodeProps) {
  const { person, onClick } = data;
  
  const fullName = `${person.first_name} ${person.last_name}`;
  const age = calculateAge(person.birthday, person.death_date);
  const birthYear = format(parseISO(person.birthday), 'yyyy');
  const deathYear = person.death_date ? format(parseISO(person.death_date), 'yyyy') : null;

  const handleClick = () => {
    if (onClick) {
      onClick(person.id);
    }
  };

  return (
    <>
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-[rgb(var(--color-text-muted))] !border-2 !border-[rgb(var(--color-bg-card))]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-[rgb(var(--color-text-muted))] !border-2 !border-[rgb(var(--color-bg-card))]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-[rgb(var(--color-text-muted))] !border-2 !border-[rgb(var(--color-bg-card))]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-[rgb(var(--color-text-muted))] !border-2 !border-[rgb(var(--color-bg-card))]"
      />

      {/* Node Content */}
      <div
        onClick={handleClick}
        className={`
          bg-[rgb(var(--color-bg-card))] rounded-xl shadow-lg border-2 p-4 cursor-pointer
          transition-all duration-200 hover:shadow-xl hover:scale-105
          min-w-[180px] max-w-[220px]
          ${selected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-[rgb(var(--color-border))]'}
          ${!person.is_living ? 'opacity-90' : ''}
        `}
      >
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <Avatar
            src={person.photo_url}
            name={fullName}
            size="lg"
            className={!person.is_living ? 'opacity-75' : ''}
          />

          {/* Name */}
          <h3 className="mt-3 font-semibold text-[rgb(var(--color-text-main))] text-sm leading-tight">
            {fullName}
          </h3>
          
          {person.nickname && (
            <p className="text-xs text-[rgb(var(--color-text-muted))]">"{person.nickname}"</p>
          )}

          {/* Dates */}
          <div className="mt-2 flex items-center gap-1 text-xs text-[rgb(var(--color-text-muted))]">
            <Calendar className="w-3 h-3" />
            <span>
              {birthYear}
              {deathYear ? ` - ${deathYear}` : ''}
            </span>
          </div>

          {/* Age */}
          <p className="text-xs text-[rgb(var(--color-text-muted))] opacity-75">
            {person.is_living ? `${age} years old` : `Lived ${age} years`}
          </p>

          {/* In Memoriam Badge */}
          {!person.is_living && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--color-bg-elevated))] text-[rgb(var(--color-text-muted))]">
                <Heart className="w-2.5 h-2.5" />
                In Memoriam
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const PersonNode = memo(PersonNodeComponent);
