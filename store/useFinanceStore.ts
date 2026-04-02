import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  
  // Settings
  theme: AppTheme;
  currency: CurrencySymbol;
  biometricsEnabled: boolean;
  notificationsEnabled: boolean;
  dbInitialized: boolean;
  
  // Actions
  init: () => Promise<void>;
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
    (set, get) => ({
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

      init: async () => {
        if (get().dbInitialized) return;
        const db = await DB.initDB();
        const transactions = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
        const goals = await DB.getAllItemsDB(db, 'goals') as Goal[];
        
        // Calculate totals
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

        set({ 
          transactions, 
          goals: goals.map(g => ({ ...g, targetAmount: (g as any).target_amount, currentAmount: (g as any).current_amount })), 
          monthlyIncome: income, 
          monthlyExpense: expense,
          netWorth,
          dbInitialized: true 
        });
      },

      addTransaction: async (t) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newT = { ...t, id };
        const db = await DB.initDB();
        await DB.addItemDB(db, 'transactions', newT);
        
        // Refresh local state (simplest way to ensure SQL and Store match)
        const all = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
        const netWorth = all.reduce((acc, tr) => acc + (tr.type === 'income' ? tr.amount : -tr.amount), 0);
        
        set({ transactions: all, netWorth });
      },

      deleteTransaction: async (id) => {
        const db = await DB.initDB();
        await DB.deleteItemDB(db, 'transactions', id);
        const all = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
        const netWorth = all.reduce((acc, tr) => acc + (tr.type === 'income' ? tr.amount : -tr.amount), 0);
        set({ transactions: all, netWorth });
      },

      editTransaction: async (id, updated) => {
        const db = await DB.initDB();
        await DB.updateItemDB(db, 'transactions', id, updated);
        const all = await DB.getAllItemsDB(db, 'transactions') as Transaction[];
        const netWorth = all.reduce((acc, tr) => acc + (tr.type === 'income' ? tr.amount : -tr.amount), 0);
        set({ transactions: all, netWorth });
      },

      updateGoal: async (id, amount) => {
        const db = await DB.initDB();
        await DB.updateItemDB(db, 'goals', id, { current_amount: amount });
        const allGoals = await DB.getAllItemsDB(db, 'goals') as any[];
        set({ goals: allGoals.map(g => ({ ...g, targetAmount: g.target_amount, currentAmount: g.current_amount })) });
      },

      addGoal: async (goal) => {
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
        set({ goals: allGoals.map(g => ({ ...g, targetAmount: g.target_amount, currentAmount: g.current_amount })) });
      },

      setTheme: (theme) => set({ theme }),
      
      setCurrency: async (newCurrency) => {
        const currentCurrency = get().currency;
        if (currentCurrency === newCurrency) return;

        const symbolToIso: Record<CurrencySymbol, string> = {
          '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', 'A$': 'AUD', 'C$': 'CAD', 'CHF': 'CHF', '₩': 'KRW'
        };

        const oldIso = symbolToIso[currentCurrency];
        const newIso = symbolToIso[newCurrency];

        try {
          const apiKey = process.env.EXPO_PUBLIC_EXCHANGE_RATE_API_KEY;
          const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${oldIso}`);
          const data = await response.json();

          if (data.result === 'success') {
            const rate = data.conversion_rates[newIso];
            const oldTransactions = get().transactions;
            const oldGoals = get().goals;
            
            const db = await DB.initDB();
            // Update all transactions in DB (this is heavy but accurate)
            for (const t of oldTransactions) {
              await DB.updateItemDB(db, 'transactions', t.id, { amount: t.amount * rate });
            }
            for (const g of oldGoals) {
              await DB.updateItemDB(db, 'goals', g.id, { 
                target_amount: g.targetAmount * rate, 
                current_amount: g.currentAmount * rate 
              });
            }

            set({ currency: newCurrency });
            await get().init(); // Recalculate everything from DB
          }
        } catch (error) {
          console.error("Currency conversion error:", error);
          set({ currency: newCurrency });
        }
      },

      toggleBiometrics: () => set((state) => ({ biometricsEnabled: !state.biometricsEnabled })),
      toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

      seedData: async () => {
        const db = await DB.initDB();
        // Clear tables
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
        await get().init();
      }
    }),
    {
      name: 'equilibrium-finance-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        theme: state.theme, 
        currency: state.currency, 
        biometricsEnabled: state.biometricsEnabled, 
        notificationsEnabled: state.notificationsEnabled 
      }), // Only persist simple settings in AsyncStorage, data stays in SQLite
    }
  )
);
