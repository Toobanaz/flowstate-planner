import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => boolean;
  signOut: () => Promise<void>;
}

const GUEST_MODE_KEY = "flowstate.guest.mode";

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isGuest: false,
  continueAsGuest: () => false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(readGuestMode);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          clearGuestMode();
          setIsGuest(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    clearGuestMode();
    setIsGuest(false);
    if (session) await supabase.auth.signOut();
  };

  const continueAsGuest = () => {
    try {
      localStorage.setItem(GUEST_MODE_KEY, "true");
      setIsGuest(true);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isGuest, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function readGuestMode(): boolean {
  try {
    return localStorage.getItem(GUEST_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

function clearGuestMode(): void {
  try {
    localStorage.removeItem(GUEST_MODE_KEY);
  } catch {
    // Nothing to clear when browser storage is unavailable.
  }
}
