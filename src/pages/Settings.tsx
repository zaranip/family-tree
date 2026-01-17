import { useState, useEffect } from 'react';
import { PageLayout, PageContainer, PageHeader } from '../components/layout';
import { ThemeSelector, Input, Select, Button, useToast } from '../components/common';
import { useTheme } from '../features/theme/ThemeContext';
import { useAuth } from '../features/auth/AuthContext';
import { usePeople } from '../hooks';
import { userProfilesApi } from '../lib/supabase';

export function Settings() {
  const { theme } = useTheme();
  const { profile, user, refreshProfile } = useAuth();
  const { data: people } = usePeople();
  const { success, error: showError } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form values from profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSelectedPersonId(profile.person_id || '');
    }
  }, [profile]);

  // Create options for the person dropdown
  const personOptions = people?.map((person) => ({
    value: person.id,
    label: `${person.first_name} ${person.last_name}`,
  })) || [];

  // Add "None" option at the beginning
  const allPersonOptions = [
    { value: '', label: 'Not linked to anyone' },
    ...personOptions,
  ];

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await userProfilesApi.update(user.id, {
        display_name: displayName || null,
        person_id: selectedPersonId || null,
      });
      await refreshProfile();
      success('Settings saved', 'Your profile has been updated.');
    } catch (err) {
      showError('Failed to save', 'Could not update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasChanges = 
    (displayName !== (profile?.display_name || '')) ||
    (selectedPersonId !== (profile?.person_id || ''));

  return (
    <PageLayout>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Settings"
          subtitle="Manage your preferences"
        />

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
              Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[rgb(var(--color-text-muted))] mb-4">
                  Your email: <span className="font-medium">{profile?.email || user?.email}</span>
                </p>
              </div>

              <Input
                label="Display Name"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                hint="This name will be shown instead of your email"
              />

              <Select
                label="Link to Family Member"
                options={allPersonOptions}
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                hint="Link your account to a person in the family tree"
              />

              <div className="pt-2">
                <Button
                  onClick={handleSaveProfile}
                  isLoading={isSaving}
                  disabled={!hasChanges || isSaving}
                >
                  Save Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
              Appearance
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--color-text-main))] mb-2">
                  Theme
                </label>
                <p className="text-sm text-[rgb(var(--color-text-muted))] mb-3">
                  Choose how the app looks to you. Current: <span className="font-medium capitalize">{theme}</span>
                </p>
                <ThemeSelector />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text-main))] mb-4">
              About
            </h2>
            
            <div className="space-y-2 text-sm text-[rgb(var(--color-text-muted))]">
              <p>Family Tree App</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
