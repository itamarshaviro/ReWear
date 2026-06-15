import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export type BuyerPreferences = {
  brands: string[];
  topSize: string;
  bottomSize: string;
  shoeSize: string;
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  idImageUri: string | null;
  isVerified: boolean;
  preferences?: BuyerPreferences;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  pendingEmail: string;
  register: (data: RegisterPayload) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  setIdImage: (uri: string) => void;
  completeProfile: (address: string) => void;
  updatePreferences: (prefs: BuyerPreferences) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

type PendingUser = RegisterPayload & { idImageUri: string | null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Start in loading state only when Supabase is configured, so we can
  // check for an existing session before rendering the redirect in index.tsx
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [pending, setPending] = useState<PendingUser | null>(null);

  const pendingEmail = pending?.email ?? '';

  // ── Session detection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Restore session on mount — handles magic link redirect and page refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUser(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleAuthUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAuthUser(authUser: User) {
    try {
      // Try to load an existing profile from the users table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('users') as any)
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (data && !error) {
        // Returning user — restore their profile and let index.tsx show home
        setUser({
          id: data.auth_id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone ?? '',
          address: data.address ?? '',
          idImageUri: null,
          isVerified: data.is_verified ?? true,
        });
        return;
      }
    } catch {
      // profile not found — fall through
    }

    // New user: auth is done (magic link clicked) but profile not yet complete.
    // If we have their registration data in memory, skip the verify screen.
    if (pending) {
      router.replace('/auth/id-upload');
    }

    setIsLoading(false);
  }

  // ── Registration flow ─────────────────────────────────────────────────────

  async function register(data: RegisterPayload) {
    setPending({ ...data, idImageUri: null });

    if (isSupabaseConfigured()) {
      await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
          // On web, redirect back to the app root so the onAuthStateChange
          // listener picks up the session automatically
          emailRedirectTo:
            typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
    }
  }

  async function verifyCode(code: string): Promise<boolean> {
    if (!pending) return false;
    // Always accept any 6-digit code — this is demo mode.
    // Real authentication (magic link) happens separately via onAuthStateChange.
    return code.length === 6;
  }

  function setIdImage(uri: string) {
    setPending(prev => prev ? { ...prev, idImageUri: uri } : prev);
  }

  async function completeProfile(address: string) {
    if (!pending) return;

    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      phone: pending.phone,
      address,
      idImageUri: pending.idImageUri,
      isVerified: true,
    };

    if (isSupabaseConfigured()) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('users') as any).upsert({
          auth_id: authUser.id,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          address,
          is_verified: true,
        });
      }
    }

    setUser(newUser);
    setPending(null);
  }

  function updatePreferences(prefs: BuyerPreferences) {
    setUser(prev => prev ? { ...prev, preferences: prefs } : prev);
  }

  function logout() {
    setUser(null);
    setPending(null);
    if (isSupabaseConfigured()) supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      pendingEmail,
      register,
      verifyCode,
      setIdImage,
      completeProfile,
      updatePreferences,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
