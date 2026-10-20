// CashMine · shared/auth — minimal token-entry UI shown by AuthGate when there
// is no stored token. The token is provided externally (task email); there is
// no login endpoint.

import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
    onSubmit: (token: string) => Promise<void>;
}

export function TokenEntryScreen({ onSubmit }: Props) {
    const dark = (useColorScheme() ?? 'light') === 'dark';
    const [value, setValue] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const trimmed = value.trim();
    const disabled = trimmed.length === 0 || submitting;

    const handleSubmit = async () => {
        if (trimmed.length === 0 || submitting) return;
        setSubmitting(true);
        try {
            await onSubmit(trimmed);
        } finally {
            setSubmitting(false);
        }
    };

    const c = dark
        ? {
              bg: '#0B1120',
              card: '#111827',
              fg: '#F9FAFB',
              sub: '#94A3B8',
              input: '#0B1120',
              border: '#1F2937',
          }
        : {
              bg: '#F8FAFC',
              card: '#FFFFFF',
              fg: '#0F172A',
              sub: '#64748B',
              input: '#F1F5F9',
              border: '#E2E8F0',
          };

    return (
        <View
            style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: c.bg }]}
        >
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.center}
                >
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: c.card, borderColor: c.border },
                        ]}
                    >
                        <Text style={[styles.title, { color: c.fg }]}>
                            Connect to CashMine
                        </Text>
                        <Text style={[styles.subtitle, { color: c.sub }]}>
                            Paste the API token to continue.
                        </Text>
                        <TextInput
                            value={value}
                            onChangeText={setValue}
                            placeholder="API token"
                            placeholderTextColor={c.sub}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="off"
                            editable={!submitting}
                            onSubmitEditing={handleSubmit}
                            returnKeyType="go"
                            style={[
                                styles.input,
                                {
                                    backgroundColor: c.input,
                                    borderColor: c.border,
                                    color: c.fg,
                                },
                            ]}
                        />
                        <Pressable
                            accessibilityRole="button"
                            disabled={disabled}
                            onPress={handleSubmit}
                            style={[styles.button, { opacity: disabled ? 0.5 : 1 }]}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonLabel}>Save token</Text>
                            )}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        zIndex: 1000,
    },
    safe: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 24,
        gap: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    button: {
        marginTop: 4,
        backgroundColor: '#208AEF',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
