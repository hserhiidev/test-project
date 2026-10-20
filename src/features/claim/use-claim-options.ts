// CashMine · features/claim — claiming parameters for a given asset.

import { useQuery } from '@tanstack/react-query';

import { apiFetch, queryKeys, type ClaimOptions } from '@/shared/api';

export function useClaimOptions(asset: string | undefined) {
    return useQuery({
        queryKey: asset
            ? queryKeys.claimOptions(asset)
            : (['claim-options', 'disabled'] as const),
        queryFn: ({ signal }) =>
            apiFetch<ClaimOptions>('/v1/claim-options', {
                query: { asset: asset! },
                signal,
            }),
        enabled: Boolean(asset),
    });
}
