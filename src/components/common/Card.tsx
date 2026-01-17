import type { ReactNode } from 'react';

// =============================================================================
// BASIC CARD
// =============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`bg-[rgb(var(--color-bg-card))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// CARD WITH HEADER
// =============================================================================

interface CardWithHeaderProps extends CardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardWithHeader({ title, subtitle, action, children, className = '' }: CardWithHeaderProps) {
  return (
    <div className={`bg-[rgb(var(--color-bg-card))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] ${className}`}>
      <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--color-text-main))]">{title}</h3>
          {subtitle && <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[rgb(var(--color-text-muted))]">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[rgb(var(--color-text-main))]">{value}</p>
          {trend && (
            <p className={`mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// EMPTY STATE CARD
// =============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <Card className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-[rgb(var(--color-bg-elevated))] rounded-full text-[rgb(var(--color-text-muted))] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[rgb(var(--color-text-main))]">{title}</h3>
      {description && (
        <p className="mt-2 text-[rgb(var(--color-text-muted))] max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}
