// ———   frontend/src/hooks/useAuth.ts — Centralized auth state ———
// useAuth is the single source of truth for authentication state in the app.
// Every component that needs to know 'is the user logged in?' imports this hook.
// Centralizing auth logic here prevents duplicated Amplify calls scattered across components.

import { useState, useEffect, useCallback } from "react";
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";

export interface AuthUser {
  userId: string; // Cognito sub UUID
  email: string;
  isAdmin: boolean; // true if user is in the 'admin' Cognito group
  idToken: string; // JWT ID token — sent as Authorization header in API calls
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // loadUser: fetches the current Cognito session and extracts user data.
  // Called on mount (to restore session) and after sign-in.
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      // getCurrentUser() checks if there is an active Cognito session.
      // Throws NotAuthorizedException if no session exists.
      await getCurrentUser();

      // fetchAuthSession() retrieves the current JWT tokens.
      // forceRefresh: false — use cached tokens if they are not expired.
      const session = await fetchAuthSession({ forceRefresh: false });
      const idToken = session.tokens?.idToken;

      if (!idToken) {
        setUser(null);
        return;
      }

      // Decode the JWT payload to extract user claims.
      // The payload is base64url-encoded JSON between the first and second dots.
      const payload = idToken.payload;

      // 'cognito:groups' contains the list of Cognito groups the user belongs to.
      const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
      const isAdmin = groups.includes("admin");

      setUser({
        userId: payload["sub"] as string,
        email: payload["email"] as string,
        isAdmin,
        // toString() on the Amplify JWT object returns the raw token string.
        idToken: idToken.toString(),
      });
    } catch {
      // No active session — user is logged out. This is a normal state, not an error.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, attempt to restore an existing session.
  // If the user previously logged in and the refresh token is still valid,
  // Amplify will silently restore the session without prompting for credentials.
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthUser | null> => {
    // Clear any previous auth errors before attempting sign-in.
    setError(null);
    try {
      // signIn() exchanges email + password with Cognito.
      // If credentials are wrong, Cognito throws NotAuthorizedException here.
      await signIn({ username: email, password });

      // loadUser() fetches the fresh session and calls setUser() internally.
      // This updates the user state in the hook for all future renders.
      await loadUser();

      // BUT — setUser() is asynchronous (React state), so the user variable
      // in this closure is still null at this point. We can't return user here.
      // Instead, we rebuild the user object directly from the fresh session
      // so we can return it immediately to the caller (LoginPage).
      const session = await fetchAuthSession({ forceRefresh: false });
      const idToken = session.tokens?.idToken;

      // If for some reason the session has no token after sign-in, return null.
      // LoginPage will fall back to /dashboard in this case.
      if (!idToken) return null;

      const payload = idToken.payload;
      const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];

      // Build and return the user object so LoginPage can use it immediately
      // for routing — without waiting for a React re-render to see updated state.
      const freshUser: AuthUser = {
        userId: payload["sub"] as string,
        email: payload["email"] as string,
        isAdmin: groups.includes("admin"),
        idToken: idToken.toString(),
      };

      return freshUser;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign in failed";
      setError(message);
      // Re-throw so LoginPage's try/catch can catch it and call setError("root").
      throw e;
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const register = async (email: string, password: string) => {
    await signUp({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
  };

  const confirmEmail = async (email: string, code: string) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  };

  return { user, loading, error, login, logout, register, confirmEmail };
}
