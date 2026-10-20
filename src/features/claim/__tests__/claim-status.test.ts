import { isClaimCompleted, isClaimFailed, isClaimPending } from '../claim-status';

describe('claim status classification', () => {
    it('recognizes the terminal statuses', () => {
        expect(isClaimCompleted('completed')).toBe(true);
        expect(isClaimFailed('failed')).toBe(true);
    });

    it('treats pending as in-flight', () => {
        expect(isClaimPending('pending')).toBe(true);
        expect(isClaimPending('completed')).toBe(false);
        expect(isClaimPending('failed')).toBe(false);
    });

    it('treats any unknown status as still pending (keep polling, never false-success)', () => {
        expect(isClaimPending('queued')).toBe(true);
        expect(isClaimCompleted('queued')).toBe(false);
        expect(isClaimFailed('queued')).toBe(false);
    });
});
