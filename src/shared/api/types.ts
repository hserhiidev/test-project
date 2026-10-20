// CashMine · shared/api — backend DTOs.
// NOTE: all monetary amounts are decimal *strings* (never JSON numbers), per the API docs.

export type ApiErrorCode =
    | 'VALIDATION' // 400
    | 'UNAUTHORIZED' // 401
    | 'NOT_FOUND' // 404
    | 'IDEMPOTENCY_MISMATCH' // 409
    | 'RATE_LIMITED' // 429
    | 'SERVER' // 500 / 503
    | 'TIMEOUT' // 504
    | 'NETWORK'; // client-side (no response)

export interface ApiErrorBody {
    error: {
        code: ApiErrorCode | string;
        message: string;
        field?: string;
        retryAfterMs?: number;
    };
}

// GET /v1/balances
export interface BalanceItem {
    asset: string;
    decimals: number;
    available: string;
    pending: string;
    claiming: string;
    usdPrice: string;
}

export interface Balances {
    asOf: string;
    items: BalanceItem[];
}

// GET /v1/activity
export type ActivityType = 'accrual' | 'reversal' | 'claim';

export interface ActivityItem {
    id: string;
    type: ActivityType;
    asset: string;
    amount: string;
    status: string;
    exchange: string;
    createdAt: string;
    relatedId: string | null;
}

export interface ActivityPage {
    items: ActivityItem[];
    nextCursor: string | null;
}

// GET /v1/claim-options
export interface ClaimDestination {
    id: string;
    label?: string;
    address?: string;
    network?: string;
}

export interface ClaimOptions {
    asset: string;
    minAmount: string;
    fee: string;
    destinations: ClaimDestination[];
}

// POST /v1/claims
export interface CreateClaimInput {
    asset: string;
    amount: string;
    destinationId: string;
}

export type ClaimStatus =
    | 'pending'
    | 'processing'
    | 'settled'
    | 'failed'
    | (string & {});

export interface Claim {
    id: string;
    status: ClaimStatus;
    fee: string;
    receiveAmount: string;
    createdAt: string;
    updatedAt: string;
    // Echoed back by the API; kept optional to avoid over-asserting the response shape.
    asset?: string;
    amount?: string;
    destinationId?: string;
}
