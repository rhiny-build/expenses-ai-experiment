/**
 * Expense Type Definitions
 *
 * This file contains all TypeScript types and interfaces for the expense tracking application.
 *
 * For developers coming from Java/C#:
 * - TypeScript interfaces are similar to interfaces in Java/C# - they define contracts for objects
 * - Type aliases (using 'type' keyword) are like enums or union types
 * - The '|' operator creates union types (similar to enums but more flexible)
 * - All types are compile-time only and don't exist at runtime (like Java generics erasure)
 */

/**
 * Valid expense categories
 *
 * Now supports custom user-defined categories stored in localStorage.
 * The type remains a string for flexibility, but the actual categories
 * are managed through the CategoryManager component.
 *
 * @example
 * const category: ExpenseCategory = 'Food'; // Valid
 * const category2: ExpenseCategory = 'Custom Category'; // Also valid
 */
export type ExpenseCategory = string;

/**
 * Default categories provided out of the box with descriptions
 * Users can add, edit, rename, or archive these
 */
export const DEFAULT_CATEGORY_CONFIGS: Array<{name: string; description: string}> = [
  { name: 'Food', description: 'Groceries, restaurants, cafes, food delivery' },
  { name: 'Transportation', description: 'Gas, public transit, uber/taxi, parking, car maintenance' },
  { name: 'Entertainment', description: 'Movies, games, concerts, streaming services, hobbies' },
  { name: 'Shopping', description: 'Clothing, electronics, home goods, general retail' },
  { name: 'Bills', description: 'Utilities, rent, phone, internet, insurance, subscriptions' },
  { name: 'Other', description: 'Anything that doesn\'t clearly fit the above' }
];

/**
 * Legacy default category names (for backwards compatibility)
 */
export const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_CONFIGS.map(c => c.name) as unknown as readonly ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];

/**
 * Category data model for category management
 *
 * Represents a category with its metadata including order, archived status, and description.
 *
 * @property name - Display name of the category
 * @property description - Description to help users and AI understand what belongs in this category
 * @property order - Sort order for dropdown display (lower = higher in list)
 * @property isArchived - Whether category is archived (hidden from new expense forms)
 * @property expenseCount - Number of expenses using this category (computed)
 */
export interface Category {
  name: string;
  description: string;
  order: number;
  isArchived: boolean;
  expenseCount?: number; // Computed field, not stored
}

/**
 * Core expense data model
 *
 * Represents a single expense record with all its properties.
 * This is the main domain object used throughout the application.
 *
 * For Java/C# developers:
 * - Similar to a POCO (Plain Old CLR Object) or POJO (Plain Old Java Object)
 * - All fields are required (non-nullable) by default in TypeScript
 * - Use optional fields with '?' if needed (e.g., `id?: string`)
 *
 * @property id - Unique identifier for the expense (format: timestamp-randomString)
 * @property date - Date of the expense in ISO format (YYYY-MM-DD)
 * @property amount - Expense amount in GBP (always positive number)
 * @property category - Classification of the expense
 * @property description - User-provided description of the expense
 * @property createdAt - Timestamp when the expense was created (ISO 8601 format)
 */
export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
}

/**
 * Form data structure for creating/editing expenses
 *
 * Represents the shape of data from user input forms before validation.
 * Note that 'amount' is a string here (from text input) and will be
 * parsed to number before creating an Expense object.
 *
 * For Java/C# developers:
 * - This is like a DTO (Data Transfer Object) or ViewModel
 * - Used to separate form state from domain model
 * - Allows handling of invalid input (e.g., non-numeric amounts)
 *
 * @property date - Date string from date input (YYYY-MM-DD)
 * @property amount - Amount as string from text input (will be validated)
 * @property category - Selected category from dropdown
 * @property description - User-entered description text
 */
export interface ExpenseFormData {
  date: string;
  amount: string;
  category: ExpenseCategory;
  description: string;
}

/**
 * Filter criteria for expense list
 *
 * Defines all possible filters that can be applied to the expense list.
 * All filters are optional (empty string = no filter applied).
 *
 * For Java/C# developers:
 * - Similar to a filter/criteria object pattern
 * - Used with the filterExpenses() utility function
 * - Supports combining multiple filters (AND logic)
 *
 * @property category - Filter by category ('All' means no category filter)
 * @property startDate - Filter expenses on or after this date (ISO format)
 * @property endDate - Filter expenses on or before this date (ISO format)
 * @property searchTerm - Search in description and category (case-insensitive)
 */
export interface ExpenseFilters {
  category: string | 'All';
  startDate: string;
  endDate: string;
  searchTerm: string;
}

/**
 * Aggregated expense statistics
 *
 * Contains calculated summary data for a set of expenses.
 * Generated by the calculateSummary() utility function.
 *
 * For Java/C# developers:
 * - This is a read-only result object (similar to a projection or DTO)
 * - Contains derived/computed data, not stored data
 * - Record<K, V> is TypeScript's way of expressing Dictionary<K,V> or Map<K,V>
 *
 * @property totalSpending - Sum of all expense amounts
 * @property monthlySpending - Sum of expenses in the current month
 * @property categoryBreakdown - Total spending per category (dynamic keys)
 * @property topCategory - The category with highest total spending
 */
export interface ExpenseSummary {
  totalSpending: number;
  monthlySpending: number;
  categoryBreakdown: Record<string, number>;
  topCategory: {
    category: string;
    amount: number;
  };
}
