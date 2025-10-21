# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern expense tracking web application built with Next.js 14, TypeScript, and Tailwind CSS. The app features AI-powered expense categorization using OpenAI's GPT-4o, CSV import/export capabilities, and comprehensive analytics. All data is stored locally in the browser using localStorage.

## Development Workflow

### Git Branching Strategy

1. **Starting New Work**
   - Before making any changes, create and checkout a feature branch: `git checkout -b feature_short_descriptive_name`
   - Feature branch names should be descriptive (e.g., `feature_category_management`, `fix_csv_import_bug`)

2. **Making Commits**
   - Commit frequently in small, logical chunks as you work
   - Each commit should represent a single coherent change (e.g., "Add validation", "Fix bug in calculation")
   - **When to commit automatically (no need to ask)**:
     - After completing a well-defined subtask or feature component
     - After fixing a bug
     - After adding/updating tests
     - After refactoring code
     - Before switching to work on a different aspect of the feature
   - **When to ask before committing**:
     - When you're unsure if the current state is a good stopping point
     - When changes span multiple unrelated concerns
     - When the user is actively testing and might want to revert
   - Write clear, descriptive commit messages following this format:
     ```
     Short summary of change (imperative mood, 50 chars max)

     - Detailed explanation of what changed (if needed)
     - Why the change was made
     - Any important context or side effects

     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

3. **Completing Work**
   - When the feature is complete and tested, ask the user for approval to merge
   - After approval: merge back to main, complete any documentation updates, commit, and push to GitHub
   - Delete the feature branch after successful push: `git branch -d feature_branch_name`

### Commit Best Practices

- **Atomic commits**: Each commit should be a single, reversible unit of work
- **Test before committing**: Ensure code works and tests pass (if applicable)
- **Descriptive messages**: Future you (or others) should understand the commit without reading the diff
- **Don't commit broken code**: Every commit should leave the codebase in a working state

## Common Commands

### Development
```bash
# Start development server (with hot-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

### Testing
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a single test file
npm test -- expenseUtils.test.ts
```

## Architecture

### Layered Architecture

The application follows a strict layered architecture:

1. **Presentation Layer** (`components/`, `app/page.tsx`)
   - React components handle UI and user interactions
   - All components are client components (`'use client'`)
   - Use controlled form inputs with React state

2. **Business Logic Layer** (`utils/`)
   - Pure utility functions contain all business rules
   - Stateless and fully testable
   - Example: `calculateSummary()`, `filterExpenses()`, `exportToCSV()`

3. **Data Access Layer** (`lib/storage.ts`)
   - Service object pattern for localStorage operations
   - All CRUD operations go through this layer
   - SSR-safe (checks for `window` before accessing localStorage)

4. **Type Definitions** (`types/expense.ts`)
   - All TypeScript interfaces and types
   - Single source of truth for data structures

### Data Flow Pattern

The app follows React's unidirectional data flow:

```
User Action → Component Event Handler → Update State (useState) →
Call Storage Service → localStorage → Re-render Component → Updated UI
```

**Critical Pattern**: State lives in the main `app/page.tsx` and flows down to child components via props. Child components notify parent of changes via callback functions (props down, events up).

### Component Hierarchy

```
app/page.tsx (Main App - owns state)
├── Dashboard (display only)
├── ExpenseCharts (display only)
├── ExpenseForm (calls onAdd/onUpdate callbacks)
├── ExpenseList (calls onEdit/onDelete callbacks)
├── ExportModal (uses export utils)
└── ImportModal (uses parse utils, calls API for categorization)
```

## Key Files and Their Purposes

### Core Files
- **`app/page.tsx`**: Main application page containing all state management
- **`lib/storage.ts`**: localStorage service (all data persistence operations)
- **`types/expense.ts`**: TypeScript type definitions (single source of truth)
- **`utils/expenseUtils.ts`**: Business logic utilities (calculations, filtering)
- **`utils/advancedExport.ts`**: Export functionality (CSV, JSON, PDF)

### API Routes
- **`app/api/categorize/route.ts`**: Server-side API endpoint for AI categorization
  - Uses OpenAI GPT-4o
  - Requires `OPENAI_API_KEY` environment variable
  - Falls back gracefully if API key not configured

### Testing
- Tests are co-located in `__tests__/` directories next to source files
- Use Jest with React Testing Library
- Focus on testing business logic in `utils/` (pure functions)
- Mock browser APIs (localStorage, Blob, URL.createObjectURL)

## Important Patterns and Conventions

### State Management
- Main state (`expenses` array) lives in `app/page.tsx`
- Use `useState` for component-level state
- Use `useMemo` for expensive calculations (e.g., filtering, sorting)
- Always create new arrays/objects when updating state (immutability)

### Data Immutability
```typescript
// ✅ Correct: Create new array
setExpenses([...expenses, newExpense]);

// ❌ Wrong: Mutate existing array
expenses.push(newExpense);
setExpenses(expenses); // Won't trigger re-render
```

### TypeScript Usage
- All code is strictly typed (no `any` types)
- Interfaces are preferred for object shapes
- Union types for enums (e.g., `ExpenseCategory`)
- Use type inference where possible

### React Patterns
- **Controlled Components**: Form inputs controlled by React state
- **Props Down, Events Up**: Data flows down via props, events bubble up via callbacks
- **Lifting State Up**: Shared state lives in common parent component
- **Separation of Concerns**: UI logic in components, business logic in utils

### Storage Service Pattern
- All localStorage access goes through `lib/storage.ts`
- Never access `localStorage` directly from components
- Service handles SSR safety, error handling, and serialization
- Uses read-modify-write pattern: `getExpenses() → modify → saveExpenses()`

## AI Categorization Feature

The CSV import feature uses OpenAI's GPT-4o for intelligent expense categorization:

1. **API Route**: `/api/categorize` (server-side)
2. **Model**: GPT-4o (fast and accurate)
3. **Confidence-based UX**: Only shows review modal for low-confidence categorizations
4. **Graceful Degradation**: Works without API key (manual categorization)
5. **Batch Processing**: Categorizes multiple expenses in one API call

When modifying AI features, test both with and without API key configured.

## Testing Philosophy

- **Unit Tests**: Test utility functions in isolation (primary focus)
- **Integration Tests**: Test component behavior with user interactions (future)
- **Mocking Strategy**: Mock browser APIs (localStorage, Blob, URL)
- **Test Coverage**: Aim for >80% coverage on business logic

### Writing Tests
- Use Arrange-Act-Assert pattern
- Test edge cases (empty arrays, invalid input, boundary conditions)
- Use descriptive test names: `should [expected behavior] when [condition]`
- Group related tests with nested `describe()` blocks

## Common Development Tasks

### Adding a New Expense Field
1. Update `Expense` interface in `types/expense.ts`
2. TypeScript will show errors everywhere the type is used
3. Update components to handle new field (ExpenseForm, ExpenseList, etc.)
4. Update storage if needed (automatic via serialization)
5. Update tests to include new field

### Adding a New Component
1. Create file in `components/` directory
2. Export default function component
3. Define props interface if component accepts props
4. Import and use in parent component
5. Consider adding to component hierarchy diagram in ARCHITECTURE.md

### Adding a New Utility Function
1. Add to appropriate file in `utils/` (or create new file)
2. Write JSDoc comments
3. Write tests in `utils/__tests__/`
4. Ensure function is pure (no side effects)
5. Export function for use in components

## Environment Variables

Optional environment variables (create `.env.local`):

```bash
OPENAI_API_KEY=sk-...  # For AI categorization (optional)
```

Without API key, CSV import works but requires manual categorization.

## Build and Deploy

The app is configured for Next.js static export by default. When deploying:

1. Run `npm run build` to create optimized production build
2. Static files are in `.next/` directory
3. Can be deployed to any static hosting (Vercel, Netlify, etc.)
4. No server required (localStorage means no backend needed)

## Browser Compatibility

- Requires ES2017+ support
- Uses localStorage API (all modern browsers)
- Responsive design (mobile and desktop)
- Tested on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Gotchas and Edge Cases

### localStorage Limitations
- **Size limit**: ~5-10MB (browser-dependent)
- **Privacy mode**: localStorage may throw errors or be disabled
- **SSR context**: Always check `typeof window !== 'undefined'`
- **Data persistence**: Cleared when user clears browser data

### React Re-rendering
- Mutations don't trigger re-renders (must create new objects/arrays)
- `useMemo` prevents expensive recalculations
- Props comparison is shallow (use keys for lists)

### TypeScript Path Aliases
- Use `@/` prefix for absolute imports (configured in `tsconfig.json`)
- Example: `import { Expense } from '@/types/expense'`
- Avoids brittle relative paths like `../../types/expense`

### Date Handling
- All dates stored as ISO strings (YYYY-MM-DD)
- Use `date-fns` library for date manipulation (already installed)
- Browser date inputs use local timezone

## Code Style

- Use ESLint for code quality (`npm run lint`)
- Follow Next.js and React best practices
- Prefer functional components over class components
- Use arrow functions for consistency
- Keep components focused and small (<250 lines)
- Extract complex logic to utility functions

## Documentation

Comprehensive documentation available:

- **ARCHITECTURE.md**: Detailed architecture explanation (great for Java/C# developers)
- **GETTING_STARTED.md**: Setup guide and development workflow
- **TESTING.md**: Complete testing guide with examples
- **README.md**: User-facing documentation and feature list

When adding features, on completion update relevant documentation files.
