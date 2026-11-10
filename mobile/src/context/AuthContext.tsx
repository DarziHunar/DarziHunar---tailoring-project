import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as SecureStore from 'expo-secure-store';
import { ApiError } from '../services/api';
import { authService, SignupPayload } from '../services/authService';
import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'darzihunar.accessToken';
const USER_KEY = 'darzihunar.user';

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignupPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearStoredSession = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  }, []);

  const saveSession = useCallback(
    async (token: string, nextUser: AuthUser) => {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser)),
      ]);

      setAccessToken(token);
      setUser(nextUser);
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);

        if (!storedToken || !storedUser) {
          await clearStoredSession();
          return;
        }

        const cachedUser = JSON.parse(storedUser) as AuthUser;

        if (!cachedUser?.id || !cachedUser?.email || !cachedUser?.role) {
          await clearStoredSession();
          return;
        }

        try {
          const currentUser = await authService.getCurrentUser(
            cachedUser.id,
            storedToken,
          );

          if (active) {
            await saveSession(storedToken, currentUser);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await clearStoredSession();
          } else if (active) {
            await saveSession(storedToken, cachedUser);
          }
        }
      } catch {
        await clearStoredSession();
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, [clearStoredSession, saveSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login(
        email.trim().toLowerCase(),
        password,
      );

      if (!result?.accessToken || !result?.user) {
        throw new Error('Login response did not include token and user.');
      }

      await saveSession(result.accessToken, result.user);
    },
    [saveSession],
  );

  const signUp = useCallback(
    async (payload: SignupPayload) => {
      const result = await authService.signup({
        ...payload,
        email: payload.email.trim().toLowerCase(),
      });

      if (!result?.accessToken || !result?.user) {
        throw new Error('Signup response did not include token and user.');
      }

      await saveSession(result.accessToken, result.user);
    },
    [saveSession],
  );

  const signOut = useCallback(async () => {
    await clearStoredSession();
    setAccessToken(null);
    setUser(null);
  }, [clearStoredSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [user, accessToken, isLoading, signIn, signUp, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}