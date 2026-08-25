import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, Image } from 'react-native';
import { useFoodStore } from '../../src/stores/foodStore';
import { Colors } from '../../src/constants/colors';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { FoodEntry } from '../../src/types';

export default function HistoryScreen() {
    const { theme } = useAppTheme();
    const styles = getStyles(theme);

    const { entries, removeEntry } = useFoodStore();
    const [expandedDate, setExpandedDate] = useState<string | null>(null);

    // Group entries by date
    const groupedEntries = entries.reduce((acc, entry) => {
        const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        if (!acc[date]) {
            acc[date] = {
                entries: [],
                totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
            };
        }

        acc[date].entries.push(entry);
        acc[date].totals.calories += entry.calories;
        acc[date].totals.protein += entry.protein;
        acc[date].totals.carbs += entry.carbs;
        acc[date].totals.fat += entry.fat;

        return acc;
    }, {} as Record<string, { entries: FoodEntry[], totals: any }>);

    // Sort dates descending
    const sortedDates = Object.keys(groupedEntries).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
    });

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete Entry',
            `Are you sure you want to delete ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => removeEntry(id)
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>History</Text>

                {sortedDates.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={theme.border} />
                        <Text style={styles.emptyStateText}>No history yet</Text>
                        <Text style={styles.emptyStateSub}>Your logged meals will appear here.</Text>
                    </View>
                ) : (
                    sortedDates.map((date) => {
                        const dayData = groupedEntries[date];
                        const isExpanded = expandedDate === date;

                        return (
                            <View key={date} style={styles.dayCard}>
                                <Pressable
                                    style={styles.dayHeader}
                                    onPress={() => setExpandedDate(isExpanded ? null : date)}
                                >
                                    <View>
                                        <Text style={styles.dateText}>{date}</Text>
                                        <Text style={styles.dayCalories}>
                                            <Text style={{ color: theme.primary }}>{dayData.totals.calories}</Text> kcal
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color={theme.textMuted}
                                    />
                                </Pressable>

                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        <View style={styles.dayMacros}>
                                            <View style={styles.macroBadge}>
                                                <Text style={[styles.macroValue, { color: theme.protein }]}>{dayData.totals.protein}g</Text>
                                                <Text style={styles.macroLabel}>Protein</Text>
                                            </View>
                                            <View style={styles.macroBadge}>
                                                <Text style={[styles.macroValue, { color: theme.carbs }]}>{dayData.totals.carbs}g</Text>
                                                <Text style={styles.macroLabel}>Carbs</Text>
                                            </View>
                                            <View style={styles.macroBadge}>
                                                <Text style={[styles.macroValue, { color: theme.fat }]}>{dayData.totals.fat}g</Text>
                                                <Text style={styles.macroLabel}>Fat</Text>
                                            </View>
                                        </View>

                                        <View style={styles.entryList}>
                                            {dayData.entries.map((entry) => (
                                                <View key={entry.id} style={styles.entryItem}>
                                                    {entry.imageUri ? (
                                                        <Image source={{ uri: entry.imageUri }} style={styles.entryImage} />
                                                    ) : (
                                                        <View style={styles.entryIconFallback}>
                                                            <Ionicons name="restaurant" size={16} color={theme.primary} />
                                                        </View>
                                                    )}
                                                    <View style={styles.entryInfo}>
                                                        <Text style={styles.entryName}>{entry.name}</Text>
                                                        <Text style={styles.entryDetails}>
                                                            {entry.mealType} • {entry.calories} kcal
                                                        </Text>
                                                    </View>
                                                    <Pressable
                                                        style={styles.deleteButton}
                                                        onPress={() => handleDelete(entry.id, entry.name)}
                                                    >
                                                        <Ionicons name="trash-outline" size={20} color={theme.accent} />
                                                    </Pressable>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
    dayCard: {
        backgroundColor: theme.card,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 4,
    },
    dayCalories: {
        fontSize: 14,
        color: theme.textMuted,
        fontWeight: '700',
    },
    expandedContent: {
        borderTopWidth: 1,
        borderTopColor: theme.border,
        backgroundColor: theme.background,
    },
    dayMacros: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    macroBadge: {
        alignItems: 'center',
        backgroundColor: theme.card,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    macroValue: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    macroLabel: {
        fontSize: 11,
        color: theme.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    entryList: {
        padding: 16,
    },
    entryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    entryImage: {
        width: 44,
        height: 44,
        borderRadius: 12,
        marginRight: 12,
    },
    entryIconFallback: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${theme.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    entryInfo: {
        flex: 1,
    },
    entryName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 4,
    },
    entryDetails: {
        fontSize: 13,
        color: theme.textMuted,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 8,
        backgroundColor: `${theme.accent}15`,
        borderRadius: 12,
    },
});
