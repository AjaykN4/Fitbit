import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { useFoodStore } from '../../src/stores/foodStore';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { theme } = useAppTheme();
  const styles = getStyles(theme);

  const { entries, goals } = useFoodStore();

  // Process data for the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dailyData = last7Days.map(date => {
    const dayEntries = entries.filter(e => new Date(e.timestamp).setHours(0, 0, 0, 0) === date.getTime());
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: dayEntries.reduce((sum, e) => sum + e.calories, 0),
      protein: dayEntries.reduce((sum, e) => sum + e.protein, 0),
      carbs: dayEntries.reduce((sum, e) => sum + e.carbs, 0),
      fat: dayEntries.reduce((sum, e) => sum + e.fat, 0),
    };
  });

  const calorieData = {
    labels: dailyData.map(d => d.date),
    datasets: [
      {
        data: dailyData.map(d => d.calories),
        color: (opacity = 1) => theme.primary,
        strokeWidth: 3,
      },
      {
        data: dailyData.map(() => goals.calories),
        color: (opacity = 1) => theme.textMuted,
        strokeWidth: 2,
        withDots: false,
      }
    ],
    legend: ["Calories Consumed", "Goal"]
  };

  const todayData = dailyData[6];
  const totalMacros = todayData.protein + todayData.carbs + todayData.fat;

  const macroPieData = [
    {
      name: "Protein",
      population: todayData.protein,
      color: theme.protein,
      legendFontColor: theme.text,
      legendFontSize: 12
    },
    {
      name: "Carbs",
      population: todayData.carbs,
      color: theme.carbs,
      legendFontColor: theme.text,
      legendFontSize: 12
    },
    {
      name: "Fat",
      population: todayData.fat,
      color: theme.fat,
      legendFontColor: theme.text,
      legendFontSize: 12
    }
  ];

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => theme.text,
    labelColor: (opacity = 1) => theme.textMuted,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.card
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Ionicons name="bar-chart" size={28} color={theme.primary} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calorie Trend (7 Days)</Text>
          <LineChart
            data={calorieData}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Macro Split</Text>
          {totalMacros > 0 ? (
            <PieChart
              data={macroPieData}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[10, 0]}
              absolute
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Log food to see your macro split</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Protein Trend (7 Days)</Text>
          <BarChart
            data={{
              labels: dailyData.map(d => d.date),
              datasets: [{ data: dailyData.map(d => d.protein) }]
            }}
            width={screenWidth - 80}
            height={220}
            yAxisLabel=""
            yAxisSuffix="g"
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => theme.protein,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            withInnerLines={false}
          />
        </View>

        <View style={{ height: 100 }} />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -1,
  },
  card: {
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
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '600',
  }
});
