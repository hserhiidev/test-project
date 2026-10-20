import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { BalanceItem } from '@/shared/api';
import { formatTokenAmount } from '@/shared/money';

interface Props {
    items: BalanceItem[];
    selected: string | undefined;
    onSelect: (asset: string) => void;
}

/** Row of selectable asset pills, each showing the symbol + available amount. */
export function AssetPicker({ items, selected, onSelect }: Props) {
    return (
        <View style={styles.row}>
            {items.map((item) => {
                const isSelected = item.asset === selected;
                return (
                    <Pressable
                        key={item.asset}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => onSelect(item.asset)}
                        style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
                        <ThemedView
                            type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                            style={styles.pill}>
                            <ThemedText
                                type="smallBold"
                                themeColor={isSelected ? 'text' : 'textSecondary'}>
                                {item.asset}
                            </ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                                {formatTokenAmount(item.available)}
                            </ThemedText>
                        </ThemedView>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    pill: {
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.half,
        minWidth: 72,
    },
    pressed: {
        opacity: 0.7,
    },
});
