import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export type BuyerPreferences = {
  brands: string[];
  topSize: string;
  bottomSize: string;
  shoeSize: string;
};

export type AuthUser = {
  id: string;       // Supabase auth UUID
  dbId: string;     // users table UUID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number | null;
  address: string;
  isVerified: boolean;
  isPremium: boolean;
  preferences?: BuyerPreferences;
};

export type SignUpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  age?: number;
  street?: string;
  city?: string;
  zip?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (payload: SignUpPayload) => Promise<'ok' | 'needs-verify' | string>;
  logout: () => void;
  updatePreferences: (prefs: BuyerPreferences) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());

  // ── Session detection ────────────────────────────────────────────────────
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
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (data) {
        setUser({
          id: authUser.id,
          dbId: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone ?? '',
          age: data.age ?? null,
          address: data.address ?? '',
          isVerified: data.is_verified ?? true,
          isPremium: data.is_premium ?? false,
        });
      } else {
        // Profile row missing — still allow login with auth data
        const meta = authUser.user_metadata ?? {};
        setUser({
          id: authUser.id,
          dbId: '',
          firstName: (meta.first_name as string) ?? authUser.email?.split('@')[0] ?? 'משתמש',
          lastName: (meta.last_name as string) ?? '',
          email: authUser.email ?? '',
          phone: (meta.phone as string) ?? '',
          age: null,
          address: '',
          isVerified: true,
          isPremium: false,
        });
      }
    } catch {
      // network error — leave user null, isLoading will unblock
    }
    setIsLoading(false);
  }

  // ── Sign in ──────────────────────────────────────────────────────────────
  async function signIn(email: string, password: string): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      setUser({
        id: 'demo', dbId: 'demo',
        firstName: 'משתמש', lastName: 'דמו', email,
        phone: '', age: null, address: '',
        isVerified: true, isPremium: false,
      });
      return null;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) return 'מייל או סיסמא שגויים';
      if (error.message.includes('Email not confirmed')) return 'יש לאמת את האימייל תחילה';
      return error.message;
    }
    // Set loading so index.tsx shows spinner instead of redirecting back to /auth
    // before onAuthStateChange → handleAuthUser finishes setting the user
    setIsLoading(true);
    return null;
  }

  // ── Sign up ──────────────────────────────────────────────────────────────
  async function signUp(payload: SignUpPayload): Promise<'ok' | 'needs-verify' | string> {
    const address = [payload.street, payload.city, payload.zip].filter(Boolean).join(', ');

    if (!isSupabaseConfigured()) {
      setUser({
        id: `demo-${Date.now()}`, dbId: `demo-${Date.now()}`,
        firstName: payload.firstName, lastName: payload.lastName,
        email: payload.email, phone: payload.phone,
        age: payload.age ?? null, address,
        isVerified: true, isPremium: false,
      });
      return 'ok';
    }

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: payload.phone,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists'))
        return 'כתובת המייל כבר רשומה. נסה להתחבר במקום זאת.';
      return error.message;
    }

    const authUser = data.user;
    if (!authUser) return 'שגיאה ביצירת חשבון';

    // Save profile — age column omitted until the ALTER TABLE migration runs
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        auth_id: authUser.id,
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        address: address || null,
        is_verified: true,
        is_premium: false,
      });

    if (upsertError) {
      await supabase.auth.signOut();
      return 'שגיאה בשמירת הפרטים: ' + upsertError.message;
    }

    // If no session → email confirmation required (happens when "Confirm email" is ON)
    if (!data.session) return 'needs-verify';

    // Sign out immediately so the user must log in manually.
    // This also avoids a race condition where onAuthStateChange fires before
    // the upsert above completes and handleAuthUser finds no profile.
    await supabase.auth.signOut();
    return 'ok';
  }

  // ── Other ────────────────────────────────────────────────────────────────
  function logout() {
    setUser(null);
    if (isSupabaseConfigured()) supabase.auth.signOut();
  }

  function updatePreferences(prefs: BuyerPreferences) {
    setUser(prev => prev ? { ...prev, preferences: prefs } : prev);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
