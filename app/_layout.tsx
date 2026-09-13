import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useFoodStore } from '../src/stores/foodStore';

export default function RootLayout() {
    const { colorScheme, theme } = useAppTheme();
    const [session, setSession] = useState<Session | null>(null);
    const segments = useSegments();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();
    const fetchCloudData = useFoodStore(state => state.fetchCloudData);
    const skipAuth = useFoodStore(state => state.skipAuth);
    const subscribeToRealtime = useFoodStore(state => state.subscribeToRealtime);
    const unsubscribeFromRealtime = useFoodStore(state => state.unsubscribeFromRealtime);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchCloudData();
                subscribeToRealtime();
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchCloudData();
                subscribeToRealtime();
            } else {
                unsubscribeFromRealtime();
            }
        });

        return () => {
            subscription.unsubscribe();
            unsubscribeFromRealtime();
        };
    }, []);

    useEffect(() => {
        if (!rootNavigationState?.key) return;

        const inAuthGroup = segments[0] === 'auth';

        // Use setTimeout to ensure the layout has fully mounted before navigating
        if (!session && !skipAuth && !inAuthGroup) {
            setTimeout(() => {
                router.replace('/auth');
            }, 1);
        } else if ((session || skipAuth) && inAuthGroup) {
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 1);
        }
    }, [session, skipAuth, segments, rootNavigationState?.key]);

    return (
        <>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: theme.background },
                    headerTintColor: theme.text,
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: theme.background },
                }}
            >
                <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="auth"
                    options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                    name="meals"
                    options={{
                        presentation: 'modal',
                        title: "Today's Meals",
                        headerShown: true,
                        headerStyle: { backgroundColor: theme.card },
                    }}
                />
            </Stack>
        </>
    );
}
