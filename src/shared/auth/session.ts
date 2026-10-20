// CashMine · shared/auth — session orchestration bridging persistent storage
// (./token-storage) and the in-memory holder (./auth-token). Framework-free so
// non-React code (e.g. the React Query error handler) can call signOut().

import { setAuthToken } from './auth-token';
import { clearToken, getToken, setToken } from './token-storage';

/** Load a previously saved token into memory on app start. */
export async function hydrateToken(): Promise<void> {
    try {
        setAuthToken(await getToken());
    } catch {
        setAuthToken(null);
    }
}

/** Save a token to persistent storage and memory. */
export async function persistToken(token: string): Promise<void> {
    const trimmed = token.trim();
    await setToken(trimmed);
    setAuthToken(trimmed);
}

/** Clear the token everywhere (used on logout and on 401 UNAUTHORIZED). */
export async function signOut(): Promise<void> {
    try {
        await clearToken();
    } finally {
        setAuthToken(null);
    }
}
