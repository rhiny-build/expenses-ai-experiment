'use client';

import { useState } from 'react';
import CategoryMockup1 from '@/components/CategoryMockup1';
import CategoryMockup2 from '@/components/CategoryMockup2';
import CategoryMockup3 from '@/components/CategoryMockup3';

export default function CategoryMockupsPage() {
  const [selectedMockup, setSelectedMockup] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Category Management Mockups</h1>
            <a
              href="/"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Main App
            </a>
          </div>

          {/* Mockup Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMockup(1)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMockup === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Approach 1: Inline Panel
            </button>
            <button
              onClick={() => setSelectedMockup(2)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMockup === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Approach 2: Settings Page
            </button>
            <button
              onClick={() => setSelectedMockup(3)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMockup === 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Approach 3: Modal with Tabs
            </button>
          </div>
        </div>
      </div>

      {/* Mockup Display */}
      <div>
        {selectedMockup === 1 && <CategoryMockup1 />}
        {selectedMockup === 2 && <CategoryMockup2 />}
        {selectedMockup === 3 && <CategoryMockup3 />}
      </div>
    </div>
  );
}
