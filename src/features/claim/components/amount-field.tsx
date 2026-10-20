import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTokenAmount } from '@/shared/money';

const ACCENT = '#208AEF';
const ERROR = '#DC2626';

interface Props {
    value: string;
    onChangeText: (text: string) => void;
    onMax: () => void;
    asset: string;
    available: string;
    error?: string;
    editable?: boolean;
}

/** Decimal amount input with an inline "Max" button, available-balance label,
 *  and a validation message. */
export function AmountField({
    value,
    onChangeText,
    onMax,
    asset,
    available,
    error,
    editable = true,
}: Props) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <ThemedText type="small" themeColor="textSecondary">
                    Amount
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                    Available {formatTokenAmount(available)} {asset}
                </ThemedText>
            </View>

            <View
                style={[
                    styles.inputRow,
                    {
                        backgroundColor: theme.backgroundElement,
                        borderColor: error ? ERROR : theme.backgroundSelected,
                    },
                ]}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    editable={editable}
                    placeholder="0.0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    autoCorrect={false}
                    accessibilityLabel={`Amount of ${asset} to claim`}
                    style={[styles.input, { color: theme.text }]}
                />
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Use maximum amount"
                    disabled={!editable}
                    onPress={onMax}
                    style={({ pressed }) => [
                        styles.max,
                        { opacity: !editable ? 0.5 : pressed ? 0.6 : 1 },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: ACCENT }}>
                        MAX
                    </ThemedText>
                </Pressable>
            </View>

            {error ? (
                <ThemedText type="small" style={{ color: ERROR }}>
                    {error}
                </ThemedText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.two,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Spacing.three,
        paddingHorizontal: Spacing.three,
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        paddingVertical: Spacing.three,
    },
    max: {
        paddingVertical: Spacing.two,
        paddingLeft: Spacing.three,
    },
});
