import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useFoodStore } from '../../src/stores/foodStore';
import { Colors } from '../../src/constants/colors';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';

const ACTIVITY_LEVELS = [
    { id: 'sedentary', label: 'Sedentary', desc: 'Little/no exercise' },
    { id: 'light', label: 'Light', desc: '1-3 days/week' },
    { id: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
    { id: 'active', label: 'Active', desc: '6-7 days/week' },
    { id: 'very_active', label: 'Very Active', desc: 'Hard daily exercise' },
];

const GOALS = [
    { id: 'lose_fast', label: 'Lose Fast (1kg/wk)', modifier: -1000 },
    { id: 'lose', label: 'Lose Weight (0.5kg/wk)', modifier: -500 },
    { id: 'maintain', label: 'Maintain Weight', modifier: 0 },
    { id: 'gain', label: 'Gain Weight (0.5kg/wk)', modifier: 500 },
    { id: 'gain_fast', label: 'Gain Fast (1kg/wk)', modifier: 1000 },
];

const METHODS = [
    {
        id: 'mifflin',
        name: 'Mifflin-St Jeor',
        desc: 'Most accurate for modern lifestyles. Endorsed by the ADA.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/'
    },
    {
        id: 'harris',
        name: 'Harris-Benedict',
        desc: 'Original 1919 formula, revised in 1984. Slightly overestimates.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/6741850/'
    },
    {
        id: 'katch',
        name: 'Katch-McArdle',
        desc: 'Most accurate if you know your exact body fat percentage.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16277816/'
    }
];

export default function GoalsScreen() {
    const { theme } = useAppTheme();
    const styles = getStyles(theme);

    const { goals, updateGoals, userStats, updateUserStats } = useFoodStore();

    // Manual overrides
    const [manualCalories, setManualCalories] = useState(goals.calories.toString());
    const [manualProtein, setManualProtein] = useState(goals.protein.toString());
    const [manualCarbs, setManualCarbs] = useState(goals.carbs.toString());
    const [manualFat, setManualFat] = useState(goals.fat.toString());

    // Calculator state
    const [gender, setGender] = useState<'male' | 'female'>(userStats?.gender || 'male');
    const [age, setAge] = useState(userStats?.age?.toString() || '25');
    const [weight, setWeight] = useState(userStats?.weight?.toString() || '70');
    const [height, setHeight] = useState(userStats?.height?.toString() || '170');
    const [bodyFat, setBodyFat] = useState('15');
    const [activity, setActivity] = useState(userStats?.activityLevel || 'moderate');
    const [goal, setGoal] = useState(userStats?.goal || 'maintain');
    const [method, setMethod] = useState('mifflin');
    const [isCalculatorVisible, setCalculatorVisible] = useState(false);

    const calculateMacros = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const a = parseInt(age);
        const bf = parseFloat(bodyFat);

        if (!w || !h || !a || (method === 'katch' && !bf)) {
            Alert.alert('Error', 'Please fill in all stats correctly.');
            return;
        }

        let bmr = 0;

        if (method === 'mifflin') {
            bmr = (10 * w) + (6.25 * h) - (5 * a);
            bmr += gender === 'male' ? 5 : -161;
        } else if (method === 'harris') {
            if (gender === 'male') {
                bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
            } else {
                bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
            }
        } else if (method === 'katch') {
            const leanMass = w * (1 - (bf / 100));
            bmr = 370 + (21.6 * leanMass);
        }

        const multipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9
        };

        let tdee = bmr * multipliers[activity as keyof typeof multipliers];

        const goalModifier = GOALS.find(g => g.id === goal)?.modifier || 0;
        const targetCalories = Math.round(tdee + goalModifier);

        // High Protein Split (2.2g per kg)
        const targetProtein = Math.round(w * 2.2);
        const proteinCals = targetProtein * 4;

        // Fat (25% of cals)
        const targetFat = Math.round((targetCalories * 0.25) / 9);
        const fatCals = targetFat * 9;

        // Carbs (Rest)
        const targetCarbs = Math.round((targetCalories - proteinCals - fatCals) / 4);

        setManualCalories(targetCalories.toString());
        setManualProtein(targetProtein.toString());
        setManualCarbs(targetCarbs.toString());
        setManualFat(targetFat.toString());

        updateUserStats({
            gender,
            age: a,
            weight: w,
            height: h,
            activityLevel: activity as any,
            goal: goal as any
        });

        Alert.alert('Calculated!', `Your TDEE is ~${Math.round(tdee)} kcal. Macros updated for your goal. Scroll up to save them!`);
    };

    const handleSaveManual = () => {
        const cal = parseInt(manualCalories) || 0;
        const p = parseInt(manualProtein) || 0;
        const c = parseInt(manualCarbs) || 0;
        const f = parseInt(manualFat) || 0;

        if (cal === 0 || p === 0 || c === 0 || f === 0) {
            Alert.alert('Error', 'Please enter valid goals greater than 0');
            return;
        }

        updateGoals({ calories: cal, protein: p, carbs: c, fat: f });
        Alert.alert('Success', 'Your daily goals have been updated!');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Targets</Text>

                {/* Custom Targets (Always at the top) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="options" size={24} color={theme.primary} />
                        <Text style={styles.sectionTitle}>Custom Targets</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Daily Calories (kcal)</Text>
                        <TextInput
                            style={styles.largeInput}
                            value={manualCalories}
                            onChangeText={setManualCalories}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.macroGrid}>
                        <View style={styles.macroInputContainer}>
                            <Text style={[styles.label, { color: theme.protein }]}>Protein (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={manualProtein}
                                onChangeText={setManualProtein}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.macroInputContainer}>
                            <Text style={[styles.label, { color: theme.carbs }]}>Carbs (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={manualCarbs}
                                onChangeText={setManualCarbs}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.macroInputContainer}>
                            <Text style={[styles.label, { color: theme.fat }]}>Fat (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={manualFat}
                                onChangeText={setManualFat}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <Pressable style={styles.primaryButton} onPress={handleSaveManual}>
                        <Text style={styles.primaryButtonText}>Save Targets</Text>
                    </Pressable>
                </View>

                {/* Calculator Section */}
                <Pressable
                    style={styles.calculatorHeader}
                    onPress={() => setCalculatorVisible(!isCalculatorVisible)}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.calculatorTitle}>Don't know your targets?</Text>
                        <Text style={styles.calculatorSubtitle}>Tap here to use our scientific calculators.</Text>
                    </View>
                    <Ionicons
                        name={isCalculatorVisible ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={theme.text}
                        style={{ marginLeft: 16 }}
                    />
                </Pressable>

                {isCalculatorVisible && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="calculator" size={24} color={theme.secondary} />
                            <Text style={styles.sectionTitle}>Macro Calculator</Text>
                        </View>

                        <View style={styles.methodSelectorVertical}>
                            {METHODS.map(m => (
                                <Pressable
                                    key={m.id}
                                    style={[styles.methodCardLarge, method === m.id && styles.methodCardLargeActive]}
                                    onPress={() => setMethod(m.id)}
                                >
                                    <View style={styles.methodCardHeader}>
                                        <Ionicons
                                            name={method === m.id ? "radio-button-on" : "radio-button-off"}
                                            size={24}
                                            color={method === m.id ? theme.secondary : theme.textMuted}
                                        />
                                        <Text style={[styles.methodNameLarge, method === m.id && styles.methodNameLargeActive]}>{m.name}</Text>
                                    </View>
                                    <Text style={styles.methodDescLarge}>{m.desc}</Text>
                                    {method === m.id && (
                                        <Pressable onPress={() => Linking.openURL(m.url)} style={{ marginTop: 8 }}>
                                            <Text style={styles.scienceLink}>Read the study ↗</Text>
                                        </Pressable>
                                    )}
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderToggle}>
                                    <Pressable
                                        style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                                        onPress={() => setGender('male')}
                                    >
                                        <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>M</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                                        onPress={() => setGender('female')}
                                    >
                                        <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>F</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Weight (kg)</Text>
                                <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Height (cm)</Text>
                                <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
                            </View>
                        </View>

                        {method === 'katch' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Body Fat %</Text>
                                <TextInput style={styles.input} value={bodyFat} onChangeText={setBodyFat} keyboardType="numeric" />
                            </View>
                        )}

                        <Text style={styles.label}>Activity Level</Text>
                        <View style={styles.chipContainer}>
                            {ACTIVITY_LEVELS.map(act => (
                                <Pressable
                                    key={act.id}
                                    style={[styles.chip, activity === act.id && styles.chipActive]}
                                    onPress={() => setActivity(act.id as any)}
                                >
                                    <Text style={[styles.chipText, activity === act.id && styles.chipTextActive]}>{act.label}</Text>
                                    <Text style={[styles.chipDesc, activity === act.id && styles.chipDescActive]}>{act.desc}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.label}>Goal</Text>
                        <View style={styles.chipContainer}>
                            {GOALS.map(g => (
                                <Pressable
                                    key={g.id}
                                    style={[styles.chip, goal === g.id && styles.chipActive]}
                                    onPress={() => setGoal(g.id as any)}
                                >
                                    <Text style={[styles.chipText, goal === g.id && styles.chipTextActive]}>{g.label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <Pressable style={[styles.primaryButton, { backgroundColor: theme.secondary }]} onPress={calculateMacros}>
                            <Text style={styles.primaryButtonText}>Calculate Macros</Text>
                        </Pressable>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
    card: {
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.text,
        letterSpacing: -0.5,
    },
    calculatorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.card,
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    calculatorTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 4,
    },
    calculatorSubtitle: {
        fontSize: 14,
        color: theme.textMuted,
        fontWeight: '500',
        lineHeight: 20,
    },
    methodSelectorVertical: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 24,
    },
    methodCardLarge: {
        padding: 16,
        backgroundColor: theme.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
    },
    methodCardLargeActive: {
        backgroundColor: `${theme.secondary}10`,
        borderColor: theme.secondary,
    },
    methodCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    methodNameLarge: {
        color: theme.text,
        fontWeight: '800',
        fontSize: 16,
        marginLeft: 12,
    },
    methodNameLargeActive: {
        color: theme.secondary,
    },
    methodDescLarge: {
        color: theme.textMuted,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
        marginLeft: 36,
    },
    scienceLink: {
        color: theme.secondary,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 36,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    halfInput: {
        width: '48%',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: theme.background,
        borderRadius: 16,
        padding: 16,
        color: theme.text,
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: theme.border,
    },
    largeInput: {
        backgroundColor: theme.background,
        borderRadius: 20,
        padding: 24,
        color: theme.text,
        fontSize: 32,
        fontWeight: '900',
        borderWidth: 1,
        borderColor: theme.border,
        textAlign: 'center',
        marginBottom: 24,
    },
    genderToggle: {
        flexDirection: 'row',
        backgroundColor: theme.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    genderBtn: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    genderBtnActive: {
        backgroundColor: theme.secondary,
    },
    genderText: {
        color: theme.textMuted,
        fontWeight: '800',
    },
    genderTextActive: {
        color: '#FFF',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    chip: {
        backgroundColor: theme.background,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    chipActive: {
        backgroundColor: theme.secondary,
        borderColor: theme.secondary,
    },
    chipText: {
        color: theme.textMuted,
        fontSize: 14,
        fontWeight: '700',
    },
    chipTextActive: {
        color: '#FFF',
    },
    chipDesc: {
        fontSize: 10,
        color: theme.textMuted,
        marginTop: 2,
    },
    chipDescActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    macroGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    macroInputContainer: {
        width: '31%',
    },
    primaryButton: {
        backgroundColor: theme.primary,
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
