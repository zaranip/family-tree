import { useState, useRef, useEffect, forwardRef, type ChangeEvent } from 'react';
import { MapPin, X } from 'lucide-react';

// =============================================================================
// LOCATION DATA - Common cities, states, and countries
// =============================================================================

const LOCATIONS = [
  // Major US Cities
  'New York, NY, USA',
  'Los Angeles, CA, USA',
  'Chicago, IL, USA',
  'Houston, TX, USA',
  'Phoenix, AZ, USA',
  'Philadelphia, PA, USA',
  'San Antonio, TX, USA',
  'San Diego, CA, USA',
  'Dallas, TX, USA',
  'San Jose, CA, USA',
  'Austin, TX, USA',
  'Jacksonville, FL, USA',
  'Fort Worth, TX, USA',
  'Columbus, OH, USA',
  'Charlotte, NC, USA',
  'San Francisco, CA, USA',
  'Indianapolis, IN, USA',
  'Seattle, WA, USA',
  'Denver, CO, USA',
  'Boston, MA, USA',
  'Nashville, TN, USA',
  'Detroit, MI, USA',
  'Portland, OR, USA',
  'Las Vegas, NV, USA',
  'Memphis, TN, USA',
  'Louisville, KY, USA',
  'Baltimore, MD, USA',
  'Milwaukee, WI, USA',
  'Albuquerque, NM, USA',
  'Tucson, AZ, USA',
  'Fresno, CA, USA',
  'Sacramento, CA, USA',
  'Atlanta, GA, USA',
  'Miami, FL, USA',
  'Orlando, FL, USA',
  'Tampa, FL, USA',
  'Pittsburgh, PA, USA',
  'Cleveland, OH, USA',
  'Minneapolis, MN, USA',
  'New Orleans, LA, USA',
  'Honolulu, HI, USA',
  'Anchorage, AK, USA',
  
  // International Cities
  'London, England, UK',
  'Manchester, England, UK',
  'Birmingham, England, UK',
  'Edinburgh, Scotland, UK',
  'Dublin, Ireland',
  'Paris, France',
  'Lyon, France',
  'Marseille, France',
  'Berlin, Germany',
  'Munich, Germany',
  'Hamburg, Germany',
  'Frankfurt, Germany',
  'Rome, Italy',
  'Milan, Italy',
  'Naples, Italy',
  'Madrid, Spain',
  'Barcelona, Spain',
  'Valencia, Spain',
  'Amsterdam, Netherlands',
  'Brussels, Belgium',
  'Vienna, Austria',
  'Zurich, Switzerland',
  'Geneva, Switzerland',
  'Stockholm, Sweden',
  'Oslo, Norway',
  'Copenhagen, Denmark',
  'Helsinki, Finland',
  'Warsaw, Poland',
  'Prague, Czech Republic',
  'Budapest, Hungary',
  'Athens, Greece',
  'Lisbon, Portugal',
  'Moscow, Russia',
  'St. Petersburg, Russia',
  
  // Asia
  'Tokyo, Japan',
  'Osaka, Japan',
  'Kyoto, Japan',
  'Beijing, China',
  'Shanghai, China',
  'Hong Kong, China',
  'Guangzhou, China',
  'Shenzhen, China',
  'Seoul, South Korea',
  'Busan, South Korea',
  'Taipei, Taiwan',
  'Singapore',
  'Bangkok, Thailand',
  'Ho Chi Minh City, Vietnam',
  'Hanoi, Vietnam',
  'Manila, Philippines',
  'Jakarta, Indonesia',
  'Kuala Lumpur, Malaysia',
  'Mumbai, India',
  'Delhi, India',
  'Bangalore, India',
  'Chennai, India',
  'Kolkata, India',
  'Karachi, Pakistan',
  'Lahore, Pakistan',
  'Dhaka, Bangladesh',
  'Kathmandu, Nepal',
  
  // Middle East
  'Dubai, UAE',
  'Abu Dhabi, UAE',
  'Riyadh, Saudi Arabia',
  'Jeddah, Saudi Arabia',
  'Tel Aviv, Israel',
  'Jerusalem, Israel',
  'Istanbul, Turkey',
  'Ankara, Turkey',
  'Tehran, Iran',
  'Cairo, Egypt',
  'Alexandria, Egypt',
  
  // Africa
  'Lagos, Nigeria',
  'Nairobi, Kenya',
  'Johannesburg, South Africa',
  'Cape Town, South Africa',
  'Durban, South Africa',
  'Casablanca, Morocco',
  'Accra, Ghana',
  'Addis Ababa, Ethiopia',
  
  // Oceania
  'Sydney, NSW, Australia',
  'Melbourne, VIC, Australia',
  'Brisbane, QLD, Australia',
  'Perth, WA, Australia',
  'Adelaide, SA, Australia',
  'Auckland, New Zealand',
  'Wellington, New Zealand',
  'Christchurch, New Zealand',
  
  // South America
  'São Paulo, Brazil',
  'Rio de Janeiro, Brazil',
  'Buenos Aires, Argentina',
  'Lima, Peru',
  'Bogotá, Colombia',
  'Santiago, Chile',
  'Caracas, Venezuela',
  'Montevideo, Uruguay',
  'Quito, Ecuador',
  
  // Central America & Caribbean
  'Mexico City, Mexico',
  'Guadalajara, Mexico',
  'Monterrey, Mexico',
  'Cancún, Mexico',
  'Havana, Cuba',
  'San Juan, Puerto Rico',
  'Panama City, Panama',
  'San José, Costa Rica',
  'Guatemala City, Guatemala',
  
  // Canada
  'Toronto, ON, Canada',
  'Montreal, QC, Canada',
  'Vancouver, BC, Canada',
  'Calgary, AB, Canada',
  'Edmonton, AB, Canada',
  'Ottawa, ON, Canada',
  'Winnipeg, MB, Canada',
  'Quebec City, QC, Canada',
  'Halifax, NS, Canada',
];

// =============================================================================
// TYPES
// =============================================================================

interface LocationAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const LocationAutocomplete = forwardRef<HTMLInputElement, LocationAutocompleteProps>(
  (
    {
      value = '',
      onChange,
      onBlur,
      name,
      label,
      placeholder = 'Start typing a city name...',
      error,
      hint,
      required,
      disabled,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with external value
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Filter suggestions based on input
    useEffect(() => {
      if (inputValue.length < 2) {
        setSuggestions([]);
        return;
      }

      const query = inputValue.toLowerCase();
      const filtered = LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(query)
      ).slice(0, 10); // Limit to 10 suggestions

      setSuggestions(filtered);
      setHighlightedIndex(-1);
    }, [inputValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
      setIsOpen(true);
    };

    const handleSelectSuggestion = (suggestion: string) => {
      setInputValue(suggestion);
      onChange(suggestion);
      setIsOpen(false);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleSelectSuggestion(suggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    const handleClear = () => {
      setInputValue('');
      onChange('');
      inputRef.current?.focus();
    };

    const inputId = name || 'location-autocomplete';

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-base font-medium text-[rgb(var(--color-text-main))] mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]">
            <MapPin className="w-5 h-5" />
          </div>

          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={inputId}
            name={name}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full pl-12 pr-10 py-3 text-base border rounded-lg
              transition-colors duration-200
              bg-[rgb(var(--color-bg-card))] text-[rgb(var(--color-text-main))]
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              placeholder:text-[rgb(var(--color-text-muted))]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-[rgb(var(--color-input-border))]'}
            `}
            autoComplete="off"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />

          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-main))]"
              aria-label="Clear location"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <ul
              className="absolute z-10 w-full mt-1 bg-[rgb(var(--color-bg-card))] border border-[rgb(var(--color-border))] rounded-lg shadow-lg max-h-60 overflow-auto"
              role="listbox"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer
                    ${index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'hover:bg-[rgb(var(--color-bg-elevated))]'}
                  `}
                >
                  <MapPin className="w-4 h-4 text-[rgb(var(--color-text-muted))] flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">{hint}</p>
        )}
      </div>
    );
  }
);

LocationAutocomplete.displayName = 'LocationAutocomplete';
