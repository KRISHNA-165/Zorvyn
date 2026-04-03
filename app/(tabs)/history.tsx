import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter as FilterIcon, Pencil, Search, Trash2, TrendingUp, X } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import Theme from '@/constants/Theme';
import { Button, Card, Typography, useThemeColors } from '@/components/AppComponents';
import { PREDEFINED_CATEGORIES } from '@/constants/Categories';
import { Transaction, TransactionType, useFinanceStore } from '@/store/useFinanceStore';

export default function HistoryScreen() {
  const colors = useThemeColors();
  const { transactions, currency, isLoading, error, deleteTransaction, editTransaction } = useFinanceStore();

  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        transaction.category.toLowerCase().includes(query) ||
        transaction.note.toLowerCase().includes(query);

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, transactions, typeFilter]);

  const handleEditPress = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditNote(transaction.note);
    setEditCategory(transaction.category);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to permanently remove this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteTransaction(id) 
        }
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    await editTransaction(editingTransaction.id, {
      amount,
      note: editNote.trim(),
      category: editCategory.trim(),
    });

    if (!useFinanceStore.getState().error) {
      setEditingTransaction(null);
    }
  };

  const handleDeleteFromEdit = () => {
    if (!editingTransaction) return;
    const id = editingTransaction.id;
    setEditingTransaction(null);
    handleDelete(id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Activity</Typography>
        <Pressable style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setIsFilterModalVisible(true)}>
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
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </Card>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <Card style={[styles.feedbackCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Typography variant="small" color={colors.expense}>{error}</Typography>
          </Card>
        ) : null}

        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionList}>
            {filteredTransactions.map((transaction, index) => (
              <Animated.View key={transaction.id} entering={FadeInRight.delay(index * 50)}>
                <Card style={styles.activityItem} variant="outline">
                  <View style={[styles.activityIcon, { backgroundColor: transaction.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)' }]}>
                    <TrendingUp size={20} color={transaction.type === 'income' ? colors.primary : colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyBold">{transaction.category}</Typography>
                    <Typography variant="small" color={colors.textSecondary}>{transaction.note}</Typography>
                  </View>
                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Typography variant="bodyBold" color={transaction.type === 'income' ? colors.income : colors.expense}>
                      {transaction.type === 'income' ? '+' : '-'} {currency}{transaction.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="small" color={colors.textSecondary}>{new Date(transaction.date).toLocaleDateString()}</Typography>
                    <View style={styles.actionRow}>
                      <Pressable 
                        onPress={() => handleEditPress(transaction)} 
                        style={styles.actionIcon}
                        hitSlop={12}
                      >
                        <Pencil size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable 
                        onPress={() => handleDelete(transaction.id)} 
                        style={styles.actionIcon}
                        hitSlop={12}
                      >
                        <Trash2 size={16} color={colors.expense} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
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
              }}
              style={{ marginTop: 16 }}
            />
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={isFilterModalVisible} animationType="slide" transparent onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Filters</Typography>
              <Pressable onPress={() => setIsFilterModalVisible(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <Typography variant="label" style={styles.filterLabel}>TYPE</Typography>
            <View style={styles.filterRow}>
              {(['all', 'income', 'expense'] as const).map((filter) => (
                <Pressable key={filter} onPress={() => setTypeFilter(filter)} style={[styles.chip, typeFilter === filter && { backgroundColor: colors.primary }]}>
                  <Typography variant="small" color={typeFilter === filter ? 'white' : colors.text}>{filter.toUpperCase()}</Typography>
                </Pressable>
              ))}
            </View>

            <Typography variant="label" style={styles.filterLabel}>CATEGORY</Typography>
            <View style={styles.filterRow}>
              <Pressable onPress={() => setSelectedCategory('all')} style={[styles.chip, selectedCategory === 'all' && { backgroundColor: colors.primary }]}>
                <Typography variant="small" color={selectedCategory === 'all' ? 'white' : colors.text}>ALL</Typography>
              </Pressable>
              {PREDEFINED_CATEGORIES.slice(0, 6).map((category) => (
                <Pressable key={category} onPress={() => setSelectedCategory(category)} style={[styles.chip, selectedCategory === category && { backgroundColor: colors.primary }]}>
                  <Typography variant="small" color={selectedCategory === category ? 'white' : colors.text}>{category.toUpperCase()}</Typography>
                </Pressable>
              ))}
            </View>

            <Button title="Apply Filters" onPress={() => setIsFilterModalVisible(false)} style={{ marginTop: 20 }} />
          </Card>
        </View>
      </Modal>

      <Modal visible={!!editingTransaction} transparent animationType="fade" onRequestClose={() => setEditingTransaction(null)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Edit Transaction</Typography>
              <Pressable onPress={() => setEditingTransaction(null)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={editAmount}
              onChangeText={setEditAmount}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Category"
              placeholderTextColor={colors.textSecondary}
              value={editCategory}
              onChangeText={setEditCategory}
            />
            <TextInput
              style={[styles.input, styles.notesInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Notes"
              placeholderTextColor={colors.textSecondary}
              value={editNote}
              onChangeText={setEditNote}
              multiline
            />

            <View style={styles.actionButtons}>
              <Button title="Cancel" variant="secondary" onPress={() => setEditingTransaction(null)} style={{ flex: 1 }} />
              <Button title="Save Changes" onPress={handleSaveEdit} style={{ flex: 1 }} />
            </View>

            <Button 
              title="Delete Transaction" 
              variant="outline" 
              onPress={handleDeleteFromEdit} 
              style={{ marginTop: 12, borderColor: colors.expense }} 
              textStyle={{ color: colors.expense }}
            />
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
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  searchContainer: { paddingHorizontal: Theme.spacing.md, paddingBottom: Theme.spacing.sm },
  searchCard: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  searchInput: { flex: 1, minHeight: 24 },
  scrollContent: { padding: Theme.spacing.md },
  feedbackCard: { marginBottom: Theme.spacing.md },
  transactionList: { gap: Theme.spacing.sm },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: Theme.spacing.md },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionIcon: { padding: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: { padding: Theme.spacing.xl },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  filterLabel: { marginTop: Theme.spacing.md, marginBottom: Theme.spacing.sm, letterSpacing: 1 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(148, 163, 184, 0.15)' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  actionButtons: { flexDirection: 'row', gap: Theme.spacing.sm, marginTop: Theme.spacing.sm },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 13, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
