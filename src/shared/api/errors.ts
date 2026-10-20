// CashMine · shared/api — normalized API errors.

import type { ApiErrorBody } from './types';

export interface ApiErrorArgs {
    code: string;
    status: number;
    message: string;
    field?: string;
    retryAfterMs?: number;
}

/** A single error type thrown by the HTTP client for every failed request. */
export class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    readonly field?: string;
    readonly retryAfterMs?: number;

    constructor({ code, status, message, field, retryAfterMs }: ApiErrorArgs) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.field = field;
        this.retryAfterMs = retryAfterMs;
    }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
    if (typeof body !== 'object' || body === null || !('error' in body)) {
        return false;
    }
    const err = (body as { error: unknown }).error;
    return (
        typeof err === 'object' &&
        err !== null &&
        typeof (err as { message?: unknown }).message === 'string'
    );
}

function retryAfterFromHeaders(headers?: Headers): number | undefined {
    const raw = headers?.get?.('Retry-After');
    if (!raw) return undefined;
    const seconds = Number(raw);
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

/** Build an {@link ApiError} from a non-2xx response's status + parsed body. */
export function toApiError(
    status: number,
    body: unknown,
    headers?: Headers,
): ApiError {
    if (isApiErrorBody(body)) {
        const { code, message, field, retryAfterMs } = body.error;
        return new ApiError({
            status,
            code: code || 'SERVER',
            message,
            field,
            retryAfterMs: retryAfterMs ?? retryAfterFromHeaders(headers),
        });
    }

    const fallbackMessage =
        typeof (body as { message?: unknown })?.message === 'string'
            ? (body as { message: string }).message
            : `Request failed with status ${status}`;

    return new ApiError({
        status,
        code: 'SERVER',
        message: fallbackMessage,
        retryAfterMs: retryAfterFromHeaders(headers),
    });
}

/** The request never produced a response (offline, DNS, connection reset…). */
export function networkError(message?: string): ApiError {
    return new ApiError({
        status: 0,
        code: 'NETWORK',
        message: message || 'Network request failed',
    });
}

/** Map any thrown value to a short, user-facing message for the toast. */
export function messageForError(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.code) {
            case 'UNAUTHORIZED':
                return 'Your session is invalid or expired. Please re-enter your token.';
            case 'RATE_LIMITED': {
                const seconds = error.retryAfterMs
                    ? Math.ceil(error.retryAfterMs / 1000)
                    : undefined;
                return seconds
                    ? `Too many requests. Try again in ${seconds}s.`
                    : 'Too many requests. Please slow down.';
            }
            case 'NOT_FOUND':
                return error.message || 'Not found.';
            case 'IDEMPOTENCY_MISMATCH':
                return 'This request was already sent with different data.';
            case 'TIMEOUT':
                return 'The request timed out — the outcome is unknown. Please check again.';
            case 'VALIDATION':
                return error.field
                    ? `${error.message} (${error.field})`
                    : error.message;
            case 'NETWORK':
                return 'Network error. Check your connection and try again.';
            default:
                return error.message || 'Something went wrong. Please try again.';
        }
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return 'Something went wrong. Please try again.';
}
