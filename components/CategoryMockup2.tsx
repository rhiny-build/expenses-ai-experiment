'use client';

import { useState } from 'react';
import Link from 'next/link';

// Approach 2: Dedicated Settings Page
export default function CategoryMockup2() {
  const [categories, setCategories] = useState([
    { name: 'Food', expenseCount: 24, isActive: true },
    { name: 'Transportation', expenseCount: 18, isActive: true },
    { name: 'Entertainment', expenseCount: 12, isActive: true },
    { name: 'Shopping', expenseCount: 15, isActive: true },
    { name: 'Bills', expenseCount: 8, isActive: true },
    { name: 'Other', expenseCount: 5, isActive: true },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive).length;
  const archivedCategories = categories.filter(c => !c.isActive).length;

  const handleEdit = (index: number) => {
    setEditingId(index);
    setEditValue(categories[index].name);
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...categories];
    updated[index].name = editValue;
    setCategories(updated);
    setEditingId(null);
  };

  const handleDelete = (index: number) => {
    const category = categories[index];
    if (confirm(`Archive "${category.name}"? ${category.expenseCount} expenses will remain but category won't be available for new expenses.`)) {
      const updated = [...categories];
      updated[index].isActive = false;
      setCategories(updated);
    }
  };

  const handleAdd = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { name: newCategory.trim(), expenseCount: 0, isActive: true }]);
      setNewCategory('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Category Management</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Approach 2: Dedicated Settings Page</h2>
              <p className="text-slate-400">Full-featured management with detailed statistics</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Total Categories</div>
              <div className="text-3xl font-bold text-white">{totalCategories}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Active</div>
              <div className="text-3xl font-bold text-green-400">{activeCategories}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Archived</div>
              <div className="text-3xl font-bold text-amber-400">{archivedCategories}</div>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-600">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold">Category Name</th>
                <th className="text-center px-6 py-4 text-slate-300 font-semibold">Expenses</th>
                <th className="text-center px-6 py-4 text-slate-300 font-semibold">Status</th>
                <th className="text-right px-6 py-4 text-slate-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === index ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(index);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className="text-white font-medium">{category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
                      {category.expenseCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {category.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {editingId === index ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(index)}
                            className="text-green-400 hover:text-green-300 p-2 rounded hover:bg-slate-700 transition-colors"
                            title="Save"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-slate-400 hover:text-slate-300 p-2 rounded hover:bg-slate-700 transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(index)}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-slate-700 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {category.isActive && (
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-slate-700 transition-colors"
                              title="Archive"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md">
              <div className="border-b border-slate-700 p-4">
                <h3 className="text-xl font-bold text-white">Add New Category</h3>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') setShowAddModal(false);
                  }}
                />
              </div>
              <div className="border-t border-slate-700 p-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
