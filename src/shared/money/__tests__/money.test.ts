import type { BalanceItem } from '@/shared/api';
import {
    addDecimals,
    availableUsd,
    formatTokenAmount,
    formatUsd,
    isZeroDecimal,
    multiplyDecimals,
    totalAvailableUsd,
} from '@/shared/money';

function item(partial: Partial<BalanceItem>): BalanceItem {
    return {
        asset: 'BTC',
        decimals: 8,
        available: '0',
        pending: '0',
        claiming: '0',
        usdPrice: '0',
        ...partial,
    };
}

describe('multiplyDecimals', () => {
    it('multiplies with exact base-10 precision (no float drift)', () => {
        // 0.1 * 0.2 would be 0.020000000000000004 in float math.
        expect(multiplyDecimals('0.1', '0.2')).toBe('0.02');
        expect(multiplyDecimals('1.5', '64123.45')).toBe('96185.175');
    });

    it('handles large token amounts without precision loss', () => {
        expect(multiplyDecimals('123456789.123456789', '2')).toBe(
            '246913578.246913578',
        );
    });

    it('propagates sign', () => {
        expect(multiplyDecimals('-2', '3')).toBe('-6');
        expect(multiplyDecimals('-2', '-3')).toBe('6');
    });
});

describe('addDecimals', () => {
    it('adds across differing scales', () => {
        expect(addDecimals('0.1', '0.2')).toBe('0.3');
        expect(addDecimals('100', '0.001')).toBe('100.001');
    });
});

describe('isZeroDecimal', () => {
    it('detects zero regardless of formatting', () => {
        expect(isZeroDecimal('0')).toBe(true);
        expect(isZeroDecimal('0.000')).toBe(true);
        expect(isZeroDecimal('0.0001')).toBe(false);
    });
});

describe('formatTokenAmount', () => {
    it('trims trailing zeros and groups thousands', () => {
        expect(formatTokenAmount('1234.5000')).toBe('1,234.5');
        expect(formatTokenAmount('1000000')).toBe('1,000,000');
        expect(formatTokenAmount('0.100000')).toBe('0.1');
    });

    it('rounds to the max fraction digits (half-up)', () => {
        expect(formatTokenAmount('0.123456789')).toBe('0.123457');
    });
});

describe('formatUsd', () => {
    it('renders two decimals with a $ and grouping', () => {
        expect(formatUsd('1234.5')).toBe('$1,234.50');
        expect(formatUsd('0')).toBe('$0.00');
        expect(formatUsd('1234567.899')).toBe('$1,234,567.90');
    });

    it('renders negatives', () => {
        expect(formatUsd('-5.5')).toBe('-$5.50');
    });
});

describe('availableUsd / totalAvailableUsd', () => {
    it('values a single asset by available × usdPrice', () => {
        expect(availableUsd(item({ available: '0.5', usdPrice: '64000' }))).toBe(
            '32000',
        );
    });

    it('sums available value across assets, ignoring pending/claiming', () => {
        const items = [
            item({ asset: 'BTC', available: '0.5', pending: '10', usdPrice: '64000' }),
            item({ asset: 'ETH', available: '2', claiming: '5', usdPrice: '3200.25' }),
            item({ asset: 'USDT', available: '150.5', usdPrice: '1' }),
        ];
        // 32000 + 6400.50 + 150.5
        expect(formatUsd(totalAvailableUsd(items))).toBe('$38,551.00');
    });

    it('is $0.00 for an empty portfolio', () => {
        expect(formatUsd(totalAvailableUsd([]))).toBe('$0.00');
    });
});
