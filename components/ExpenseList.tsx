'use client';

import { useState } from 'react';
import { Expense, ExpenseCategory, ExpenseFilters } from '@/types/expense';
import { formatCurrency, filterExpenses, sortExpensesByDate } from '@/utils/expenseUtils';
import { format } from 'date-fns';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onDeleteAll: () => void;
}

const CATEGORIES: (ExpenseCategory | 'All')[] = [
  'All',
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

const getCategoryColor = (category: ExpenseCategory): string => {
  const colors: Record<ExpenseCategory, string> = {
    Food: 'bg-green-100 text-green-800',
    Transportation: 'bg-blue-100 text-blue-800',
    Entertainment: 'bg-purple-100 text-purple-800',
    Shopping: 'bg-pink-100 text-pink-800',
    Bills: 'bg-red-100 text-red-800',
    Other: 'bg-gray-100 text-gray-800',
  };
  return colors[category];
};

export default function ExpenseList({ expenses, onEdit, onDelete, onDeleteMultiple, onDeleteAll }: ExpenseListProps) {
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: 'All',
    startDate: '',
    endDate: '',
    searchTerm: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredExpenses = sortExpensesByDate(filterExpenses(expenses, filters));

  const handleDelete = (id: string, description: string) => {
    if (confirm(`Are you sure you want to delete "${description}"?`)) {
      onDelete(id);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExpenses.map(exp => exp.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected expense(s)?`)) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleDeleteAll = () => {
    if (expenses.length === 0) return;
    if (confirm(`Are you sure you want to delete ALL ${expenses.length} expense(s)? This cannot be undone.`)) {
      onDeleteAll();
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Expense List</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleDeleteAll}
            disabled={expenses.length === 0}
            className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors font-medium text-sm disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            Delete All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-slate-300 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search expenses..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-slate-300 mb-1">
            Category
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value as ExpenseCategory | 'All' })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-slate-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-slate-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No expenses found</p>
          <p className="text-slate-500 text-sm mt-2">
            {expenses.length === 0 ? 'Add your first expense to get started' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold w-12">
                  <input
                    type="checkbox"
                    checked={filteredExpenses.length > 0 && selectedIds.size === filteredExpenses.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Category</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Description</th>
                <th className="text-right py-3 px-4 text-slate-300 font-semibold">Amount</th>
                <th className="text-right py-3 px-4 text-slate-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-700 hover:bg-slate-750">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(expense.id)}
                      onChange={() => handleToggleSelect(expense.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-200">{expense.description}</td>
                  <td className="py-3 px-4 text-right font-semibold text-white">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-blue-400 hover:text-blue-300 mr-3 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id, expense.description)}
                      className="text-red-400 hover:text-red-300 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </div>
        </div>
      )}
    </div>
  );
}
