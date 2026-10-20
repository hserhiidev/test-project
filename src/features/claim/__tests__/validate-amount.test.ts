import { validateClaimAmount, type ClaimAmountParams } from '../validate-amount';

function params(overrides: Partial<ClaimAmountParams> = {}): ClaimAmountParams {
    return {
        amount: '1',
        asset: 'ETH',
        available: '10',
        minAmount: '0.5',
        fee: '0.1',
        decimals: 6,
        ...overrides,
    };
}

describe('validateClaimAmount', () => {
    it('accepts a valid amount and returns the net received (amount − fee)', () => {
        const result = validateClaimAmount(params({ amount: '2', fee: '0.1' }));
        expect(result).toEqual({ ok: true, receiveAmount: '1.9' });
    });

    it('rejects a malformed amount', () => {
        expect(validateClaimAmount(params({ amount: 'abc' })).ok).toBe(false);
        expect(validateClaimAmount(params({ amount: '1.2.3' })).ok).toBe(false);
        // leading zeros are not allowed by the API format rule
        expect(validateClaimAmount(params({ amount: '01' })).ok).toBe(false);
    });

    it('rejects more decimal places than the asset supports', () => {
        const result = validateClaimAmount(params({ amount: '1.1234567', decimals: 6 }));
        expect(result.ok).toBe(false);
    });

    it('rejects zero', () => {
        expect(validateClaimAmount(params({ amount: '0', minAmount: '0' })).ok).toBe(false);
    });

    it('enforces the minimum', () => {
        const result = validateClaimAmount(params({ amount: '0.4', minAmount: '0.5' }));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toContain('Minimum');
    });

    it('rejects amounts above the available balance', () => {
        const result = validateClaimAmount(params({ amount: '11', available: '10' }));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toContain('available');
    });

    it('accepts an amount exactly equal to the available balance', () => {
        expect(validateClaimAmount(params({ amount: '10', available: '10' })).ok).toBe(true);
    });

    it('rejects an amount that does not exceed the fee', () => {
        const result = validateClaimAmount(
            params({ amount: '0.5', minAmount: '0.1', fee: '0.5' }),
        );
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toContain('fee');
    });
});
