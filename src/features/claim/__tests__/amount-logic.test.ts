// CashMine · features/claim — focused unit tests for the claim "amount" logic:
// parsing, validation, commission (fee), and USD summary/totals. Exercises the
// real helpers through their public surface (parsing is covered via behaviour,
// since `parse` itself is internal to the money module).

import type { BalanceItem } from '@/shared/api';
import {
    addDecimals,
    availableUsd,
    formatTokenAmount,
    formatUsd,
    isZeroDecimal,
    subtractDecimals,
    totalAvailableUsd,
} from '@/shared/money';

import { validateClaimAmount, type ClaimAmountParams } from '../validate-amount';

function item(overrides: Partial<BalanceItem> = {}): BalanceItem {
    return {
        asset: 'BTC',
        decimals: 8,
        available: '0',
        pending: '0',
        claiming: '0',
        usdPrice: '0',
        ...overrides,
    };
}

function amountParams(overrides: Partial<ClaimAmountParams> = {}): ClaimAmountParams {
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

describe('amount logic · parsing', () => {
    it('treats malformed or empty input as zero', () => {
        expect(isZeroDecimal('abc')).toBe(true);
        expect(isZeroDecimal('')).toBe(true);
        expect(addDecimals('abc', '5')).toBe('5');
        expect(formatTokenAmount('not-a-number')).toBe('0');
    });

    it('trims surrounding whitespace before parsing', () => {
        expect(addDecimals('  1.5 ', ' 2.5 ')).toBe('4');
    });

    it('normalizes redundant trailing zeros', () => {
        expect(addDecimals('1.50', '0')).toBe('1.5');
    });

    it('keeps full precision across differing scales', () => {
        expect(addDecimals('0.0000001', '0.0000002')).toBe('0.0000003');
    });

    it('parses and preserves a negative result', () => {
        expect(subtractDecimals('0', '0.5')).toBe('-0.5');
    });
});

describe('amount logic · validation', () => {
    it('accepts an amount exactly at the minimum', () => {
        expect(validateClaimAmount(amountParams({ amount: '0.5', minAmount: '0.5' })).ok).toBe(
            true,
        );
    });

    it('accepts an amount exactly at the available balance', () => {
        expect(validateClaimAmount(amountParams({ amount: '10', available: '10' })).ok).toBe(
            true,
        );
    });

    it('accepts precision exactly at the asset limit', () => {
        const result = validateClaimAmount(
            amountParams({
                amount: '0.00000001',
                decimals: 8,
                minAmount: '0.00000001',
                fee: '0',
                available: '1',
            }),
        );
        expect(result.ok).toBe(true);
    });

    it('rejects one digit beyond the asset precision', () => {
        expect(validateClaimAmount(amountParams({ amount: '1.234', decimals: 2 })).ok).toBe(
            false,
        );
    });

    it('rejects below the minimum and above the available balance', () => {
        expect(validateClaimAmount(amountParams({ amount: '0.4', minAmount: '0.5' })).ok).toBe(
            false,
        );
        expect(validateClaimAmount(amountParams({ amount: '11', available: '10' })).ok).toBe(
            false,
        );
    });

    it('rejects malformed input, including leading zeros', () => {
        expect(validateClaimAmount(amountParams({ amount: '1.2.3' })).ok).toBe(false);
        expect(validateClaimAmount(amountParams({ amount: '01' })).ok).toBe(false);
    });
});

describe('amount logic · commission (fee)', () => {
    it('deducts the fee with exact base-10 precision (no float drift)', () => {
        // 0.3 - 0.1 drifts to 0.19999999999999998 in float math.
        expect(subtractDecimals('0.3', '0.1')).toBe('0.2');
    });

    it('returns the exact net amount (amount − fee) on a valid claim', () => {
        const result = validateClaimAmount(amountParams({ amount: '2', fee: '0.1' }));
        expect(result).toEqual({ ok: true, receiveAmount: '1.9' });
    });

    it('handles a high-precision fee', () => {
        const result = validateClaimAmount(
            amountParams({ amount: '1', fee: '0.000001', decimals: 6, minAmount: '0.000001' }),
        );
        expect(result).toEqual({ ok: true, receiveAmount: '0.999999' });
    });

    it('rejects when the fee swallows the whole amount (net ≤ 0)', () => {
        const result = validateClaimAmount(
            amountParams({ amount: '1', fee: '1', minAmount: '0.1' }),
        );
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toContain('fee');
    });
});

describe('amount logic · USD summary & totals', () => {
    it('values a single asset by available × usdPrice', () => {
        expect(availableUsd(item({ available: '0.25', usdPrice: '3200.4' }))).toBe('800.1');
    });

    it('sums available value across assets, ignoring pending and claiming', () => {
        const items = [
            item({ asset: 'BTC', available: '0.5', pending: '100', usdPrice: '64000' }),
            item({ asset: 'ETH', available: '2', claiming: '50', usdPrice: '3200.25' }),
        ];
        // 32000 + 6400.50 (pending/claiming excluded)
        expect(formatUsd(totalAvailableUsd(items))).toBe('$38,400.50');
    });

    it('is $0.00 for an empty portfolio', () => {
        expect(formatUsd(totalAvailableUsd([]))).toBe('$0.00');
    });

    it('rounds the USD headline half-up to two decimals', () => {
        expect(formatUsd(totalAvailableUsd([item({ available: '1', usdPrice: '1234567.899' })]))).toBe(
            '$1,234,567.90',
        );
    });
});
