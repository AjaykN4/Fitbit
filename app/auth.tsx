import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../src/stores/foodStore';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { theme } = useAppTheme();
    const setSkipAuth = useFoodStore(state => state.setSkipAuth);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) Alert.alert('Error', error.message);
        else router.replace('/(tabs)');
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) Alert.alert('Error', error.message);
        else if (!session) Alert.alert('Account Created!', 'Please check your inbox for email verification, or disable it in Supabase.');
        else router.replace('/(tabs)');
        setLoading(false);
    }

    const handleSkip = () => {
        setSkipAuth(true);
        router.replace('/(tabs)');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
                <View style={styles.overlay}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="flash" size={40} color="#FFD600" />
                            </View>
                            <Text style={styles.title}>Elevate</Text>
                            <Text style={styles.subtitle}>Your premium fitness journey starts here.</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        onChangeText={(text) => setEmail(text)}
                                        value={email}
                                        placeholder="Email Address"
                                        placeholderTextColor="#8E8E93"
                                        autoCapitalize={'none'}
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        onChangeText={(text) => setPassword(text)}
                                        value={password}
                                        secureTextEntry={true}
                                        placeholder="Password"
                                        placeholderTextColor="#8E8E93"
                                        autoCapitalize={'none'}
                                    />
                                </View>
                            </View>

                            <View style={styles.buttonContainer}>
                                <Pressable
                                    style={styles.primaryButton}
                                    disabled={loading}
                                    onPress={signInWithEmail}
                                >
                                    <Text style={styles.primaryButtonText}>Sign In</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.secondaryButton}
                                    disabled={loading}
                                    onPress={signUpWithEmail}
                                >
                                    <Text style={styles.secondaryButtonText}>Create Account</Text>
                                </Pressable>
                            </View>
                        </View>

                        <Pressable style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>Skip for now</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        </Pressable>
                    </View>
                </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1A',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
    },
    content: {
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 8,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    card: {
        padding: 24,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 60,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    buttonContainer: {
        marginTop: 8,
        gap: 12,
    },
    primaryButton: {
        height: 60,
        borderRadius: 20,
        backgroundColor: '#0055FF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0055FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    secondaryButton: {
        height: 60,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    secondaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    skipButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        opacity: 0.8,
    }
});
