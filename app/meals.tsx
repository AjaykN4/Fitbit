import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Image } from 'react-native';
import { useFoodStore } from '../src/stores/foodStore';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const getFoodIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('apple') || lower.includes('fruit') || lower.includes('banana')) return 'nutrition';
    if (lower.includes('chicken') || lower.includes('meat') || lower.includes('beef')) return 'restaurant';
    if (lower.includes('rice') || lower.includes('bowl') || lower.includes('pasta')) return 'fast-food';
    if (lower.includes('veg') || lower.includes('salad') || lower.includes('green')) return 'leaf';
    if (lower.includes('water') || lower.includes('drink')) return 'water';
    return 'restaurant-outline';
};

export default function MealsScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const styles = getStyles(theme);

    const { entries, removeEntry } = useFoodStore();

    const today = new Date().setHours(0, 0, 0, 0);
    const todaysEntries = entries.filter(e => new Date(e.timestamp).setHours(0, 0, 0, 0) === today);

    const groupedMeals = todaysEntries.reduce((acc, entry) => {
        if (!acc[entry.mealType]) {
            acc[entry.mealType] = [];
        }
        acc[entry.mealType].push(entry);
        return acc;
    }, {} as Record<string, typeof entries>);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {Object.keys(groupedMeals).length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={64} color={theme.border} />
                        <Text style={styles.emptyStateText}>No meals logged today</Text>
                        <Text style={styles.emptyStateSub}>Go to the Log tab to add your first meal!</Text>
                    </View>
                ) : (
                    Object.entries(groupedMeals).map(([mealType, mealEntries]) => {
                        const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

                        return (
                            <View key={mealType} style={styles.mealSection}>
                                <View style={styles.mealHeader}>
                                    <Text style={styles.mealTitle}>{mealType}</Text>
                                    <Text style={styles.mealCalories}>{mealCalories} cal</Text>
                                </View>

                                {mealEntries.map((entry) => (
                                    <View key={entry.id} style={styles.foodItem}>
                                        {entry.imageUri ? (
                                            <Image source={{ uri: entry.imageUri }} style={styles.foodImage} />
                                        ) : (
                                            <View style={styles.foodIconFallback}>
                                                <Ionicons name={getFoodIcon(entry.name)} size={20} color={theme.primary} />
                                            </View>
                                        )}
                                        <View style={styles.foodInfo}>
                                            <Text style={styles.foodName}>{entry.name}</Text>
                                            <Text style={styles.foodMacros}>
                                                P: {entry.protein}g • C: {entry.carbs}g • F: {entry.fat}g
                                            </Text>
                                        </View>
                                        <Pressable onPress={() => removeEntry(entry.id)} style={styles.deleteBtn}>
                                            <Ionicons name="trash-outline" size={20} color={theme.accent} />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        );
                    })
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyStateText: {
        color: theme.text,
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSub: {
        color: theme.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    mealSection: {
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    mealTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
    },
    mealCalories: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.primary,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    foodImage: {
        width: 48,
        height: 48,
        borderRadius: 16,
        marginRight: 12,
    },
    foodIconFallback: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: `${theme.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 4,
    },
    foodMacros: {
        fontSize: 13,
        color: theme.textMuted,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 8,
        backgroundColor: `${theme.accent}15`,
        borderRadius: 12,
    },
});
