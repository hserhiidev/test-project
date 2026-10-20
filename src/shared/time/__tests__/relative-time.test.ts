import { formatRelativeTime, secondsSince } from '@/shared/time';

const NOW = Date.parse('2026-10-20T12:00:00.000Z');

function ago(ms: number): string {
    return new Date(NOW - ms).toISOString();
}

describe('secondsSince', () => {
    it('returns whole seconds of age', () => {
        expect(secondsSince(ago(5000), NOW)).toBe(5);
    });

    it('is NaN for an unparseable timestamp', () => {
        expect(Number.isNaN(secondsSince('not-a-date', NOW))).toBe(true);
    });
});

describe('formatRelativeTime', () => {
    it('collapses very recent and future times to "just now"', () => {
        expect(formatRelativeTime(ago(0), NOW)).toBe('just now');
        expect(formatRelativeTime(ago(3000), NOW)).toBe('just now');
        expect(formatRelativeTime(ago(-10000), NOW)).toBe('just now');
    });

    it('formats seconds, minutes, hours and days', () => {
        expect(formatRelativeTime(ago(12_000), NOW)).toBe('12s ago');
        expect(formatRelativeTime(ago(3 * 60_000), NOW)).toBe('3m ago');
        expect(formatRelativeTime(ago(2 * 3_600_000), NOW)).toBe('2h ago');
        expect(formatRelativeTime(ago(5 * 86_400_000), NOW)).toBe('5d ago');
    });

    it('falls back to "just now" for invalid input', () => {
        expect(formatRelativeTime('nope', NOW)).toBe('just now');
    });
});
