// CashMine · features/balances — live account balances.
// Balances poll every 15s and are considered fresh for 10s (per requirements).

import { useQuery } from '@tanstack/react-query';

import { apiFetch, queryKeys, type Balances } from '@/shared/api';

export const BALANCES_REFETCH_INTERVAL_MS = 15_000;
export const BALANCES_STALE_TIME_MS = 10_000;

export function useBalances() {
    return useQuery({
        queryKey: queryKeys.balances,
        queryFn: ({ signal }) => apiFetch<Balances>('/v1/balances', { signal }),
        refetchInterval: BALANCES_REFETCH_INTERVAL_MS,
        staleTime: BALANCES_STALE_TIME_MS,
    });
}
