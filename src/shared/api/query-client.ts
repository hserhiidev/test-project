// CashMine · shared/api — React Query client with the GLOBAL error handler.
//
// Every failed query/mutation funnels through handleError: it surfaces a toast
// and, on 401, clears the session so the token gate reappears. Mutations never
// retry (per requirements); balances timing is set per-hook in features/balances.

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { signOut } from '@/shared/auth/session';
import { toast } from '@/shared/ui/toast/toast-emitter';

import { ApiError, messageForError } from './errors';

function handleError(error: unknown): void {
    if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        void signOut();
    }
    toast.error(messageForError(error));
}

export function createQueryClient(): QueryClient {
    return new QueryClient({
        queryCache: new QueryCache({ onError: handleError }),
        mutationCache: new MutationCache({ onError: handleError }),
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
}
