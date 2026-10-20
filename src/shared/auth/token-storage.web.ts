// CashMine · shared/auth — persistent token storage (web fallback).
// expo-secure-store is not supported on web, so fall back to localStorage.

const TOKEN_KEY = 'cashmine.api.token';

export async function getToken(): Promise<string | null> {
    try {
        return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    } catch {
        return null;
    }
}

export async function setToken(token: string): Promise<void> {
    try {
        globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } catch {
        // Storage unavailable (private mode etc.) — token stays in memory only.
    }
}

export async function clearToken(): Promise<void> {
    try {
        globalThis.localStorage?.removeItem(TOKEN_KEY);
    } catch {
        // No-op: nothing persisted to clear.
    }
}
