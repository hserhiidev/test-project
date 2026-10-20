// CashMine · shared/money — commission & currency helpers.
//
// Backend monetary values arrive as decimal *strings* (never JS numbers) to
// avoid binary-float rounding. These helpers do exact base-10 arithmetic with
// BigInt so a portfolio total is correct to the last cent, then format for the
// UI only at the very end.

import type { BalanceItem } from '@/shared/api';

/** A base-10 decimal: value = (neg ? -1 : 1) * coef / 10^scale. */
interface Decimal {
    neg: boolean;
    coef: bigint;
    scale: number;
}

const ZERO: Decimal = { neg: false, coef: 0n, scale: 0 };

/** Parse a decimal string. Invalid / empty input is treated as 0. */
function parse(value: string): Decimal {
    const trimmed = value.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return ZERO;

    let neg = false;
    let body = trimmed;
    if (body.startsWith('-')) {
        neg = true;
        body = body.slice(1);
    }

    const [intPart, fracPart = ''] = body.split('.');
    const coef = BigInt((intPart || '0') + fracPart);
    return { neg: coef !== 0n && neg, coef, scale: fracPart.length };
}

/** Align two decimals to a common scale, returning signed coefficients. */
function align(a: Decimal, b: Decimal): { scale: number; a: bigint; b: bigint } {
    const scale = Math.max(a.scale, b.scale);
    const ac = a.coef * 10n ** BigInt(scale - a.scale) * (a.neg ? -1n : 1n);
    const bc = b.coef * 10n ** BigInt(scale - b.scale) * (b.neg ? -1n : 1n);
    return { scale, a: ac, b: bc };
}

function add(a: Decimal, b: Decimal): Decimal {
    const { scale, a: ac, b: bc } = align(a, b);
    const sum = ac + bc;
    return { neg: sum < 0n, coef: sum < 0n ? -sum : sum, scale };
}

function multiply(a: Decimal, b: Decimal): Decimal {
    const coef = a.coef * b.coef;
    return { neg: coef !== 0n && a.neg !== b.neg, coef, scale: a.scale + b.scale };
}

function negate(d: Decimal): Decimal {
    return d.coef === 0n ? d : { ...d, neg: !d.neg };
}

function subtract(a: Decimal, b: Decimal): Decimal {
    return add(a, negate(b));
}

/** -1 if a < b, 1 if a > b, 0 if equal. */
function compare(a: Decimal, b: Decimal): number {
    const { a: ac, b: bc } = align(a, b);
    return ac < bc ? -1 : ac > bc ? 1 : 0;
}

/** Render a decimal to exactly `dp` fraction digits, rounding half-up. */
function toFixed(d: Decimal, dp: number): string {
    let coef = d.coef;
    if (d.scale > dp) {
        const divisor = 10n ** BigInt(d.scale - dp);
        const remainder = coef % divisor;
        coef /= divisor;
        if (remainder * 2n >= divisor) coef += 1n; // round half-up
    } else if (d.scale < dp) {
        coef *= 10n ** BigInt(dp - d.scale);
    }

    const digits = coef.toString().padStart(dp + 1, '0');
    const intPart = digits.slice(0, digits.length - dp) || '0';
    const fracPart = dp > 0 ? `.${digits.slice(digits.length - dp)}` : '';
    const sign = d.neg && coef !== 0n ? '-' : '';
    return `${sign}${intPart}${fracPart}`;
}

/** Insert thousands separators into a run of integer digits. */
function groupThousands(intDigits: string): string {
    return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Drop redundant trailing fraction zeros from a decimal string ("32.50" -> "32.5"). */
function trimTrailingZeros(value: string): string {
    if (!value.includes('.')) return value;
    return value.replace(/0+$/, '').replace(/\.$/, '');
}

/** True when a decimal string represents exactly zero. */
export function isZeroDecimal(value: string): boolean {
    return parse(value).coef === 0n;
}

/** Exact product of two decimal strings (full precision, no rounding). */
export function multiplyDecimals(a: string, b: string): string {
    const product = multiply(parse(a), parse(b));
    return trimTrailingZeros(toFixed(product, product.scale));
}

/** Exact sum of two decimal strings. */
export function addDecimals(a: string, b: string): string {
    const d = add(parse(a), parse(b));
    return trimTrailingZeros(toFixed(d, d.scale));
}

/** Exact difference of two decimal strings (a − b). */
export function subtractDecimals(a: string, b: string): string {
    const d = subtract(parse(a), parse(b));
    return trimTrailingZeros(toFixed(d, d.scale));
}

/** Compare two decimal strings: -1 if a < b, 0 if equal, 1 if a > b. */
export function compareDecimals(a: string, b: string): -1 | 0 | 1 {
    return compare(parse(a), parse(b)) as -1 | 0 | 1;
}

/** Count fraction digits in a decimal string ("1.230" → 3, "5" → 0). */
export function decimalPlaces(value: string): number {
    const trimmed = value.trim();
    const dot = trimmed.indexOf('.');
    return dot === -1 ? 0 : trimmed.length - dot - 1;
}

/**
 * Format a token amount for display: rounded to `maxFractionDigits`, trailing
 * zeros trimmed, thousands-grouped. e.g. "1234.5000" -> "1,234.5".
 */
export function formatTokenAmount(value: string, maxFractionDigits = 6): string {
    const fixed = toFixed(parse(value), maxFractionDigits);
    const neg = fixed.startsWith('-');
    let abs = neg ? fixed.slice(1) : fixed;
    if (abs.includes('.')) abs = abs.replace(/0+$/, '').replace(/\.$/, '');
    const [intPart, fracPart] = abs.split('.');
    return `${neg ? '-' : ''}${groupThousands(intPart)}${fracPart ? `.${fracPart}` : ''}`;
}

/** Format a USD decimal string as e.g. "$1,234.56" (always 2 dp). */
export function formatUsd(value: string): string {
    const fixed = toFixed(parse(value), 2);
    const neg = fixed.startsWith('-');
    const [intPart, fracPart] = (neg ? fixed.slice(1) : fixed).split('.');
    return `${neg ? '-$' : '$'}${groupThousands(intPart)}.${fracPart}`;
}

/** USD value of a single balance's available amount (available × usdPrice). */
export function availableUsd(item: BalanceItem): string {
    return multiplyDecimals(item.available, item.usdPrice);
}

/**
 * Total portfolio value in USD across all assets, counting *available* balances
 * only (pending/claiming are shown per-asset but excluded from the headline).
 * Returned as a raw decimal string — pass through {@link formatUsd} to display.
 */
export function totalAvailableUsd(items: BalanceItem[]): string {
    const total = items.reduce<Decimal>(
        (acc, item) => add(acc, multiply(parse(item.available), parse(item.usdPrice))),
        ZERO,
    );
    return trimTrailingZeros(toFixed(total, total.scale));
}
