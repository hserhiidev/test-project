import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBalances } from '@/features/balances';
import { isZeroDecimal } from '@/shared/money';

import { AmountField } from './components/amount-field';
import { AssetPicker } from './components/asset-picker';
import { ClaimSummary } from './components/claim-summary';
import { ClaimTracker } from './components/claim-tracker';
import { DestinationPicker } from './components/destination-picker';
import { useClaimOptions } from './use-claim-options';
import { useCreateClaim } from './use-create-claim';
import { validateClaimAmount } from './validate-amount';

// On web the tab bar floats over the top of the screen (see BalancesScreen).
const TOP_INSET = Platform.OS === 'web' ? Spacing.six + Spacing.three : Spacing.three;

interface Submitted {
    claimId: string;
    asset: string;
    amount: string;
}

export function ClaimScreen() {
    const balances = useBalances();

    const [selectedAsset, setSelectedAsset] = useState<string>();
    const [amountText, setAmountText] = useState('');
    const [destinationId, setDestinationId] = useState<string>();
    const [submitted, setSubmitted] = useState<Submitted | null>(null);

    const items = balances.data?.items ?? [];
    const claimable = items.filter((i) => !isZeroDecimal(i.available));
    const effectiveAsset = selectedAsset ?? claimable[0]?.asset;
    const selectedItem = claimable.find((i) => i.asset === effectiveAsset);

    const options = useClaimOptions(effectiveAsset);
    const createClaim = useCreateClaim();

    const selectAsset = (asset: string) => {
        setSelectedAsset(asset);
        setAmountText('');
        setDestinationId(undefined);
    };

    const reset = () => {
        setSubmitted(null);
        setAmountText('');
    };

    // ---- Render: loading / error / empty shells ---------------------------
    let body: React.ReactNode;

    if (balances.isLoading && !balances.data) {
        body = <Spinner label="Loading balances…" />;
    } else if (balances.isError && !balances.data) {
        body = (
            <ErrorState
                error={balances.error}
                onRetry={() => void balances.refetch()}
                retrying={balances.isFetching}
            />
        );
    } else if (claimable.length === 0) {
        body = (
            <View style={styles.centered}>
                <ThemedText type="smallBold">Nothing to claim yet</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                    Rewards appear here once you have an available balance.
                </ThemedText>
            </View>
        );
    } else if (submitted) {
        body = (
            <ScrollView contentContainerStyle={styles.content}>
                <Header />
                <ClaimTracker
                    claimId={submitted.claimId}
                    asset={submitted.asset}
                    amount={submitted.amount}
                    onReset={reset}
                />
            </ScrollView>
        );
    } else {
        body = (
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled">
                <Header />

                <AssetPicker
                    items={claimable}
                    selected={effectiveAsset}
                    onSelect={selectAsset}
                />

                <ClaimForm
                    asset={effectiveAsset!}
                    available={selectedItem?.available ?? '0'}
                    decimals={selectedItem?.decimals ?? 0}
                    options={options}
                    amountText={amountText}
                    onChangeAmount={setAmountText}
                    destinationId={destinationId}
                    onSelectDestination={setDestinationId}
                    submitting={createClaim.isPending}
                    onSubmit={(input) =>
                        createClaim.mutate(input, {
                            onSuccess: (claim) =>
                                setSubmitted({
                                    claimId: claim.id,
                                    asset: input.asset,
                                    amount: input.amount,
                                }),
                        })
                    }
                />
            </ScrollView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.flex}>
                    {body}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ThemedView>
    );
}

function Header() {
    return (
        <View style={styles.header}>
            <ThemedText type="subtitle">Claim</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
                Withdraw your commission rewards.
            </ThemedText>
        </View>
    );
}

// ---- Per-asset form (depends on claim-options) ----------------------------

interface ClaimFormProps {
    asset: string;
    available: string;
    decimals: number;
    options: ReturnType<typeof useClaimOptions>;
    amountText: string;
    onChangeAmount: (text: string) => void;
    destinationId: string | undefined;
    onSelectDestination: (id: string) => void;
    submitting: boolean;
    onSubmit: (input: { asset: string; amount: string; destinationId: string }) => void;
}

function ClaimForm({
    asset,
    available,
    decimals,
    options,
    amountText,
    onChangeAmount,
    destinationId,
    onSelectDestination,
    submitting,
    onSubmit,
}: ClaimFormProps) {
    if (options.isLoading && !options.data) {
        return (
            <View style={styles.inlineLoader}>
                <ActivityIndicator />
            </View>
        );
    }

    if (options.isError && !options.data) {
        return (
            <View style={styles.inlineError}>
                <ThemedText type="small" themeColor="textSecondary">
                    Couldn&apos;t load claim options for {asset}.
                </ThemedText>
                <Button
                    title="Retry"
                    variant="secondary"
                    loading={options.isFetching}
                    onPress={() => void options.refetch()}
                />
            </View>
        );
    }

    const data = options.data;
    if (!data) return null;

    const destinations = data.destinations;
    const effectiveDestination =
        destinationId && destinations.some((d) => d.id === destinationId)
            ? destinationId
            : destinations[0]?.id;

    const trimmed = amountText.trim();
    const validation =
        trimmed === ''
            ? null
            : validateClaimAmount({
                  amount: trimmed,
                  asset,
                  available,
                  minAmount: data.minAmount,
                  fee: data.fee,
                  decimals,
              });

    const amountError = validation && !validation.ok ? validation.message : undefined;
    const receiveAmount = validation?.ok ? validation.receiveAmount : null;
    const canSubmit = Boolean(validation?.ok && effectiveDestination && !submitting);

    return (
        <View style={styles.form}>
            <AmountField
                value={amountText}
                onChangeText={onChangeAmount}
                onMax={() => onChangeAmount(available)}
                asset={asset}
                available={available}
                error={amountError}
                editable={!submitting}
            />

            <DestinationPicker
                destinations={destinations}
                selected={effectiveDestination}
                onSelect={onSelectDestination}
            />

            <ClaimSummary asset={asset} fee={data.fee} receiveAmount={receiveAmount} />

            <Button
                title={submitting ? 'Submitting…' : 'Claim'}
                loading={submitting}
                disabled={!canSubmit}
                onPress={() => {
                    if (!effectiveDestination || !validation?.ok) return;
                    onSubmit({ asset, amount: trimmed, destinationId: effectiveDestination });
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    safeArea: {
        flex: 1,
        width: '100%',
        maxWidth: MaxContentWidth,
    },
    flex: {
        flex: 1,
    },
    content: {
        gap: Spacing.four,
        paddingHorizontal: Spacing.four,
        paddingTop: TOP_INSET,
        paddingBottom: BottomTabInset + Spacing.four,
    },
    header: {
        gap: Spacing.two,
    },
    form: {
        gap: Spacing.four,
    },
    inlineLoader: {
        paddingVertical: Spacing.five,
        alignItems: 'center',
    },
    inlineError: {
        gap: Spacing.three,
        paddingVertical: Spacing.three,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.four,
    },
    centeredText: {
        textAlign: 'center',
    },
});
