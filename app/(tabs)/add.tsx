import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Check, ChevronLeft, ChevronRight, X, Delete } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import Theme from '@/constants/Theme';
import { Typography, useThemeColors, Card } from '@/components/AppComponents';
import { useFinanceStore, TransactionType } from '@/store/useFinanceStore';
import { PREDEFINED_CATEGORIES } from '@/constants/Categories';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function AddTransactionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { addTransaction, currency, isLoading, error, clearError } = useFinanceStore();


  const [amount, setAmount] = useState('0.00');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const daysInView = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const leadingEmpty = firstDay.getDay();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < leadingEmpty; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [calendarMonth]);

  const handleNumberPress = (num: string) => {
    setAmount((prev) => {
      // Handle initial state
      if (prev === '0.00') {
        if (num === '.') return '0.';
        return num;
      }
      
      // Handle decimals
      if (num === '.' && prev.includes('.')) return prev;
      
      // Limit decimals to 2 places
      if (prev.includes('.')) {
        const [, decimal] = prev.split('.');
        if (decimal && decimal.length >= 2) return prev;
      }

      return prev + num;
    });
  };

  const handleBackspace = () => {
    setAmount((prev) => {
      if (prev === '0.00' || prev.length === 0) return '0.00';
      if (prev.length === 1) return '0.00';
      
      const next = prev.slice(0, -1);
      if (next === '' || next === '.') return '0.00';
      return next;
    });
  };

  const resetForm = () => {
    setAmount('0.00');
    setType('expense');
    setCategory(PREDEFINED_CATEGORIES[0]);
    setIsCustomCategory(false);
    setCustomCategory('');
    setNote('');
    setSelectedDate(new Date());
  };


  const handleSave = async () => {
    const finalAmount = parseFloat(amount);
    const finalCategory = isCustomCategory ? customCategory.trim() : category;

    if (isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transaction amount.');
      return;
    }

    if (!finalCategory) {
      Alert.alert('Missing Category', 'Please choose or enter a category.');
      return;
    }

    console.log(`[AddTransaction] Saving: ${type} ${finalAmount} in ${finalCategory}`);

    await addTransaction({
      amount: finalAmount,
      type,
      category: finalCategory,
      date: selectedDate.toISOString(),
      note: note.trim() || `New ${finalCategory} ${type}`,
    });


    if (!useFinanceStore.getState().error) {
      resetForm();
      Alert.alert('Success', 'Transaction saved successfully!', [
        { text: 'Add Another', style: 'cancel' },
        { text: 'Go to Dashboard', onPress: () => router.push('/') }
      ]);
    }
  };


  const changeCalendarMonth = (delta: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const renderLoadingOverlay = isLoading ? (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Typography style={{ marginTop: 12 }}>Saving transaction...</Typography>
    </View>
  ) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/')} style={styles.headerIcon}>
          <X size={24} color={colors.textSecondary} />
        </Pressable>
        <Typography variant="h3">New Transaction</Typography>
        <Pressable onPress={handleSave} style={styles.headerIcon} disabled={isLoading}>
          {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <Check size={24} color={colors.primary} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error ? (
          <Pressable onPress={clearError}>
            <Card style={[styles.feedbackCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Typography variant="small" color={colors.expense}>{error}</Typography>
              <Typography variant="small" color={colors.textSecondary} style={{ fontSize: 10, marginTop: 4 }}>Tap to dismiss</Typography>
            </Card>
          </Pressable>
        ) : null}


        <View style={styles.amountContainer}>
          <Typography variant="label" align="center">TRANSACTION AMOUNT</Typography>
          <View style={styles.amountWrapper}>
            <Typography variant="h1" style={styles.currencySymbol}>{currency}</Typography>
            <Typography variant="h1" style={styles.amountValue}>{amount}</Typography>
          </View>
        </View>

        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['expense', 'income'] as TransactionType[]).map((transactionType) => (
            <Pressable
              key={transactionType}
              onPress={() => {
                console.log(`[AddTransaction] Switching type to: ${transactionType}`);
                setType(transactionType);
              }}
              style={[
                styles.toggleBtn,
                transactionType === type && {
                  backgroundColor: transactionType === 'expense' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  borderColor: transactionType === 'expense' ? colors.expense : colors.primary,
                  borderWidth: 1,
                },
              ]}
              hitSlop={8}
            >
              <Typography
                variant="bodyBold"
                color={transactionType === type ? (transactionType === 'expense' ? colors.expense : colors.primary) : colors.textSecondary}
              >
                {transactionType === 'expense' ? 'Expense' : 'Income'}
              </Typography>
            </Pressable>
          ))}
        </View>


        <View style={styles.numPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((val) => (
            <Pressable
              key={val}
              style={[styles.numBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleNumberPress(val.toString())}
            >
              <Typography variant="h2">{val}</Typography>
            </Pressable>
          ))}
          
          <Pressable
            style={[styles.numBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleBackspace}
          >
            <Delete size={24} color={colors.expense} />
          </Pressable>

          <View style={styles.fullWidthRow}>
            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={20} color="white" />
                  <Typography variant="bodyBold" color="white" style={{ marginLeft: 8 }}>
                    Save Transaction
                  </Typography>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="label" style={{ marginBottom: 12 }}>CATEGORY</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {PREDEFINED_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setIsCustomCategory(false);
                }}
                style={[
                  styles.catChip,
                  { borderColor: colors.border },
                  !isCustomCategory && category === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Typography variant="small" color={!isCustomCategory && category === cat ? 'white' : colors.text}>{cat}</Typography>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setIsCustomCategory(true)}
              style={[
                styles.catChip,
                { borderColor: colors.border },
                isCustomCategory && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Typography variant="small" color={isCustomCategory ? 'white' : colors.text}>Custom</Typography>
            </Pressable>
          </ScrollView>
          {isCustomCategory ? (
            <TextInput
              style={[styles.customInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter custom category..."
              placeholderTextColor={colors.textSecondary}
              value={customCategory}
              onChangeText={setCustomCategory}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <Typography variant="label">DATE</Typography>
          <Pressable
            onPress={() => setIsDatePickerVisible(true)}
            style={[styles.metaInfo, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Calendar size={18} color={colors.textSecondary} />
            <Typography variant="body" style={{ marginLeft: 8 }}>{selectedDate.toLocaleDateString()}</Typography>
            <View style={{ flex: 1 }} />
            <Typography variant="small" color={colors.primary}>Change</Typography>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Typography variant="label">NOTES</Typography>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Add details..."
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>


      </ScrollView>

      <Modal visible={isDatePickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.calendarCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Select Date</Typography>
              <Pressable onPress={() => setIsDatePickerVisible(false)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.monthControls}>
              <Pressable onPress={() => changeCalendarMonth(-1)} style={[styles.monthNavBtn, { borderColor: colors.border }]}>
                <ChevronLeft size={18} color={colors.text} />
              </Pressable>
              <Typography variant="bodyBold">
                {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Typography>
              <Pressable onPress={() => changeCalendarMonth(1)} style={[styles.monthNavBtn, { borderColor: colors.border }]}>
                <ChevronRight size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekDaysRow}>
              {WEEK_DAYS.map((day) => (
                <Typography key={day} variant="small" style={styles.weekDay}>{day}</Typography>
              ))}
            </View>

            <View style={styles.daysContainer}>
              {daysInView.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => {
                      setSelectedDate(day);
                      setIsDatePickerVisible(false);
                    }}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: colors.primary },
                      !isSelected && isToday && { borderWidth: 1, borderColor: colors.primary },
                    ]}
                  >
                    <Typography variant="small" color={isSelected ? 'white' : colors.text}>
                      {day.getDate()}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>
      </Modal>

      {renderLoadingOverlay}
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
  headerIcon: { padding: 8 },
  scrollContent: { padding: Theme.spacing.md },
  feedbackCard: { marginBottom: 16 },
  amountContainer: { alignItems: 'center', paddingVertical: Theme.spacing.xl },
  amountWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: Theme.spacing.sm },
  currencySymbol: { fontSize: 42, marginRight: 8 },
  amountValue: { fontSize: 64, letterSpacing: -2 },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: Theme.borderRadius.md,
    padding: 6,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  section: { marginBottom: Theme.spacing.lg },
  categoryScroll: { flexDirection: 'row', marginBottom: Theme.spacing.md },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginTop: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  notesInput: {
    borderRadius: 12,
    padding: 16,
    marginTop: Theme.spacing.sm,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.lg,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  numBtn: {
    width: '30%',
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidthRow: {
    width: '100%',
    marginTop: Theme.spacing.sm,
  },
  primaryActionBtn: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  saveBtn: { borderColor: 'transparent' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: { width: '100%', padding: Theme.spacing.xl },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekDay: { width: '14%', textAlign: 'center', fontWeight: '700' },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 13, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
