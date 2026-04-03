import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowDownRight, ArrowUpRight, Plus, Settings, Zap } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors } from '@/components/AppComponents';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { netWorth, monthlyIncome, monthlyExpense, currency, transactions, seedData, isLoading, error, clearError } = useFinanceStore();


  const chartHeights = useMemo(() => {
    const expenses = transactions.filter((transaction) => transaction.type === 'expense');
    const days = [6, 5, 4, 3, 2, 1, 0];
    const rawData = days.map((offset) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - offset);
      const dayKey = targetDate.toDateString();

      return expenses
        .filter((transaction) => new Date(transaction.date).toDateString() === dayKey)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    });

    const max = Math.max(...rawData, 1);
    return rawData.map((value) => Math.max((value / max) * 120, 10));
  }, [transactions]);

  const growth = useMemo(() => {
    const current = monthlyIncome - monthlyExpense;
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const previousNet = transactions
      .filter((transaction) => {
        const date = new Date(transaction.date);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum, transaction) => sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount), 0);

    if (previousNet === 0) return current > 0 ? '100.0' : '0.0';
    return (((current - previousNet) / Math.abs(previousNet)) * 100).toFixed(1);
  }, [monthlyExpense, monthlyIncome, transactions]);

  const isGrowthPositive = parseFloat(growth) >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? (
          <Pressable onPress={clearError}>
            <Card style={[styles.feedbackCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Typography variant="small" color={colors.expense}>{error}</Typography>
              <Typography variant="small" color={colors.textSecondary} style={{ fontSize: 10, marginTop: 4 }}>Tap to dismiss</Typography>
            </Card>
          </Pressable>
        ) : null}


        <View style={styles.header}>
          <View>
            <Typography variant="label" color={colors.textSecondary}>WELCOME BACK</Typography>
            <Typography variant="h2">Vault Overview</Typography>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={seedData} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Zap size={20} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => router.push('/profile')} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Settings size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <Card style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View>
            <Typography variant="label" color="rgba(255,255,255,0.7)">TOTAL NET WORTH</Typography>
            <Typography variant="h1" style={styles.balanceText}>
              {currency}{netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </View>
          <View style={styles.growthBadge}>
            {isGrowthPositive ? <ArrowUpRight size={14} color="white" /> : <ArrowDownRight size={14} color="white" />}
            <Typography variant="small" color="white" style={{ marginLeft: 4 }}>
              {isGrowthPositive ? '+' : ''}{growth}% from last month
            </Typography>
          </View>
        </Card>

        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <ArrowUpRight size={18} color={colors.primary} />
            </View>
            <Typography variant="small">TOTAL INCOME</Typography>
            <Typography variant="h3">{currency}{monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <ArrowDownRight size={18} color={colors.expense} />
            </View>
            <Typography variant="small">TOTAL EXPENSES</Typography>
            <Typography variant="h3">{currency}{monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Typography variant="h3">Weekly Spending</Typography>
          <Typography variant="small" color={colors.primary}>Last 7 Days</Typography>
        </View>

        <Card style={styles.chartCard} variant="outline">
          <View style={styles.chartBars}>
            {chartHeights.map((height, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(index * 100).springify()}
                style={[styles.bar, { height, backgroundColor: index === 6 ? colors.primary : colors.border }]}
              />
            ))}
          </View>
          <View style={styles.chartLabels}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
              <Typography key={`${label}-${index}`} variant="small" color={colors.textSecondary}>{label}</Typography>
            ))}
          </View>

        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => router.push('/add')}>
        <Plus size={30} color="white" />
      </Pressable>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </SafeAreaView>
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
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: { padding: Theme.spacing.md },
  feedbackCard: { marginBottom: Theme.spacing.md },
  balanceCard: { padding: Theme.spacing.xl, marginBottom: Theme.spacing.lg },
  balanceText: { color: 'white', marginTop: 8 },
  growthBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricsRow: { flexDirection: 'row', gap: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  metricCard: { flex: 1, padding: Theme.spacing.md },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  chartCard: { padding: Theme.spacing.lg },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginBottom: 16 },
  bar: { width: '8%', borderRadius: 4 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 13, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
