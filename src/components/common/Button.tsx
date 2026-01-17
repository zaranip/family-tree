import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// =============================================================================
// TYPES
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// =============================================================================
// STYLES
// =============================================================================

const baseStyles = `
  inline-flex items-center justify-center font-medium rounded-lg
  transition-colors duration-200 min-h-touch
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[rgb(var(--color-accent-btn))] text-white hover:bg-[rgb(var(--color-accent-btn-hover))] focus:ring-[rgb(var(--color-accent-btn))] active:bg-[rgb(var(--color-accent-btn-active))]',
  secondary: 'bg-[rgb(var(--color-bg-card))] text-[rgb(var(--color-text-main))] border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-bg-elevated))] focus:ring-[rgb(var(--color-accent-btn))] active:bg-[rgb(var(--color-bg-elevated))]',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
  ghost: 'bg-transparent text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg-elevated))] hover:text-[rgb(var(--color-text-main))] focus:ring-[rgb(var(--color-accent-btn))]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

// =============================================================================
// COMPONENT
// =============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// =============================================================================
// LINK BUTTON (for navigation that looks like a button)
// =============================================================================

interface LinkButtonProps extends ButtonProps {
  href?: string;
}

export function LinkButton({ href, children, ...props }: LinkButtonProps) {
  if (href) {
    return (
      <a href={href} className="inline-block">
        <Button {...props}>{children}</Button>
      </a>
    );
  }
  return <Button {...props}>{children}</Button>;
}
