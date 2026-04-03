import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpRight, Calendar, ChevronDown, PieChart as PieIcon, TrendingUp } from 'lucide-react-native';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors } from '@/components/AppComponents';
import { useFinanceStore } from '@/store/useFinanceStore';

type Filter = 'Weekly' | 'Monthly' | 'Yearly';

export default function InsightsScreen() {
  const colors = useThemeColors();
  const { currency, transactions, isLoading, error } = useFinanceStore();
  const [filter, setFilter] = useState<Filter>('Monthly');

  const now = new Date();
  const filterDays = filter === 'Weekly' ? 7 : filter === 'Monthly' ? 30 : 365;
  const currentPeriodStart = new Date(now.getTime() - filterDays * 86400000);
  const prevPeriodStart = new Date(currentPeriodStart.getTime() - filterDays * 86400000);

  const currentTransactions = transactions.filter((transaction) => new Date(transaction.date) >= currentPeriodStart);
  const prevTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date >= prevPeriodStart && date < currentPeriodStart;
  });

  let currentIncome = 0;
  let currentExpense = 0;
  currentTransactions.forEach((transaction) => {
    if (transaction.type === 'income') currentIncome += transaction.amount;
    else currentExpense += transaction.amount;
  });

  let prevExpense = 0;
  prevTransactions.forEach((transaction) => {
    if (transaction.type === 'expense') prevExpense += transaction.amount;
  });

  const savingsAmount = currentIncome - currentExpense;
  const savingsRate = currentIncome > 0 ? Math.max(0, (savingsAmount / currentIncome) * 100).toFixed(1) : '0.0';

  const fixedCategories = ['Housing', 'Utilities', 'Insurance', 'Healthcare', 'Salary'];
  let fixedTotal = 0;
  let variableTotal = 0;
  const categoryMap: Record<string, number> = {};

  currentTransactions.forEach((transaction) => {
    if (transaction.type !== 'expense') return;
    if (fixedCategories.includes(transaction.category)) fixedTotal += transaction.amount;
    else variableTotal += transaction.amount;
    categoryMap[transaction.category] = (categoryMap[transaction.category] || 0) + transaction.amount;
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
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }));

  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense * 100).toFixed(0) : '0';
  const isBetter = currentExpense < prevExpense;
  const mostExpensiveCategory = topCategories[0]?.name || 'None';
  const insightText =
    currentExpense > 0
      ? `You spent ${Math.abs(Number(expenseChange))}% ${isBetter ? 'less' : 'more'} than the previous ${filter.toLowerCase()} period. ${mostExpensiveCategory} was your primary driver.`
      : 'No transactions found for this period. Start tracking to see comparisons!';

  const dateLabel = filter === 'Weekly' ? 'Last 7 Days' : filter === 'Monthly' ? 'Last 30 Days' : 'This Year';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Insights</Typography>
        <Pressable style={[styles.dateSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Calendar size={16} color={colors.primary} />
          <Typography variant="small" style={{ marginHorizontal: 8 }}>{dateLabel}</Typography>
          <ChevronDown size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        {(['Weekly', 'Monthly', 'Yearly'] as Filter[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filterTab, filter === value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Typography variant="small" color={filter === value ? colors.background : colors.textSecondary} style={{ fontWeight: '600' }}>
              {value}
            </Typography>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <Card style={[styles.feedbackCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Typography variant="small" color={colors.expense}>{error}</Typography>
          </Card>
        ) : null}

        <Card style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Typography variant="label" color={colors.textSecondary}>NET SAVINGS</Typography>
              <Typography variant="h1" color={colors.primary}>
                {currency}{savingsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </View>
            <View style={[styles.rateBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Typography variant="small" color={colors.primary}>{savingsRate}% Rate</Typography>
            </View>
          </View>

          <View style={styles.chartPlaceholder}>
            <View style={styles.donutRow}>
              <View style={[styles.donut, { borderColor: colors.primary, borderLeftColor: 'transparent' }]} />
              <View style={styles.donutInfo}>
                <Typography variant="h3" color={colors.text}>
                  {currentIncome > 0 ? Math.min(100, Math.round((currentExpense / currentIncome) * 100)) : 0}%
                </Typography>
                <Typography variant="small" color={colors.textSecondary}>of income used</Typography>
              </View>
            </View>
            <View style={styles.chartLegend}>
              <LegendItem color={colors.primary} label="Fixed" value={`${fixedPercent}%`} />
              <LegendItem color={colors.secondary} label="Variable" value={`${variablePercent}%`} />
              <LegendItem color={colors.accent} label="Savings" value={`${savingsPercent}%`} />
            </View>
          </View>
        </Card>

        <Typography variant="label" style={styles.sectionLabel}>ANALYSIS BY CATEGORY</Typography>
        <View style={styles.categoryList}>
          {topCategories.length > 0 ? (
            topCategories.map((category, index) => (
              <CategoryItem
                key={category.name}
                icon={index === 0 ? TrendingUp : index === 1 ? PieIcon : ArrowUpRight}
                name={category.name}
                amount={`${currency}${category.amount.toFixed(0)}`}
                percentage={category.percentage}
                color={index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.accent}
              />
            ))
          ) : (
            <Typography variant="body" align="center" color={colors.textSecondary}>Insufficient data for categorization.</Typography>
          )}
        </View>

        <Card style={[styles.alertCard, { backgroundColor: colors.card, borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
          <Typography variant="bodyBold">Vault Intelligence</Typography>
          <Typography variant="small" style={{ marginTop: 4 }}>{insightText}</Typography>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Typography variant="small" style={{ flex: 1, marginLeft: 8 }}>{label}</Typography>
      <Typography variant="small" style={{ fontWeight: '600' }}>{value}</Typography>
    </View>
  );
}

function CategoryItem({
  icon: Icon,
  name,
  amount,
  percentage,
  color,
}: {
  icon: any;
  name: string;
  amount: string;
  percentage: number;
  color: string;
}) {
  const colors = useThemeColors();

  return (
    <View style={styles.catItem}>
      <View style={[styles.catIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.catDetails}>
          <Typography variant="body">{name}</Typography>
          <Typography variant="bodyBold">{amount}</Typography>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  filterContainer: { flexDirection: 'row', paddingHorizontal: Theme.spacing.md, gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  scrollContent: { padding: Theme.spacing.md },
  feedbackCard: { marginBottom: Theme.spacing.md },
  overviewCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.lg },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  chartPlaceholder: { marginTop: Theme.spacing.xl, flexDirection: 'row', alignItems: 'center' },
  donutRow: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  donut: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 10 },
  donutInfo: { alignItems: 'center' },
  chartLegend: { flex: 1, marginLeft: 32, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { marginBottom: Theme.spacing.md, letterSpacing: 1 },
  categoryList: { gap: Theme.spacing.lg, marginBottom: Theme.spacing.xl },
  catItem: { flexDirection: 'row', alignItems: 'center' },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  alertCard: { padding: Theme.spacing.lg },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 13, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
