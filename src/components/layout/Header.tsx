import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, TreeDeciduous, User, LogOut, Settings, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { ThemeSelector } from '../common/ThemeSelector';
import { Avatar } from '../common/Avatar';

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const navLinks = [
    { to: '/', label: 'Family Tree' },
    { to: '/people', label: 'People' },
    { to: '/search', label: 'Search' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin', icon: Shield },
  ];

  return (
    <header className="bg-[rgb(var(--color-bg-card))] border-b border-[rgb(var(--color-border))] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <TreeDeciduous className="w-8 h-8" />
            <span className="text-xl font-bold hidden sm:block">Family Tree</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-main))] hover:bg-[rgb(var(--color-bg-elevated))] transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && adminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-main))] hover:bg-[rgb(var(--color-bg-elevated))] transition-colors font-medium flex items-center gap-2"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <ThemeSelector />
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-[rgb(var(--color-bg-elevated))] transition-colors"
                >
                  <Avatar
                    name={profile?.display_name || user.email || 'User'}
                    size="sm"
                  />
                  <span className="hidden sm:block text-sm font-medium text-[rgb(var(--color-text-main))]">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-[rgb(var(--color-bg-card))] rounded-lg shadow-lg border border-[rgb(var(--color-border))] py-1 z-20">
                      <div className="px-4 py-2 border-b border-[rgb(var(--color-border))]">
                        <p className="text-sm font-medium text-[rgb(var(--color-text-main))]">
                          {profile?.display_name || 'User'}
                        </p>
                        <p className="text-sm text-[rgb(var(--color-text-muted))] truncate">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[rgb(var(--color-text-main))] hover:bg-[rgb(var(--color-bg-elevated))]"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[rgb(var(--color-text-main))] hover:bg-[rgb(var(--color-bg-elevated))]"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <hr className="my-1 border-[rgb(var(--color-border))]" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-[rgb(var(--color-bg-elevated))]"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="btn-primary text-sm px-4 py-2"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg-elevated))]"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[rgb(var(--color-border))]">
            <div className="space-y-4">
              <div className="px-4">
                <ThemeSelector />
              </div>
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block px-4 py-3 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-main))] hover:bg-[rgb(var(--color-bg-elevated))] transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAdmin && adminLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-main))] hover:bg-[rgb(var(--color-bg-elevated))] transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
