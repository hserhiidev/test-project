// CashMine · shared/auth — persistent token storage (native: iOS/Android).
// Web uses token-storage.web.ts (SecureStore is unsupported on web).

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cashmine.api.token';

export async function getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
}
