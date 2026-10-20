import { toast } from '@/shared/ui/toast/toast-emitter';

import { ApiError } from '../errors';
import { createQueryClient } from '../query-client';

// signOut touches expo-secure-store transitively; stub it so this stays a unit
// test. jest.mock is hoisted above the imports by babel-plugin-jest-hoist.
jest.mock('@/shared/auth/session', () => ({ signOut: jest.fn() }));

describe('createQueryClient', () => {
    afterEach(() => jest.restoreAllMocks());

    it('disables retries for all mutations', () => {
        const qc = createQueryClient();
        expect(qc.getDefaultOptions().mutations?.retry).toBe(false);
    });

    it('routes query errors to a toast (global error handler)', async () => {
        const errorSpy = jest.spyOn(toast, 'error').mockImplementation(() => {});
        const qc = createQueryClient();

        await qc
            .fetchQuery({
                queryKey: ['boom'],
                queryFn: async () => {
                    throw new ApiError({
                        code: 'SERVER',
                        status: 500,
                        message: 'boom',
                    });
                },
                retry: false,
            })
            .catch(() => {});

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(String(errorSpy.mock.calls[0][0])).toContain('boom');
    });
});
