import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Users, Activity, Shield, RotateCcw, 
  ChevronDown, ChevronUp 
} from 'lucide-react';
import { PageLayout, PageContainer, PageHeader } from '../components/layout';
import { 
  Button, Card, StatCard, LoadingCard, 
  ConfirmModal, useToast, Avatar 
} from '../components/common';
import { usePeople, useRelationships, useSoftDeleteRelationship, useRestoreRelationship } from '../hooks';
import { useAuth } from '../features/auth/AuthContext';
import { supabase, userProfilesApi, auditLogApi } from '../lib/supabase';
import { RELATIONSHIP_LABELS } from '../types';
import type { UserProfile, AuditLogEntry, Relationship, Person } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// =============================================================================
// ADMIN DASHBOARD
// =============================================================================

export function Admin() {
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { data: people = [], isLoading: loadingPeople } = usePeople();
  const { data: relationships = [], isLoading: loadingRelationships } = useRelationships();
  
  // Fetch all relationships including deleted
  const { data: allRelationships = [] } = useQuery({
    queryKey: ['relationships', 'all-including-deleted'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationships')
        .select(`
          *,
          person1:people!relationships_person1_id_fkey(id, first_name, last_name),
          person2:people!relationships_person2_id_fkey(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch user profiles
  const { data: userProfiles = [] } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: () => userProfilesApi.getAll(),
    enabled: isAdmin,
  });

  // Fetch audit log
  const { data: auditLog = [] } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => auditLogApi.getAll(50),
    enabled: isAdmin,
  });

  const softDeleteRelationship = useSoftDeleteRelationship();
  const restoreRelationship = useRestoreRelationship();

  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('stats');

  // Toggle user role
  const toggleRole = useMutation({
    mutationFn: async ({ userId, currentRole }: { userId: string; currentRole: string }) => {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      await userProfilesApi.setRole(userId, newRole);
      return newRole;
    },
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      success('Role updated', `User role changed to ${newRole}`);
    },
    onError: () => {
      showError('Failed to update role', 'Please try again');
    },
  });

  const deletedRelationships = allRelationships.filter((r: Relationship) => r.is_deleted);
  const livingCount = people.filter((p) => p.is_living).length;

  const handleDeleteRelationship = async () => {
    if (!selectedRelationship) return;
    try {
      await softDeleteRelationship.mutateAsync(selectedRelationship);
      success('Relationship deleted', 'The relationship has been removed.');
    } catch (err) {
      showError('Failed to delete', 'Please try again.');
    }
    setShowDeleteModal(false);
    setSelectedRelationship(null);
  };

  const handleRestoreRelationship = async (id: string) => {
    try {
      await restoreRelationship.mutateAsync(id);
      success('Relationship restored', 'The relationship has been restored.');
    } catch (err) {
      showError('Failed to restore', 'Please try again.');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!isAdmin) {
    return (
      <PageLayout>
        <PageContainer>
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Admin Access Required</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
          </div>
        </PageContainer>
      </PageLayout>
    );
  }

  if (loadingPeople || loadingRelationships) {
    return (
      <PageLayout>
        <PageContainer>
          <LoadingCard message="Loading admin dashboard..." />
        </PageContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContainer>
        <PageHeader
          title="Admin Dashboard"
          subtitle="Manage users, relationships, and view activity"
        />

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <StatCard
            title="Total People"
            value={people.length}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Living"
            value={livingCount}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Relationships"
            value={relationships.length}
            icon={<Activity className="w-6 h-6" />}
          />
          <StatCard
            title="Users"
            value={userProfiles.length}
            icon={<Shield className="w-6 h-6" />}
          />
        </div>

        {/* User Management */}
        <Card className="mb-6">
          <button
            onClick={() => toggleSection('users')}
            className="w-full flex items-center justify-between p-2"
          >
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            {expandedSection === 'users' ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {expandedSection === 'users' && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userProfiles.map((user: UserProfile) => (
                      <tr key={user.id}>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.email} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900">{user.display_name || 'No name'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                            ${user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-500">
                          {format(parseISO(user.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRole.mutate({ 
                              userId: user.id, 
                              currentRole: user.role 
                            })}
                            disabled={toggleRole.isPending}
                          >
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {/* Deleted Relationships */}
        <Card className="mb-6">
          <button
            onClick={() => toggleSection('deleted')}
            className="w-full flex items-center justify-between p-2"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Deleted Relationships ({deletedRelationships.length})
            </h3>
            {expandedSection === 'deleted' ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {expandedSection === 'deleted' && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              {deletedRelationships.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No deleted relationships</p>
              ) : (
                <div className="space-y-3">
                  {deletedRelationships.map((rel: Relationship & { person1: Person; person2: Person }) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {rel.person1?.first_name} {rel.person1?.last_name}
                          {' '}
                          <span className="text-gray-500">→</span>
                          {' '}
                          {rel.person2?.first_name} {rel.person2?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {RELATIONSHIP_LABELS[rel.relationship_type]}
                          {' • '}
                          Deleted {rel.deleted_at && format(parseISO(rel.deleted_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRestoreRelationship(rel.id)}
                        leftIcon={<RotateCcw className="w-4 h-4" />}
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Activity Log */}
        <Card>
          <button
            onClick={() => toggleSection('activity')}
            className="w-full flex items-center justify-between p-2"
          >
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            {expandedSection === 'activity' ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {expandedSection === 'activity' && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              {auditLog.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {auditLog.map((entry: AuditLogEntry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="p-2 bg-white rounded-full">
                        <Activity className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {entry.description || entry.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(entry.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedRelationship(null);
          }}
          onConfirm={handleDeleteRelationship}
          title="Delete Relationship"
          message="Are you sure you want to delete this relationship? You can restore it later from the admin dashboard."
          confirmText="Delete"
          variant="danger"
          isLoading={softDeleteRelationship.isPending}
        />
      </PageContainer>
    </PageLayout>
  );
}
