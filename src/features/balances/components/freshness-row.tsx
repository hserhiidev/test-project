import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime, secondsSince } from '@/shared/time';

const FRESH_COLOR = '#16A34A';
const STALE_COLOR = '#F59E0B';
// Balances poll every 15s; flag the snapshot as stale once it drifts well past
// that window so a paused/offline poll is visible to the user.
const STALE_AFTER_SECONDS = 40;

interface Props {
    asOf: string;
    onRefresh: () => void;
    refreshing: boolean;
}

/** "Updated 5s ago" freshness line with a status dot and a manual refresh
 *  control. The relative label ticks every second on its own. */
export function FreshnessRow({ asOf, onRefresh, refreshing }: Props) {
    const theme = useTheme();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const seconds = secondsSince(asOf, now);
    const stale = Number.isNaN(seconds) || seconds > STALE_AFTER_SECONDS;

    return (
        <View style={styles.row}>
            <View style={styles.status}>
                <View
                    style={[
                        styles.dot,
                        { backgroundColor: stale ? STALE_COLOR : FRESH_COLOR },
                    ]}
                />
                <ThemedText type="small" themeColor="textSecondary">
                    Updated {formatRelativeTime(asOf, now)}
                </ThemedText>
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh balances"
                disabled={refreshing}
                onPress={onRefresh}
                style={({ pressed }) => [
                    styles.refresh,
                    { opacity: refreshing ? 0.6 : pressed ? 0.7 : 1 },
                ]}>
                {refreshing ? (
                    <ActivityIndicator size="small" color={theme.text} />
                ) : (
                    <ThemedText type="link" themeColor="text">
                        Refresh
                    </ThemedText>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    status: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    refresh: {
        minHeight: 32,
        minWidth: 64,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
});
