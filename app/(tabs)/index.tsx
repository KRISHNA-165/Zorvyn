import React from 'react';
import { StyleSheet, View, ScrollView, Image, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Zap, 
  Settings,
  Plus
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors, Button } from '@/components/AppComponents';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { 
    transactions, 
    netWorth, 
    monthlyIncome, 
    monthlyExpense, 
    currency,
    seedData 
  } = useFinanceStore();

  const isWeb = Platform.OS === 'web';

  // Calculate real weekly spending for the chart
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dailySpending = last7Days.map(day => {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86400000;
    const total = transactions
      .filter(t => {
        const tDate = new Date(t.date).getTime();
        return t.type === 'expense' && tDate >= dayStart && tDate < dayEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return total;
  });

  const maxSpending = Math.max(...dailySpending, 1);
  const chartHeights = dailySpending.map(s => Math.max(10, (s / maxSpending) * 120));

  // Calculate Net Worth Growth
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const oldBalance = transactions
    .filter(t => new Date(t.date).getTime() < thirtyDaysAgo)
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  
  const growth = oldBalance !== 0 ? ((netWorth - oldBalance) / Math.abs(oldBalance) * 100).toFixed(1) : '0.0';
  const isGrowthPositive = parseFloat(growth) >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop' }} 
            style={styles.avatar} 
          />
          <View>
            <Typography variant="small" color={colors.textSecondary}>Welcome back,</Typography>
            <Typography variant="h3">The Vault</Typography>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.iconButton, { marginRight: 8 }]} 
            onPress={() => {
              console.log('Zap pressed');
              seedData();
            }}
          >
            <View><Zap size={20} color={colors.primary} /></View>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/profile')}>
            <View><Settings size={20} color={colors.textSecondary} /></View>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Net Worth Card */}
        <Card style={[styles.netWorthCard, { backgroundColor: colors.primary }]}>
          <Typography variant="label" color="rgba(255,255,255,0.8)">CURRENT NET WORTH</Typography>
          <View style={styles.balanceRow}>
            <Typography variant="h1" style={styles.balanceText}>
              {currency}{netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </View>
          <View style={[styles.growthBadge, { backgroundColor: isGrowthPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
            {isGrowthPositive ? <ArrowUpRight size={14} color="#10B981" /> : <ArrowDownRight size={14} color="#EF4444" />}
            <Typography variant="small" color={isGrowthPositive ? "#10B981" : "#EF4444"} style={{ marginLeft: 4 }}>
              {isGrowthPositive ? '+' : ''}{growth}% from last month
            </Typography>
          </View>
        </Card>

        {/* Aggregate Metrics */}
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

        {/* Weekly Spending Chart */}
        <View style={styles.sectionHeader}>
          <Typography variant="h3">Weekly Spending</Typography>
          <Typography variant="small" color={colors.primary}>View Report</Typography>
        </View>

        <Card style={styles.chartCard} variant="outline">
          <View style={styles.chartBars}>
            {chartHeights.map((h, i) => {
              const BarContainer: any = isWeb ? View : Animated.View;
              const isToday = i === 6;
              return (
                <BarContainer 
                  key={i} 
                  entering={isWeb ? undefined : FadeInUp.delay(i * 100).springify()}
                  style={[
                    styles.bar, 
                    { height: h, backgroundColor: isToday ? colors.primary : colors.border }
                  ]} 
                />
              );
            })}
          </View>
          <View style={styles.chartLabels}>
            {last7Days.map(d => (
              <Typography key={d.toISOString()} variant="small" style={{ fontSize: 10 }}>
                {weekDays[d.getDay()]}
              </Typography>
            ))}
          </View>
        </Card>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Typography variant="h3">Recent Activity</Typography>
          <Pressable onPress={() => router.push('/history')}>
            <Typography variant="small" color={colors.primary}>See All</Typography>
          </Pressable>
        </View>

        <View style={styles.activityList}>
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 3).map((t, i) => {
              const ItemContainer: any = isWeb ? View : Animated.View;
              return (
                <ItemContainer key={t.id} entering={isWeb ? undefined : FadeInRight.delay(i * 100)}>
                  <Card style={styles.activityItem} variant="outline">
                    <View style={[styles.activityIcon, { backgroundColor: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <TrendingUp size={20} color={t.type === 'income' ? colors.primary : colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="bodyBold">{t.category}</Typography>
                      <Typography variant="small">{t.note}</Typography>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Typography variant="bodyBold" color={t.type === 'income' ? colors.income : colors.expense}>
                        {t.type === 'income' ? '+' : '-'} {currency}{t.amount.toFixed(2)}
                      </Typography>
                      <Typography variant="small">{new Date(t.date).toLocaleDateString()}</Typography>
                    </View>
                  </Card>
                </ItemContainer>
              );
            })
          ) : (
            <Card style={styles.emptyCard} variant="outline">
              <Typography variant="body" align="center">No recent activity found.</Typography>
              <Button 
                title="Seed Mock Data" 
                onPress={seedData} 
                style={{ marginTop: 12 }} 
              />
            </Card>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/add')}
      >
        <View><Plus size={32} color="white" /></View>
      </Pressable>
    </SafeAreaView>
  );
}

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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      web: { cursor: 'pointer' }
    }) as any,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  netWorthCard: {
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  balanceRow: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  balanceText: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  metricCard: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  chartCard: {
    height: 180,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  bar: {
    width: 18,
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  activityList: {
    gap: Theme.spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    ...Platform.select({
      web: { cursor: 'pointer' }
    }) as any,
  },
});
