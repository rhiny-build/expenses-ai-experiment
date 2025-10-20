/**
 * Unit Tests for Expense Utility Functions
 *
 * This file contains tests for all utility functions in expenseUtils.ts
 *
 * For developers coming from Java/C#:
 * - describe() is like a test class - it groups related tests together
 * - test() or it() is like a [Test] or @Test method - each one tests a specific behavior
 * - expect() is like Assert - it verifies that actual values match expected values
 * - beforeEach() is like @Before or [SetUp] - runs before each test
 *
 * Test Structure Pattern:
 * - Arrange: Set up test data
 * - Act: Execute the function being tested
 * - Assert: Verify the results using expect()
 */

import {
  calculateSummary,
  filterExpenses,
  sortExpensesByDate,
  formatCurrency,
  generateId,
} from '../expenseUtils';
import { Expense, ExpenseFilters } from '@/types/expense';

describe('expenseUtils', () => {
  // Sample test data used across multiple tests
  // Similar to creating test fixtures in Java/C#
  const mockExpenses: Expense[] = [
    {
      id: '1',
      date: '2025-10-01',
      amount: 50.00,
      category: 'Food',
      description: 'Groceries',
      createdAt: '2025-10-01T10:00:00Z',
    },
    {
      id: '2',
      date: '2025-10-15',
      amount: 30.00,
      category: 'Transportation',
      description: 'Bus ticket',
      createdAt: '2025-10-15T14:00:00Z',
    },
    {
      id: '3',
      date: '2025-09-20',
      amount: 100.00,
      category: 'Entertainment',
      description: 'Concert tickets',
      createdAt: '2025-09-20T18:00:00Z',
    },
    {
      id: '4',
      date: '2025-10-10',
      amount: 75.00,
      category: 'Food',
      description: 'Restaurant',
      createdAt: '2025-10-10T19:00:00Z',
    },
  ];

  /**
   * Tests for calculateSummary()
   * This function aggregates expense data and calculates totals
   */
  describe('calculateSummary', () => {
    test('should calculate total spending correctly', () => {
      // Arrange: We have mockExpenses with known amounts
      // Act: Calculate summary
      const summary = calculateSummary(mockExpenses);

      // Assert: Total should be sum of all expenses (50 + 30 + 100 + 75 = 255)
      expect(summary.totalSpending).toBe(255);
    });

    test('should calculate monthly spending for current month', () => {
      // This test depends on current date
      // In October 2025, it should include expenses from October only
      const summary = calculateSummary(mockExpenses);

      // October expenses: 50 + 30 + 75 = 155
      expect(summary.monthlySpending).toBe(155);
    });

    test('should create category breakdown correctly', () => {
      const summary = calculateSummary(mockExpenses);

      // Verify each category total
      expect(summary.categoryBreakdown.Food).toBe(125); // 50 + 75
      expect(summary.categoryBreakdown.Transportation).toBe(30);
      expect(summary.categoryBreakdown.Entertainment).toBe(100);
      expect(summary.categoryBreakdown.Shopping).toBe(0);
      expect(summary.categoryBreakdown.Bills).toBe(0);
      expect(summary.categoryBreakdown.Other).toBe(0);
    });

    test('should identify top spending category', () => {
      const summary = calculateSummary(mockExpenses);

      // Food has highest total (125)
      expect(summary.topCategory.category).toBe('Food');
      expect(summary.topCategory.amount).toBe(125);
    });

    test('should handle empty expenses array', () => {
      const summary = calculateSummary([]);

      expect(summary.totalSpending).toBe(0);
      expect(summary.monthlySpending).toBe(0);
      expect(summary.topCategory.amount).toBe(0);
    });
  });

  /**
   * Tests for filterExpenses()
   * This function filters expenses based on multiple criteria
   */
  describe('filterExpenses', () => {
    test('should filter by category', () => {
      // Arrange: Create filter for Food category only
      const filters: ExpenseFilters = {
        category: 'Food',
        startDate: '',
        endDate: '',
        searchTerm: '',
      };

      // Act: Apply filter
      const filtered = filterExpenses(mockExpenses, filters);

      // Assert: Should only return Food expenses
      expect(filtered).toHaveLength(2);
      expect(filtered.every(exp => exp.category === 'Food')).toBe(true);
    });

    test('should filter by date range', () => {
      const filters: ExpenseFilters = {
        category: 'All',
        startDate: '2025-10-01',
        endDate: '2025-10-31',
        searchTerm: '',
      };

      const filtered = filterExpenses(mockExpenses, filters);

      // Should only include October expenses
      expect(filtered).toHaveLength(3);
    });

    test('should filter by search term in description', () => {
      const filters: ExpenseFilters = {
        category: 'All',
        startDate: '',
        endDate: '',
        searchTerm: 'ticket',
      };

      const filtered = filterExpenses(mockExpenses, filters);

      // Should match "Bus ticket" and "Concert tickets"
      expect(filtered).toHaveLength(2);
    });

    test('should filter by search term in category', () => {
      const filters: ExpenseFilters = {
        category: 'All',
        startDate: '',
        endDate: '',
        searchTerm: 'food',
      };

      const filtered = filterExpenses(mockExpenses, filters);

      // Should match Food category (case insensitive)
      expect(filtered).toHaveLength(2);
    });

    test('should apply multiple filters simultaneously', () => {
      const filters: ExpenseFilters = {
        category: 'Food',
        startDate: '2025-10-01',
        endDate: '2025-10-31',
        searchTerm: 'restaurant',
      };

      const filtered = filterExpenses(mockExpenses, filters);

      // Should only match the Restaurant expense
      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toBe('Restaurant');
    });

    test('should return all expenses when no filters applied', () => {
      const filters: ExpenseFilters = {
        category: 'All',
        startDate: '',
        endDate: '',
        searchTerm: '',
      };

      const filtered = filterExpenses(mockExpenses, filters);

      expect(filtered).toHaveLength(mockExpenses.length);
    });
  });

  /**
   * Tests for sortExpensesByDate()
   * This function sorts expenses chronologically
   */
  describe('sortExpensesByDate', () => {
    test('should sort expenses by date descending (newest first) by default', () => {
      const sorted = sortExpensesByDate(mockExpenses);

      // Verify newest date is first
      expect(sorted[0].date).toBe('2025-10-15');
      expect(sorted[sorted.length - 1].date).toBe('2025-09-20');
    });

    test('should sort expenses by date ascending when specified', () => {
      const sorted = sortExpensesByDate(mockExpenses, true);

      // Verify oldest date is first
      expect(sorted[0].date).toBe('2025-09-20');
      expect(sorted[sorted.length - 1].date).toBe('2025-10-15');
    });

    test('should not mutate original array', () => {
      // Important: Functions should not modify input data
      const original = [...mockExpenses];
      sortExpensesByDate(mockExpenses);

      // Original array should remain unchanged
      expect(mockExpenses).toEqual(original);
    });
  });

  /**
   * Tests for formatCurrency()
   * This function formats numbers as currency strings
   */
  describe('formatCurrency', () => {
    test('should format positive amounts correctly', () => {
      expect(formatCurrency(100)).toBe('£100.00');
      expect(formatCurrency(50.5)).toBe('£50.50');
      expect(formatCurrency(1234.56)).toBe('£1,234.56');
    });

    test('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('£0.00');
    });

    test('should handle large amounts with proper formatting', () => {
      expect(formatCurrency(1000000)).toBe('£1,000,000.00');
    });

    test('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('£11.00');
      expect(formatCurrency(10.994)).toBe('£10.99');
    });
  });

  /**
   * Tests for generateId()
   * This function creates unique identifiers
   */
  describe('generateId', () => {
    test('should generate unique IDs', () => {
      // Generate multiple IDs
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      // All should be different
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    test('should generate non-empty strings', () => {
      const id = generateId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('should include timestamp component', () => {
      const id = generateId();

      // ID format: timestamp-randomstring
      expect(id).toContain('-');

      const timestamp = id.split('-')[0];
      const numericTimestamp = parseInt(timestamp, 10);

      // Should be a valid timestamp close to current time
      expect(numericTimestamp).toBeGreaterThan(Date.now() - 1000);
      expect(numericTimestamp).toBeLessThan(Date.now() + 1000);
    });
  });
});
