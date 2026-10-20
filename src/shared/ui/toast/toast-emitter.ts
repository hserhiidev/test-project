// CashMine · shared/ui/toast — framework-free toast event bus.
//
// Lets both React components (via useToast) and non-React code (the global
// React Query error handler) trigger toasts through the same imperative `toast`
// API. The ToastProvider subscribes and renders them.

export type ToastType = 'error' | 'success' | 'info';

export interface ToastInput {
    message: string;
    type?: ToastType;
    duration?: number;
}

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

type Listener = (toast: ToastItem) => void;

const DEFAULT_DURATION = 4000;
const DEDUPE_WINDOW_MS = 3000;

const listeners = new Set<Listener>();
let counter = 0;
let lastKey: string | null = null;
let lastAt = 0;

function nextId(): string {
    counter += 1;
    return `${Date.now()}-${counter}`;
}

export function subscribeToasts(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function emit({ message, type = 'info', duration }: ToastInput): void {
    // Collapse identical back-to-back toasts (e.g. a failing 15s balances
    // refetch) so they don't stack up.
    const key = `${type}:${message}`;
    const now = Date.now();
    if (key === lastKey && now - lastAt < DEDUPE_WINDOW_MS) return;
    lastKey = key;
    lastAt = now;

    const item: ToastItem = {
        id: nextId(),
        message,
        type,
        duration: duration ?? DEFAULT_DURATION,
    };
    for (const listener of listeners) listener(item);
}

export const toast = {
    show: (message: string, type: ToastType = 'info', duration?: number) =>
        emit({ message, type, duration }),
    error: (message: string, duration?: number) =>
        emit({ message, type: 'error', duration }),
    success: (message: string, duration?: number) =>
        emit({ message, type: 'success', duration }),
    info: (message: string, duration?: number) =>
        emit({ message, type: 'info', duration }),
};
