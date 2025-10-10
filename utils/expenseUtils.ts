import { Expense, ExpenseCategory, ExpenseSummary, ExpenseFilters } from '@/types/expense';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export const calculateSummary = (expenses: Expense[]): ExpenseSummary => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const monthlyExpenses = expenses.filter(exp => {
    const expenseDate = parseISO(exp.date);
    return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
  });

  const monthlySpending = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryBreakdown: Record<ExpenseCategory, number> = {
    Food: 0,
    Transportation: 0,
    Entertainment: 0,
    Shopping: 0,
    Bills: 0,
    Other: 0,
  };

  expenses.forEach(exp => {
    categoryBreakdown[exp.category] += exp.amount;
  });

  const topCategoryEntry = Object.entries(categoryBreakdown).reduce(
    (max, [category, amount]) => (amount > max.amount ? { category: category as ExpenseCategory, amount } : max),
    { category: 'Other' as ExpenseCategory, amount: 0 }
  );

  return {
    totalSpending,
    monthlySpending,
    categoryBreakdown,
    topCategory: topCategoryEntry,
  };
};

export const filterExpenses = (expenses: Expense[], filters: ExpenseFilters): Expense[] => {
  return expenses.filter(expense => {
    // Category filter
    if (filters.category !== 'All' && expense.category !== filters.category) {
      return false;
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      const expenseDate = parseISO(expense.date);
      const start = parseISO(filters.startDate);
      const end = parseISO(filters.endDate);

      if (!isWithinInterval(expenseDate, { start, end })) {
        return false;
      }
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        expense.description.toLowerCase().includes(searchLower) ||
        expense.category.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });
};

export const sortExpensesByDate = (expenses: Expense[], ascending = false): Expense[] => {
  return [...expenses].sort((a, b) => {
    const dateA = parseISO(a.date).getTime();
    const dateB = parseISO(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
};

export const exportToCSV = (expenses: Expense[]): void => {
  if (expenses.length === 0) {
    alert('No expenses to export');
    return;
  }

  const headers = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map(exp => [
    exp.date,
    exp.category,
    exp.amount.toString(),
    `"${exp.description.replace(/"/g, '""')}"`, // Escape quotes in description
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export interface UncategorizedExpense {
  date: string;
  amount: number;
  description: string;
  category?: ExpenseCategory;
  confidence?: 'high' | 'medium' | 'low';
}

export const importFromCSV = (file: File): Promise<UncategorizedExpense[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          reject(new Error('CSV file is empty or invalid'));
          return;
        }

        // Parse header to detect format
        const header = lines[0].toLowerCase();
        const hasCategory = header.includes('category');

        // Skip header row
        const dataLines = lines.slice(1);
        const expenses: UncategorizedExpense[] = [];

        for (const line of dataLines) {
          // Parse CSV line (handle quoted fields properly)
          const fields: string[] = [];
          let currentField = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
              } else {
                // Toggle quote state
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // End of field
              fields.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          // Add last field
          fields.push(currentField.trim());

          if (fields.length < 3) continue;

          let date: string;
          let category: string | undefined;
          let amount: string;
          let description: string;

          if (hasCategory && fields.length >= 4) {
            // Format: Date, Category, Amount, Description
            [date, category, amount, description] = fields;
          } else {
            // Format: Date, Amount, Description (no category)
            [date, amount, description] = fields;
            category = undefined;
          }

          // Validate amount
          const parsedAmount = parseFloat(amount);
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            console.warn(`Invalid amount "${amount}" found, skipping row`);
            continue;
          }

          // Validate date
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            console.warn(`Invalid date "${date}" found, skipping row`);
            continue;
          }

          // Validate category if present
          const validCategories: ExpenseCategory[] = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];
          let validCategory: ExpenseCategory | undefined;

          if (category && validCategories.includes(category as ExpenseCategory)) {
            validCategory = category as ExpenseCategory;
          }

          expenses.push({
            date: date,
            amount: parsedAmount,
            description: description || '',
            category: validCategory,
          });
        }

        if (expenses.length === 0) {
          reject(new Error('No valid expenses found in CSV file'));
          return;
        }

        resolve(expenses);
      } catch (error) {
        reject(new Error('Failed to parse CSV file: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};
