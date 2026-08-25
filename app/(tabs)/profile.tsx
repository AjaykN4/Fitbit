import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useFoodStore } from '../../src/stores/foodStore';
import { Colors } from '../../src/constants/colors';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
    const { theme, colorScheme } = useAppTheme();
    const styles = getStyles(theme);

    const { entries, clearAllData, userStats, themePreference, setThemePreference } = useFoodStore();

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'Are you sure you want to delete all your food logs and reset your goals? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Data',
                    style: 'destructive',
                    onPress: () => {
                        clearAllData();
                        Alert.alert('Success', 'All data has been cleared.');
                    }
                }
            ]
        );
    };

    const totalDaysLogged = new Set(
        entries.map(e => new Date(e.timestamp).toLocaleDateString())
    ).size;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Profile</Text>

                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color={theme.primary} />
                    </View>
                    <Text style={styles.name}>Athlete</Text>
                    <Text style={styles.memberSince}>Level 1 Tracker</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="flame" size={24} color={theme.primary} style={styles.statIcon} />
                        <Text style={styles.statValue}>{totalDaysLogged}</Text>
                        <Text style={styles.statLabel}>Days Logged</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="restaurant" size={24} color={theme.secondary} style={styles.statIcon} />
                        <Text style={styles.statValue}>{entries.length}</Text>
                        <Text style={styles.statLabel}>Total Meals</Text>
                    </View>
                </View>

                {userStats && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Your Stats</Text>
                        <View style={styles.statRow}>
                            <Text style={styles.statKey}>Gender</Text>
                            <Text style={styles.statVal}>{userStats.gender.toUpperCase()}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statKey}>Age</Text>
                            <Text style={styles.statVal}>{userStats.age} yrs</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statKey}>Weight</Text>
                            <Text style={styles.statVal}>{userStats.weight} kg</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statKey}>Height</Text>
                            <Text style={styles.statVal}>{userStats.height} cm</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statKey}>Goal</Text>
                            <Text style={styles.statVal}>{userStats.goal.toUpperCase()}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <Pressable style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: `${theme.primary}15` }]}>
                                <Ionicons name="notifications" size={20} color={theme.primary} />
                            </View>
                            <Text style={styles.settingText}>Notifications</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </Pressable>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: `${theme.secondary}15` }]}>
                                <Ionicons name="color-palette" size={20} color={theme.secondary} />
                            </View>
                            <Text style={styles.settingText}>Theme</Text>
                        </View>
                        <View style={styles.themeToggle}>
                            <Pressable
                                style={[styles.themeBtn, themePreference === 'light' && styles.themeBtnActive]}
                                onPress={() => setThemePreference('light')}
                            >
                                <Ionicons name="sunny" size={16} color={themePreference === 'light' ? '#FFF' : theme.textMuted} />
                            </Pressable>
                            <Pressable
                                style={[styles.themeBtn, themePreference === 'system' && styles.themeBtnActive]}
                                onPress={() => setThemePreference('system')}
                            >
                                <Ionicons name="phone-portrait" size={16} color={themePreference === 'system' ? '#FFF' : theme.textMuted} />
                            </Pressable>
                            <Pressable
                                style={[styles.themeBtn, themePreference === 'dark' && styles.themeBtnActive]}
                                onPress={() => setThemePreference('dark')}
                            >
                                <Ionicons name="moon" size={16} color={themePreference === 'dark' ? '#FFF' : theme.textMuted} />
                            </Pressable>
                        </View>
                    </View>

                    <Pressable style={styles.settingRow} onPress={handleClearData}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: `${theme.accent}15` }]}>
                                <Ionicons name="trash" size={20} color={theme.accent} />
                            </View>
                            <Text style={[styles.settingText, { color: theme.accent }]}>Clear All Data</Text>
                        </View>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Fitbit Clone v1.0.0</Text>
                    <Text style={styles.madeWithText}>Built with React Native & Expo</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <Pressable style={styles.logoutButton} onPress={() => supabase.auth.signOut()}>
                        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </Pressable>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const getStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.text,
        marginBottom: 24,
        letterSpacing: -1,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${theme.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.primary,
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.text,
        marginBottom: 4,
    },
    memberSince: {
        fontSize: 14,
        color: theme.primary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    statIcon: {
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 16,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    statKey: {
        color: theme.textMuted,
        fontSize: 15,
        fontWeight: '600',
    },
    statVal: {
        color: theme.text,
        fontSize: 15,
        fontWeight: '800',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
    },
    themeToggle: {
        flexDirection: 'row',
        backgroundColor: theme.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 2,
    },
    themeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    themeBtnActive: {
        backgroundColor: theme.secondary,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    versionText: {
        color: theme.textMuted,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    madeWithText: {
        color: theme.textMuted,
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.5,
    },
    section: {
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FF3B3020',
        justifyContent: 'center',
        gap: 8,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '700',
    }
});
