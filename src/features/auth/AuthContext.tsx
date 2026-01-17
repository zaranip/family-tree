import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { UserProfile } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAdmin: false,
  });

  // Fetch or create user profile from database
  const fetchOrCreateProfile = async (userId: string, email: string): Promise<UserProfile | null> => {
    try {
      // First try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // If profile doesn't exist (PGRST116 = not found), create it
      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: email,
            role: 'member',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return null;
        }

        return newProfile;
      }

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return null;
      }

      return null;
    } catch (err) {
      console.error('Error in fetchOrCreateProfile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let profile: UserProfile | null = null;
      
      if (session?.user) {
        profile = await fetchOrCreateProfile(session.user.id, session.user.email || '');
      }

      setState({
        user: session?.user ?? null,
        profile,
        session,
        isLoading: false,
        isAdmin: profile?.role === 'admin',
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let profile: UserProfile | null = null;
        
        if (session?.user) {
          profile = await fetchOrCreateProfile(session.user.id, session.user.email || '');
        }

        setState({
          user: session?.user ?? null,
          profile,
          session,
          isLoading: false,
          isAdmin: profile?.role === 'admin',
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign up
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAdmin: false,
    });
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  // Update password
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (state.user) {
      const profile = await fetchOrCreateProfile(state.user.id, state.user.email || '');
      setState(prev => ({
        ...prev,
        profile,
        isAdmin: profile?.role === 'admin',
      }));
    }
  };

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
