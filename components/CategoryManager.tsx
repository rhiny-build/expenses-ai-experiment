'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types/expense';
import { storage } from '@/lib/storage';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void; // Callback to notify parent of changes
}

export default function CategoryManager({ isOpen, onClose, onCategoriesChanged }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [archivedCategories, setArchivedCategories] = useState<Category[]>([]);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expenseCounts, setExpenseCounts] = useState<Record<string, number>>({});

  // Load categories and expense counts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = () => {
    const active = storage.getActiveCategories();
    const archived = storage.getArchivedCategories();
    const counts = storage.getCategoryExpenseCounts();

    setActiveCategories(active);
    setArchivedCategories(archived);
    setExpenseCounts(counts);
  };

  const handleEdit = (name: string) => {
    setEditingName(name);
    setEditValue(name);
  };

  const handleSaveEdit = (oldName: string) => {
    if (editValue.trim() && editValue.trim() !== oldName) {
      storage.updateCategoryName(oldName, editValue.trim());
      loadCategories();
      onCategoriesChanged();
    }
    setEditingName(null);
  };

  const handleArchive = (name: string) => {
    const count = expenseCounts[name] || 0;
    const message = count > 0
      ? `Archive "${name}"? ${count} expense${count !== 1 ? 's' : ''} will remain but this category won't be available for new expenses.`
      : `Archive "${name}"?`;

    if (confirm(message)) {
      storage.archiveCategory(name);
      loadCategories();
      onCategoriesChanged();
    }
  };

  const handleRestore = (name: string) => {
    storage.restoreCategory(name);
    loadCategories();
    onCategoriesChanged();
  };

  const handleAdd = () => {
    if (newCategory.trim()) {
      // Check for duplicates
      const allCategories = [...activeCategories, ...archivedCategories];
      if (allCategories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
        alert('A category with this name already exists!');
        return;
      }

      storage.addCategory(newCategory.trim());
      setNewCategory('');
      loadCategories();
      onCategoriesChanged();
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...activeCategories];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setActiveCategories(items);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      // Save the new order
      storage.reorderCategories(activeCategories);
      onCategoriesChanged();
    }
    setDraggedIndex(null);
  };

  const handleClose = () => {
    setEditingName(null);
    setNewCategory('');
    setActiveTab('active');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="border-b border-slate-700 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700 px-6 flex gap-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'active'
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Active Categories
              <span className="ml-2 inline-flex items-center justify-center bg-blue-600/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeCategories.length}
              </span>
              {activeTab === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'archived'
                  ? 'text-amber-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Archived
              <span className="ml-2 inline-flex items-center justify-center bg-amber-600/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {archivedCategories.length}
              </span>
              {activeTab === 'archived' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'active' ? (
              <div className="space-y-3">
                {/* Drag hint */}
                <div className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Drag to reorder (affects dropdown order)
                </div>

                {/* Active Categories */}
                {activeCategories.map((category, index) => {
                  const count = expenseCounts[category.name] || 0;

                  return (
                    <div
                      key={category.name}
                      draggable={editingName !== category.name}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-2 border-blue-500/30 rounded-lg p-4 transition-all ${
                        draggedIndex === index ? 'opacity-50 scale-95' : 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10'
                      } ${editingName !== category.name ? 'cursor-move' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        {editingName !== category.name && (
                          <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                          </svg>
                        )}

                        {/* Category Info */}
                        {editingName === category.name ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(category.name);
                              if (e.key === 'Escape') setEditingName(null);
                            }}
                          />
                        ) : (
                          <div className="flex-1">
                            <div className="text-white font-semibold text-lg">{category.name}</div>
                            <div className="text-slate-400 text-sm">
                              {count} expense{count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {editingName === category.name ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(category.name)}
                                className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                title="Save"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingName(null)}
                                className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-700 transition-colors"
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
                                onClick={() => handleEdit(category.name)}
                                className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleArchive(category.name)}
                                className="text-amber-400 hover:text-amber-300 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                title="Archive"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add New */}
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Add new category..."
                      className="flex-1 bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd();
                      }}
                    />
                    <button
                      onClick={handleAdd}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p className="text-slate-400 text-lg">No archived categories</p>
                    <p className="text-slate-500 text-sm mt-1">Archived categories appear here</p>
                  </div>
                ) : (
                  archivedCategories.map((category) => {
                    const count = expenseCounts[category.name] || 0;

                    return (
                      <div
                        key={category.name}
                        className="bg-amber-600/5 border border-amber-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-white font-semibold">{category.name}</div>
                            <div className="text-slate-400 text-sm">
                              {count} expense{count !== 1 ? 's' : ''} (archived)
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestore(category.name)}
                            className="text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 p-6 flex justify-end">
            <button
              onClick={handleClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
