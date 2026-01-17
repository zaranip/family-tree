import { Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from '../../features/theme/ThemeContext';

const themeOptions = [
  {
    id: 'light',
    label: 'Light',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: Moon,
  },
  {
    id: 'colored',
    label: 'Colored',
    icon: Palette,
  },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="Theme selection">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = option.id === theme;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={isActive ? 'theme-toggle__button is-active' : 'theme-toggle__button'}
            aria-pressed={isActive}
          >
            <Icon className="theme-toggle__icon" aria-hidden="true" />
            <span className="theme-toggle__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
