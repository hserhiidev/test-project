// CashMine · shared/auth — AuthProvider (token state + hydration) and AuthGate
// (overlays the token-entry screen when unauthenticated, keeping the navigator
// mounted for Expo Router).

import * as SplashScreen from 'expo-splash-screen';
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from 'react';

import { getAuthToken, subscribeAuthToken } from './auth-token';
import { hydrateToken, persistToken, signOut } from './session';
import { TokenEntryScreen } from './token-entry-screen';

interface AuthContextValue {
    token: string | null;
    isHydrating: boolean;
    saveToken: (token: string) => Promise<void>;
    clearToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const token = useSyncExternalStore(
        subscribeAuthToken,
        getAuthToken,
        getAuthToken,
    );
    const [isHydrating, setHydrating] = useState(true);

    useEffect(() => {
        let active = true;
        hydrateToken().finally(() => {
            if (active) setHydrating(false);
            void SplashScreen.hideAsync().catch(() => {});
        });
        return () => {
            active = false;
        };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            isHydrating,
            saveToken: persistToken,
            clearToken: signOut,
        }),
        [token, isHydrating],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Renders children (the app navigator) at all times and overlays the token
 * entry screen while there is no token. Shows nothing extra during hydration —
 * the splash screen is still visible then.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
    const { token, isHydrating, saveToken } = useAuth();
    return (
        <>
            {children}
            {!isHydrating && !token ? (
                <TokenEntryScreen onSubmit={saveToken} />
            ) : null}
        </>
    );
}
