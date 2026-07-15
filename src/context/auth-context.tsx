import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { registerForPushNotifications } from '@/lib/notifications';
import type { User } from '@supabase/supabase-js';

const REMEMBER_KEY = 'rewear_no_remember';
const ALIVE_KEY    = 'rewear_session_alive';

function webStorage() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return { local: window.localStorage, session: window.sessionStorage };
}

export type BuyerPreferences = {
  brands: string[];
  topSizes: string[];
  bottomSizes: string[];
  shoeSizes: string[];
  minPrice: number;
  maxPrice: number;
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
  profilePhoto?: string;
  gender?: 'male' | 'female';
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
  profilePhoto?: string;
  gender?: 'male' | 'female';
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  pendingEmail: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<string | null>;
  signUp: (payload: SignUpPayload) => Promise<'ok' | 'needs-verify' | string>;
  verifyOtp: (code: string) => Promise<string | null>;
  resendOtp: () => Promise<string | null>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<string | null>;
  logout: () => void;
  updatePreferences: (prefs: BuyerPreferences) => void;
  updateProfilePhoto: (url: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const suppressAuth = useRef(false);

  // ── Session detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // "Remember me" check: if user opted out and browser was closed, sign out
    let skipSession = false;
    const storage = webStorage();
    if (storage) {
      try {
        const alive      = storage.session.getItem(ALIVE_KEY);
        const noRemember = storage.local.getItem(REMEMBER_KEY);
        if (!alive && noRemember) {
          storage.local.removeItem(REMEMBER_KEY);
          supabase.auth.signOut(); // fires SIGNED_OUT → onAuthStateChange handles the rest
          skipSession = true;
          setIsLoading(false);
        }
      } catch { /* storage blocked */ }
    }

    if (!skipSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleAuthUser(session.user);
        } else {
          setIsLoading(false);
        }
      });
    }

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
    if (suppressAuth.current) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (data) {
        const row = data as typeof data & { preferences?: BuyerPreferences; profile_photo?: string };
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
          preferences: row.preferences ?? undefined,
          profilePhoto: row.profile_photo ?? undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gender: ((data as any).gender === 'male' || (data as any).gender === 'female') ? (data as any).gender as 'male' | 'female' : undefined,
        });
        registerForPushNotifications(data.id);
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
  async function signIn(email: string, password: string, rememberMe = true): Promise<string | null> {
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

    // Track "remember me" choice via sessionStorage (clears on browser close)
    try {
      const storage = webStorage();
      if (storage) {
        storage.session.setItem(ALIVE_KEY, '1');
        if (!rememberMe) {
          storage.local.setItem(REMEMBER_KEY, '1');
        } else {
          storage.local.removeItem(REMEMBER_KEY);
        }
      }
    } catch { /* storage blocked */ }

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

    // Block onAuthStateChange from navigating during signup
    suppressAuth.current = true;
    try {
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

      const { error: upsertError } = await (supabase.from('users') as any)
        .upsert({
          auth_id: authUser.id,
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          address: address || null,
          is_verified: true,
          is_premium: false,
          ...(payload.profilePhoto ? { profile_photo: payload.profilePhoto } : {}),
          ...(payload.gender ? { gender: payload.gender } : {}),
        });

      if (upsertError) {
        await supabase.auth.signOut();
        return 'שגיאה בשמירת הפרטים: ' + upsertError.message;
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: payload.email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      if (otpError) return 'ok';

      setPendingEmail(payload.email.trim().toLowerCase());
      return 'needs-verify';
    } finally {
      suppressAuth.current = false;
    }
  }

  // ── OTP verification ─────────────────────────────────────────────────────
  async function verifyOtp(code: string): Promise<string | null> {
    if (!pendingEmail) return 'שגיאה: לא נמצא מייל ממתין';
    suppressAuth.current = true;
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type: 'email',
      });
      if (error) return 'קוד שגוי או פג תוקף';
      // Sign out immediately — user must log in manually after verification
      await supabase.auth.signOut();
      setPendingEmail(null);
      return null;
    } finally {
      suppressAuth.current = false;
    }
  }

  async function resendOtp(): Promise<string | null> {
    if (!pendingEmail) return 'שגיאה: לא נמצא מייל ממתין';
    const { error } = await supabase.auth.signInWithOtp({
      email: pendingEmail,
      options: { shouldCreateUser: false },
    });
    if (error) return error.message;
    return null;
  }

  // ── Password reset ───────────────────────────────────────────────────────
  async function sendPasswordReset(email: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    if (error) return 'לא נמצא חשבון עם מייל זה';
    setPendingEmail(email.trim().toLowerCase());
    return null;
  }

  async function confirmPasswordReset(code: string, newPassword: string): Promise<string | null> {
    if (!pendingEmail) return 'שגיאה: לא נמצא מייל ממתין';
    suppressAuth.current = true;
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type: 'email',
      });
      if (error) return 'קוד שגוי או פג תוקף';
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return updateError.message;
      await supabase.auth.signOut();
      setPendingEmail(null);
      return null;
    } finally {
      suppressAuth.current = false;
    }
  }

  // ── Other ────────────────────────────────────────────────────────────────
  function logout() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // On web: sign out then hard-navigate — avoids React re-render flicker
      if (isSupabaseConfigured()) {
        supabase.auth.signOut().then(() => window.location.assign('/auth'));
      } else {
        window.location.assign('/auth');
      }
      return;
    }
    setUser(null);
    if (isSupabaseConfigured()) supabase.auth.signOut();
  }

  function updatePreferences(prefs: BuyerPreferences) {
    setUser(prev => prev ? { ...prev, preferences: prefs } : prev);
    if (isSupabaseConfigured() && user?.dbId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('users') as any).update({ preferences: prefs }).eq('id', user.dbId);
    }
  }

  async function updateProfilePhoto(url: string) {
    setUser(prev => prev ? { ...prev, profilePhoto: url } : prev);
    if (isSupabaseConfigured() && user?.dbId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('users') as any).update({ profile_photo: url }).eq('id', user.dbId);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, pendingEmail, signIn, signUp, verifyOtp, resendOtp, sendPasswordReset, confirmPasswordReset, logout, updatePreferences, updateProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
