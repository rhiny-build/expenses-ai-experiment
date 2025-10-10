'use client';

import { Expense, ExpenseCategory } from '@/types/expense';
import { calculateSummary } from '@/utils/expenseUtils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExpenseChartsProps {
  expenses: Expense[];
}

const COLORS: Record<ExpenseCategory, string> = {
  Food: '#10b981',
  Transportation: '#3b82f6',
  Entertainment: '#8b5cf6',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Other: '#6b7280',
};

export default function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  const summary = calculateSummary(expenses);

  const categoryData = Object.entries(summary.categoryBreakdown)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
    }));

  const getCategoryMonthlyData = () => {
    const monthlyData: { [key: string]: { [key in ExpenseCategory]?: number } } = {};

    expenses.forEach((expense) => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = {};
      }
      monthlyData[month][expense.category] = (monthlyData[month][expense.category] || 0) + expense.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, categories]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        ...categories,
      }));
  };

  const monthlyData = getCategoryMonthlyData();

  if (expenses.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">Spending Analytics</h2>
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No data to display</p>
          <p className="text-slate-500 text-sm mt-2">Add some expenses to see your spending analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Spending Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart - Category Breakdown */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-slate-300 text-center">
            Spending by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props;
                  return `${name} ${((percent || 0) * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as ExpenseCategory]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Monthly Trends */}
        {monthlyData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-300 text-center">
              Monthly Spending Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                <Legend />
                {Object.keys(COLORS).map((category) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={COLORS[category as ExpenseCategory]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Breakdown Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-slate-300">Category Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(summary.categoryBreakdown).map(([category, amount]) => (
            <div
              key={category}
              className="border border-slate-700 bg-slate-750 rounded-lg p-4 text-center"
              style={{ borderLeftWidth: '4px', borderLeftColor: COLORS[category as ExpenseCategory] }}
            >
              <p className="text-sm text-slate-400 mb-1">{category}</p>
              <p className="text-lg font-bold" style={{ color: COLORS[category as ExpenseCategory] }}>
                £{amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
