import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Flame, Plus, Shield, Plane, Trophy, X } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors, Button } from '@/components/AppComponents';
import { Goal, useFinanceStore } from '@/store/useFinanceStore';

export default function GoalsScreen() {
  const colors = useThemeColors();
  const { goals, transactions, currency, addGoal, updateGoal, isLoading, error } = useFinanceStore();

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalContribution, setGoalContribution] = useState('');

  const now = new Date();

  const challengeMetrics = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const dayToExpenses: Record<string, number> = {};
    expenses.forEach((t) => {
      const dateKey = new Date(t.date).toDateString();
      dayToExpenses[dateKey] = (dayToExpenses[dateKey] || 0) + 1;
    });

    let streak = 0;
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    while (streak < 365) {
      const dateKey = current.toDateString();
      if (dayToExpenses[dateKey]) break;
      streak++;
      current.setDate(current.getDate() - 1);
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();
    const spendDays = new Set(
      expenses
        .filter((t) => {
          const date = new Date(t.date);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .map((t) => new Date(t.date).toDateString())
    ).size;

    const noSpendDaysSoFar = currentDayOfMonth - spendDays;
    const progressPercent = Math.round((noSpendDaysSoFar / daysInMonth) * 100);

    return { streak, daysInMonth, noSpendDaysSoFar, progressPercent };
  }, [now, transactions]);

  const milestones = useMemo(() => {
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const hasIncome = transactions.some((transaction) => transaction.type === 'income');
    const halfwayGoal = goals.some((goal) => goal.currentAmount >= goal.targetAmount / 2);

    return [
      {
        id: 'income',
        title: 'Income logged',
        description: hasIncome ? 'You have recorded at least one income transaction.' : 'Log your first income transaction.',
        unlocked: hasIncome,
      },
      {
        id: 'savings',
        title: 'Saved over 10,000',
        description: totalSaved >= 10000 ? `Current saved total: ${currency}${totalSaved.toLocaleString()}` : `Save ${currency}${Math.max(0, 10000 - totalSaved).toLocaleString()} more.`,
        unlocked: totalSaved >= 10000,
      },
      {
        id: 'goal',
        title: 'Halfway to a goal',
        description: halfwayGoal ? 'At least one goal is 50% funded.' : 'Fund any goal to at least 50%.',
        unlocked: halfwayGoal,
      },
      {
        id: 'streak',
        title: '7-day no-spend streak',
        description: challengeMetrics.streak >= 7 ? `Current streak: ${challengeMetrics.streak} days.` : `Current streak: ${challengeMetrics.streak} days.`,
        unlocked: challengeMetrics.streak >= 7,
      },
    ];
  }, [challengeMetrics.streak, currency, goals, transactions]);

  const handleAddGoal = async () => {
    if (!goalName || !goalTarget || isNaN(parseFloat(goalTarget))) return;

    await addGoal({
      name: goalName,
      targetAmount: parseFloat(goalTarget),
      currentAmount: 0,
      icon: 'shield',
      category: 'General',
    });

    if (!useFinanceStore.getState().error) {
      setGoalName('');
      setGoalTarget('');
      setIsAddingGoal(false);
    }
  };

  const handleGoalContribution = async () => {
    if (!selectedGoal) return;
    const contribution = parseFloat(goalContribution);
    if (isNaN(contribution) || contribution <= 0) return;

    const nextAmount = Math.min(selectedGoal.targetAmount, selectedGoal.currentAmount + contribution);
    await updateGoal(selectedGoal.id, nextAmount);

    if (!useFinanceStore.getState().error) {
      setSelectedGoal(null);
      setGoalContribution('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Goals</Typography>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsAddingGoal((prev) => !prev)}
        >
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <Card style={[styles.feedbackCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Typography variant="small" color={colors.expense}>{error}</Typography>
          </Card>
        ) : null}

        {isAddingGoal ? (
          <Card style={styles.addGoalCard}>
            <Typography variant="bodyBold" style={{ marginBottom: 12 }}>Create New Goal</Typography>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Goal Name"
              placeholderTextColor={colors.textSecondary}
              value={goalName}
              onChangeText={setGoalName}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Target Amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />
            <View style={styles.row}>
              <Pressable onPress={() => setIsAddingGoal(false)} style={[styles.saveBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, flex: 1 }]}>
                <Typography variant="bodyBold">Cancel</Typography>
              </Pressable>
              <Pressable onPress={handleAddGoal} style={[styles.saveBtn, { backgroundColor: colors.primary, flex: 1 }]}>
                <Typography variant="bodyBold" color="white">Save Goal</Typography>
              </Pressable>
            </View>
          </Card>
        ) : null}

        <Card style={[styles.challengeCard, { backgroundColor: colors.card }]}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeInfo}>
              <Typography variant="label" color={colors.accent}>ACTIVE CHALLENGE</Typography>
              <Typography variant="h3">No-Spend {now.toLocaleString('default', { month: 'long' })}</Typography>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Flame size={16} color={colors.accent} />
              <Typography variant="small" color={colors.accent} style={{ marginLeft: 4 }}>
                {challengeMetrics.streak} Day Streak
              </Typography>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Typography variant="small">Monthly Progress</Typography>
              <Typography variant="small" style={{ fontWeight: '600' }}>
                {challengeMetrics.noSpendDaysSoFar}/{challengeMetrics.daysInMonth} Days
              </Typography>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${challengeMetrics.progressPercent}%`, backgroundColor: colors.accent }]} />
            </View>
          </View>
        </Card>

        <Typography variant="label" style={styles.sectionLabel}>SAVINGS GOALS</Typography>
        <View style={styles.goalsList}>
          {goals.length > 0 ? (
            goals.map((goal, index) => {
              const GoalIcon = goal.icon === 'car' ? Car : goal.icon === 'shield' ? Shield : Plane;
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              const ItemContainer: any = Animated.View;

              return (
                <ItemContainer key={goal.id} entering={FadeInUp.delay(index * 100)}>
                  <Card style={styles.goalItem} variant="outline">
                    <View style={styles.goalTop}>
                      <View style={[styles.goalIcon, { backgroundColor: colors.background }]}>
                        <GoalIcon size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Typography variant="bodyBold">{goal.name}</Typography>
                        <Typography variant="small">{goal.category}</Typography>
                      </View>
                      <Typography variant="bodyBold">
                        {currency}{goal.currentAmount.toLocaleString()} / {currency}{goal.targetAmount.toLocaleString()}
                      </Typography>
                    </View>

                    <View style={[styles.progressBar, { backgroundColor: colors.border, marginTop: 12 }]}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
                    </View>

                    <View style={styles.goalBottom}>
                      <Typography variant="small">{progress.toFixed(1)}% complete</Typography>
                      <Button title="Add Funds" onPress={() => setSelectedGoal(goal)} />
                    </View>
                  </Card>
                </ItemContainer>
              );
            })
          ) : (
            <Card style={styles.emptyCard} variant="outline">
              <Typography variant="body">No active goals found.</Typography>
            </Card>
          )}
        </View>

        <Typography variant="label" style={styles.sectionLabel}>MILESTONES</Typography>
        <View style={styles.goalsList}>
          {milestones.map((milestone) => (
            <Card key={milestone.id} style={styles.milestoneCard} variant="outline">
              <View style={styles.milestoneRow}>
                <View style={[styles.goalIcon, { backgroundColor: milestone.unlocked ? 'rgba(16, 185, 129, 0.1)' : colors.background }]}>
                  <Trophy size={20} color={milestone.unlocked ? colors.primary : colors.textSecondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="bodyBold">{milestone.title}</Typography>
                  <Typography variant="small" color={colors.textSecondary}>{milestone.description}</Typography>
                </View>
                <Typography variant="small" color={milestone.unlocked ? colors.primary : colors.textSecondary}>
                  {milestone.unlocked ? 'Unlocked' : 'Locked'}
                </Typography>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedGoal} transparent animationType="fade" onRequestClose={() => setSelectedGoal(null)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Update Goal</Typography>
              <Pressable onPress={() => setSelectedGoal(null)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <Typography variant="bodyBold">{selectedGoal?.name}</Typography>
            <Typography variant="small" color={colors.textSecondary} style={{ marginTop: 4 }}>
              Current: {currency}{selectedGoal?.currentAmount.toLocaleString()} of {currency}{selectedGoal?.targetAmount.toLocaleString()}
            </Typography>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background, marginTop: 16 }]}
              placeholder="Contribution amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={goalContribution}
              onChangeText={setGoalContribution}
            />

            <View style={styles.row}>
              <Pressable onPress={() => setSelectedGoal(null)} style={[styles.saveBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, flex: 1 }]}>
                <Typography variant="bodyBold">Cancel</Typography>
              </Pressable>
              <Pressable onPress={handleGoalContribution} style={[styles.saveBtn, { backgroundColor: colors.primary, flex: 1 }]} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Typography variant="bodyBold" color="white">Save</Typography>}
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>

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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: Theme.spacing.md },
  feedbackCard: { marginBottom: 16 },
  challengeCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.xl },
  addGoalCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.xl },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  saveBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  challengeInfo: { flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  progressSection: { gap: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  sectionLabel: { marginBottom: Theme.spacing.md, letterSpacing: 1 },
  goalsList: { gap: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  goalItem: { padding: Theme.spacing.md },
  goalTop: { flexDirection: 'row', alignItems: 'center' },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  emptyCard: { alignItems: 'center', padding: Theme.spacing.xl },
  milestoneCard: { padding: Theme.spacing.md },
  milestoneRow: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: { padding: Theme.spacing.xl },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 13, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
