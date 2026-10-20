// CashMine · shared/api — centralized React Query keys so features can
// invalidate each other's caches (e.g. a claim invalidates balances + activity).

export const queryKeys = {
    balances: ['balances'] as const,
    activityRoot: ['activity'] as const,
    activity: (limit: number) => ['activity', limit] as const,
    claimOptions: (asset: string) => ['claim-options', asset] as const,
    claim: (id: string) => ['claim', id] as const,
};
