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
  id: string;        // auth.users UUID
  dbId: string;      // users table UUID (used for all DB foreign keys)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  idImageUri: string | null;
  isVerified: boolean;
  isPremium: boolean;
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
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [pending, setPending] = useState<PendingUser | null>(null);

  const pendingEmail = pending?.email ?? '';

  // ── Session detection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (data && !error) {
        setUser({
          id: authUser.id,
          dbId: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone ?? '',
          address: data.address ?? '',
          idImageUri: null,
          isVerified: data.is_verified ?? true,
          isPremium: data.is_premium ?? false,
        });
        setIsLoading(false);
        return;
      }
    } catch {
      // profile not found — new user
    }

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
          emailRedirectTo:
            typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
    }
  }

  async function verifyCode(code: string): Promise<boolean> {
    if (!pending) return false;

    if (isSupabaseConfigured()) {
      // When "Confirm email" is disabled in Supabase Dashboard, signInWithOtp
      // creates a session immediately — no OTP token needed.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return true;

      // Fallback: verify OTP token when email confirmation is enabled
      const { error } = await supabase.auth.verifyOtp({
        email: pending.email,
        token: code,
        type: 'email',
      });
      return !error;
    }

    // Demo mode: accept any 6-digit code
    return code.length === 6;
  }

  function setIdImage(uri: string) {
    setPending(prev => prev ? { ...prev, idImageUri: uri } : prev);
  }

  async function completeProfile(address: string) {
    if (!pending) return;

    if (isSupabaseConfigured()) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from('users').upsert({
          auth_id: authUser.id,
          first_name: pending.firstName,
          last_name: pending.lastName,
          email: pending.email,
          phone: pending.phone,
          address,
          is_verified: true,
          is_premium: false,
        });

        // Read back the generated UUID
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          dbId: profile?.id ?? authUser.id,
          firstName: pending.firstName,
          lastName: pending.lastName,
          email: pending.email,
          phone: pending.phone,
          address,
          idImageUri: pending.idImageUri,
          isVerified: true,
          isPremium: false,
        });
        setPending(null);
        return;
      }
    }

    // Local demo fallback
    setUser({
      id: `user-${Date.now()}`,
      dbId: `user-${Date.now()}`,
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      phone: pending.phone,
      address,
      idImageUri: pending.idImageUri,
      isVerified: true,
      isPremium: false,
    });
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
