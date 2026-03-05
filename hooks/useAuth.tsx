'use client';

import {
  useState, useEffect, useCallback,
  createContext, useContext, ReactNode,
} from 'react';
import type { Profile } from '@/lib/types';
import { AuthService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isLoggedIn: boolean;
  isVerified: boolean;
  isProfileComplete: boolean;
  role: 'guest' | 'member' | 'professional' | 'admin';
}

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getCurrentRole: () => AuthState['role'];
}

type AuthContextValue = AuthState & AuthActions;

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isLoggedIn: false,
    isVerified: false,
    isProfileComplete: false,
    role: 'guest',
  });

  // Charger/recharger la session depuis Appwrite
  const refreshUser = useCallback(async (options: { redirect?: boolean } = {}) => {
    try {
      const { user, profile } = await AuthService.getMe();
      const newRole = (profile?.role as AuthState['role']) || 'guest';
      setState({
        user,
        profile,
        loading: false,
        isLoggedIn: true,
        isVerified: user.emailVerification,
        isProfileComplete: profile.profileCompleted,
        role: newRole
      });

      if (options.redirect) {
        if (newRole === 'admin') {
          router.replace('/admin/dashboard');
        } else if (newRole === 'professional') {
          router.replace('/pro/dashboard');
        } else if (newRole === 'member') {
          router.replace('/');
        }
      }
    } catch {
      setState({
        user: null,
        profile: null,
        loading: false,
        isLoggedIn: false,
        isVerified: false,
        isProfileComplete: false,
        role: 'guest',
      });
    }
  }, [router]);

  const getCurrentRole = useCallback((): AuthState['role'] => {
    return state.role;
  }, [state.role]);

  // Vérification initiale de session au montage
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    await AuthService.login(email, password);
    await refreshUser({ redirect: true });
  }, [refreshUser]);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await AuthService.register(payload)
    }, [refreshUser])

  const logout = useCallback(async () => {
    await AuthService.logout(state.user?.$id);
    setState({
      user: null,
      profile: null,
      loading: false,
      isLoggedIn: false,
      isVerified: false,
      isProfileComplete: false,
      role: 'guest',
    });
    router.replace('/');
  }, [state.user, router]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, register, getCurrentRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
}