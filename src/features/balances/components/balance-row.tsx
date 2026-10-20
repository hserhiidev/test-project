import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { BalanceItem } from '@/shared/api';
import {
    availableUsd,
    formatTokenAmount,
    formatUsd,
    isZeroDecimal,
} from '@/shared/money';

/** One asset: symbol + any locked amounts on the left, available balance and
 *  its USD value on the right. */
export function BalanceRow({ item }: { item: BalanceItem }) {
    const locked: string[] = [];
    if (!isZeroDecimal(item.pending)) {
        locked.push(`Pending ${formatTokenAmount(item.pending)}`);
    }
    if (!isZeroDecimal(item.claiming)) {
        locked.push(`Claiming ${formatTokenAmount(item.claiming)}`);
    }

    return (
        <ThemedView type="backgroundElement" style={styles.row}>
            <View style={styles.left}>
                <ThemedText type="smallBold">{item.asset}</ThemedText>
                {locked.length > 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                        {locked.join(' · ')}
                    </ThemedText>
                ) : null}
            </View>
            <View style={styles.right}>
                <ThemedText type="smallBold">
                    {formatTokenAmount(item.available)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                    {formatUsd(availableUsd(item))}
                </ThemedText>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.three,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.three,
        borderRadius: Spacing.three,
    },
    left: {
        gap: Spacing.half,
        flexShrink: 1,
    },
    right: {
        alignItems: 'flex-end',
        gap: Spacing.half,
    },
});
