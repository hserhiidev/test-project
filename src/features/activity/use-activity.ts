// CashMine · features/activity — paginated transaction history (newest first).

import { useInfiniteQuery } from '@tanstack/react-query';

import { apiFetch, queryKeys, type ActivityPage } from '@/shared/api';

export const DEFAULT_ACTIVITY_LIMIT = 20;

export function useActivity(limit: number = DEFAULT_ACTIVITY_LIMIT) {
    return useInfiniteQuery({
        queryKey: queryKeys.activity(limit),
        queryFn: ({ pageParam, signal }) =>
            apiFetch<ActivityPage>('/v1/activity', {
                query: { limit, cursor: pageParam ?? undefined },
                signal,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });
}
