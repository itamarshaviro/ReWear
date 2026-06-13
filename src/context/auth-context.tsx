import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  idImageUri: string | null;
  isVerified: boolean;
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
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Intermediate state while user is going through registration steps
type PendingUser = RegisterPayload & { idImageUri: string | null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading] = useState(false);
  const [pending, setPending] = useState<PendingUser | null>(null);

  const pendingEmail = pending?.email ?? '';

  async function register(data: RegisterPayload) {
    setPending({ ...data, idImageUri: null });

    if (isSupabaseConfigured()) {
      // Send OTP to email via Supabase Auth
      await supabase.auth.signInWithOtp({
        email: data.email,
        options: { shouldCreateUser: true },
      });
    }
    // Demo mode: OTP is handled locally (any 6-digit code works)
  }

  async function verifyCode(code: string): Promise<boolean> {
    if (!pending) return false;

    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.verifyOtp({
        email: pending.email,
        token: code,
        type: 'email',
      });
      if (error) return false;
    } else {
      // Demo mode: accept any 6-digit code or the shortcut "123456"
      if (code.length !== 6) return false;
    }

    return true;
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
