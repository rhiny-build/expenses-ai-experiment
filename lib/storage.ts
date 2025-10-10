import { Expense } from '@/types/expense';

const STORAGE_KEY = 'expense_tracker_expenses';

export const storage = {
  getExpenses: (): Expense[] => {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveExpenses: (expenses: Expense[]): void => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  addExpense: (expense: Expense): void => {
    const expenses = storage.getExpenses();
    expenses.push(expense);
    storage.saveExpenses(expenses);
  },

  updateExpense: (id: string, updatedExpense: Expense): void => {
    const expenses = storage.getExpenses();
    const index = expenses.findIndex(exp => exp.id === id);

    if (index !== -1) {
      expenses[index] = updatedExpense;
      storage.saveExpenses(expenses);
    }
  },

  deleteExpense: (id: string): void => {
    const expenses = storage.getExpenses();
    const filtered = expenses.filter(exp => exp.id !== id);
    storage.saveExpenses(filtered);
  },

  deleteMultipleExpenses: (ids: string[]): void => {
    const expenses = storage.getExpenses();
    const idsSet = new Set(ids);
    const filtered = expenses.filter(exp => !idsSet.has(exp.id));
    storage.saveExpenses(filtered);
  },

  clearAllExpenses: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
};
