import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Check, 
  Calendar, 
  CreditCard,
  ChevronDown
} from 'lucide-react-native';

import Theme from '@/constants/Theme';
import { Typography, Button, useThemeColors, Card } from '@/components/AppComponents';
import { useFinanceStore, TransactionType, Transaction } from '@/store/useFinanceStore';
import { useRouter } from 'expo-router';
import { PREDEFINED_CATEGORIES } from '@/constants/Categories';

export default function AddTransactionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { addTransaction, currency } = useFinanceStore();
  
  const [amount, setAmount] = useState('0.00');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [note, setNote] = useState('');


  const handleNumberPress = (num: string) => {
    setAmount(prev => {
      if (prev === '0.00') return num;
      // Allow decimal to be appended appropriately
      if (num === '.' && prev.includes('.')) return prev;
      return prev + num;
    });
  };

  const handleSave = () => {
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transaction amount.');
      return;
    }
    
    addTransaction({
      amount: finalAmount,
      type,
      category: isCustomCategory ? customCategory : category,
      date: new Date().toISOString(),
      note: note || `New ${isCustomCategory ? customCategory : category} ${type}`,
    });
    router.push('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/')} style={styles.headerIcon}>
          <View>
            <X size={24} color={colors.textSecondary} />
          </View>
        </Pressable>
        <Typography variant="h3">New Transaction</Typography>
        <Pressable onPress={handleSave} style={styles.headerIcon}>
          <View>
            <Check size={24} color={colors.primary} />
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Typography variant="label" align="center">TRANSACTION AMOUNT</Typography>
          <View style={styles.amountWrapper}>
            <Typography variant="h1" style={styles.currencySymbol}>{currency}</Typography>
            <Typography variant="h1" style={styles.amountValue}>{amount}</Typography>
          </View>
        </View>

        {/* Type Toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable 
            onPress={() => setType('expense')}
            style={({ pressed }) => [
              styles.toggleBtn, 
              type === 'expense' && { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
              pressed && { opacity: 0.7 }
            ]}
          >
            <View>
              <Typography 
                variant="bodyBold" 
                color={type === 'expense' ? colors.expense : colors.textSecondary}
              >
                Expense
              </Typography>
            </View>
          </Pressable>
          <Pressable 
            onPress={() => setType('income')}
            style={({ pressed }) => [
              styles.toggleBtn, 
              type === 'income' && { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
              pressed && { opacity: 0.7 }
            ]}
          >
            <View>
              <Typography 
                variant="bodyBold" 
                color={type === 'income' ? colors.primary : colors.textSecondary}
              >
                Income
              </Typography>
            </View>
          </Pressable>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Typography variant="label" style={{ marginBottom: 12 }}>CATÉGORY</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {PREDEFINED_CATEGORIES.map((cat) => (
              <Pressable 
                key={cat} 
                onPress={() => { setCategory(cat); setIsCustomCategory(false); }}
                style={[
                  styles.catChip, 
                  { borderColor: colors.border },
                  (!isCustomCategory && category === cat) && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Typography variant="small" color={(!isCustomCategory && category === cat) ? 'white' : colors.text}>{cat}</Typography>
              </Pressable>
            ))}
            <Pressable 
              onPress={() => setIsCustomCategory(true)}
              style={[
                styles.catChip, 
                { borderColor: colors.border },
                isCustomCategory && { backgroundColor: colors.accent, borderColor: colors.accent }
              ]}
            >
              <Typography variant="small" color={isCustomCategory ? 'white' : colors.text}>Custom</Typography>
            </Pressable>
          </ScrollView>
          
          {isCustomCategory && (
            <TextInput 
              style={[styles.customInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter custom category name..."
              placeholderTextColor={colors.textSecondary}
              value={customCategory}
              onChangeText={setCustomCategory}
              autoFocus
            />
          )}
        </View>

        {/* Date & Account */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Typography variant="label">DATE</Typography>
            <View style={[styles.metaInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Calendar size={18} color={colors.textSecondary} />
              <Typography variant="body" style={{ marginLeft: 8 }}>{new Date().toLocaleDateString()}</Typography>
            </View>
          </View>
          <View style={styles.metaCol}>
            <Typography variant="label">FROM ACCOUNT</Typography>
            <View style={[styles.metaInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CreditCard size={18} color={colors.textSecondary} />
              <Typography variant="body" style={{ flex: 1, marginLeft: 8 }}>Main Savings</Typography>
              <ChevronDown size={14} color={colors.textSecondary} />
            </View>
          </View>
        </View>

        {/* Notes */}
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

        {/* Numeric Pad */}
        <View style={styles.numPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((val) => (
            <Pressable 
              key={val} 
              style={({ pressed }) => [
                styles.numBtn, 
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { backgroundColor: colors.border }
              ]}
              onPress={() => handleNumberPress(val.toString())}
            >
              <View>
                <Typography variant="h2">{val}</Typography>
              </View>
            </Pressable>
          ))}
          <Pressable 
            style={({ pressed }) => [
              styles.numBtn, 
              styles.saveBtn, 
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 }
            ]}
            onPress={handleSave}
          >
            <View>
              <Typography variant="bodyBold" color="white">Save</Typography>
            </View>
          </Pressable>
        </View>
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
  headerIcon: {
    padding: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }) as any,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  currencySymbol: {
    fontSize: 42,
    marginRight: 8,
  },
  amountValue: {
    fontSize: 64,
    letterSpacing: -2,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: Theme.borderRadius.md,
    padding: 6,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    ...Platform.select({ web: { cursor: 'pointer' } }) as any,
  },
  section: {
    marginBottom: Theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    justifyContent: 'space-between',
  },
  catIconBox: {
    width: '18%',
    aspectRatio: 0.9,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }) as any,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  metaCol: {
    flex: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    padding: 12,
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
    ...Platform.select({ web: { cursor: 'pointer', userSelect: 'none' } }) as any,
  },
  saveBtn: {
    borderColor: 'transparent',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
  },
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
});
