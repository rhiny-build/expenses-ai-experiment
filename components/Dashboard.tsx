'use client';

import { Expense } from '@/types/expense';
import { calculateSummary, formatCurrency } from '@/utils/expenseUtils';

interface DashboardProps {
  expenses: Expense[];
  onExportClick: () => void;
}

export default function Dashboard({ expenses, onExportClick }: DashboardProps) {
  const summary = calculateSummary(expenses);

  const summaryCards = [
    {
      title: 'Total Spending',
      value: formatCurrency(summary.totalSpending),
      icon: '💰',
      color: 'bg-blue-500',
    },
    {
      title: 'This Month',
      value: formatCurrency(summary.monthlySpending),
      icon: '📅',
      color: 'bg-green-500',
    },
    {
      title: 'Top Category',
      value: summary.topCategory.category,
      subtitle: formatCurrency(summary.topCategory.amount),
      icon: '🏆',
      color: 'bg-purple-500',
    },
    {
      title: 'Total Expenses',
      value: expenses.length.toString(),
      icon: '📊',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <button
          onClick={onExportClick}
          disabled={expenses.length === 0}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <span className="text-lg">⚡</span>
          Advanced Export
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6 hover:shadow-lg hover:border-slate-600 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">{card.icon}</div>
              <div className={`${card.color} w-12 h-12 rounded-full opacity-20`}></div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-2">{card.title}</h3>
            <p className={`text-2xl font-bold ${card.color.replace('bg-', 'text-')}`}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-slate-500 text-sm mt-1">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
