import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as DB from '@/services/db';

export type TransactionType = 'income' | 'expense';
export type AppTheme = 'light' | 'dark';
export type CurrencySymbol = '$' | '€' | '£' | '¥' | '₹' | 'A$' | 'C$' | 'CHF' | '₩';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  category: string;
  projectedCompletion?: string;
}

interface FinanceState {
  transactions: Transaction[];
  goals: Goal[];
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  
  // Settings & UX
  theme: AppTheme;
  currency: CurrencySymbol;
  biometricsEnabled: boolean;
  notificationsEnabled: boolean;
  dbInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  init: (forceRefresh?: boolean) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  editTransaction: (id: string, updated: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  updateGoal: (id: string, amount: number) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  setTheme: (theme: AppTheme) => void;
  setCurrency: (currency: CurrencySymbol) => Promise<void>;
  toggleBiometrics: () => void;
  toggleNotifications: () => void;
  seedData: () => Promise<void>;
  clearError: () => void;
}


const mockTransactions: Transaction[] = [
  // Current Month
  { id: '1', amount: 240.00, type: 'expense', category: 'Personal', date: new Date().toISOString(), note: 'Essential wardrobe update' },
  { id: '2', amount: 1500.00, type: 'income', category: 'Salary', date: new Date().toISOString(), note: 'Project Q3 Strategy' },
  { id: '3', amount: 45.50, type: 'expense', category: 'Food', date: new Date().toISOString(), note: 'Dinner with friends' },
  
  // Previous Month (for comparison)
  { 
    id: '4', 
    amount: 1200.00, 
    type: 'income', 
    category: 'Salary', 
    date: new Date(Date.now() - 32 * 86400000).toISOString(), 
    note: 'Previous Month Salary' 
  },
  { 
    id: '5', 
    amount: 400.00, 
    type: 'expense', 
    category: 'Housing', 
    date: new Date(Date.now() - 35 * 86400000).toISOString(), 
    note: 'Previous Rent' 
  },
];

const mockGoals: Goal[] = [
  { id: 'g1', name: 'New Car', targetAmount: 35000, currentAmount: 24500, icon: 'car', category: 'Transport' },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => {
      const recalculateStats = (transactions: Transaction[]) => {
        let income = 0;
        let expense = 0;
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        transactions.forEach(t => {
          const tDate = new Date(t.date);
          if (tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear) {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
          }
        });

        const netWorth = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
        return { monthlyIncome: income, monthlyExpense: expense, netWorth };
      };

      return {
        transactions: [],
        goals: [],
        netWorth: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        theme: 'dark',
        currency: '$',
        biometricsEnabled: false,
        notificationsEnabled: true,
        dbInitialized: false,
        isLoading: false,
        error: null,

        init: async (forceRefresh = false) => {
          if (get().dbInitialized && !forceRefresh) return;
          set({ isLoading: true, error: null });
          try {
            const db = await DB.initDB();
            const transactions = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
            const goalsData = await DB.getAllItemsDB(db, 'goals') as any[];
            
            const stats = recalculateStats(transactions);
            const goals = goalsData.map(g => ({ ...g, targetAmount: g.target_amount, currentAmount: g.current_amount }));

            set({ 
              transactions, 
              goals, 
              ...stats,
              dbInitialized: true,
              isLoading: false 
            });
          } catch (err) {
            set({ error: 'Database Initialization Failed', isLoading: false });
            console.error(err);
          }
        },

        addTransaction: async (t) => {
          set({ isLoading: true, error: null });
          try {
            if (!['income', 'expense'].includes(t.type)) {
              throw new Error(`Invalid transaction type: ${t.type}`);
            }

            const id = Math.random().toString(36).substr(2, 9);
            const newT = { ...t, id };
            const db = await DB.initDB();
            await DB.addItemDB(db, 'transactions', newT);
            
            // Re-fetch all and recalculate
            const all = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
            const stats = recalculateStats(all);
            
            set({ transactions: all, ...stats, isLoading: false, error: null });
            console.log(`[useFinanceStore] Transaction added successfully: ${t.type}`);
          } catch (err: any) {
            console.error('[addTransaction] Error:', err);
            set({ error: err?.message || 'Failed to add transaction', isLoading: false });
          }
        },


        deleteTransaction: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const db = await DB.initDB();
            await DB.deleteItemDB(db, 'transactions', id);
            const all = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
            const stats = recalculateStats(all);
            set({ transactions: all, ...stats, isLoading: false });
          } catch (err) {
            set({ error: 'Failed to delete transaction', isLoading: false });
          }
        },

        editTransaction: async (id, updated) => {
          set({ isLoading: true, error: null });
          try {
            const db = await DB.initDB();
            await DB.updateItemDB(db, 'transactions', id, updated);
            const all = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
            const stats = recalculateStats(all);
            set({ transactions: all, ...stats, isLoading: false });
          } catch (err) {
            set({ error: 'Failed to edit transaction', isLoading: false });
          }
        },

        updateGoal: async (id, amount) => {
          set({ isLoading: true, error: null });
          try {
            const db = await DB.initDB();
            await DB.updateItemDB(db, 'goals', id, { current_amount: amount });
            const allGoals = await DB.getAllItemsDB(db, 'goals') as any[];
            set({ goals: allGoals.map(g => ({ ...g, targetAmount: g.target_amount, currentAmount: g.current_amount })), isLoading: false });
          } catch (err) {
            set({ error: 'Failed to update goal', isLoading: false });
          }
        },

        addGoal: async (goal) => {
          set({ isLoading: true, error: null });
          try {
            const id = Math.random().toString(36).substr(2, 9);
            const db = await DB.initDB();
            await DB.addItemDB(db, 'goals', { 
              id, 
              name: goal.name, 
              target_amount: goal.targetAmount, 
              current_amount: goal.currentAmount, 
              icon: goal.icon, 
              category: goal.category 
            });
            const allGoals = await DB.getAllItemsDB(db, 'goals') as any[];
            set({ goals: allGoals.map(g => ({ ...g, targetAmount: g.target_amount, currentAmount: g.current_amount })), isLoading: false });
          } catch (err) {
            console.error('Add Goal Error:', err);
            set({ error: 'Failed to add goal. Please try again.', isLoading: false });
          }
        },

        setTheme: (theme) => set({ theme }),
        
        setCurrency: async (newCurrency) => {
          const currentCurrency = get().currency;
          if (currentCurrency === newCurrency) return;
          
          console.log(`[setCurrency] Converting from ${currentCurrency} to ${newCurrency}`);
          set({ isLoading: true, error: null });

          const symbolToIso: Record<CurrencySymbol, string> = {
            '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', 'A$': 'AUD', 'C$': 'CAD', 'CHF': 'CHF', '₩': 'KRW'
          };

          const oldIso = symbolToIso[currentCurrency];
          const newIso = symbolToIso[newCurrency];
          const apiKey = process.env.EXPO_PUBLIC_EXCHANGE_RATE_API_KEY;

          try {
            if (!apiKey) {
               throw new Error('API Key missing in .env (EXPO_PUBLIC_EXCHANGE_RATE_API_KEY)');
            }

            let response;
            try {
              response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${oldIso}`);
            } catch (netErr) {
              throw new Error('Network request failed. Please check your internet connection.');
            }

            if (!response.ok) {
              throw new Error(`API returned HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.result === 'success') {
              const rate = data.conversion_rates[newIso];
              console.log(`[setCurrency] Rate found: ${rate}`);
              
              const db = await DB.initDB();
              const oldTransactions = get().transactions;
              const oldGoals = get().goals;

              // Use a transaction for stability on Android (no NullPointerException)
              await db.withTransactionAsync(async () => {
                console.log(`[setCurrency] Transaction started: ${oldTransactions.length} items to update`);
                
                // Use a sequential loop for more reliable processing on Android native bridge
                for (const t of oldTransactions) {
                  await DB.updateItemDB(db, 'transactions', t.id, { amount: t.amount * rate });
                }
                for (const g of oldGoals) {
                  await DB.updateItemDB(db, 'goals', g.id, { 
                    target_amount: g.targetAmount * rate, 
                    current_amount: g.currentAmount * rate 
                  });
                }
              });

              console.log(`[setCurrency] Transaction complete. Symbol: ${newCurrency}`);
              set({ currency: newCurrency });
              await get().init(true);
              
              Alert.alert(
                'Success', 
                `Currency converted! All records updated from ${currentCurrency} to ${newCurrency} at ${rate.toFixed(4)}`
              );
            } else {
              throw new Error(data['error-type'] || 'API failure from server');
            }
          } catch (error: any) {
            console.error("Currency conversion error:", error);
            const msg = error?.message || 'Check connection or API key.';
            set({ error: `Conversion Error: ${msg}`, isLoading: false });
            
            Alert.alert(
              'Conversion Issue', 
              `${msg}\n\nOnly the symbol was updated as a fallback.`,
              [{ text: 'OK', onPress: () => set({ currency: newCurrency }) }]
            );
          }
        },


        toggleBiometrics: () => set((state) => ({ biometricsEnabled: !state.biometricsEnabled })),
        toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

        clearError: () => set({ error: null }),

        seedData: async () => {

          set({ isLoading: true, error: null });
          try {
            const db = await DB.initDB();
            await db.runAsync('DELETE FROM transactions');
            await db.runAsync('DELETE FROM goals');
            
            for (const t of mockTransactions) {
              await DB.addItemDB(db, 'transactions', t);
            }
            for (const g of mockGoals) {
              await DB.addItemDB(db, 'goals', { 
                id: g.id, 
                name: g.name, 
                target_amount: g.targetAmount, 
                current_amount: g.currentAmount, 
                icon: g.icon, 
                category: g.category 
              });
            }
            await get().init(true);
          } catch (err) {
            set({ error: 'Data Seeding Failed', isLoading: false });
          }
        }
      };
    },
    {
      name: 'equilibrium-finance-v4',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        theme: state.theme, 
        currency: state.currency, 
        biometricsEnabled: state.biometricsEnabled, 
        notificationsEnabled: state.notificationsEnabled 
      }),
    }
  )
);
