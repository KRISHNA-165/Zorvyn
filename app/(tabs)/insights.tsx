import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors } from '@/components/AppComponents';
import { useFinanceStore } from '@/store/useFinanceStore';

type Filter = 'Weekly' | 'Monthly' | 'Yearly';

export default function InsightsScreen() {
  const colors = useThemeColors();
  const { currency, transactions } = useFinanceStore();
  const [filter, setFilter] = useState<Filter>('Monthly');

  // Time-based filtering
  const now = new Date();
  const filterDays = filter === 'Weekly' ? 7 : filter === 'Monthly' ? 30 : 365;
  const currentPeriodStart = new Date(now.getTime() - filterDays * 86400000);
  const prevPeriodStart = new Date(currentPeriodStart.getTime() - filterDays * 86400000);

  // Split transactions into active and previous for comparison
  const currentTransactions = transactions.filter(t => new Date(t.date) >= currentPeriodStart);
  const prevTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= prevPeriodStart && d < currentPeriodStart;
  });
  
  let currentIncome = 0;
  let currentExpense = 0;
  currentTransactions.forEach(t => {
    if (t.type === 'income') currentIncome += t.amount;
    else currentExpense += t.amount;
  });

  let prevExpense = 0;
  prevTransactions.forEach(t => {
    if (t.type === 'expense') prevExpense += t.amount;
  });

  const savingsAmount = currentIncome - currentExpense;
  const savingsRate = currentIncome > 0 ? (Math.max(0, (savingsAmount / currentIncome) * 100)).toFixed(1) : '0.0';

  // Category Analysis
  const fixedCategories = ['Housing', 'Utilities', 'Insurance', 'Healthcare', 'Salary'];
  let fixedTotal = 0;
  let variableTotal = 0;
  const categoryMap: Record<string, number> = {};

  currentTransactions.forEach(t => {
    if (t.type === 'expense') {
      if (fixedCategories.includes(t.category)) fixedTotal += t.amount;
      else variableTotal += t.amount;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }
  });

  const totalExpense = fixedTotal + variableTotal;
  const fixedPercent = totalExpense > 0 ? Math.round((fixedTotal / totalExpense) * 100) : 0;
  const variablePercent = totalExpense > 0 ? Math.round((variableTotal / totalExpense) * 100) : 0;
  const savingsPercent = currentIncome > 0 ? Math.max(0, Math.round((savingsAmount / currentIncome) * 100)) : 0;

  const topCategories = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }));

  // Smart Insight Logic
  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense * 100).toFixed(0) : '0';
  const isBetter = currentExpense < prevExpense;
  const mostExpensiveCategory = topCategories[0]?.name || 'None';
  
  const insightText = currentExpense > 0 
    ? `You spent ${Math.abs(Number(expenseChange))}% ${isBetter ? 'less' : 'more'} than the previous ${filter.toLowerCase()} period. ${mostExpensiveCategory} was your primary driver.`
    : "No transactions found for this period. Start tracking to see comparisons!";

  const dateLabel = filter === 'Weekly' ? 'Last 7 Days' : filter === 'Monthly' ? 'Last 30 Days' : 'This Year';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Insights</Typography>
        <Pressable style={[styles.dateSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Calendar size={16} color={colors.primary} />
          <Typography variant="small" style={{ marginHorizontal: 8 }}>
            {dateLabel}
          </Typography>
          <ChevronDown size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        {(['Weekly', 'Monthly', 'Yearly'] as Filter[]).map((f) => (
          <Pressable 
            key={f} 
            onPress={() => setFilter(f)}
            style={[
              styles.filterTab, 
              filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
          >
            <Typography 
              variant="small" 
              color={filter === f ? colors.background : colors.textSecondary}
              style={{ fontWeight: '600' }}
            >
              {f}
            </Typography>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Typography variant="label" color={colors.textSecondary}>NET SAVINGS</Typography>
              <Typography variant="h1" color={colors.primary}>{currency}{savingsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
            </View>
            <View style={[styles.rateBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Typography variant="small" color={colors.primary}>{savingsRate}% Rate</Typography>
            </View>
          </View>

          <View style={styles.chartPlaceholder}>
            <View style={styles.donutRow}>
              <View style={[styles.donut, { borderColor: colors.primary, borderLeftColor: 'transparent' }]} />
              <View style={styles.donutInfo}>
                <Typography variant="h3" color={colors.text}>{currentIncome > 0 ? Math.min(100, Math.round((currentExpense / currentIncome) * 100)) : 0}%</Typography>
                <Typography variant="small" color={colors.textSecondary}>of income used</Typography>
              </View>
            </View>
            <View style={styles.chartLegend}>
              <LegendItem color={colors.primary} label="Fixed" value={`${fixedPercent}%`} colors={colors} />
              <LegendItem color={colors.secondary} label="Variable" value={`${variablePercent}%`} colors={colors} />
              <LegendItem color={colors.accent} label="Savings" value={`${savingsPercent}%`} colors={colors} />
            </View>
          </View>
        </Card>

        <Typography variant="label" style={styles.sectionLabel}>ANALYSIS BY CATEGORY</Typography>
        <View style={styles.categoryList}>
          {topCategories.length > 0 ? topCategories.map((cat, idx) => (
            <CategoryItem 
              key={cat.name}
              icon={idx === 0 ? TrendingUp : idx === 1 ? PieIcon : ArrowUpRight} 
              name={cat.name} 
              amount={cat.amount.toFixed(0)} 
              percentage={cat.percentage} 
              color={idx === 0 ? colors.primary : idx === 1 ? colors.secondary : colors.accent} 
              colors={colors}
              currency={currency}
            />
          )) : (
            <Typography variant="body" align="center" color={colors.textSecondary}>Insufficient data for categorization.</Typography>
          )}
        </View>

        <Card style={[styles.alertCard, { backgroundColor: colors.card, borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
          <Typography variant="bodyBold">Vault Intelligence</Typography>
          <Typography variant="small" style={{ marginTop: 4 }}>
            {insightText}
          </Typography>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const LegendItem = ({ color, label, value, colors }: any) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Typography variant="small" style={{ flex: 1, marginLeft: 8 }}>{label}</Typography>
    <Typography variant="small" style={{ fontWeight: '600' }}>{value}</Typography>
  </View>
);

const CategoryItem = ({ icon: Icon, name, amount, percentage, color, colors, currency }: any) => (
  <View style={styles.catItem}>
    <View style={[styles.catIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon size={18} color={color} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <View style={styles.catDetails}>
        <Typography variant="body">{name}</Typography>
        <Typography variant="bodyBold">{currency}{amount}</Typography>
      </View>
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({ web: { cursor: 'pointer' } }) as any,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  overviewCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chartPlaceholder: {
    marginTop: Theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutRow: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donut: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
  },
  donutInfo: {
    alignItems: 'center',
  },
  chartLegend: {
    flex: 1,
    marginLeft: 32,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    marginBottom: Theme.spacing.md,
    letterSpacing: 1,
  },
  categoryList: {
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  alertCard: {
    padding: Theme.spacing.md,
  },
});
