// CashMine · features/claim — claim status classification.
// The API reports three statuses: 'pending' (settling, ~20s), 'completed'
// (succeeded), 'failed' (rejected, amount returned). We classify defensively:
// anything that is not an explicit terminal status is treated as still pending,
// so an unexpected value keeps us polling rather than falsely declaring success.

export function isClaimCompleted(status: string): boolean {
    return status === 'completed';
}

export function isClaimFailed(status: string): boolean {
    return status === 'failed';
}

/** Still in flight — keep polling and show a progress state. */
export function isClaimPending(status: string): boolean {
    return !isClaimCompleted(status) && !isClaimFailed(status);
}
