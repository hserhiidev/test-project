import { setAuthToken } from '@/shared/auth/auth-token';

import { apiFetch } from '../client';
import { ApiError } from '../errors';

function mockResponse(status: number, body?: unknown): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: () => null },
        text: async () => (body === undefined ? '' : JSON.stringify(body)),
    } as unknown as Response;
}

describe('apiFetch', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
        setAuthToken(null);
        jest.restoreAllMocks();
    });

    it('builds the URL + query string, injects the bearer token, and parses JSON', async () => {
        setAuthToken('tok_123');
        const fetchMock = jest
            .fn()
            .mockResolvedValue(mockResponse(200, { ok: true }));
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        const data = await apiFetch<{ ok: boolean }>('/v1/activity', {
            query: { limit: 20, cursor: undefined },
        });

        expect(data).toEqual({ ok: true });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://task-api.cashmine.io/v1/activity?limit=20');
        expect((init.headers as Record<string, string>).Authorization).toBe(
            'Bearer tok_123',
        );
    });

    it('throws a typed ApiError from the { error } envelope', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue(
            mockResponse(400, {
                error: { code: 'VALIDATION', message: 'Bad amount', field: 'amount' },
            }),
        ) as unknown as typeof fetch;

        await expect(
            apiFetch('/v1/claims', { method: 'POST', body: {} }),
        ).rejects.toMatchObject({
            name: 'ApiError',
            code: 'VALIDATION',
            status: 400,
            field: 'amount',
        });
    });

    it('carries retryAfterMs for RATE_LIMITED (429)', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue(
            mockResponse(429, {
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests',
                    retryAfterMs: 2300,
                },
            }),
        ) as unknown as typeof fetch;

        const error = (await apiFetch('/v1/balances').catch(
            (e) => e,
        )) as ApiError;
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('RATE_LIMITED');
        expect(error.retryAfterMs).toBe(2300);
    });
});
