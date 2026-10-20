// CashMine · shared/time — human-friendly relative timestamps for "how fresh
// is this data" indicators.

/** Whole seconds between `iso` and `now` (negative if `iso` is in the future). */
export function secondsSince(iso: string, now: number = Date.now()): number {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return NaN;
    return Math.round((now - then) / 1000);
}

/**
 * Compact relative label, e.g. "just now", "12s ago", "3m ago", "2h ago",
 * "5d ago". Future or unparseable timestamps collapse to "just now".
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
    const sec = secondsSince(iso, now);
    if (Number.isNaN(sec) || sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;

    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;

    return `${Math.floor(hr / 24)}d ago`;
}
