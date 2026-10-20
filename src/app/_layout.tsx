import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { createQueryClient } from '@/shared/api';
import { AuthGate, AuthProvider } from '@/shared/auth';
import { ToastProvider } from '@/shared/ui/toast';

// Keep the splash screen up until auth hydration finishes (see AuthProvider).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [queryClient] = useState(() => createQueryClient());

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <ThemeProvider
                        value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
                    >
                        <ToastProvider>
                            <AuthGate>
                                <AppTabs />
                            </AuthGate>
                            <StatusBar style="auto" />
                        </ToastProvider>
                    </ThemeProvider>
                </AuthProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
