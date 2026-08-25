import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Image, Dimensions } from 'react-native';
import { useFoodStore } from '../../src/stores/foodStore';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const { entries, goals } = useFoodStore();

    // Calculate today's totals
    const today = new Date().setHours(0, 0, 0, 0);
    const todaysEntries = entries.filter(e => new Date(e.timestamp).setHours(0, 0, 0, 0) === today);

    const totals = todaysEntries.reduce((acc, entry) => ({
        calories: acc.calories + entry.calories,
        carbs: acc.carbs + entry.carbs,
        protein: acc.protein + entry.protein,
        fat: acc.fat + entry.fat,
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });

    const mockExerciseCals = 10;
    const remainingCals = goals.calories - totals.calories + mockExerciseCals;

    const [activeSlide, setActiveSlide] = useState(0);

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        setActiveSlide(Math.round(index));
    };

    const renderMacroCard = (title: string, current: number, target: number, color: string) => {
        const remaining = Math.max(target - current, 0);

        return (
            <View style={{ width }}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
                    <Text style={styles.cardSubtitle}>Remaining = Target - Consumed</Text>

                    <View style={styles.caloriesContent}>
                        <View style={[styles.circleWrapper, { borderTopColor: color, borderRightColor: color, borderColor: `${color}20` }]}>
                            <View style={styles.progressCircle}>
                                <Text style={[styles.remainingNumber, { color: theme.text }]}>{remaining}</Text>
                                <Text style={styles.remainingLabel}>Remaining</Text>
                            </View>
                        </View>

                        <View style={styles.statsList}>
                            <View style={styles.statRow}>
                                <Ionicons name="flag" size={18} color="#8E8E93" style={styles.statIcon} />
                                <View>
                                    <Text style={styles.statLabel}>Target</Text>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{target}g</Text>
                                </View>
                            </View>
                            <View style={styles.statRow}>
                                <Ionicons name="restaurant" size={18} color={color} style={styles.statIcon} />
                                <View>
                                    <Text style={styles.statLabel}>Consumed</Text>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{current}g</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background === '#000000' ? '#000' : '#F5F6FA' }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.yellowAccent} />
                    <View style={styles.headerContent}>
                        <View style={styles.profileImageContainer}>
                            <Image
                                source={{ uri: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff' }}
                                style={styles.profileImage}
                            />
                            <View style={styles.proBadge}>
                                <Ionicons name="star" size={10} color="#FFF" />
                            </View>
                        </View>
                        <Text style={[styles.greeting, { color: theme.text }]}>We're so happy{'\n'}to see you again!</Text>
                        <Pressable style={styles.bellIcon}>
                            <Ionicons name="notifications-outline" size={24} color={theme.text} />
                            <View style={styles.notificationDot} />
                        </Pressable>
                    </View>
                </View>

                {/* Carousel Section */}
                <View>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        snapToInterval={width}
                        decelerationRate="fast"
                    >
                        {/* Slide 1: Calories Card */}
                        <View style={{ width }}>
                            <View style={[styles.card, { backgroundColor: theme.card, marginHorizontal: 20 }]}>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>Calories</Text>
                                <Text style={styles.cardSubtitle}>Remaining = Goal - Food + Exercise</Text>

                                <View style={styles.caloriesContent}>
                                    {/* Left: Circle */}
                                    <View style={styles.circleWrapper}>
                                        <View style={styles.progressCircle}>
                                            <Text style={[styles.remainingNumber, { color: theme.text }]}>{remainingCals}</Text>
                                            <Text style={styles.remainingLabel}>Remaining</Text>
                                        </View>
                                    </View>

                                    {/* Right: Stats */}
                                    <View style={styles.statsList}>
                                        <View style={styles.statRow}>
                                            <Ionicons name="flag" size={18} color="#8E8E93" style={styles.statIcon} />
                                            <View>
                                                <Text style={styles.statLabel}>Base Goal</Text>
                                                <Text style={[styles.statValue, { color: theme.text }]}>{goals.calories}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.statRow}>
                                            <Ionicons name="restaurant" size={18} color="#0055FF" style={styles.statIcon} />
                                            <View>
                                                <Text style={styles.statLabel}>Food</Text>
                                                <Text style={[styles.statValue, { color: theme.text }]}>{totals.calories}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.statRow}>
                                            <Ionicons name="flame" size={18} color="#FF9500" style={styles.statIcon} />
                                            <View>
                                                <Text style={styles.statLabel}>Exercise</Text>
                                                <Text style={[styles.statValue, { color: theme.text }]}>{mockExerciseCals}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Slide 2: Carbs */}
                        {renderMacroCard('Carbs', totals.carbs || 0, goals.carbs, theme.carbs)}

                        {/* Slide 3: Protein */}
                        {renderMacroCard('Protein', totals.protein || 0, goals.protein, theme.protein)}

                        {/* Slide 4: Fats */}
                        {renderMacroCard('Fats', totals.fat || 0, goals.fat, theme.fat)}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                        {[0, 1, 2, 3].map((i) => (
                            <View key={i} style={[styles.dot, activeSlide === i && styles.dotActive]} />
                        ))}
                    </View>
                </View>

                {/* Secondary Cards */}
                <View style={styles.rowCards}>
                    {/* Steps Card */}
                    <View style={[styles.smallCard, { backgroundColor: theme.card }]}>
                        <View style={styles.smallCardHeader}>
                            <Text style={[styles.smallCardTitle, { color: theme.text }]}>Steps</Text>
                        </View>
                        <View style={styles.smallCardContent}>
                            <Ionicons name="footsteps" size={24} color="#FF2D55" style={{ marginRight: 8 }} />
                            <Text style={[styles.smallCardValue, { color: theme.text }]}>3,550</Text>
                        </View>
                        <Text style={styles.smallCardSub}>Goal: 10,000 steps</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '35%', backgroundColor: '#FF2D55' }]} />
                        </View>
                    </View>

                    {/* Exercise Card */}
                    <View style={[styles.smallCard, { backgroundColor: theme.card }]}>
                        <View style={styles.smallCardHeader}>
                            <Text style={[styles.smallCardTitle, { color: theme.text }]}>Exercise</Text>
                            <Ionicons name="add" size={20} color={theme.text} />
                        </View>
                        <View style={styles.exerciseRow}>
                            <Ionicons name="flame" size={18} color="#FF9500" style={{ marginRight: 8 }} />
                            <Text style={[styles.exerciseValue, { color: theme.text }]}>10 cal</Text>
                        </View>
                        <View style={styles.exerciseRow}>
                            <Ionicons name="time" size={18} color="#FF9500" style={{ marginRight: 8 }} />
                            <Text style={[styles.exerciseValue, { color: theme.text }]}>0:10 hr</Text>
                        </View>
                    </View>
                </View>

                {/* Progress Section */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Progress</Text>
                <View style={[styles.progressCard, { backgroundColor: theme.card }]}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressTitle, { color: theme.text }]}>Steps</Text>
                        <Text style={styles.progressDevice}>Galaxy S23</Text>
                    </View>
                    <View style={styles.progressChartPlaceholder}>
                        <View style={[styles.chartBar, { height: 40 }]} />
                        <View style={[styles.chartBar, { height: 60 }]} />
                        <View style={[styles.chartBar, { height: 30 }]} />
                        <View style={[styles.chartBar, { height: 80 }]} />
                        <View style={[styles.chartBar, { height: 50 }]} />
                        <View style={[styles.chartBar, { height: 90 }]} />
                        <View style={[styles.chartBar, { height: 45, backgroundColor: '#0055FF' }]} />
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
        position: 'relative',
    },
    yellowAccent: {
        position: 'absolute',
        top: -50,
        left: 0,
        width: 120,
        height: 120,
        backgroundColor: '#FFD600',
        borderBottomRightRadius: 60,
        zIndex: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
        marginTop: 20,
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 16,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    proBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#0055FF',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    greeting: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
    },
    bellIcon: {
        padding: 8,
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF2D55',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    card: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 24,
    },
    caloriesContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    circleWrapper: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 8,
        borderColor: '#E5E5EA',
        borderTopColor: '#0055FF',
        borderRightColor: '#0055FF',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-45deg' }],
    },
    progressCircle: {
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
    },
    remainingNumber: {
        fontSize: 28,
        fontWeight: '800',
    },
    remainingLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '600',
    },
    statsList: {
        flex: 1,
        marginLeft: 24,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    statLabel: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D1D1D6',
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: '#0055FF',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    rowCards: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    smallCard: {
        width: (width - 56) / 2,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    smallCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    smallCardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    smallCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    smallCardValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    smallCardSub: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 8,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F2F2F7',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    progressCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    progressDevice: {
        fontSize: 14,
        color: '#8E8E93',
    },
    progressChartPlaceholder: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 100,
        paddingHorizontal: 10,
    },
    chartBar: {
        width: 24,
        backgroundColor: '#E5E5EA',
        borderRadius: 4,
    }
});
