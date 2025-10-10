'use client';

import { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { formatCurrency } from '@/utils/expenseUtils';
import { format } from 'date-fns';

type ExportFormat = 'csv' | 'json' | 'pdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onExport: (
    format: ExportFormat,
    filteredExpenses: Expense[],
    filename: string
  ) => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  expenses,
  onExport,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ExpenseCategory[]>([]);
  const [customFilename, setCustomFilename] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const categories: ExpenseCategory[] = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];

  // Filter expenses based on selected criteria
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Date range filter
      if (startDate && new Date(expense.date) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(expense.date) > new Date(endDate)) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(expense.category)) {
        return false;
      }

      return true;
    });
  }, [expenses, startDate, endDate, selectedCategories]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const toggleCategory = (category: ExpenseCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    const filename = customFilename.trim() || `expenses_${format(new Date(), 'yyyy-MM-dd')}`;

    try {
      await onExport(selectedFormat, filteredExpenses, filename);
      // Reset and close after successful export
      setTimeout(() => {
        setIsExporting(false);
        handleClose();
      }, 500);
    } catch (error) {
      setIsExporting(false);
      alert('Export failed. Please try again.');
    }
  };

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCategories([]);
    setCustomFilename('');
    setShowPreview(false);
    setSelectedFormat('csv');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Advanced Export</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Export Summary */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-slate-400 text-sm">Records to Export</p>
                  <p className="text-2xl font-bold text-blue-400">{filteredExpenses.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-slate-400 text-sm">Format</p>
                  <p className="text-2xl font-bold text-purple-400">{selectedFormat.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Export Format Selection */}
            <div>
              <label className="block text-slate-300 font-medium mb-3">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'csv', label: 'CSV', icon: '📊', desc: 'Spreadsheet format' },
                  { value: 'json', label: 'JSON', icon: '🔧', desc: 'Developer friendly' },
                  { value: 'pdf', label: 'PDF', icon: '📄', desc: 'Print ready' },
                ].map(format => (
                  <button
                    key={format.value}
                    onClick={() => setSelectedFormat(format.value as ExportFormat)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedFormat === format.value
                        ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                        : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-3xl mb-1">{format.icon}</div>
                    <div className="font-bold text-white">{format.label}</div>
                    <div className="text-xs text-slate-400">{format.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-slate-300 font-medium mb-3">Date Range (Optional)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-slate-300 font-medium mb-3">
                Filter by Category (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Custom Filename */}
            <div>
              <label className="block text-slate-300 font-medium mb-3">
                Custom Filename (Optional)
              </label>
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder={`expenses_${format(new Date(), 'yyyy-MM-dd')}`}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                File extension will be added automatically
              </p>
            </div>

            {/* Preview Toggle */}
            <div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
              >
                <span>{showPreview ? '▼' : '▶'}</span>
                Preview Data ({filteredExpenses.length} records)
              </button>
            </div>

            {/* Preview Table */}
            {showPreview && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-slate-300">Date</th>
                        <th className="px-4 py-2 text-left text-slate-300">Category</th>
                        <th className="px-4 py-2 text-right text-slate-300">Amount</th>
                        <th className="px-4 py-2 text-left text-slate-300">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.slice(0, 10).map((expense) => (
                        <tr key={expense.id} className="border-t border-slate-700">
                          <td className="px-4 py-2 text-slate-300">{expense.date}</td>
                          <td className="px-4 py-2 text-slate-300">{expense.category}</td>
                          <td className="px-4 py-2 text-right text-slate-300">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-4 py-2 text-slate-300 truncate max-w-xs">
                            {expense.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredExpenses.length > 10 && (
                    <div className="p-2 text-center text-slate-400 text-xs bg-slate-800">
                      ... and {filteredExpenses.length - 10} more records
                    </div>
                  )}
                  {filteredExpenses.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No expenses match the selected filters
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 border-t border-slate-700 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={filteredExpenses.length === 0 || isExporting}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                📥 Export {filteredExpenses.length} Records
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
