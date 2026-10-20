// CashMine · features/claim — a single claim's settlement status.
// Polls every 5s while the claim is still pending/processing.

import { useQuery } from '@tanstack/react-query';

import { apiFetch, queryKeys, type Claim } from '@/shared/api';

const PENDING_STATUSES = new Set(['pending', 'processing']);

export function useClaim(id: string | undefined) {
    return useQuery({
        queryKey: id ? queryKeys.claim(id) : (['claim', 'disabled'] as const),
        queryFn: ({ signal }) => apiFetch<Claim>(`/v1/claims/${id}`, { signal }),
        enabled: Boolean(id),
        refetchInterval: (query) =>
            query.state.data && PENDING_STATUSES.has(query.state.data.status)
                ? 5_000
                : false,
    });
}
