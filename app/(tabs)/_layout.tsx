import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
    const { theme, colorScheme } = useAppTheme();
    const router = useRouter();
    const styles = getStyles(theme);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: '#0055FF',
                    tabBarInactiveTintColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
                    tabBarShowLabel: true,
                    tabBarLabelStyle: styles.tabBarLabel,
                    tabBarItemStyle: styles.tabBarItem,
                    tabBarBackground: () => (
                        <BlurView
                            tint={colorScheme === 'dark' ? 'dark' : 'light'}
                            intensity={80}
                            style={StyleSheet.absoluteFill}
                        >
                            <View style={[StyleSheet.absoluteFill, { 
                                backgroundColor: colorScheme === 'dark' 
                                    ? 'rgba(20, 20, 30, 0.65)' 
                                    : 'rgba(255, 255, 255, 0.65)' 
                            }]} />
                        </BlurView>
                    ),
                    sceneStyle: { backgroundColor: theme.background, paddingBottom: 110 },
                }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Dashboard',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={focused ? styles.activeIconWrap : undefined}>
                                <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="log"
                    options={{
                        title: 'Diary',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={focused ? styles.activeIconWrap : undefined}>
                                <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="goals"
                    options={{
                        title: 'Plans',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={focused ? styles.activeIconWrap : undefined}>
                                <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="analytics"
                    options={{
                        title: 'Newsfeed',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={focused ? styles.activeIconWrap : undefined}>
                                <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={22} color={color} />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'More',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={focused ? styles.activeIconWrap : undefined}>
                                <Ionicons name={focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline'} size={22} color={color} />
                            </View>
                        ),
                    }}
                />
            </Tabs>

            {/* Floating Glassmorphism Search Bar */}
            <View style={styles.floatingSearchContainer} pointerEvents="box-none">
                <Pressable style={styles.searchBarOuter} onPress={() => router.push('/log')}>
                    <BlurView tint="light" intensity={90} style={styles.searchBarBlur}>
                        <View style={styles.searchBarInner}>
                            <Ionicons name="search" size={20} color="#0055FF" style={{ marginRight: 8 }} />
                            <Text style={styles.searchText}>Search for a food!</Text>
                            <Ionicons name="barcode-outline" size={20} color="#0055FF" style={{ marginLeft: 'auto' }} />
                        </View>
                    </BlurView>
                </Pressable>
            </View>
        </View>
    );
}

const getStyles = (theme: typeof Colors.light) => StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0,
        backgroundColor: 'transparent',
        height: Platform.OS === 'ios' ? 85 : 65,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingBottom: Platform.OS === 'ios' ? 20 : 5,
        paddingTop: 5,
    },
    tabBarItem: {
        borderRadius: 12,
        marginHorizontal: 2,
        paddingVertical: 4,
    },
    tabBarLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: 0.2,
    },
    activeIconWrap: {
        backgroundColor: 'rgba(0, 85, 255, 0.1)',
        borderRadius: 12,
        padding: 6,
        marginBottom: -4,
    },
    floatingSearchContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 78 : 58,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    searchBarOuter: {
        width: '90%',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    searchBarBlur: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    searchBarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    searchText: {
        color: '#0055FF',
        fontSize: 16,
        fontWeight: '600',
    },
});

