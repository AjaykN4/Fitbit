import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, Linking, Image } from 'react-native';
import { useFoodStore } from '../../src/stores/foodStore';
import { Colors } from '../../src/constants/colors';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface FoodResult {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    brand?: string;
    url?: string;
    imageUri?: string;
    description?: string;
}

export default function LogScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme } = useAppTheme();
    const styles = getStyles(theme);

    const { addEntry, mealCategories, savedMeals, addSavedMeal, removeSavedMeal } = useFoodStore();

    const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'vision'>('search');

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<FoodResult[]>([]);

    const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);

    const initialMealType = (params.meal as string) || mealCategories[0] || 'Meal 1';
    const [mealType, setMealType] = useState<string>(initialMealType);

    const [servingSize, setServingSize] = useState('100');

    // Camera state
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const cameraRef = useRef<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const searchFood = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResults([]);
        
        // Try OpenFoodFacts first, fall back to USDA if it's down
        let results = await searchOpenFoodFacts(searchQuery);
        
        if (results === null) {
            // OpenFoodFacts failed, try USDA
            results = await searchUSDA(searchQuery);
        }

        if (results && results.length > 0) {
            setSearchResults(results);
        } else if (results !== null) {
            Alert.alert('No Results', 'No foods found. Try a different search term.');
        }
        
        setIsSearching(false);
    };

    const searchOpenFoodFacts = async (query: string): Promise<FoodResult[] | null> => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            if (!response.ok) return null; // Fall back to USDA

            const data = await response.json();
            if (!data.products || data.products.length === 0) return [];

            return data.products
                .filter((p: any) => p.product_name && p.nutriments)
                .map((p: any) => ({
                    id: p._id || Math.random().toString(),
                    name: p.product_name,
                    brand: p.brands || '',
                    calories: Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0),
                    protein: Math.round(p.nutriments.proteins_100g || p.nutriments.proteins || 0),
                    carbs: Math.round(p.nutriments.carbohydrates_100g || p.nutriments.carbohydrates || 0),
                    fat: Math.round(p.nutriments.fat_100g || p.nutriments.fat || 0),
                    fiber: Math.round(p.nutriments.fiber_100g || p.nutriments.fiber || 0),
                    sugar: Math.round(p.nutriments.sugars_100g || p.nutriments.sugars || 0),
                    sodium: Math.round((p.nutriments.sodium_100g || p.nutriments.sodium || 0) * 1000),
                    url: p.url || `https://world.openfoodfacts.org/product/${p._id}`,
                }));
        } catch {
            return null; // Fall back to USDA
        }
    };

    const searchUSDA = async (query: string): Promise<FoodResult[] | null> => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(
                `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(query)}&pageSize=20`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            if (!response.ok) {
                Alert.alert('Error', 'Both food databases are currently unavailable. Try again later.');
                return null;
            }

            const data = await response.json();
            if (!data.foods || data.foods.length === 0) return [];

            return data.foods.map((f: any) => {
                const getNutrient = (id: number) => {
                    const n = f.foodNutrients?.find((n: any) => n.nutrientId === id);
                    return Math.round(n?.value || 0);
                };

                return {
                    id: f.fdcId?.toString() || Math.random().toString(),
                    name: f.description || f.lowercaseDescription || 'Unknown',
                    brand: f.brandName || f.brandOwner || '',
                    calories: getNutrient(1008),
                    protein: getNutrient(1003),
                    carbs: getNutrient(1005),
                    fat: getNutrient(1004),
                    fiber: getNutrient(1079),
                    sugar: getNutrient(2000),
                    sodium: getNutrient(1093),
                    url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${f.fdcId}/nutrients`,
                };
            });
        } catch {
            Alert.alert('Error', 'Could not search. Check your internet connection.');
            return null;
        }
    };

    const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (activeTab === 'vision') return; // Don't scan barcodes in vision mode

        setIsScanning(false);
        setIsSearching(true);

        try {
            let response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
            let result = await response.json();

            if (result.status !== 1 && data.length === 12) {
                response = await fetch(`https://world.openfoodfacts.org/api/v0/product/0${data}.json`);
                result = await response.json();
            }

            if (result.status === 1 && result.product) {
                const p = result.product;

                if (!p.nutriments || p.nutriments['energy-kcal_100g'] === undefined) {
                    Alert.alert('Missing Data', 'This product was found but is missing nutritional information.');
                    return;
                }

                const food: FoodResult = {
                    id: p._id || Math.random().toString(),
                    name: p.product_name || 'Unknown Product',
                    brand: p.brands,
                    calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
                    protein: Math.round(p.nutriments.proteins_100g || 0),
                    carbs: Math.round(p.nutriments.carbohydrates_100g || 0),
                    fat: Math.round(p.nutriments.fat_100g || 0),
                    fiber: Math.round(p.nutriments.fiber_100g || 0),
                    sugar: Math.round(p.nutriments.sugars_100g || 0),
                    sodium: Math.round((p.nutriments.sodium_100g || 0) * 1000),
                    url: p.url || `https://world.openfoodfacts.org/product/${p._id}`,
                };

                setSelectedFood(food);
            } else {
                Alert.alert('Not Found', 'Barcode not found in the free database. Try searching by name instead!');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch product data.');
        } finally {
            setIsSearching(false);
        }
    };

    const startScanning = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Permission Required', 'Camera permission is required to scan barcodes.');
                return;
            }
        }
        setIsScanning(true);
    };

    const takePictureForAI = async () => {
        if (!cameraRef.current) return;

        setIsAnalyzing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: false });

            // MOCK AI RESPONSE
            setTimeout(() => {
                const mockFood: FoodResult = {
                    id: Math.random().toString(),
                    name: 'Grilled Chicken Salad',
                    brand: 'AI Vision Estimate',
                    calories: 350,
                    protein: 35,
                    carbs: 12,
                    fat: 18,
                    fiber: 5,
                    sugar: 4,
                    sodium: 450,
                    imageUri: photo.uri,
                    description: 'I see a fresh salad with mixed greens, cherry tomatoes, cucumbers, and sliced grilled chicken breast, lightly dressed with vinaigrette.'
                };

                setSelectedFood(mockFood);
                setServingSize('100');
                setIsAnalyzing(false);
            }, 2000);

        } catch (error) {
            Alert.alert('Error', 'Failed to take picture.');
            setIsAnalyzing(false);
        }
    };

    const handleSaveToFavorites = () => {
        if (!selectedFood) return;

        const multiplier = (parseInt(servingSize) || 100) / 100;

        addSavedMeal({
            name: selectedFood.name,
            calories: Math.round(selectedFood.calories * multiplier),
            protein: Math.round(selectedFood.protein * multiplier),
            carbs: Math.round(selectedFood.carbs * multiplier),
            fat: Math.round(selectedFood.fat * multiplier),
            fiber: Math.round(selectedFood.fiber * multiplier),
            sugar: Math.round(selectedFood.sugar * multiplier),
            sodium: Math.round(selectedFood.sodium * multiplier),
            url: selectedFood.url,
        });

        Alert.alert('Saved!', `${selectedFood.name} has been added to your Saved Meals.`);
    };

    const handleSave = () => {
        if (!selectedFood) return;

        const multiplier = (parseInt(servingSize) || 100) / 100;

        addEntry({
            name: selectedFood.name,
            mealType,
            calories: Math.round(selectedFood.calories * multiplier),
            protein: Math.round(selectedFood.protein * multiplier),
            carbs: Math.round(selectedFood.carbs * multiplier),
            fat: Math.round(selectedFood.fat * multiplier),
            fiber: Math.round(selectedFood.fiber * multiplier),
            sugar: Math.round(selectedFood.sugar * multiplier),
            sodium: Math.round(selectedFood.sodium * multiplier),
            url: selectedFood.url,
            imageUri: selectedFood.imageUri,
            description: selectedFood.description,
        });

        setSelectedFood(null);
        setServingSize('100');
        router.push('/');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            {/* Barcode Scanner Modal */}
            <Modal visible={isScanning} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.scannerContainer}>
                    <View style={styles.scannerHeader}>
                        <Text style={styles.scannerTitle}>Scan Barcode</Text>
                        <Pressable onPress={() => setIsScanning(false)} style={styles.closeScannerButton}>
                            <Ionicons name="close" size={28} color={theme.text} />
                        </Pressable>
                    </View>

                    {isScanning && permission?.granted && (
                        <View style={styles.cameraContainer}>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                onBarcodeScanned={handleBarcodeScanned}
                                barcodeScannerSettings={{
                                    barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
                                }}
                            />
                            <View style={styles.scannerOverlay} pointerEvents="none">
                                <View style={styles.scannerTarget} />
                                <Text style={styles.scannerInstruction}>Center barcode in the square</Text>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Log Food</Text>

                {!selectedFood ? (
                    <>
                        <View style={styles.tabContainer}>
                            <Pressable
                                style={[styles.tab, activeTab === 'search' && styles.tabActive]}
                                onPress={() => setActiveTab('search')}
                            >
                                <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>Search DB</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
                                onPress={() => setActiveTab('saved')}
                            >
                                <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>Saved Meals</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.tab, activeTab === 'vision' && styles.tabActive]}
                                onPress={() => {
                                    if (!permission?.granted) requestPermission();
                                    setActiveTab('vision');
                                }}
                            >
                                <Text style={[styles.tabText, activeTab === 'vision' && styles.tabTextActive]}>AI Vision</Text>
                            </Pressable>
                        </View>

                        {activeTab === 'search' && (
                            <>
                                <View style={styles.searchContainer}>
                                    <View style={styles.searchInputWrapper}>
                                        <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search Open Food Facts..."
                                            placeholderTextColor={theme.textMuted}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            onSubmitEditing={searchFood}
                                            returnKeyType="search"
                                        />
                                        {searchQuery.length > 0 && (
                                            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                                <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                                            </Pressable>
                                        )}
                                    </View>

                                    <Pressable style={styles.scanButton} onPress={startScanning}>
                                        <Ionicons name="barcode-outline" size={24} color="#FFF" />
                                    </Pressable>
                                </View>

                                {isSearching ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color={theme.primary} />
                                        <Text style={styles.loadingText}>Searching database...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.resultsContainer}>
                                        {searchResults.map((item) => (
                                            <Pressable
                                                key={item.id}
                                                style={styles.resultItem}
                                                onPress={() => {
                                                    setSelectedFood(item);
                                                    setServingSize('100');
                                                }}
                                            >
                                                <View style={styles.resultInfo}>
                                                    <Text style={styles.resultName}>{item.name}</Text>
                                                    {item.brand && <Text style={styles.resultBrand}>{item.brand}</Text>}
                                                </View>
                                                <View style={styles.resultMacros}>
                                                    <Text style={styles.resultCalories}>{item.calories} kcal</Text>
                                                    <Text style={styles.resultDetails}>per 100g</Text>
                                                </View>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {activeTab === 'saved' && (
                            <View style={styles.resultsContainer}>
                                {savedMeals.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="heart-outline" size={48} color={theme.textMuted} />
                                        <Text style={styles.emptyStateText}>No saved meals yet.</Text>
                                        <Text style={styles.emptyStateSub}>Search for a food and tap the heart icon to save it here.</Text>
                                    </View>
                                ) : (
                                    savedMeals.map((item) => (
                                        <View key={item.id} style={styles.resultItem}>
                                            <Pressable
                                                style={styles.resultInfo}
                                                onPress={() => {
                                                    setSelectedFood({ ...item, brand: 'Saved Meal' });
                                                    setServingSize('100');
                                                }}
                                            >
                                                <Text style={styles.resultName}>{item.name}</Text>
                                                <Text style={styles.resultBrand}>P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g</Text>
                                            </Pressable>
                                            <View style={styles.savedMealActions}>
                                                <Text style={styles.resultCalories}>{item.calories} kcal</Text>
                                                <Pressable onPress={() => removeSavedMeal(item.id)} style={styles.deleteButton}>
                                                    <Ionicons name="trash-outline" size={20} color={theme.accent} />
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}

                        {activeTab === 'vision' && (
                            <View style={styles.visionContainer}>
                                {!permission?.granted ? (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="camera-outline" size={48} color={theme.textMuted} />
                                        <Text style={styles.emptyStateText}>Camera Access Required</Text>
                                        <Text style={styles.emptyStateSub}>We need camera access to analyze your food.</Text>
                                        <Pressable style={[styles.primaryButton, { marginTop: 20 }]} onPress={requestPermission}>
                                            <Text style={styles.primaryButtonText}>Grant Permission</Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    <View style={styles.cameraWrapper}>
                                        <CameraView
                                            ref={cameraRef}
                                            style={styles.visionCamera}
                                            facing="back"
                                        />
                                        {isAnalyzing ? (
                                            <View style={styles.analyzingOverlay} pointerEvents="none">
                                                <ActivityIndicator size="large" color={theme.primary} />
                                                <Text style={styles.analyzingText}>AI is analyzing your food...</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.visionOverlay} pointerEvents="box-none">
                                                <View style={styles.visionTarget} pointerEvents="none" />
                                                <Pressable style={styles.captureButton} onPress={takePictureForAI}>
                                                    <View style={styles.captureButtonInner} />
                                                </Pressable>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                ) : (
                    /* Selected Food Details Section */
                    <>
                        <View style={styles.card}>
                            {selectedFood.imageUri && (
                                <Image source={{ uri: selectedFood.imageUri }} style={styles.foodImage} />
                            )}

                            <View style={styles.selectedFoodHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                                    {selectedFood.brand && <Text style={styles.selectedFoodBrand}>{selectedFood.brand}</Text>}
                                    {selectedFood.description && (
                                        <Text style={styles.foodDescription}>{selectedFood.description}</Text>
                                    )}
                                    {selectedFood.url && (
                                        <Pressable onPress={() => Linking.openURL(selectedFood.url!)}>
                                            <Text style={styles.foodUrl}>View on Open Food Facts ↗</Text>
                                        </Pressable>
                                    )}
                                </View>
                                <View style={styles.headerActions}>
                                    {selectedFood.brand !== 'Saved Meal' && (
                                        <Pressable onPress={handleSaveToFavorites} style={styles.favoriteButton}>
                                            <Ionicons name="heart-outline" size={24} color={theme.primary} />
                                        </Pressable>
                                    )}
                                    <Pressable onPress={() => setSelectedFood(null)} style={styles.changeButton}>
                                        <Text style={styles.changeButtonText}>Cancel</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <Text style={styles.label}>Add to Meal</Text>
                            <View style={styles.mealTypeContainer}>
                                {mealCategories.map(type => (
                                    <Pressable
                                        key={type}
                                        style={[styles.mealTypeButton, mealType === type && styles.mealTypeButtonActive]}
                                        onPress={() => setMealType(type)}
                                    >
                                        <Text style={[styles.mealTypeText, mealType === type && styles.mealTypeTextActive]}>
                                            {type}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {selectedFood.brand !== 'Saved Meal' && !selectedFood.imageUri && (
                                <>
                                    <Text style={styles.label}>Serving Size (g/ml)</Text>
                                    <View style={styles.servingContainer}>
                                        <TextInput
                                            style={styles.servingInput}
                                            value={servingSize}
                                            onChangeText={setServingSize}
                                            keyboardType="numeric"
                                        />
                                        <Text style={styles.servingUnit}>grams</Text>
                                    </View>
                                </>
                            )}

                            {selectedFood.imageUri && (
                                <>
                                    <Text style={styles.label}>Portion Eaten (%)</Text>
                                    <View style={styles.servingContainer}>
                                        <TextInput
                                            style={styles.servingInput}
                                            value={servingSize}
                                            onChangeText={setServingSize}
                                            keyboardType="numeric"
                                        />
                                        <Text style={styles.servingUnit}>%</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Calculated Nutrition</Text>

                            <View style={styles.macroGrid}>
                                <View style={styles.macroBox}>
                                    <Text style={styles.macroValue}>{Math.round(selectedFood.calories * ((parseInt(servingSize) || 0) / 100))}</Text>
                                    <Text style={styles.macroLabel}>Calories</Text>
                                </View>
                                <View style={styles.macroBox}>
                                    <Text style={[styles.macroValue, { color: theme.protein }]}>{Math.round(selectedFood.protein * ((parseInt(servingSize) || 0) / 100))}g</Text>
                                    <Text style={styles.macroLabel}>Protein</Text>
                                </View>
                                <View style={styles.macroBox}>
                                    <Text style={[styles.macroValue, { color: theme.carbs }]}>{Math.round(selectedFood.carbs * ((parseInt(servingSize) || 0) / 100))}g</Text>
                                    <Text style={styles.macroLabel}>Carbs</Text>
                                </View>
                                <View style={styles.macroBox}>
                                    <Text style={[styles.macroValue, { color: theme.fat }]}>{Math.round(selectedFood.fat * ((parseInt(servingSize) || 0) / 100))}g</Text>
                                    <Text style={styles.macroLabel}>Fat</Text>
                                </View>
                            </View>

                            <View style={styles.microGrid}>
                                <View style={styles.microRow}>
                                    <Text style={styles.microLabel}>Fiber</Text>
                                    <Text style={styles.microValue}>{Math.round(selectedFood.fiber * ((parseInt(servingSize) || 0) / 100))}g</Text>
                                </View>
                                <View style={styles.microRow}>
                                    <Text style={styles.microLabel}>Sugar</Text>
                                    <Text style={styles.microValue}>{Math.round(selectedFood.sugar * ((parseInt(servingSize) || 0) / 100))}g</Text>
                                </View>
                                <View style={styles.microRow}>
                                    <Text style={styles.microLabel}>Sodium</Text>
                                    <Text style={styles.microValue}>{Math.round(selectedFood.sodium * ((parseInt(servingSize) || 0) / 100))}mg</Text>
                                </View>
                            </View>
                        </View>

                        <Pressable style={styles.saveButton} onPress={handleSave}>
                            <Ionicons name="add-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Add to {mealType}</Text>
                        </Pressable>
                    </>
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    tabActive: {
        backgroundColor: theme.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        color: theme.textMuted,
        fontWeight: '700',
        fontSize: 13,
    },
    tabTextActive: {
        color: theme.primary,
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 16,
        marginRight: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: theme.text,
        fontSize: 16,
        paddingVertical: 16,
        fontWeight: '600',
    },
    clearButton: {
        padding: 4,
    },
    scanButton: {
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        width: 56,
        borderRadius: 16,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    scannerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.text,
    },
    closeScannerButton: {
        padding: 4,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerTarget: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: theme.primary,
        backgroundColor: 'transparent',
        borderRadius: 24,
    },
    scannerInstruction: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 24,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: theme.textMuted,
        marginTop: 12,
        fontWeight: '600',
    },
    resultsContainer: {
        gap: 12,
    },
    resultItem: {
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    resultInfo: {
        flex: 1,
        paddingRight: 12,
    },
    resultName: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    resultBrand: {
        color: theme.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    resultMacros: {
        alignItems: 'flex-end',
    },
    resultCalories: {
        color: theme.primary,
        fontWeight: '800',
        fontSize: 18,
    },
    resultDetails: {
        color: theme.textMuted,
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600',
    },
    savedMealActions: {
        alignItems: 'flex-end',
        flexDirection: 'row',
        gap: 12,
    },
    deleteButton: {
        padding: 4,
    },
    emptyState: {
        alignItems: 'center',
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
        textAlign: 'center',
        paddingHorizontal: 20,
        fontWeight: '500',
        lineHeight: 20,
    },
    visionContainer: {
        height: 400,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
    },
    cameraWrapper: {
        flex: 1,
        position: 'relative',
    },
    visionCamera: {
        flex: 1,
    },
    visionOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 40,
    },
    visionTarget: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
        borderRadius: 24,
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF',
    },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    analyzingText: {
        color: theme.primary,
        fontSize: 18,
        fontWeight: '800',
        marginTop: 16,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    foodImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: 20,
    },
    selectedFoodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    selectedFoodName: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.text,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    selectedFoodBrand: {
        fontSize: 14,
        color: theme.textMuted,
        fontWeight: '600',
        marginBottom: 8,
    },
    foodDescription: {
        fontSize: 14,
        color: theme.text,
        lineHeight: 20,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    foodUrl: {
        color: theme.secondary,
        fontSize: 13,
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    favoriteButton: {
        padding: 8,
        backgroundColor: `${theme.primary}15`,
        borderRadius: 12,
    },
    changeButton: {
        backgroundColor: theme.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    changeButtonText: {
        color: theme.text,
        fontSize: 13,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
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
    mealTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    mealTypeButton: {
        backgroundColor: theme.background,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    mealTypeButtonActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    mealTypeText: {
        color: theme.textMuted,
        fontWeight: '700',
    },
    mealTypeTextActive: {
        color: '#FFF',
    },
    servingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 16,
    },
    servingInput: {
        flex: 1,
        color: theme.text,
        fontSize: 24,
        fontWeight: '800',
        paddingVertical: 16,
    },
    servingUnit: {
        color: theme.textMuted,
        fontSize: 16,
        fontWeight: '600',
    },
    macroGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    macroBox: {
        alignItems: 'center',
        backgroundColor: theme.background,
        padding: 16,
        borderRadius: 16,
        width: '23%',
        borderWidth: 1,
        borderColor: theme.border,
    },
    macroValue: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 4,
    },
    macroLabel: {
        fontSize: 12,
        color: theme.textMuted,
        fontWeight: '600',
    },
    microGrid: {
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: 16,
    },
    microRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    microLabel: {
        color: theme.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
    microValue: {
        color: theme.text,
        fontSize: 15,
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: theme.primary,
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    primaryButton: {
        backgroundColor: theme.primary,
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
