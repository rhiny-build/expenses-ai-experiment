/**
 * Local Storage Service for Expense Persistence
 *
 * This module handles all browser localStorage operations for expense data.
 * It provides a simple API for CRUD (Create, Read, Update, Delete) operations.
 *
 * For developers coming from Java/C#:
 * - localStorage is like a simple key-value database in the browser (similar to SharedPreferences in Android)
 * - Data is stored as strings, so we use JSON.stringify/parse for serialization
 * - This is a synchronous API (unlike most database operations in backend)
 * - Data persists between browser sessions but is cleared when user clears browser data
 *
 * Technical Notes:
 * - localStorage has a size limit (~5-10MB depending on browser)
 * - Always wrapped in try-catch because localStorage can throw errors (quota exceeded, privacy mode, etc.)
 * - SSR-safe: checks for window to avoid errors during server-side rendering
 */

import { Expense, Category, DEFAULT_CATEGORIES } from '@/types/expense';

/**
 * Storage keys for localStorage
 * Namespacing helps avoid conflicts with other apps on the same domain
 */
const STORAGE_KEY = 'expense_tracker_expenses';
const CATEGORIES_STORAGE_KEY = 'expense_tracker_categories';

/**
 * Storage service object containing all persistence methods
 *
 * For Java/C# developers:
 * - This pattern is similar to a static class or singleton service
 * - All methods are stateless and operate on localStorage directly
 * - Could be refactored to a class with dependency injection if needed
 */
export const storage = {
  /**
   * Retrieves all expenses from localStorage
   *
   * @returns Array of expenses, or empty array if none exist or error occurs
   *
   * Error handling:
   * - Returns empty array instead of throwing (fail-safe pattern)
   * - Handles SSR context (when window is undefined)
   * - Catches JSON parse errors for corrupted data
   *
   * @example
   * const expenses = storage.getExpenses();
   * console.log(`Found ${expenses.length} expenses`);
   */
  getExpenses: (): Expense[] => {
    // SSR check: localStorage only exists in browser, not during server-side rendering
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  /**
   * Saves the complete expense array to localStorage
   *
   * This replaces ALL existing expenses with the provided array.
   * Use this carefully - usually you want addExpense or updateExpense instead.
   *
   * @param expenses - Complete array of expenses to save
   *
   * For Java/C# developers:
   * - This is like truncating and rewriting a file
   * - Not transactional - if it fails, previous data might be lost
   * - Consider this a private method; public methods (add, update, delete) use it internally
   */
  saveExpenses: (expenses: Expense[]): void => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  /**
   * Adds a new expense to storage
   *
   * Uses the pattern: read -> modify -> write
   * This is safe for small datasets but not concurrent-safe.
   *
   * @param expense - The expense object to add (must include valid id)
   *
   * @example
   * const newExpense: Expense = {
   *   id: generateId(),
   *   date: '2025-10-16',
   *   amount: 50.00,
   *   category: 'Food',
   *   description: 'Lunch',
   *   createdAt: new Date().toISOString()
   * };
   * storage.addExpense(newExpense);
   */
  addExpense: (expense: Expense): void => {
    const expenses = storage.getExpenses();
    expenses.push(expense);
    storage.saveExpenses(expenses);
  },

  /**
   * Updates an existing expense by ID
   *
   * Finds the expense with matching ID and replaces it completely.
   * If no expense with the given ID exists, no action is taken (silent fail).
   *
   * @param id - The ID of the expense to update
   * @param updatedExpense - The complete new expense object (including the same id)
   *
   * For Java/C# developers:
   * - Similar to a repository's Update method
   * - Uses Array.findIndex() which is O(n) - acceptable for small datasets
   * - Silent failure pattern (no exception if ID not found)
   *
   * @example
   * storage.updateExpense('123', { ...existingExpense, amount: 75.00 });
   */
  updateExpense: (id: string, updatedExpense: Expense): void => {
    const expenses = storage.getExpenses();
    const index = expenses.findIndex(exp => exp.id === id);

    if (index !== -1) {
      expenses[index] = updatedExpense;
      storage.saveExpenses(expenses);
    }
  },

  /**
   * Deletes a single expense by ID
   *
   * Uses Array.filter() to create a new array excluding the specified expense.
   *
   * @param id - The ID of the expense to delete
   *
   * Behavior:
   * - If expense doesn't exist, still succeeds (idempotent operation)
   * - Original array is not mutated; creates new filtered array
   *
   * @example
   * storage.deleteExpense('expense-123');
   */
  deleteExpense: (id: string): void => {
    const expenses = storage.getExpenses();
    const filtered = expenses.filter(exp => exp.id !== id);
    storage.saveExpenses(filtered);
  },

  /**
   * Deletes multiple expenses by IDs (bulk delete)
   *
   * More efficient than calling deleteExpense() multiple times
   * because it only reads and writes once.
   *
   * @param ids - Array of expense IDs to delete
   *
   * Performance optimization:
   * - Uses Set for O(1) lookup instead of Array.includes() which is O(n)
   * - For 100 expenses and 10 deletes: O(n) vs O(n*m) complexity
   *
   * @example
   * storage.deleteMultipleExpenses(['id1', 'id2', 'id3']);
   */
  deleteMultipleExpenses: (ids: string[]): void => {
    const expenses = storage.getExpenses();
    const idsSet = new Set(ids); // Convert to Set for faster lookup
    const filtered = expenses.filter(exp => !idsSet.has(exp.id));
    storage.saveExpenses(filtered);
  },

  /**
   * Removes all expenses from storage
   *
   * This is a destructive operation with no undo!
   * Completely removes the storage key from localStorage.
   *
   * Use cases:
   * - User explicitly requests to clear all data
   * - Testing/development scenarios
   * - Data export before reset
   *
   * @example
   * if (confirm('Delete all expenses?')) {
   *   storage.clearAllExpenses();
   * }
   */
  clearAllExpenses: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Retrieves all categories from localStorage
   *
   * @returns Array of categories, or default categories if none exist
   *
   * Initializes with DEFAULT_CATEGORIES on first run
   */
  getCategories: (): Category[] => {
    if (typeof window === 'undefined') {
      return DEFAULT_CATEGORIES.map((name, index) => ({
        name,
        order: index,
        isArchived: false
      }));
    }

    try {
      const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }

      // First time - initialize with defaults
      const defaultCategories = DEFAULT_CATEGORIES.map((name, index) => ({
        name,
        order: index,
        isArchived: false
      }));
      storage.saveCategories(defaultCategories);
      return defaultCategories;
    } catch (error) {
      console.error('Error reading categories from localStorage:', error);
      return DEFAULT_CATEGORIES.map((name, index) => ({
        name,
        order: index,
        isArchived: false
      }));
    }
  },

  /**
   * Saves the complete category array to localStorage
   *
   * @param categories - Complete array of categories to save
   */
  saveCategories: (categories: Category[]): void => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories to localStorage:', error);
    }
  },

  /**
   * Gets active (non-archived) categories sorted by order
   *
   * @returns Array of active categories
   */
  getActiveCategories: (): Category[] => {
    return storage.getCategories()
      .filter(cat => !cat.isArchived)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Gets archived categories
   *
   * @returns Array of archived categories
   */
  getArchivedCategories: (): Category[] => {
    return storage.getCategories()
      .filter(cat => cat.isArchived)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Adds a new category
   *
   * @param name - Name of the new category
   */
  addCategory: (name: string): void => {
    const categories = storage.getCategories();
    const maxOrder = Math.max(...categories.map(c => c.order), -1);

    categories.push({
      name: name.trim(),
      order: maxOrder + 1,
      isArchived: false
    });

    storage.saveCategories(categories);
  },

  /**
   * Updates a category name
   *
   * @param oldName - Current name of the category
   * @param newName - New name for the category
   */
  updateCategoryName: (oldName: string, newName: string): void => {
    const categories = storage.getCategories();
    const category = categories.find(c => c.name === oldName);

    if (category) {
      category.name = newName.trim();
      storage.saveCategories(categories);

      // Update all expenses with this category
      const expenses = storage.getExpenses();
      const updatedExpenses = expenses.map(exp =>
        exp.category === oldName ? { ...exp, category: newName.trim() } : exp
      );
      storage.saveExpenses(updatedExpenses);
    }
  },

  /**
   * Archives a category (hides from new expense forms)
   *
   * @param name - Name of the category to archive
   */
  archiveCategory: (name: string): void => {
    const categories = storage.getCategories();
    const category = categories.find(c => c.name === name);

    if (category) {
      category.isArchived = true;
      storage.saveCategories(categories);
    }
  },

  /**
   * Restores an archived category
   *
   * @param name - Name of the category to restore
   */
  restoreCategory: (name: string): void => {
    const categories = storage.getCategories();
    const category = categories.find(c => c.name === name);

    if (category) {
      category.isArchived = false;
      storage.saveCategories(categories);
    }
  },

  /**
   * Reorders categories (updates order field for drag-and-drop)
   *
   * @param categories - Array of categories in new order
   */
  reorderCategories: (categories: Category[]): void => {
    const updated = categories.map((cat, index) => ({
      ...cat,
      order: index
    }));
    storage.saveCategories(updated);
  },

  /**
   * Gets expense count for each category
   *
   * @returns Map of category name to expense count
   */
  getCategoryExpenseCounts: (): Record<string, number> => {
    const expenses = storage.getExpenses();
    const counts: Record<string, number> = {};

    expenses.forEach(exp => {
      counts[exp.category] = (counts[exp.category] || 0) + 1;
    });

    return counts;
  }
};
