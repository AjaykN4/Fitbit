import { useColorScheme } from 'react-native';
import { useFoodStore } from '../stores/foodStore';
import { Colors } from '../constants/colors';

export function useAppTheme() {
    const systemColorScheme = useColorScheme();
    const themePreference = useFoodStore((state) => state.themePreference);

    const activeTheme = themePreference === 'system'
        ? (systemColorScheme ?? 'light')
        : themePreference;

    return {
        colorScheme: activeTheme,
        theme: Colors[activeTheme],
    };
}
