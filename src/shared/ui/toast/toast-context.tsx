// CashMine · shared/ui/toast — ToastProvider + host.
// Subscribes to the toast event bus and renders an auto-dismissing, safe-area
// aware stack of toasts using React Native's built-in Animated (no extra deps).

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    subscribeToasts,
    toast,
    type ToastItem,
    type ToastType,
} from './toast-emitter';

interface ToastContextValue {
    show: typeof toast.show;
    error: typeof toast.error;
    success: typeof toast.success;
    info: typeof toast.info;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: string) => {
        setItems((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(
        () => subscribeToasts((item) => setItems((prev) => [...prev, item])),
        [],
    );

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastViewport items={items} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

function ToastViewport({
    items,
    onDismiss,
}: {
    items: ToastItem[];
    onDismiss: (id: string) => void;
}) {
    const insets = useSafeAreaInsets();
    if (items.length === 0) return null;
    return (
        <View
            pointerEvents="box-none"
            style={[styles.viewport, { top: insets.top + 8 }]}
        >
            {items.map((item) => (
                <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
            ))}
        </View>
    );
}

const ACCENT: Record<ToastType, { light: string; dark: string }> = {
    error: { light: '#DC2626', dark: '#F87171' },
    success: { light: '#16A34A', dark: '#4ADE80' },
    info: { light: '#208AEF', dark: '#60A5FA' },
};

function ToastCard({
    item,
    onDismiss,
}: {
    item: ToastItem;
    onDismiss: (id: string) => void;
}) {
    const dark = (useColorScheme() ?? 'light') === 'dark';
    // useState (not useRef) so the value isn't read via a ref during render,
    // which the react-hooks/refs lint rule forbids. Still created exactly once.
    const [progress] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => onDismiss(item.id), item.duration);
        return () => clearTimeout(timer);
    }, [item.id, item.duration, onDismiss, progress]);

    const accent = ACCENT[item.type][dark ? 'dark' : 'light'];

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    backgroundColor: dark ? '#1F2937' : '#FFFFFF',
                    borderLeftColor: accent,
                    opacity: progress,
                    transform: [
                        {
                            translateY: progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-12, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <Pressable
                accessibilityRole="button"
                onPress={() => onDismiss(item.id)}
                style={styles.pressable}
            >
                <Text
                    style={[styles.message, { color: dark ? '#F9FAFB' : '#111827' }]}
                >
                    {item.message}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    viewport: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 8,
        zIndex: 9999,
    },
    card: {
        width: '100%',
        maxWidth: 480,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    pressable: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
    },
});
