// CashMine · features/claim — client-side validation of the claim amount,
// mirroring the API rules (POST /v1/claims):
//   • format: digits with an optional single dot, no leading zeros
//   • precision: at most the asset's `decimals` fraction digits
//   • range: minAmount <= amount <= available
//   • the fee is deducted, so the amount must exceed the fee (receive > 0)
//
// The server re-checks `available` live, so this only prevents obvious mistakes
// and double-spends against the latest snapshot — it is not the source of truth.

import {
    compareDecimals,
    decimalPlaces,
    formatTokenAmount,
    isZeroDecimal,
    subtractDecimals,
} from '@/shared/money';

export interface ClaimAmountParams {
    amount: string; // raw user input
    asset: string;
    available: string;
    minAmount: string;
    fee: string;
    decimals: number;
}

export type ClaimAmountResult =
    | { ok: true; receiveAmount: string }
    | { ok: false; message: string };

// Integer part is 0 or starts 1-9 (no leading zeros), optional fraction.
const DECIMAL_RE = /^(0|[1-9]\d*)(\.\d+)?$/;

/**
 * Validate a claim amount. Callers should treat an empty input as "incomplete"
 * (disable submit, no error) rather than passing it here.
 */
export function validateClaimAmount(p: ClaimAmountParams): ClaimAmountResult {
    const amount = p.amount.trim();

    if (!DECIMAL_RE.test(amount)) {
        return { ok: false, message: 'Enter a valid amount.' };
    }
    if (decimalPlaces(amount) > p.decimals) {
        return {
            ok: false,
            message: `${p.asset} supports at most ${p.decimals} decimal places.`,
        };
    }
    if (isZeroDecimal(amount)) {
        return { ok: false, message: 'Amount must be greater than zero.' };
    }
    if (compareDecimals(amount, p.minAmount) < 0) {
        return {
            ok: false,
            message: `Minimum claim is ${formatTokenAmount(p.minAmount)} ${p.asset}.`,
        };
    }
    if (compareDecimals(amount, p.available) > 0) {
        return {
            ok: false,
            message: `Exceeds your available ${formatTokenAmount(p.available)} ${p.asset}.`,
        };
    }

    const receiveAmount = subtractDecimals(amount, p.fee);
    if (compareDecimals(receiveAmount, '0') <= 0) {
        return {
            ok: false,
            message: `Amount must be greater than the ${formatTokenAmount(p.fee)} ${p.asset} fee.`,
        };
    }

    return { ok: true, receiveAmount };
}
