// CashMine · features/balances — live account balances.
// Balances poll every 15s and are considered fresh for 10s (per requirements).

import { useQuery } from '@tanstack/react-query';

import { apiFetch, queryKeys, type Balances } from '@/shared/api';
import { useAuth } from '@/shared/auth';

export const BALANCES_REFETCH_INTERVAL_MS = 15_000;
export const BALANCES_STALE_TIME_MS = 10_000;

export function useBalances() {
    // Balances require the API token; stay idle (no premature 401) until the
    // user has entered one.
    const { token } = useAuth();

    return useQuery({
        queryKey: queryKeys.balances,
        queryFn: ({ signal }) => apiFetch<Balances>('/v1/balances', { signal }),
        enabled: Boolean(token),
        refetchInterval: BALANCES_REFETCH_INTERVAL_MS,
        staleTime: BALANCES_STALE_TIME_MS,
    });
}
