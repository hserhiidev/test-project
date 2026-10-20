import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Spacing } from '@/constants/theme';
import { formatTokenAmount } from '@/shared/money';

import { isClaimCompleted, isClaimFailed } from '../claim-status';
import { useClaim } from '../use-claim';

const SUCCESS = '#16A34A';
const ERROR = '#DC2626';
const PENDING = '#F59E0B';

interface Props {
    claimId: string;
    asset: string;
    /** Amount submitted, used as a fallback before the first status fetch. */
    amount: string;
    onReset: () => void;
}

/** Tracks a submitted claim, polling until it is completed or failed. */
export function ClaimTracker({ claimId, asset, amount, onReset }: Props) {
    const { data: claim, isLoading, isError, error, refetch, isFetching } =
        useClaim(claimId);

    // First status fetch still in flight.
    if (isLoading && !claim) {
        return <Settling asset={asset} amount={amount} receiveAmount={null} />;
    }

    // Couldn't reach the status endpoint at all — the claim may still succeed,
    // so let the user retry the status check rather than re-submitting.
    if (isError && !claim) {
        return (
            <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
        );
    }

    const status = claim?.status ?? 'pending';
    const displayAmount = claim?.amount ?? amount;
    const receiveAmount = claim?.receiveAmount ?? null;

    if (isClaimFailed(status)) {
        return (
            <View style={styles.container}>
                <StatusCard
                    color={ERROR}
                    title="Claim failed"
                    detail={
                        claim?.failureReason ??
                        'The claim was rejected. Your balance is unchanged.'
                    }
                />
                <Button title="Try again" onPress={onReset} />
            </View>
        );
    }

    if (isClaimCompleted(status)) {
        return (
            <View style={styles.container}>
                <StatusCard
                    color={SUCCESS}
                    title="Claim completed"
                    detail={`${formatTokenAmount(receiveAmount ?? displayAmount)} ${asset} is on its way to your destination.`}
                />
                <Button title="New claim" onPress={onReset} />
            </View>
        );
    }

    // Pending / settling.
    return <Settling asset={asset} amount={displayAmount} receiveAmount={receiveAmount} />;
}

function Settling({
    asset,
    amount,
    receiveAmount,
}: {
    asset: string;
    amount: string;
    receiveAmount: string | null;
}) {
    return (
        <View style={styles.container}>
            <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.headerRow}>
                    <View style={[styles.dot, { backgroundColor: PENDING }]} />
                    <ThemedText type="smallBold">Settling your claim…</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                    Claiming {formatTokenAmount(amount)} {asset}
                    {receiveAmount
                        ? ` · you'll receive ${formatTokenAmount(receiveAmount)} ${asset}`
                        : ''}
                    . This usually takes about 20 seconds — no need to submit again.
                </ThemedText>
                <View style={styles.spinnerRow}>
                    <ActivityIndicator color={PENDING} />
                </View>
            </ThemedView>
        </View>
    );
}

function StatusCard({
    color,
    title,
    detail,
}: {
    color: string;
    title: string;
    detail: string;
}) {
    return (
        <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.headerRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <ThemedText type="smallBold">{title}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
                {detail}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.three,
    },
    card: {
        gap: Spacing.two,
        padding: Spacing.three,
        borderRadius: Spacing.three,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    spinnerRow: {
        alignItems: 'flex-start',
        paddingTop: Spacing.one,
    },
});
