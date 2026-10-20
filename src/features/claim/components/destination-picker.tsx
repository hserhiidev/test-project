import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ClaimDestination } from '@/shared/api';

const ACCENT = '#208AEF';

interface Props {
    destinations: ClaimDestination[];
    selected: string | undefined;
    onSelect: (id: string) => void;
}

function labelFor(d: ClaimDestination): string {
    return d.label ?? d.address ?? d.network ?? d.id;
}

/** Choose the payout destination. Rendered as a static row when there is only
 *  one option, otherwise as a selectable radio list. */
export function DestinationPicker({ destinations, selected, onSelect }: Props) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <ThemedText type="small" themeColor="textSecondary">
                Destination
            </ThemedText>
            {destinations.map((d) => {
                const isSelected = d.id === selected;
                const single = destinations.length === 1;
                return (
                    <Pressable
                        key={d.id}
                        accessibilityRole={single ? undefined : 'radio'}
                        accessibilityState={{ selected: isSelected }}
                        disabled={single}
                        onPress={() => onSelect(d.id)}
                        style={({ pressed }) => (pressed && !single ? styles.pressed : undefined)}>
                        <ThemedView type="backgroundElement" style={styles.row}>
                            <ThemedText type="small" themeColor="text">
                                {labelFor(d)}
                            </ThemedText>
                            {!single ? (
                                <View
                                    style={[
                                        styles.radio,
                                        {
                                            borderColor: isSelected
                                                ? ACCENT
                                                : theme.textSecondary,
                                        },
                                    ]}>
                                    {isSelected ? (
                                        <View style={styles.radioDot} />
                                    ) : null}
                                </View>
                            ) : null}
                        </ThemedView>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.three,
        borderRadius: Spacing.three,
    },
    pressed: {
        opacity: 0.7,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: ACCENT,
    },
});
