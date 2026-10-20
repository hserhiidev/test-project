// CashMine · shared/api — typed fetch wrapper. Injects the bearer token, builds
// URLs, and normalizes every failure into an ApiError (see ./errors).

import { getAuthToken } from '@/shared/auth/auth-token';

import { API_BASE_URL } from './config';
import { networkError, toApiError } from './errors';

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiFetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    query?: Record<string, QueryValue>;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const url = `${API_BASE_URL}${path}`;
    if (!query) return url;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        params.append(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
}

async function parseBody(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined;
    const text = await response.text();
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {},
): Promise<T> {
    const { method = 'GET', query, body, headers, signal } = options;
    const token = getAuthToken();

    const finalHeaders: Record<string, string> = {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
    };

    let response: Response;
    try {
        response = await fetch(buildUrl(path, query), {
            method,
            headers: finalHeaders,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal,
        });
    } catch (error) {
        // Re-throw aborts untouched so React Query can treat them as cancellations.
        // (Avoid `instanceof DOMException` — it isn't a global on Hermes.)
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        throw networkError(error instanceof Error ? error.message : undefined);
    }

    const payload = await parseBody(response);

    if (!response.ok) {
        throw toApiError(response.status, payload, response.headers);
    }

    return payload as T;
}
