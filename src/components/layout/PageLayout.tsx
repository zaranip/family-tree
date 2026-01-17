import type { ReactNode } from 'react';
import { ThemeSelector } from '../common/ThemeSelector';
import { Header } from './Header';

// =============================================================================
// MAIN LAYOUT (with header)
// =============================================================================

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg-page))] flex flex-col">
      <Header />
      <main className="flex-1 text-[rgb(var(--color-text-main))]">
        {children}
      </main>
    </div>
  );
}

// =============================================================================
// PAGE CONTAINER (content wrapper)
// =============================================================================

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function PageContainer({ children, maxWidth = 'xl', className = '' }: PageContainerProps) {
  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// PAGE HEADER
// =============================================================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: Array<{ label: string; to?: string }>;
}

export function PageHeader({ title, subtitle, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-muted))]">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.to ? (
                  <a href={crumb.to} className="hover:text-[rgb(var(--color-text-main))] hover:underline">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[rgb(var(--color-text-main))] font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-main))]">{title}</h1>
          {subtitle && <p className="mt-2 text-lg text-[rgb(var(--color-text-muted))]">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

// =============================================================================
// AUTH LAYOUT (for login/register pages)
// =============================================================================

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgb(var(--color-auth-start)),rgb(var(--color-auth-end)))] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-[rgb(var(--color-text-main))]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-base text-[rgb(var(--color-text-muted))]">
            {subtitle}
          </p>
        )}
        <div className="mt-4 flex justify-center">
          <ThemeSelector />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[rgb(var(--color-bg-card))] py-8 px-6 shadow-lg rounded-xl sm:px-10 border border-[rgb(var(--color-border))]">
          {children}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FULL PAGE LAYOUT (no header, for tree view)
// =============================================================================

interface FullPageLayoutProps {
  children: ReactNode;
}

export function FullPageLayout({ children }: FullPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg-page))]">
      {children}
    </div>
  );
}
