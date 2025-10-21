'use client';

import { useState, useEffect, useRef } from 'react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { storage } from '@/lib/storage';
import { exportToCSV, importFromCSV, generateId, UncategorizedExpense } from '@/utils/expenseUtils';
import { exportExpenses } from '@/utils/advancedExport';
import Dashboard from '@/components/Dashboard';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import ExpenseCharts from '@/components/ExpenseCharts';
import ImportModal from '@/components/ImportModal';
import ExportModal from '@/components/ExportModal';
import CategoryManager from '@/components/CategoryManager';

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<Array<UncategorizedExpense & { index: number }>>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadedExpenses = storage.getExpenses();
    setExpenses(loadedExpenses);
    setIsLoading(false);
  }, []);

  const handleAddExpense = (expense: Expense) => {
    storage.addExpense(expense);
    setExpenses(storage.getExpenses());
  };

  const handleUpdateExpense = (expense: Expense) => {
    storage.updateExpense(expense.id, expense);
    setExpenses(storage.getExpenses());
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    storage.deleteExpense(id);
    setExpenses(storage.getExpenses());
  };

  const handleDeleteMultiple = (ids: string[]) => {
    storage.deleteMultipleExpenses(ids);
    setExpenses(storage.getExpenses());
  };

  const handleDeleteAll = () => {
    storage.clearAllExpenses();
    setExpenses([]);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleExport = () => {
    exportToCSV(expenses);
  };

  const handleAdvancedExport = async (
    format: 'csv' | 'json' | 'pdf',
    filteredExpenses: Expense[],
    filename: string
  ) => {
    await exportExpenses(filteredExpenses, format, filename);
  };

  const handleImportClick = () => {
    console.log('Import button clicked');
    console.log('File input ref:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null');
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setIsImporting(true);

    try {
      // Parse CSV
      const uncategorizedExpenses = await importFromCSV(file);

      // Separate expenses that need categorization
      const needsCategorization = uncategorizedExpenses.filter(exp => !exp.category);
      const alreadyCategorized = uncategorizedExpenses.filter(exp => exp.category);

      // If some expenses need categorization, use OpenAI API
      if (needsCategorization.length > 0) {
        try {
          console.log('🤖 Calling OpenAI API to categorize', needsCategorization.length, 'expense(s)...');
          console.log('Expenses to categorize:', needsCategorization);

          // Get active categories from client-side storage
          const activeCategories = storage.getActiveCategories();

          const response = await fetch('/api/categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              expenses: needsCategorization.map(exp => ({
                description: exp.description,
                amount: exp.amount,
                date: exp.date,
              })),
              categories: activeCategories, // Send categories to server
            }),
          });

          if (response.ok) {
            const { categorizedExpenses } = await response.json();
            console.log('✅ OpenAI categorization successful!');
            console.log('Categorized expenses:', categorizedExpenses);

            // Merge AI-categorized expenses with already categorized ones
            const allExpenses = [
              ...alreadyCategorized,
              ...categorizedExpenses.map((exp: any, idx: number) => ({
                ...needsCategorization[idx],
                category: exp.category,
                confidence: exp.confidence,
              })),
            ];

            // Show review modal for low-confidence or missing categorizations
            const needsReview = categorizedExpenses
              .map((exp: any, idx: number) => ({
                ...needsCategorization[idx],
                // Mark for review if: low confidence, empty category, or no category
                category: (exp.confidence === 'low' || !exp.category) ? undefined : exp.category,
                confidence: exp.confidence,
                index: idx,
              }))
              .concat(
                alreadyCategorized.map((exp, idx) => ({
                  ...exp,
                  confidence: 'high', // Already categorized = high confidence
                  index: needsCategorization.length + idx,
                }))
              );

            const hasUncategorized = needsReview.some((exp: any) => !exp.category);

            if (hasUncategorized) {
              setPendingExpenses(needsReview);
              setImportModalOpen(true);
            } else {
              // All expenses are confidently categorized, add them directly
              addImportedExpenses(allExpenses as Array<UncategorizedExpense & { category: ExpenseCategory }>);
            }
          } else {
            // API failed, show manual categorization modal
            const errorData = await response.json();
            console.error('❌ OpenAI API failed:', errorData);
            console.log('Falling back to manual categorization');
            const expensesWithIndex = uncategorizedExpenses.map((exp, idx) => ({
              ...exp,
              index: idx,
            }));
            setPendingExpenses(expensesWithIndex);
            setImportModalOpen(true);
          }
        } catch (error) {
          console.error('Categorization failed:', error);
          // Show manual categorization modal
          const expensesWithIndex = uncategorizedExpenses.map((exp, idx) => ({
            ...exp,
            index: idx,
          }));
          setPendingExpenses(expensesWithIndex);
          setImportModalOpen(true);
        }
      } else {
        // All expenses already have categories
        addImportedExpenses(alreadyCategorized as Array<UncategorizedExpense & { category: ExpenseCategory }>);
      }
    } catch (error) {
      alert('Failed to import CSV: ' + (error as Error).message);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addImportedExpenses = (expensesToAdd: Array<UncategorizedExpense & { category: ExpenseCategory }>) => {
    const newExpenses: Expense[] = expensesToAdd.map(exp => ({
      id: generateId(),
      date: exp.date,
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      createdAt: new Date().toISOString(),
    }));

    newExpenses.forEach(expense => storage.addExpense(expense));
    setExpenses(storage.getExpenses());
    alert(`Successfully imported ${newExpenses.length} expense${newExpenses.length === 1 ? '' : 's'}!`);
  };

  const handleCategorySelected = (index: number, category: ExpenseCategory) => {
    setPendingExpenses(prev =>
      prev.map(exp => (exp.index === index ? { ...exp, category } : exp))
    );
  };

  const handleConfirmImport = () => {
    const categorizedExpenses = pendingExpenses as Array<UncategorizedExpense & { category: ExpenseCategory }>;
    addImportedExpenses(categorizedExpenses);
    setImportModalOpen(false);
    setPendingExpenses([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Expense Tracker</h1>
              <p className="text-slate-300">Manage your personal finances with ease</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCategoryManagerOpen(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Manage Categories
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelected}
                className="hidden"
              />
              {!isImporting && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  📤 Import CSV
                </button>
              )}
              {isImporting && (
                <div className="bg-slate-700 text-white px-6 py-2 rounded-md font-medium inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Importing...
                </div>
              )}
              <button
                onClick={handleExport}
                disabled={expenses.length === 0}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                📥 Export CSV
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <Dashboard expenses={expenses} onExportClick={() => setExportModalOpen(true)} />

        {/* Expense Form */}
        <div className="mb-8">
          <ExpenseForm
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            initialData={editingExpense || undefined}
            onCancel={editingExpense ? handleCancelEdit : undefined}
          />
        </div>

        {/* Charts */}
        <ExpenseCharts expenses={expenses} />

        {/* Expense List */}
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDeleteExpense}
          onDeleteMultiple={handleDeleteMultiple}
          onDeleteAll={handleDeleteAll}
        />

        {/* Import Modal */}
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => {
            setImportModalOpen(false);
            setPendingExpenses([]);
            setImportFileName('');
          }}
          expensesNeedingCategory={pendingExpenses}
          onCategorySelected={handleCategorySelected}
          onConfirmAll={handleConfirmImport}
          isProcessing={false}
          fileName={importFileName}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          expenses={expenses}
          onExport={handleAdvancedExport}
        />

        {/* Category Manager Modal */}
        <CategoryManager
          isOpen={categoryManagerOpen}
          onClose={() => setCategoryManagerOpen(false)}
          onCategoriesChanged={() => {
            // Refresh data when categories change
            // This ensures dropdowns and filters are updated
            setExpenses(storage.getExpenses());
          }}
        />
      </div>
    </div>
  );
}
