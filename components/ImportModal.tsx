'use client';

import { useState } from 'react';
import { ExpenseCategory } from '@/types/expense';
import { UncategorizedExpense } from '@/utils/expenseUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expensesNeedingCategory: Array<UncategorizedExpense & { index: number }>;
  onCategorySelected: (index: number, category: ExpenseCategory) => void;
  onConfirmAll: () => void;
  isProcessing: boolean;
  fileName?: string;
}

const CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

export default function ImportModal({
  isOpen,
  onClose,
  expensesNeedingCategory,
  onCategorySelected,
  onConfirmAll,
  isProcessing,
  fileName,
}: ImportModalProps) {
  if (!isOpen) return null;

  const allCategorized = expensesNeedingCategory.every(exp => exp.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Review & Categorize Expenses</h2>
              {fileName && (
                <p className="text-blue-400 mt-1 font-medium">
                  📄 {fileName}
                </p>
              )}
              <p className="text-slate-400 mt-1">
                {expensesNeedingCategory.filter(e => !e.category).length > 0
                  ? `${expensesNeedingCategory.filter(e => !e.category).length} expense${expensesNeedingCategory.filter(e => !e.category).length === 1 ? '' : 's'} need${expensesNeedingCategory.filter(e => !e.category).length === 1 ? 's' : ''} categorization`
                  : 'All expenses categorized'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {expensesNeedingCategory.map((expense) => {
              const confidenceColors = {
                high: {
                  border: 'border-green-500/30',
                  badge: 'bg-green-500/20 text-green-400',
                  select: 'bg-green-600 border-green-500 text-white',
                },
                medium: {
                  border: 'border-yellow-500/30',
                  badge: 'bg-yellow-500/20 text-yellow-400',
                  select: 'bg-yellow-600 border-yellow-500 text-white',
                },
                low: {
                  border: 'border-red-500/30',
                  badge: 'bg-red-500/20 text-red-400',
                  select: 'bg-slate-700 border-slate-600 text-slate-300',
                },
              };

              const confidence = expense.confidence || 'low';
              const colors = confidenceColors[confidence];
              const showBorder = expense.category ? colors.border : 'border-slate-600';

              return (
                <div
                  key={expense.index}
                  className={`bg-slate-750 border rounded-lg p-4 ${showBorder}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{expense.description}</span>
                        {expense.category && confidence === 'high' && (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {expense.category && (confidence === 'medium' || confidence === 'low') && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                            {confidence} confidence
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        £{expense.amount.toFixed(2)} • {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="md:w-48">
                      <select
                        value={expense.category || ''}
                        onChange={(e) => onCategorySelected(expense.index, e.target.value as ExpenseCategory)}
                        className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          expense.category ? colors.select : 'bg-slate-700 border-slate-600 text-slate-300'
                        }`}
                        disabled={isProcessing}
                      >
                        <option value="">Select category...</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmAll}
              disabled={!allCategorized || isProcessing}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding Expenses...
                </span>
              ) : (
                `Add ${expensesNeedingCategory.length} Expense${expensesNeedingCategory.length === 1 ? '' : 's'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
