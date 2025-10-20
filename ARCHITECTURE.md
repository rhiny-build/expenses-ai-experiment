# Architecture Documentation

This document provides an overview of the Expense Tracker application architecture, explaining how different parts of the codebase fit together.

## For Developers Coming from Java/C#

If you're familiar with backend development, here are some key differences in React/Next.js applications:

| Concept | Java/C# Equivalent | React/Next.js |
|---------|-------------------|---------------|
| **Components** | Classes/Views | Functions that return UI (JSX) |
| **State** | Instance variables | Managed with `useState` hook |
| **Props** | Constructor parameters | Function parameters |
| **Lifecycle methods** | Constructors, Dispose | `useEffect` hook |
| **Routing** | Controllers | File-based routing in `app/` directory |
| **Data layer** | Repository pattern | localStorage with service object |
| **Dependency Injection** | IoC Container | React Context or prop drilling |

## Tech Stack

- **Next.js 15**: React framework with server-side rendering and file-based routing
- **React 19**: UI library for building component-based interfaces
- **TypeScript**: Type-safe JavaScript (similar to adding types to JS like C# adds to C)
- **Tailwind CSS**: Utility-first CSS framework for styling
- **localStorage**: Browser API for data persistence (client-side only)
- **Jest & React Testing Library**: Testing framework and utilities

## Project Structure

```
expense-tracker-ai/
├── app/                        # Next.js App Router (pages and API routes)
│   ├── api/
│   │   └── categorize/         # API endpoint for AI categorization
│   │       └── route.ts
│   ├── layout.tsx              # Root layout (wraps all pages)
│   └── page.tsx                # Home page (main app)
│
├── components/                 # React components (UI building blocks)
│   ├── Dashboard.tsx           # Summary cards with statistics
│   ├── ExpenseCharts.tsx       # Data visualization with charts
│   ├── ExpenseForm.tsx         # Form for adding/editing expenses
│   ├── ExpenseList.tsx         # Table displaying expenses
│   ├── ExportModal.tsx         # Modal for exporting data
│   └── ImportModal.tsx         # Modal for importing CSV files
│
├── lib/                        # Core libraries and services
│   └── storage.ts              # localStorage service (data persistence)
│
├── types/                      # TypeScript type definitions
│   └── expense.ts              # All types/interfaces for expenses
│
├── utils/                      # Utility functions (pure functions)
│   ├── expenseUtils.ts         # Business logic (calculate, filter, etc.)
│   ├── advancedExport.ts       # Export functionality (CSV, JSON, PDF)
│   └── __tests__/              # Unit tests for utilities
│
├── jest.config.js              # Jest testing configuration
├── jest.setup.js               # Global test setup
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                   │
│  (Components - UI and User Interactions)     │
│                                              │
│  Dashboard, ExpenseForm, ExpenseList, etc.  │
└─────────────────────────────────────────────┘
                     ↓↑
┌─────────────────────────────────────────────┐
│         Business Logic Layer                 │
│       (Utils - Pure Functions)               │
│                                              │
│  calculateSummary, filterExpenses, etc.     │
└─────────────────────────────────────────────┘
                     ↓↑
┌─────────────────────────────────────────────┐
│         Data Access Layer                    │
│      (lib/storage - Data Persistence)        │
│                                              │
│  storage.getExpenses(), storage.addExpense() │
└─────────────────────────────────────────────┘
                     ↓↑
┌─────────────────────────────────────────────┐
│         Browser Storage                      │
│          (localStorage)                      │
└─────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Update State (useState)
    ↓
Call Storage Service
    ↓
localStorage (persist)
    ↓
Re-render Component (React)
    ↓
Updated UI
```

## Core Concepts

### 1. Components (Presentation Layer)

Components are the building blocks of React applications. They're like classes in OOP, but they're functions that return UI.

**Example Structure:**

```typescript
// components/Dashboard.tsx
interface DashboardProps {          // Props = function parameters
  expenses: Expense[];
  onExportClick: () => void;
}

export default function Dashboard({ expenses, onExportClick }: DashboardProps) {
  // Business logic calls
  const summary = calculateSummary(expenses);

  // Return JSX (HTML-like syntax)
  return (
    <div>
      {/* UI elements */}
    </div>
  );
}
```

**Key Component Files:**

- **`app/page.tsx`**: Main application page (root component)
- **`components/Dashboard.tsx`**: Displays expense statistics
- **`components/ExpenseForm.tsx`**: Form for adding/editing expenses
- **`components/ExpenseList.tsx`**: Table showing all expenses with actions
- **`components/ExpenseCharts.tsx`**: Visual charts and graphs
- **`components/ExportModal.tsx`**: Advanced export interface
- **`components/ImportModal.tsx`**: CSV import interface

### 2. State Management

React uses "state" to track data that changes over time. When state changes, React automatically re-renders the component.

```typescript
// Similar to a private field in a class, but with a setter
const [expenses, setExpenses] = useState<Expense[]>([]);

// Update state (triggers re-render)
setExpenses([...expenses, newExpense]);
```

**State Location:**
- Main state (expenses array) lives in `app/page.tsx`
- Passed down to child components via props
- Child components call callback functions to update parent state

### 3. Data Persistence (lib/storage.ts)

The storage service handles all localStorage operations. Think of it as a Repository pattern in DDD or DAO in Java.

```typescript
// Service object with methods
export const storage = {
  getExpenses: (): Expense[] => { ... },
  addExpense: (expense: Expense): void => { ... },
  updateExpense: (id: string, updatedExpense: Expense): void => { ... },
  deleteExpense: (id: string): void => { ... },
}
```

**Why a service object?**
- Encapsulates localStorage access
- Provides a consistent API
- Easy to mock in tests
- Could be swapped for API calls later

### 4. Business Logic (utils/)

Pure utility functions that contain business rules. These are stateless and testable.

**`utils/expenseUtils.ts`:**
- `calculateSummary()`: Aggregates expense data
- `filterExpenses()`: Filters by category, date, search term
- `sortExpensesByDate()`: Sorts expenses chronologically
- `formatCurrency()`: Formats numbers as GBP currency
- `generateId()`: Creates unique IDs

**`utils/advancedExport.ts`:**
- `exportToCSV()`: Exports as CSV file
- `exportToJSON()`: Exports as JSON with metadata
- `exportToPDF()`: Creates printable PDF report

### 5. Type Definitions (types/expense.ts)

All TypeScript interfaces and types in one place. This provides type safety across the application.

```typescript
export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
}
```

## Component Hierarchy

```
app/page.tsx (Main App)
│
├── Dashboard
│   └── (Display only - receives expenses as props)
│
├── ExpenseCharts
│   └── (Display only - receives expenses as props)
│
├── ExpenseForm
│   └── Calls parent callback to add/update expense
│
├── ExpenseList
│   ├── Calls parent callback to edit expense
│   └── Calls parent callback to delete expense
│
├── ExportModal
│   └── Uses advancedExport utils to export data
│
└── ImportModal
    └── Uses expenseUtils to parse CSV and add expenses
```

## React Patterns Used

### 1. Props Down, Events Up

- **Data flows down**: Parent passes data to children via props
- **Events flow up**: Children call callback functions to notify parent

```typescript
// Parent component
function Parent() {
  const [data, setData] = useState([]);

  const handleAdd = (item) => {
    setData([...data, item]);
  };

  return <Child data={data} onAdd={handleAdd} />;
}

// Child component
function Child({ data, onAdd }) {
  // Receives data, calls onAdd to notify parent
}
```

### 2. Controlled Components

Form inputs are "controlled" by React state:

```typescript
const [value, setValue] = useState('');

<input
  value={value}                    // State controls input
  onChange={(e) => setValue(e.target.value)}  // Updates state
/>
```

### 3. Lifting State Up

When multiple components need the same data, move state to their common parent:

```
App (state: expenses)
├── Dashboard (displays expenses)
└── ExpenseList (modifies expenses)
```

Both need `expenses`, so it lives in `App` and is passed down.

### 4. Separation of Concerns

- **Components**: Handle UI and user interaction
- **Utils**: Handle business logic and calculations
- **Storage**: Handle data persistence
- **Types**: Define data structures

This is similar to MVC or MVVM patterns in OOP.

## Key React Hooks Used

### useState

Manages component state (like instance variables in classes):

```typescript
const [expenses, setExpenses] = useState<Expense[]>([]);
```

### useEffect

Runs side effects (like lifecycle methods):

```typescript
useEffect(() => {
  // Runs after component renders
  const data = storage.getExpenses();
  setExpenses(data);
}, []);  // Empty array = run once (like componentDidMount)
```

### useMemo

Caches expensive calculations (optimization):

```typescript
const filteredExpenses = useMemo(() => {
  return filterExpenses(expenses, filters);
}, [expenses, filters]);  // Recompute only when these change
```

## Data Flow Example: Adding an Expense

1. **User fills form** in `ExpenseForm` component
2. **User clicks "Add Expense"**
3. **Form validates data** (checks amount is positive, etc.)
4. **Form calls `onAddExpense` callback** (passed from parent)
5. **Parent (`app/page.tsx`) receives new expense**
6. **Parent calls `storage.addExpense()`** to persist
7. **storage writes to localStorage**
8. **Parent updates state** with `setExpenses()`
9. **React re-renders** all components using expenses
10. **UI updates** to show new expense

## Next.js Specific Features

### File-Based Routing

In Next.js, files in the `app/` directory automatically become routes:

```
app/
├── page.tsx              → / (home page)
├── layout.tsx            → Wraps all pages
└── api/
    └── categorize/
        └── route.ts      → /api/categorize (API endpoint)
```

### Server vs Client Components

- **Server Components** (default): Render on server, sent as HTML
- **Client Components** (with `'use client'`): Run in browser, interactive

Most components in this app are client components because they need interactivity (state, event handlers, etc.).

### API Routes

`app/api/categorize/route.ts` is a serverless function:

```typescript
export async function POST(request: Request) {
  // This runs on the server, not in the browser
  // Can access environment variables, make API calls, etc.
}
```

## Styling Approach

This app uses **Tailwind CSS**, a utility-first CSS framework:

```typescript
<div className="bg-blue-500 text-white rounded-lg p-4">
  Content
</div>
```

Each class applies a single CSS property:
- `bg-blue-500`: background color
- `text-white`: text color
- `rounded-lg`: border radius
- `p-4`: padding

**Advantages:**
- Fast to write (no need to name classes)
- No CSS files to manage
- Responsive design built-in (`md:`, `lg:` prefixes)
- Consistent design system

## Common Patterns for Java/C# Developers

### Null Handling

TypeScript doesn't have null-safe operators like C# (`?.`), but it has similar syntax:

```typescript
// Optional chaining
const value = object?.property?.nestedProperty;

// Nullish coalescing
const result = value ?? defaultValue;  // Like C#'s ??
```

### Array Operations

React/JavaScript heavily uses functional array methods:

```typescript
// Filter (like LINQ Where)
const filtered = expenses.filter(exp => exp.amount > 100);

// Map (like LINQ Select)
const amounts = expenses.map(exp => exp.amount);

// Reduce (like LINQ Aggregate)
const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

// Find (like LINQ FirstOrDefault)
const found = expenses.find(exp => exp.id === id);
```

### Immutability

React requires immutable updates to state:

```typescript
// ❌ Wrong: Mutates array
expenses.push(newExpense);
setExpenses(expenses);

// ✅ Correct: Creates new array
setExpenses([...expenses, newExpense]);

// ❌ Wrong: Mutates object
expense.amount = 100;
setExpense(expense);

// ✅ Correct: Creates new object
setExpense({ ...expense, amount: 100 });
```

## Testing Architecture

Tests are organized next to the code they test:

```
utils/
├── expenseUtils.ts
└── __tests__/
    └── expenseUtils.test.ts
```

Tests focus on:
- **Unit tests**: Individual functions (utils)
- **Integration tests**: Component behavior (future work)
- **Mocking**: Browser APIs (localStorage, Blob, etc.)

See [TESTING.md](./TESTING.md) for detailed testing guide.

## Performance Considerations

### Memoization

React re-renders components when props or state change. Use `useMemo` to avoid expensive recalculations:

```typescript
const summary = useMemo(() =>
  calculateSummary(expenses),
  [expenses]
);
```

### Virtual DOM

React uses a "virtual DOM" to efficiently update the UI:
1. React builds a virtual representation of the UI
2. Compares it to the previous version (diffing)
3. Only updates the DOM elements that changed

### Lazy Loading

Next.js automatically code-splits by route, loading only needed JavaScript.

## Future Improvements

Potential architectural enhancements:

1. **State Management Library**: Use Redux or Zustand for complex state
2. **API Backend**: Replace localStorage with REST API
3. **Authentication**: Add user accounts and auth
4. **Database**: Move from localStorage to PostgreSQL/MongoDB
5. **Real-time Updates**: Use WebSockets for multi-device sync
6. **Component Library**: Extract reusable components to shared library

## Resources

- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Patterns](https://reactpatterns.com/)

## Questions?

- Check [GETTING_STARTED.md](./GETTING_STARTED.md) for setup instructions
- Check [TESTING.md](./TESTING.md) for testing guide
- Read inline comments in the code for implementation details
- All types are documented in `types/expense.ts`
