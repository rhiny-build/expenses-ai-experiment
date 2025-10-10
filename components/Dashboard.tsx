'use client';

import { Expense } from '@/types/expense';
import { calculateSummary, formatCurrency } from '@/utils/expenseUtils';

interface DashboardProps {
  expenses: Expense[];
}

export default function Dashboard({ expenses }: DashboardProps) {
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
      <h2 className="text-2xl font-bold mb-6 text-white">Dashboard</h2>
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
