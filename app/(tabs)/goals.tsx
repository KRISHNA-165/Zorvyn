import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Trophy, 
  Target, 
  Flame, 
  Plus, 
  ChevronRight,
  Shield,
  Car,
  Plane
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors } from '@/components/AppComponents';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function GoalsScreen() {
  const colors = useThemeColors();
  const { goals, currency, addGoal } = useFinanceStore();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const handleAddGoal = () => {
    if (!goalName || !goalTarget || isNaN(parseFloat(goalTarget))) return;
    addGoal({
      name: goalName,
      targetAmount: parseFloat(goalTarget),
      currentAmount: 0,
      icon: 'shield', // Default layout uses shield/car/plane safely
      category: 'General'
    });
    setGoalName('');
    setGoalTarget('');
    setIsAddingGoal(false);
  };

  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Goals</Typography>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsAddingGoal(!isAddingGoal)}
        >
          <View><Plus size={20} color="white" /></View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isAddingGoal && (
          <Card style={styles.addGoalCard}>
            <Typography variant="bodyBold" style={{ marginBottom: 12 }}>Create New Goal</Typography>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Goal Name (e.g. New Laptop)"
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
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setIsAddingGoal(false)} style={[styles.saveBtn, { backgroundColor: colors.card, flex: 1, borderWidth: 1, borderColor: colors.border }]}>
                <Typography variant="bodyBold" color={colors.text}>Cancel</Typography>
              </Pressable>
              <Pressable onPress={handleAddGoal} style={[styles.saveBtn, { backgroundColor: colors.primary, flex: 1 }]}>
                <Typography variant="bodyBold" color="white">Save Goal</Typography>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Active Challenge */}
        <Card style={{ ...styles.challengeCard, backgroundColor: colors.card }}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeInfo}>
              <Typography variant="label" color={colors.accent}>ACTIVE CHALLENGE</Typography>
              <Typography variant="h3">No-Spend November</Typography>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Flame size={16} color={colors.accent} />
              <Typography variant="small" color={colors.accent} style={{ marginLeft: 4 }}>7 Day Streak</Typography>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Typography variant="small">Progress</Typography>
              <Typography variant="small" style={{ fontWeight: '600' }}>22/30 Days</Typography>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: '73%', backgroundColor: colors.accent }]} />
            </View>
          </View>
        </Card>

        {/* Savings Goals */}
        <Typography variant="label" style={styles.sectionLabel}>SAVINGS GOALS</Typography>
        <View style={styles.goalsList}>
          {goals && goals.length > 0 ? (
            goals.map((goal, i) => {
              const GoalIcon = goal.icon === 'car' ? Car : goal.icon === 'shield' ? Shield : Plane;
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              
              const ItemContainer: any = isWeb ? View : Animated.View;
              return (
                <ItemContainer key={goal.id} entering={isWeb ? undefined : FadeInUp.delay(i * 100)}>
                  <Card style={styles.goalItem} variant="outline">
                    <View style={styles.goalTop}>
                      <View style={[styles.goalIcon, { backgroundColor: colors.background }]}>
                        <GoalIcon size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Typography variant="bodyBold">{goal.name}</Typography>
                        <Typography variant="small">{goal.category}</Typography>
                      </View>
                      <Typography variant="bodyBold">{goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} {currency}</Typography>
                    </View>
                    
                    <View style={[styles.progressBar, { backgroundColor: colors.border, marginTop: 12 }]}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
                    </View>
                    
                    <View style={styles.goalBottom}>
                      <Typography variant="small">{progress.toFixed(1)}% complete</Typography>
                      {goal.projectedCompletion && (
                        <Typography variant="small" color={colors.textSecondary}>ETA: {goal.projectedCompletion}</Typography>
                      )}
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

        {/* Milestones */}
        <Typography variant="label" style={styles.sectionLabel}>MILESTONES</Typography>
        <Card style={styles.milestoneCard} variant="outline">
          <View style={styles.milestoneRow}>
            <Trophy size={20} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography variant="bodyBold">First $10k Saved</Typography>
              <Typography variant="small">Unlocked on Oct 12, 2023</Typography>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }) as any,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  challengeCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  addGoalCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  challengeInfo: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionLabel: {
    marginBottom: Theme.spacing.md,
    letterSpacing: 1,
  },
  goalsList: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  goalItem: {
    padding: Theme.spacing.md,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  milestoneCard: {
    padding: Theme.spacing.md,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
