// CashMine · features/claim — a single claim's settlement status.
// Polls every 5s while the claim is still pending/processing.

import { useQuery } from '@tanstack/react-query';

import { apiFetch, queryKeys, type Claim } from '@/shared/api';

import { isClaimPending } from './claim-status';

export function useClaim(id: string | undefined) {
    return useQuery({
        queryKey: id ? queryKeys.claim(id) : (['claim', 'disabled'] as const),
        queryFn: ({ signal }) => apiFetch<Claim>(`/v1/claims/${id}`, { signal }),
        enabled: Boolean(id),
        // Poll every 5s while the claim is still settling; stop once it is
        // completed or failed.
        refetchInterval: (query) =>
            query.state.data && isClaimPending(query.state.data.status)
                ? 5_000
                : false,
    });
}
