import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { clearPushToken, registerPushToken } from '@/lib/notifications';

export type Profile = {
  id: string;
  handle: string | null;
  display_name: string | null;
  joined_year: number | null;
  bio: string | null;
  avatar_url: string | null;
  push_enabled: boolean;
  is_premium: boolean;
  premium_until: string | null;
  is_admin: boolean;
};

export function hasAccess(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true;
  if (!profile.is_premium) return false;
  if (!profile.premium_until) return true;
  return new Date(profile.premium_until) > new Date();
}

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, handle: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id);
        // Fire-and-forget push token registration; failures are non-fatal.
        registerPushToken(s.user.id).catch(() => {});
        Sentry.setUser({ id: s.user.id });
      } else {
        setProfile(null);
        Sentry.setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }

  async function signUp(email: string, password: string, handle: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { handle } },
    });
    if (error) return { error: error.message };
    return {};
  }

  async function signOut() {
    if (session?.user) {
      await clearPushToken(session.user.id).catch(() => {});
    }
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  return (
    <AuthCtx.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
