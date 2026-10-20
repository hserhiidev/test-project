import {
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BalanceItem } from '@/shared/api';
import { formatUsd, totalAvailableUsd } from '@/shared/money';

import { BalanceRow } from './components/balance-row';
import { FreshnessRow } from './components/freshness-row';
import { useBalances } from './use-balances';

// On web the tab bar floats over the top of the screen, so content needs room
// to clear it. Native tabs sit at the bottom (see BottomTabInset).
const TOP_INSET = Platform.OS === 'web' ? Spacing.six + Spacing.three : Spacing.three;

export function BalancesScreen() {
    const theme = useTheme();
    const { data, isLoading, isError, error, isFetching, isRefetching, refetch } =
        useBalances();

    const refresh = () => {
        void refetch();
    };

    let body: React.ReactNode;
    if (isLoading) {
        body = <Spinner label="Loading balances…" />;
    } else if (isError && !data) {
        body = <ErrorState error={error} onRetry={refresh} retrying={isFetching} />;
    } else {
        const items = data?.items ?? [];
        body = (
            <FlatList<BalanceItem>
                data={items}
                keyExtractor={(item) => item.asset}
                renderItem={({ item }) => <BalanceRow item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refresh}
                        tintColor={theme.text}
                        colors={[theme.text]}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <ThemedText type="small" themeColor="textSecondary">
                            Total balance (USD)
                        </ThemedText>
                        <ThemedText type="title">
                            {formatUsd(totalAvailableUsd(items))}
                        </ThemedText>
                        {data ? (
                            <FreshnessRow
                                asOf={data.asOf}
                                onRefresh={refresh}
                                refreshing={isFetching}
                            />
                        ) : null}
                    </View>
                }
                ListEmptyComponent={
                    <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.empty}>
                        No assets yet.
                    </ThemedText>
                }
            />
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                {body}
            </SafeAreaView>
        </ThemedView>
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
    listContent: {
        gap: Spacing.two,
        paddingHorizontal: Spacing.four,
        paddingTop: TOP_INSET,
        paddingBottom: BottomTabInset + Spacing.four,
    },
    header: {
        gap: Spacing.two,
        paddingBottom: Spacing.two,
    },
    empty: {
        textAlign: 'center',
        paddingVertical: Spacing.five,
    },
});
