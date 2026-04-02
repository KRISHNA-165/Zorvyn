import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Platform, Pressable, Alert, TextInput, Modal, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Filter as FilterIcon, 
  TrendingUp, 
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Plus
} from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors, Button } from '@/components/AppComponents';
import { useFinanceStore, TransactionType, Transaction } from '@/store/useFinanceStore';
import { PREDEFINED_CATEGORIES } from '@/constants/Categories';

export default function HistoryScreen() {
  const colors = useThemeColors();
  const { transactions, currency, deleteTransaction, editTransaction } = useFinanceStore();
  
  // Filter States
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  
  // UI States
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Edit States
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const isWeb = Platform.OS === 'web';

  // Derived Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesType = typeFilter === 'all' ? true : t.type === typeFilter;
      const matchesCategory = selectedCategory === 'all' ? true : t.category === selectedCategory;
      const matchesSearch = t.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.note.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && tDate >= dateRange.start;
      }
      if (dateRange.end) {
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && tDate <= endOfDay;
      }

      return matchesType && matchesCategory && matchesSearch && matchesDate;
    });
  }, [transactions, typeFilter, selectedCategory, searchQuery, dateRange]);

  const handleEditPress = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditNote(transaction.note);
    setEditCategory(transaction.category);
    setIsCustomCategory(!PREDEFINED_CATEGORIES.includes(transaction.category));
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    editTransaction(editingTransaction.id, {
      amount,
      note: editNote,
      category: editCategory
    });
    setEditingTransaction(null);
  };

  const handleDateSelect = (date: Date) => {
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      setDateRange({ start: date, end: null });
    } else {
      if (date < dateRange.start) {
        setDateRange({ start: date, end: dateRange.start });
      } else {
        setDateRange({ start: dateRange.start, end: date });
      }
      setIsCalendarVisible(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Activity</Typography>
        <Pressable 
          style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <FilterIcon size={20} color={colors.primary} />
          <Typography variant="small" style={{ marginLeft: 8 }}>Filters</Typography>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Card style={styles.searchCard} variant="outline">
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by category or note..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </Card>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionList}>
            {filteredTransactions.map((t, i) => {
              const ItemContainer: any = isWeb ? View : Animated.View;
              return (
                <ItemContainer key={t.id} entering={isWeb ? undefined : FadeInRight.delay(i * 50)}>
                  <Card style={styles.activityItem} variant="outline">
                    <View style={[styles.activityIcon, { backgroundColor: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)' }]}>
                      <TrendingUp size={20} color={t.type === 'income' ? colors.primary : colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="bodyBold">{t.category}</Typography>
                      <Typography variant="small" color={colors.textSecondary}>{t.note}</Typography>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Typography variant="bodyBold" color={t.type === 'income' ? colors.income : colors.expense}>
                        {t.type === 'income' ? '+' : '-'} {currency}{t.amount.toFixed(2)}
                      </Typography>
                      <Typography variant="small" color={colors.textSecondary}>{new Date(t.date).toLocaleDateString()}</Typography>
                      <View style={styles.actionRow}>
                        <Pressable onPress={() => handleEditPress(t)} style={styles.actionIcon}>
                          <Pencil size={14} color={colors.textSecondary} />
                        </Pressable>
                        <Pressable onPress={() => deleteTransaction(t.id)} style={styles.actionIcon}>
                          <Trash2 size={14} color={colors.expense} />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                </ItemContainer>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Typography variant="body" color={colors.textSecondary}>No transactions found.</Typography>
            <Button 
              title="Clear Filters" 
              onPress={() => {
                setTypeFilter('all');
                setSelectedCategory('all');
                setSearchQuery('');
                setDateRange({ start: null, end: null });
              }}
              style={{ marginTop: 16 }}
            />
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={isFilterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Filters</Typography>
              <Pressable onPress={() => setIsFilterModalVisible(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Typography variant="label" style={styles.filterLabel}>TYPE</Typography>
              <View style={styles.filterRow}>
                {['all', 'income', 'expense'].map(f => (
                  <Pressable 
                    key={f} 
                    onPress={() => setTypeFilter(f as any)}
                    style={[styles.chip, typeFilter === f && { backgroundColor: colors.primary }]}
                  >
                    <Typography variant="small" color={typeFilter === f ? 'white' : colors.text}>{f.toUpperCase()}</Typography>
                  </Pressable>
                ))}
              </View>

              <Typography variant="label" style={styles.filterLabel}>CATEGORY</Typography>
              <View style={styles.filterRow}>
                <Pressable 
                  onPress={() => setSelectedCategory('all')}
                  style={[styles.chip, selectedCategory === 'all' && { backgroundColor: colors.primary }]}
                >
                  <Typography variant="small" color={selectedCategory === 'all' ? 'white' : colors.text}>ALL</Typography>
                </Pressable>
                {PREDEFINED_CATEGORIES.slice(0, 5).map(cat => (
                  <Pressable 
                    key={cat} 
                    onPress={() => setSelectedCategory(cat)}
                    style={[styles.chip, selectedCategory === cat && { backgroundColor: colors.primary }]}
                  >
                    <Typography variant="small" color={selectedCategory === cat ? 'white' : colors.text}>{cat.toUpperCase()}</Typography>
                  </Pressable>
                ))}
              </View>

              <Typography variant="label" style={styles.filterLabel}>DATE RANGE</Typography>
              <Pressable 
                style={[styles.datePickerInput, { borderColor: colors.border }]}
                onPress={() => setIsCalendarVisible(true)}
              >
                <Typography variant="body">
                  {dateRange.start ? dateRange.start.toLocaleDateString() : 'Start'} 
                  {' - '} 
                  {dateRange.end ? dateRange.end.toLocaleDateString() : 'End'}
                </Typography>
              </Pressable>

              <View style={styles.modalFooter}>
                <Button title="Apply Filters" onPress={() => setIsFilterModalVisible(false)} />
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* Calendar Modal (Visual Grid) */}
      <Modal visible={isCalendarVisible} transparent animationType="fade">
        <View style={styles.calendarOverlay}>
          <Card style={styles.calendarCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Pick a Date</Typography>
              <Pressable onPress={() => setIsCalendarVisible(false)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={styles.calendarGrid}>
              <View style={styles.weekDaysRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                  <Typography key={d} variant="small" style={styles.weekDay}>{d}</Typography>
                ))}
              </View>
              <View style={styles.daysContainer}>
                {/* Simplified Grid for "Real" Visual Feel */}
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const isSelected = (dateRange.start && dateRange.start.getDate() === day) || 
                                   (dateRange.end && dateRange.end.getDate() === day);
                  return (
                    <Pressable 
                      key={day} 
                      onPress={() => handleDateSelect(new Date(2026, 3, day))} // Mocked to April 2026 for demo
                      style={[styles.dayCell, isSelected && { backgroundColor: colors.primary }]}
                    >
                      <Typography variant="small" color={isSelected ? 'white' : colors.text}>{day}</Typography>
                    </Pressable>
                  );
                })}
              </View>
              <Typography variant="small" align="center" style={{ marginTop: 12 }} color={colors.textSecondary}>
                Select start and end dates to set a range.
              </Typography>
            </View>
            <Button title="Apply Range" onPress={() => setIsCalendarVisible(false)} style={{ marginTop: 20 }} />
          </Card>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingTransaction} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <Card style={styles.modalContent}>
              <Typography variant="h3" style={{ marginBottom: 16 }}>Edit Transaction</Typography>
              
              <View style={styles.editGroup}>
                <Typography variant="label">Amount ({currency})</Typography>
                <TextInput
                  style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                  keyboardType="numeric"
                  value={editAmount}
                  onChangeText={setEditAmount}
                />
              </View>

              <View style={styles.editGroup}>
                <Typography variant="label">Category</Typography>
                <View style={styles.categoryPicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 40 }}>
                    {PREDEFINED_CATEGORIES.map(cat => (
                      <Pressable 
                        key={cat} 
                        onPress={() => { setEditCategory(cat); setIsCustomCategory(false); }}
                        style={[styles.catChip, editCategory === cat && { backgroundColor: colors.primary }]}
                      >
                        <Typography variant="small" color={editCategory === cat ? 'white' : colors.text}>{cat}</Typography>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable 
                    onPress={() => setIsCustomCategory(true)}
                    style={[styles.catChip, isCustomCategory && { backgroundColor: colors.accent, marginTop: 8 }]}
                  >
                    <Typography variant="small" color={isCustomCategory ? 'white' : colors.text}>Custom Category</Typography>
                  </Pressable>
                </View>
                {isCustomCategory && (
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                    placeholder="Enter custom category..."
                    value={editCategory}
                    onChangeText={setEditCategory}
                  />
                )}
              </View>

              <View style={styles.editGroup}>
                <Typography variant="label">Note</Typography>
                <TextInput
                  style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                  value={editNote}
                  onChangeText={setEditNote}
                />
              </View>

              <View style={styles.modalFooter}>
                <Button title="Cancel" onPress={() => setEditingTransaction(null)} variant="outline" style={{ flex: 1 }} />
                <Button title="Save Changes" onPress={handleSaveEdit} style={{ flex: 2, marginLeft: 12 }} />
              </View>
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Theme.spacing.md 
  },
  filterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    borderWidth: 1 
  },
  searchContainer: { paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.md },
  searchCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    height: 50 
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  scrollContent: { padding: Theme.spacing.md },
  transactionList: { gap: Theme.spacing.md },
  activityItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Theme.spacing.md 
  },
  activityIcon: { 
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.md 
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionIcon: { padding: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  modalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' 
  },
  modalContent: { 
    padding: Theme.spacing.xl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 
  },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 
  },
  filterLabel: { marginTop: 20, marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
  datePickerInput: { 
    height: 50, borderWidth: 1, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 16 
  },
  modalFooter: { flexDirection: 'row', marginTop: 32 },
  calendarOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 
  },
  calendarCard: { width: '100%', padding: Theme.spacing.xl },
  calendarGrid: { minHeight: 200 },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekDay: { width: '14%', textAlign: 'center', fontWeight: '700' },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  editGroup: { marginBottom: 16 },
  textInput: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginTop: 8 },
  categoryPicker: { gap: 8, marginTop: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)', marginRight: 8 },
});
