// CashMine · shared/auth — synchronous in-memory bearer-token holder.
//
// The HTTP client reads the token on every request (must be sync, no awaits in
// the request path), while React reads it reactively via useSyncExternalStore.
// Persistence lives in ./token-storage; orchestration in ./session.

type Listener = (token: string | null) => void;

let currentToken: string | null = null;
const listeners = new Set<Listener>();

export function getAuthToken(): string | null {
    return currentToken;
}

export function setAuthToken(token: string | null): void {
    if (token === currentToken) return;
    currentToken = token;
    for (const listener of listeners) listener(currentToken);
}

export function subscribeAuthToken(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
