// CashMine · features/claim — create a withdrawal claim.
// A fresh Idempotency-Key is generated per submission. retry:false is inherited
// from the global mutation defaults. On success, balances + activity refresh.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { apiFetch, queryKeys, type Claim, type CreateClaimInput } from '@/shared/api';

export function useCreateClaim() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateClaimInput) =>
            apiFetch<Claim>('/v1/claims', {
                method: 'POST',
                body: input,
                headers: { 'Idempotency-Key': Crypto.randomUUID() },
            }),
        onSuccess: (claim) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.balances });
            void queryClient.invalidateQueries({ queryKey: queryKeys.activityRoot });
            void queryClient.invalidateQueries({ queryKey: queryKeys.claim(claim.id) });
        },
    });
}
