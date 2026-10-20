import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatTokenAmount } from '@/shared/money';

interface Props {
    asset: string;
    fee: string;
    /** amount − fee; null while the amount is empty or invalid. */
    receiveAmount: string | null;
}

/** Breakdown of the network fee and the net amount the user will receive. */
export function ClaimSummary({ asset, fee, receiveAmount }: Props) {
    return (
        <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.row}>
                <ThemedText type="small" themeColor="textSecondary">
                    Fee
                </ThemedText>
                <ThemedText type="small" themeColor="text">
                    {formatTokenAmount(fee)} {asset}
                </ThemedText>
            </View>
            <View style={styles.row}>
                <ThemedText type="small" themeColor="textSecondary">
                    You&apos;ll receive
                </ThemedText>
                <ThemedText type="smallBold" themeColor="text">
                    {receiveAmount ? formatTokenAmount(receiveAmount) : '—'} {asset}
                </ThemedText>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: Spacing.two,
        padding: Spacing.three,
        borderRadius: Spacing.three,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
