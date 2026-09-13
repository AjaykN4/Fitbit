import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodEntry, DailyGoals, SavedMeal, UserStats } from '../types';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

let realtimeChannel: RealtimeChannel | null = null;

interface FoodState {
    entries: FoodEntry[];
    goals: DailyGoals;
    mealCategories: string[];
    savedMeals: SavedMeal[];
    userStats: UserStats | null;
    themePreference: 'system' | 'light' | 'dark';
    skipAuth: boolean;
    addEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
    removeEntry: (id: string) => void;
    updateGoals: (goals: Partial<DailyGoals>) => void;
    addMealCategory: (name: string) => void;
    addSavedMeal: (meal: Omit<SavedMeal, 'id'>) => void;
    removeSavedMeal: (id: string) => void;
    updateUserStats: (stats: UserStats) => void;
    setThemePreference: (theme: 'system' | 'light' | 'dark') => void;
    setSkipAuth: (skip: boolean) => void;
    clearAllData: () => void;
    fetchCloudData: () => Promise<void>;
    subscribeToRealtime: () => Promise<void>;
    unsubscribeFromRealtime: () => Promise<void>;
}

const defaultGoals: DailyGoals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
};

const defaultMealCategories = ['Meal 1', 'Meal 2', 'Meal 3'];

export const useFoodStore = create<FoodState>()(
    persist(
        (set) => ({
            entries: [],
            goals: defaultGoals,
            mealCategories: defaultMealCategories,
            savedMeals: [],
            userStats: null,
            themePreference: 'system',
            skipAuth: false,

            addEntry: async (entry) => {
                const newEntry = {
                    ...entry,
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: Date.now(),
                };

                set((state) => ({
                    entries: [...state.entries, newEntry]
                }));

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from('entries').insert({
                        user_id: session.user.id,
                        name: newEntry.name,
                        calories: newEntry.calories,
                        protein: newEntry.protein,
                        carbs: newEntry.carbs,
                        fat: newEntry.fat,
                        timestamp: new Date(newEntry.timestamp).toISOString(),
                        category: newEntry.mealType
                    });
                }
            },

            removeEntry: async (id) => {
                set((state) => ({
                    entries: state.entries.filter(e => e.id !== id)
                }));

                // Note: We don't have the Supabase UUID here easily, so we skip deleting from cloud for now
                // A full implementation would map local IDs to cloud UUIDs.
            },

            updateGoals: async (newGoals) => {
                set((state) => {
                    const updatedGoals = { ...state.goals, ...newGoals };

                    supabase.auth.getSession().then(({ data: { session } }) => {
                        if (session?.user) {
                            supabase.from('goals').upsert({
                                user_id: session.user.id,
                                ...updatedGoals
                            }).then();
                        }
                    });

                    return { goals: updatedGoals };
                });
            },

            addMealCategory: (name) => set((state) => ({
                mealCategories: [...state.mealCategories, name]
            })),

            addSavedMeal: (meal) => set((state) => ({
                savedMeals: [
                    ...state.savedMeals,
                    { ...meal, id: Math.random().toString(36).substring(2, 9) }
                ]
            })),

            removeSavedMeal: (id) => set((state) => ({
                savedMeals: state.savedMeals.filter(m => m.id !== id)
            })),

            updateUserStats: async (stats) => {
                set({ userStats: stats });

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from('user_stats').upsert({
                        user_id: session.user.id,
                        gender: stats.gender,
                        age: stats.age,
                        weight: stats.weight,
                        height: stats.height,
                        activity_level: stats.activityLevel,
                        goal: stats.goal
                    });
                }
            },

            setThemePreference: (theme) => set({ themePreference: theme }),

            setSkipAuth: (skip) => set({ skipAuth: skip }),

            clearAllData: () => set({
                entries: [],
                goals: defaultGoals,
                mealCategories: defaultMealCategories,
                savedMeals: [],
                userStats: null,
                themePreference: 'system'
            }),

            fetchCloudData: async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                const [entriesRes, goalsRes, statsRes] = await Promise.all([
                    supabase.from('entries').select('*').eq('user_id', session.user.id),
                    supabase.from('goals').select('*').eq('user_id', session.user.id).single(),
                    supabase.from('user_stats').select('*').eq('user_id', session.user.id).single()
                ]);

                set((state) => {
                    const newState: Partial<FoodState> = {};

                    if (entriesRes.data) {
                        newState.entries = entriesRes.data.map(e => ({
                            id: e.id,
                            name: e.name,
                            calories: e.calories,
                            protein: e.protein,
                            carbs: e.carbs,
                            fat: e.fat,
                            fiber: 0,
                            sugar: 0,
                            sodium: 0,
                            timestamp: new Date(e.timestamp).getTime(),
                            mealType: e.category
                        }));
                    }

                    if (goalsRes.data) {
                        newState.goals = {
                            calories: goalsRes.data.calories,
                            protein: goalsRes.data.protein,
                            carbs: goalsRes.data.carbs,
                            fat: goalsRes.data.fat
                        };
                    }

                    if (statsRes.data) {
                        newState.userStats = {
                            gender: statsRes.data.gender,
                            age: statsRes.data.age,
                            weight: statsRes.data.weight,
                            height: statsRes.data.height,
                            activityLevel: statsRes.data.activity_level,
                            goal: statsRes.data.goal
                        };
                    }

                    return newState;
                });
            },

            subscribeToRealtime: async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                // Tear down any existing channel first
                if (realtimeChannel) {
                    await supabase.removeChannel(realtimeChannel);
                    realtimeChannel = null;
                }

                const userId = session.user.id;

                realtimeChannel = supabase
                    .channel(`realtime:user:${userId}`)
                    // --- entries ---
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}` },
                        (payload) => {
                            const e = payload.new as any;
                            const newEntry: FoodEntry = {
                                id: e.id,
                                name: e.name,
                                calories: e.calories,
                                protein: e.protein,
                                carbs: e.carbs,
                                fat: e.fat,
                                fiber: 0,
                                sugar: 0,
                                sodium: 0,
                                timestamp: new Date(e.timestamp).getTime(),
                                mealType: e.category,
                            };
                            set((state) => ({
                                // Avoid duplicates (local optimistic update may have already added it)
                                entries: state.entries.some(en => en.id === newEntry.id)
                                    ? state.entries
                                    : [...state.entries, newEntry],
                            }));
                        }
                    )
                    .on(
                        'postgres_changes',
                        { event: 'DELETE', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}` },
                        (payload) => {
                            const deletedId = (payload.old as any).id;
                            set((state) => ({
                                entries: state.entries.filter(e => e.id !== deletedId),
                            }));
                        }
                    )
                    // --- goals ---
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
                        (payload) => {
                            const g = payload.new as any;
                            if (!g) return;
                            set({
                                goals: {
                                    calories: g.calories,
                                    protein: g.protein,
                                    carbs: g.carbs,
                                    fat: g.fat,
                                },
                            });
                        }
                    )
                    // --- user_stats ---
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${userId}` },
                        (payload) => {
                            const s = payload.new as any;
                            if (!s) return;
                            set({
                                userStats: {
                                    gender: s.gender,
                                    age: s.age,
                                    weight: s.weight,
                                    height: s.height,
                                    activityLevel: s.activity_level,
                                    goal: s.goal,
                                },
                            });
                        }
                    )
                    .subscribe();
            },

            unsubscribeFromRealtime: async () => {
                if (realtimeChannel) {
                    await supabase.removeChannel(realtimeChannel);
                    realtimeChannel = null;
                }
            },
        }),
        {
            name: 'fitbit-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
