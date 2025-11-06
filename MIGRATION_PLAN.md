# Architectural Migration Plan: Expense Tracker AI

**Purpose**: This document outlines two major architectural migrations for interview preparation and research purposes. While the actual migrations are TypeScript→MySQL and TypeScript→PHP8, the concepts directly apply to the reverse migrations (PHP→Node.js/React) commonly encountered in enterprise modernization projects.

**Current Stack**: Next.js 15, React 19, TypeScript 5, localStorage, OpenAI integration

---

## Table of Contents

1. [Part 1: MySQL Migration (LocalStorage → MySQL)](#part-1-mysql-migration)
2. [Part 2: PHP8 Backend Rewrite](#part-2-php8-backend-rewrite)
3. [Part 3: Execution Strategy](#part-3-execution-strategy)
4. [Part 4: Interview Preparation](#part-4-interview-preparation)

---

# Part 1: MySQL Migration

## 1.1 Current Architecture Analysis

### Current Data Access Pattern
```
Component (React) → storage.ts (Service Object) → localStorage API → Browser Storage
```

**Key Characteristics**:
- **Synchronous**: All operations complete immediately
- **Client-side**: Data never leaves the browser
- **No authentication**: Single-user by design
- **Type-safe**: Full TypeScript integration
- **Simple**: No network calls, no connection management

### Current Storage Operations
From `lib/storage.ts`:
- `getExpenses()` → `Expense[]`
- `saveExpenses(expenses)` → `void`
- `addExpense(expense)` → `void`
- `updateExpense(id, expense)` → `void`
- `deleteExpense(id)` → `void`
- `deleteMultipleExpenses(ids)` → `void`
- `clearAllExpenses()` → `void`
- `getCategories()` → `Category[]`
- `saveCategories(categories)` → `void`
- `addCategory(name, description)` → `void`
- `updateCategory(oldName, newName, description)` → `void`
- `archiveCategory(name)` → `void`
- `restoreCategory(name)` → `void`
- `reorderCategories(categories)` → `void`
- `getCategoryExpenseCounts()` → `Record<string, number>`

---

## 1.2 Target Architecture

### New Data Access Pattern
```
Component (React) → API Route (Next.js) → Prisma Client (ORM) → MySQL Database
```

**Key Changes**:
- **Asynchronous**: All operations return Promises
- **Server-side**: Data persists in database
- **Network calls**: Components make HTTP requests
- **Type-safe**: Prisma generates TypeScript types from schema
- **Complex**: Connection pooling, error handling, transactions

---

## 1.3 Technology Stack Decision: Prisma ORM

### Why Prisma?

| Criteria | Prisma | Raw MySQL2 | TypeORM |
|----------|--------|------------|---------|
| **Type Safety** | ✅ Auto-generated from schema | ❌ Manual type definitions | ⚠️ Decorators + manual types |
| **Developer Experience** | ✅ Excellent autocomplete | ⚠️ String-based queries | ⚠️ Good but verbose |
| **Migrations** | ✅ Built-in migration tool | ❌ Manual SQL scripts | ✅ CLI-based migrations |
| **Learning Curve** | ✅ Low (intuitive API) | ⚠️ Requires SQL knowledge | ⚠️ Medium (OOP patterns) |
| **Performance** | ✅ Optimized queries | ✅ Full control | ✅ Good with tuning |
| **Testing** | ✅ Easy to mock | ⚠️ Must mock mysql2 | ✅ Test utilities |
| **Future-proof** | ✅ Multi-DB support | ❌ MySQL-only | ✅ Multi-DB support |

**Recommendation**: **Prisma** for this project due to type safety, developer experience, and migration tooling.

**Alternative Consideration**: Use **Raw MySQL2** if you want deeper SQL knowledge or need absolute performance control.

---

## 1.4 Database Schema Design

### Prisma Schema (`prisma/schema.prisma`)

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Expense {
  id          String   @id @default(cuid())
  date        DateTime @db.Date
  amount      Decimal  @db.Decimal(10, 2)
  category    String   @db.VarChar(100)
  description String   @db.VarChar(500)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Foreign key relationship (optional for now, useful for multi-user)
  // userId    String?
  // user      User?    @relation(fields: [userId], references: [id])

  @@index([date])
  @@index([category])
  @@index([createdAt])
}

model Category {
  name        String  @id @db.VarChar(100)
  description String  @db.VarChar(500)
  order       Int
  isArchived  Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([order])
  @@index([isArchived])
}

// Future: User model for multi-user support
// model User {
//   id        String    @id @default(cuid())
//   email     String    @unique
//   name      String?
//   createdAt DateTime  @default(now())
//   expenses  Expense[]
// }
```

### Schema Decisions

| Field | Type | Rationale |
|-------|------|-----------|
| **Expense.id** | `String` (cuid) | Matches current `generateId()` pattern; better than auto-increment for distributed systems |
| **Expense.amount** | `Decimal(10,2)` | Financial precision (avoid floating point errors); supports up to £99,999,999.99 |
| **Expense.date** | `DateTime @db.Date` | Date-only storage (no time component needed) |
| **Category.name** | Primary key | Categories identified by name (current pattern); consider UUID if renaming is complex |
| **Indexes** | date, category, order | Optimize common queries (filtering by date/category, sorting) |

---

## 1.5 Migration Implementation Steps

### Phase 1: Setup (No Code Changes)

**Step 1.1: Install Dependencies**
```bash
npm install prisma @prisma/client
npm install -D prisma
```

**Step 1.2: Initialize Prisma**
```bash
npx prisma init
```
This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables file

**Step 1.3: Configure Database Connection**
Update `.env`:
```bash
# Local MySQL connection
DATABASE_URL="mysql://root:password@localhost:3306/expense_tracker"
```

**Step 1.4: Create Database**
```bash
mysql -u root -p
CREATE DATABASE expense_tracker;
EXIT;
```

**Step 1.5: Define Schema**
Copy the Prisma schema from section 1.4 into `prisma/schema.prisma`

**Step 1.6: Run Migration**
```bash
npx prisma migrate dev --name init
```
This creates tables in MySQL.

**Step 1.7: Generate Prisma Client**
```bash
npx prisma generate
```
This generates TypeScript types.

---

### Phase 2: Create API Layer

**Directory Structure**:
```
app/api/
├── expenses/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PUT (update), DELETE (single)
├── expenses/bulk-delete/
│   └── route.ts          # POST (bulk delete)
├── categories/
│   ├── route.ts          # GET (list), POST (create)
│   └── [name]/
│       ├── route.ts      # PUT (update), DELETE (archive)
│       └── restore/
│           └── route.ts  # POST (restore)
└── categories/reorder/
    └── route.ts          # POST (reorder)
```

**Step 2.1: Create Prisma Client Instance**

`lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections during hot-reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Why this pattern?**
- Prevents multiple Prisma Client instances during Next.js hot-reload
- Logs queries in development for debugging
- Singleton pattern for production

**Step 2.2: Expense API Routes**

`app/api/expenses/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/expenses - List all expenses
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });

    // Convert Decimal to number for JSON serialization
    const serialized = expenses.map(exp => ({
      ...exp,
      amount: exp.amount.toNumber(),
      date: exp.date.toISOString().split('T')[0], // YYYY-MM-DD format
      createdAt: exp.createdAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, amount, category, description } = body;

    // Validation
    if (!date || !amount || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        amount: new Prisma.Decimal(amount),
        category,
        description,
      },
    });

    const serialized = {
      ...expense,
      amount: expense.amount.toNumber(),
      date: expense.date.toISOString().split('T')[0],
      createdAt: expense.createdAt.toISOString(),
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
```

`app/api/expenses/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/expenses/:id - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    const serialized = {
      ...expense,
      amount: expense.amount.toNumber(),
      date: expense.date.toISOString().split('T')[0],
      createdAt: expense.createdAt.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/:id - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { date, amount, category, description } = body;

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(amount && { amount: new Prisma.Decimal(amount) }),
        ...(category && { category }),
        ...(description && { description }),
      },
    });

    const serialized = {
      ...expense,
      amount: expense.amount.toNumber(),
      date: expense.date.toISOString().split('T')[0],
      createdAt: expense.createdAt.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/:id - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
```

`app/api/expenses/bulk-delete/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/expenses/bulk-delete - Delete multiple expenses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ids array' },
        { status: 400 }
      );
    }

    const result = await prisma.expense.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Error bulk deleting expenses:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete expenses' },
      { status: 500 }
    );
  }
}
```

**Step 2.3: Category API Routes**

`app/api/categories/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories - List all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    });

    // Add expense counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.expense.count({
          where: { category: cat.name },
        });
        return { ...cat, expenseCount: count };
      })
    );

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get max order
    const maxCategory = await prisma.category.findFirst({
      orderBy: { order: 'desc' },
    });
    const nextOrder = (maxCategory?.order ?? -1) + 1;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || 'No description provided',
        order: nextOrder,
        isArchived: false,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
```

`app/api/categories/[name]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/categories/:name - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const body = await request.json();
    const { newName, description } = body;
    const oldName = decodeURIComponent(params.name);

    if (!newName) {
      return NextResponse.json(
        { error: 'newName is required' },
        { status: 400 }
      );
    }

    // Use transaction to update category and all expenses atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update category
      const category = await tx.category.update({
        where: { name: oldName },
        data: {
          name: newName.trim(),
          ...(description !== undefined && { description: description.trim() }),
        },
      });

      // Update all expenses with this category (if name changed)
      if (newName !== oldName) {
        await tx.expense.updateMany({
          where: { category: oldName },
          data: { category: newName.trim() },
        });
      }

      return category;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:name - Archive category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name);

    const category = await prisma.category.update({
      where: { name },
      data: { isArchived: true },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error archiving category:', error);
    return NextResponse.json(
      { error: 'Failed to archive category' },
      { status: 500 }
    );
  }
}
```

`app/api/categories/[name]/restore/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/categories/:name/restore - Restore archived category
export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name);

    const category = await prisma.category.update({
      where: { name },
      data: { isArchived: false },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error restoring category:', error);
    return NextResponse.json(
      { error: 'Failed to restore category' },
      { status: 500 }
    );
  }
}
```

`app/api/categories/reorder/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/categories/reorder - Reorder categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'categories array is required' },
        { status: 400 }
      );
    }

    // Update all categories in a transaction
    await prisma.$transaction(
      categories.map((cat, index) =>
        prisma.category.update({
          where: { name: cat.name },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: Update Storage Service Layer

**Strategy**: Update `lib/storage.ts` to call API routes instead of localStorage, maintaining the same interface.

**Step 3.1: Create New Storage Service**

`lib/storage-mysql.ts`:
```typescript
import { Expense, Category } from '@/types/expense';

/**
 * MySQL-backed Storage Service
 *
 * This replaces localStorage with MySQL via API routes.
 * All methods are now async and return Promises.
 */
export const storageMysql = {
  /**
   * Retrieves all expenses from database
   */
  getExpenses: async (): Promise<Expense[]> => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return await response.json();
    } catch (error) {
      console.error('Error reading from database:', error);
      return [];
    }
  },

  /**
   * Not used in new architecture (use addExpense, updateExpense, etc.)
   */
  saveExpenses: async (expenses: Expense[]): Promise<void> => {
    console.warn('saveExpenses() is deprecated with MySQL backend');
  },

  /**
   * Adds a new expense to database
   */
  addExpense: async (expense: Expense): Promise<void> => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
      if (!response.ok) throw new Error('Failed to add expense');
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  },

  /**
   * Updates an existing expense by ID
   */
  updateExpense: async (id: string, updatedExpense: Expense): Promise<void> => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExpense),
      });
      if (!response.ok) throw new Error('Failed to update expense');
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  /**
   * Deletes a single expense by ID
   */
  deleteExpense: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete expense');
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  /**
   * Deletes multiple expenses by IDs
   */
  deleteMultipleExpenses: async (ids: string[]): Promise<void> => {
    try {
      const response = await fetch('/api/expenses/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to bulk delete expenses');
    } catch (error) {
      console.error('Error bulk deleting expenses:', error);
      throw error;
    }
  },

  /**
   * Removes all expenses from database
   */
  clearAllExpenses: async (): Promise<void> => {
    try {
      const expenses = await storageMysql.getExpenses();
      const ids = expenses.map(exp => exp.id);
      await storageMysql.deleteMultipleExpenses(ids);
    } catch (error) {
      console.error('Error clearing all expenses:', error);
      throw error;
    }
  },

  /**
   * Retrieves all categories from database
   */
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return await response.json();
    } catch (error) {
      console.error('Error reading categories from database:', error);
      return [];
    }
  },

  /**
   * Not used in new architecture
   */
  saveCategories: async (categories: Category[]): Promise<void> => {
    console.warn('saveCategories() is deprecated with MySQL backend');
  },

  /**
   * Gets active (non-archived) categories sorted by order
   */
  getActiveCategories: async (): Promise<Category[]> => {
    const categories = await storageMysql.getCategories();
    return categories
      .filter(cat => !cat.isArchived)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Gets archived categories
   */
  getArchivedCategories: async (): Promise<Category[]> => {
    const categories = await storageMysql.getCategories();
    return categories
      .filter(cat => cat.isArchived)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Adds a new category
   */
  addCategory: async (name: string, description: string = 'No description provided'): Promise<void> => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error('Failed to add category');
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  /**
   * Updates a category name and/or description
   */
  updateCategory: async (oldName: string, newName: string, newDescription?: string): Promise<void> => {
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName, description: newDescription }),
      });
      if (!response.ok) throw new Error('Failed to update category');
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  /**
   * Legacy method - use updateCategory instead
   */
  updateCategoryName: async (oldName: string, newName: string): Promise<void> => {
    await storageMysql.updateCategory(oldName, newName);
  },

  /**
   * Archives a category
   */
  archiveCategory: async (name: string): Promise<void> => {
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to archive category');
    } catch (error) {
      console.error('Error archiving category:', error);
      throw error;
    }
  },

  /**
   * Restores an archived category
   */
  restoreCategory: async (name: string): Promise<void> => {
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(name)}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore category');
    } catch (error) {
      console.error('Error restoring category:', error);
      throw error;
    }
  },

  /**
   * Reorders categories
   */
  reorderCategories: async (categories: Category[]): Promise<void> => {
    try {
      const response = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      });
      if (!response.ok) throw new Error('Failed to reorder categories');
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  },

  /**
   * Gets expense count for each category
   */
  getCategoryExpenseCounts: async (): Promise<Record<string, number>> => {
    const categories = await storageMysql.getCategories();
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      if (cat.expenseCount !== undefined) {
        counts[cat.name] = cat.expenseCount;
      }
    });
    return counts;
  },
};
```

**Step 3.2: Update Components to Use Async Storage**

All components that use `storage` must be updated to handle async operations.

**Example - Update `app/page.tsx`**:

```typescript
// Before (localStorage)
const handleAddExpense = (expense: Expense) => {
  storage.addExpense(expense);
  setExpenses(storage.getExpenses());
};

// After (MySQL)
const handleAddExpense = async (expense: Expense) => {
  await storageMysql.addExpense(expense);
  const expenses = await storageMysql.getExpenses();
  setExpenses(expenses);
};
```

**Key Changes Needed**:
1. All handler functions become `async`
2. All storage calls use `await`
3. useEffect for initial load becomes async
4. Add loading states for async operations
5. Add error handling for network failures

---

### Phase 4: Testing Strategy

**Step 4.1: Unit Tests for API Routes**

Create `app/api/expenses/__tests__/route.test.ts`:

```typescript
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('/api/expenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return expenses', async () => {
      const mockExpenses = [
        {
          id: '1',
          date: new Date('2025-10-01'),
          amount: { toNumber: () => 50.00 },
          category: 'Food',
          description: 'Groceries',
          createdAt: new Date('2025-10-01T10:00:00Z'),
        },
      ];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      const response = await GET();
      const data = await response.json();

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
      });
      expect(data).toHaveLength(1);
      expect(data[0].amount).toBe(50.00);
    });

    it('should handle errors gracefully', async () => {
      (prisma.expense.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch expenses');
    });
  });

  describe('POST', () => {
    it('should create new expense', async () => {
      const mockExpense = {
        id: '1',
        date: new Date('2025-10-01'),
        amount: { toNumber: () => 50.00 },
        category: 'Food',
        description: 'Groceries',
        createdAt: new Date('2025-10-01T10:00:00Z'),
      };

      (prisma.expense.create as jest.Mock).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          date: '2025-10-01',
          amount: 50.00,
          category: 'Food',
          description: 'Groceries',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.amount).toBe(50.00);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });
});
```

**Step 4.2: Integration Tests**

Use the existing Jest test suite but update for async operations:

```typescript
// Before
const summary = calculateSummary(mockExpenses);
expect(summary.totalSpending).toBe(255);

// After (if data comes from API)
const expenses = await storageMysql.getExpenses();
const summary = calculateSummary(expenses);
expect(summary.totalSpending).toBe(255);
```

**Step 4.3: E2E Tests with Playwright**

Create `tests/e2e/expenses.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Expense Management with MySQL', () => {
  test('should add new expense', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Fill form
    await page.fill('input[name="date"]', '2025-10-01');
    await page.fill('input[name="amount"]', '50.00');
    await page.selectOption('select[name="category"]', 'Food');
    await page.fill('input[name="description"]', 'Test expense');

    // Submit
    await page.click('button[type="submit"]');

    // Verify expense appears in list
    await expect(page.locator('text=Test expense')).toBeVisible();
  });

  test('should persist data after refresh', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Add expense
    await page.fill('input[name="date"]', '2025-10-01');
    await page.fill('input[name="amount"]', '50.00');
    await page.selectOption('select[name="category"]', 'Food');
    await page.fill('input[name="description"]', 'Persistent expense');
    await page.click('button[type="submit"]');

    // Refresh page
    await page.reload();

    // Verify data persists
    await expect(page.locator('text=Persistent expense')).toBeVisible();
  });
});
```

---

### Phase 5: Rollout Strategy

**Step 5.1: Feature Flag Approach**

Add environment variable to switch between localStorage and MySQL:

`.env.local`:
```bash
USE_MYSQL=false  # Start with localStorage
DATABASE_URL="mysql://root:password@localhost:3306/expense_tracker"
```

`lib/storage-factory.ts`:
```typescript
import { storage as localStorageImpl } from './storage';
import { storageMysql as mysqlStorageImpl } from './storage-mysql';

const USE_MYSQL = process.env.NEXT_PUBLIC_USE_MYSQL === 'true';

export const storage = USE_MYSQL ? mysqlStorageImpl : localStorageImpl;
```

Update all imports:
```typescript
// Before
import { storage } from '@/lib/storage';

// After
import { storage } from '@/lib/storage-factory';
```

**Step 5.2: Phased Rollout**

1. **Week 1**: Deploy with `USE_MYSQL=false` (localStorage mode)
   - Verify no regressions
   - Monitor error logs

2. **Week 2**: Enable MySQL for internal testing (`USE_MYSQL=true`)
   - Test all CRUD operations
   - Verify performance is acceptable
   - Check error handling

3. **Week 3**: Enable MySQL for beta users
   - Monitor database performance
   - Collect user feedback

4. **Week 4**: Full rollout to all users
   - Remove localStorage code path
   - Remove feature flag

**Step 5.3: Data Migration Tool (Optional)**

If users have localStorage data, provide migration:

`lib/migrate-local-to-mysql.ts`:
```typescript
import { storage as localStorageImpl } from './storage';
import { storageMysql } from './storage-mysql';

export async function migrateLocalStorageToMySQL() {
  // Get all data from localStorage
  const expenses = localStorageImpl.getExpenses();
  const categories = localStorageImpl.getCategories();

  try {
    // Migrate categories first
    for (const category of categories) {
      await storageMysql.addCategory(category.name, category.description);
    }

    // Migrate expenses
    for (const expense of expenses) {
      await storageMysql.addExpense(expense);
    }

    console.log('Migration complete!');
    return { success: true, migratedExpenses: expenses.length };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}
```

Add migration button in UI:
```tsx
<button onClick={async () => {
  if (confirm('Migrate your data from localStorage to database?')) {
    const result = await migrateLocalStorageToMySQL();
    if (result.success) {
      alert(`Successfully migrated ${result.migratedExpenses} expenses!`);
    } else {
      alert('Migration failed. Please contact support.');
    }
  }
}}>
  Migrate to Database
</button>
```

---

## 1.6 Operational Considerations (Future Production)

### Database Backups

**Strategy**: Automated daily backups with point-in-time recovery

**Implementation (Production)**:
```bash
# Automated backup script (cron job)
mysqldump -u root -p expense_tracker > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u root -p expense_tracker < backup_20251001.sql
```

**Cloud Options**:
- AWS RDS: Automated backups with configurable retention
- Google Cloud SQL: Point-in-time recovery
- Azure Database for MySQL: Geo-redundant backups

### Schema Migrations

**Using Prisma Migrate**:
```bash
# Create migration after schema changes
npx prisma migrate dev --name add_vendor_field

# Apply migration in production
npx prisma migrate deploy
```

**Best Practices**:
- Never modify production schema manually
- Test migrations on staging environment first
- Keep migrations reversible when possible
- Document breaking changes

### Multi-User Support (Future)

**Required Changes**:
1. Add User authentication (NextAuth.js, Auth0, etc.)
2. Add `userId` foreign key to Expense table
3. Update all queries to filter by `userId`
4. Add row-level security

**Example Query Change**:
```typescript
// Before (single-user)
const expenses = await prisma.expense.findMany();

// After (multi-user)
const expenses = await prisma.expense.findMany({
  where: { userId: session.user.id }
});
```

### Performance Optimization

**Connection Pooling**:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  pool_timeout = 20
  pool_size = 5
}
```

**Indexes** (already defined in schema):
- Date index for filtering by date range
- Category index for filtering by category
- CreatedAt index for sorting

**Query Optimization**:
- Use `select` to fetch only needed fields
- Use pagination for large datasets
- Consider caching frequently accessed data (Redis)

### Scaling Considerations

**Horizontal Scaling**:
- Read replicas for read-heavy workloads
- Load balancer for multiple Next.js instances
- Connection pooler (PgBouncer for Postgres, ProxySQL for MySQL)

**Vertical Scaling**:
- Increase database server resources (CPU, RAM, storage)
- Optimize MySQL configuration (buffer pool, query cache)

**Cost Considerations**:
- Local MySQL: Free but requires maintenance
- AWS RDS: ~$20-50/month for small instance
- PlanetScale: Free tier available, scales automatically

---

## 1.7 Summary: MySQL Migration

### What Changes
- ✅ Data persistence: localStorage → MySQL
- ✅ API layer: Added REST endpoints
- ✅ Storage service: Synchronous → Asynchronous
- ✅ Type safety: Maintained with Prisma
- ✅ Testing: Added API route tests

### What Stays the Same
- ✅ UI/UX: No user-facing changes
- ✅ Business logic: Utils remain unchanged
- ✅ Component structure: Same component hierarchy
- ✅ Type definitions: Same TypeScript interfaces

### Complexity Rating
**Medium** - Requires understanding of:
- Async/await patterns
- REST API design
- Database schema design
- Prisma ORM basics

### Estimated Timeline
- Setup & Schema: 2-3 hours
- API Routes: 4-6 hours
- Component Updates: 3-4 hours
- Testing: 3-4 hours
- **Total: 12-17 hours**

---

# Part 2: PHP8 Backend Rewrite

## 2.1 Current Architecture Analysis

### Current Backend Stack
```
Frontend: React 19 + Next.js 15 (Client Components)
Backend: Next.js API Routes (TypeScript)
Database: localStorage (browser) → MySQL (after Part 1)
External API: OpenAI GPT-4o
Testing: Jest + React Testing Library
Build: Next.js bundler
Runtime: Node.js 20+
```

### Backend Responsibilities
1. **API Endpoints** (`app/api/categorize/route.ts`)
   - POST `/api/categorize` - AI categorization using OpenAI

2. **Future API Endpoints** (after MySQL migration)
   - Expense CRUD operations
   - Category management
   - Bulk operations

3. **Server-Side Logic**
   - OpenAI API integration
   - Request validation
   - Error handling
   - Response serialization

---

## 2.2 PHP8 Architecture Options

### Option A: Laravel 11 + React (Recommended for Interview Prep)

**Architecture**:
```
Frontend: React 19 (SPA, separate codebase or Laravel Mix)
Backend: Laravel 11 (PHP 8.2+)
API: Laravel API Resources (RESTful)
Database: MySQL with Eloquent ORM
Testing: PHPUnit + Pest
```

**Technology Mapping**:

| Next.js/TypeScript | Laravel/PHP8 | Notes |
|--------------------|--------------|-------|
| Next.js API Routes | Laravel Controllers | Both are request handlers |
| Prisma ORM | Eloquent ORM | Active Record vs Data Mapper |
| TypeScript types | PHP 8 types + PHPDoc | PHP types are runtime, TS compile-time |
| Zod validation | Laravel Validation | Built into Laravel framework |
| Jest tests | PHPUnit / Pest | Similar test syntax |
| npm packages | Composer packages | Dependency management |
| .env (Next.js) | .env (Laravel) | Same format! |

**File Structure Comparison**:

```
Next.js/TypeScript                 Laravel/PHP8
==================                 ============
app/api/expenses/route.ts   →     app/Http/Controllers/ExpenseController.php
lib/prisma.ts               →     (Eloquent models, no explicit client)
types/expense.ts            →     app/Models/Expense.php (model = type + DB)
utils/expenseUtils.ts       →     app/Services/ExpenseService.php
middleware/auth.ts          →     app/Http/Middleware/Authenticate.php
.env                        →     .env (same!)
package.json                →     composer.json
```

**Pros**:
- ✅ Most popular PHP framework (large community, extensive docs)
- ✅ Excellent ORM (Eloquent is intuitive and powerful)
- ✅ Built-in features (validation, authentication, queues, caching)
- ✅ Modern PHP 8 features (attributes, enums, readonly properties)
- ✅ Great testing tools (PHPUnit, Pest, Laravel Dusk for E2E)
- ✅ Can keep React frontend with minimal changes (API-only Laravel)
- ✅ Strong ecosystem (Laravel Forge, Vapor, Horizon, Telescope)

**Cons**:
- ❌ Heavier framework (more opinionated than Next.js)
- ❌ Learning curve for Laravel conventions ("magic" methods)
- ❌ Less type safety than TypeScript (PHP types improving but not as strict)
- ❌ No built-in server-side rendering like Next.js (separate frontend/backend)

**When to Use**:
- Building a traditional web application with server-side rendering (Blade templates)
- Need robust backend features (queues, scheduled jobs, WebSockets)
- Team has PHP experience
- Enterprise applications requiring stability and convention

**Example Code**: See Section 2.3 for full implementation.

---

### Option B: Laravel 11 Full-Stack (Blade Templates)

**Architecture**:
```
Frontend: Blade Templates (Laravel's templating engine) + Alpine.js/Livewire
Backend: Laravel 11 (PHP 8.2+)
Database: MySQL with Eloquent ORM
Testing: PHPUnit + Laravel Dusk
```

**Technology Mapping**:

| Next.js/TypeScript | Laravel Full-Stack | Notes |
|--------------------|-------------------|-------|
| React components | Blade components | Server-rendered HTML |
| useState | Livewire properties | Reactive without JavaScript |
| useEffect | Alpine.js x-init | Minimal JS framework |
| Client-side routing | Laravel routes | Traditional page loads |
| Next.js SSR | Blade rendering | Both server-rendered |

**Pros**:
- ✅ Fully integrated (no separate frontend/backend)
- ✅ Faster initial development (no API layer needed)
- ✅ Livewire enables SPA-like experience without writing much JS
- ✅ SEO-friendly (server-rendered HTML)
- ✅ Simpler deployment (single application)

**Cons**:
- ❌ Less interactive than React (Livewire has limitations)
- ❌ Mixing PHP and HTML templates (less clean separation)
- ❌ Frontend logic tied to backend (harder to reuse frontend elsewhere)
- ❌ Not ideal for complex UIs (charting, drag-and-drop, etc.)

**When to Use**:
- Building content-heavy applications (blogs, dashboards)
- Team is primarily backend-focused
- Simpler UI requirements
- Need rapid prototyping

**Example**: See Section 2.4 for Blade template examples.

---

### Option C: Symfony 7 + React (Enterprise Alternative)

**Architecture**:
```
Frontend: React 19 (SPA)
Backend: Symfony 7 (PHP 8.2+)
API: API Platform (built on Symfony)
Database: MySQL with Doctrine ORM
Testing: PHPUnit + Symfony Test Framework
```

**Technology Mapping**:

| Next.js/TypeScript | Symfony/PHP8 | Notes |
|--------------------|--------------|-------|
| Next.js API Routes | Symfony Controllers | More explicit routing |
| Prisma ORM | Doctrine ORM | More complex but powerful |
| TypeScript types | PHP 8 types + Doctrine annotations | Doctrine uses metadata |
| Next.js middleware | Symfony Event Listeners | More flexible event system |
| Jest | PHPUnit | Standard PHP testing |

**Pros**:
- ✅ Enterprise-grade (used by Drupal, Magento, etc.)
- ✅ API Platform generates full REST/GraphQL APIs automatically
- ✅ Highly flexible and modular (bundle system)
- ✅ Best-in-class security features
- ✅ Excellent for microservices architecture

**Cons**:
- ❌ Steeper learning curve than Laravel
- ❌ More boilerplate code
- ❌ Smaller community than Laravel
- ❌ Slower development for simple apps

**When to Use**:
- Building large enterprise applications
- Need strict architecture and patterns
- Complex domain logic (Domain-Driven Design)
- Microservices architecture

**Example**: See Section 2.5 for Symfony examples.

---

### Option D: Vanilla PHP 8 + React (Educational)

**Architecture**:
```
Frontend: React 19 (SPA)
Backend: PHP 8.2+ (no framework)
API: Custom REST endpoints
Database: MySQL with PDO
Testing: PHPUnit
```

**Technology Mapping**:

| Next.js/TypeScript | Vanilla PHP8 | Notes |
|--------------------|--------------|-------|
| Next.js routing | Router library (e.g., FastRoute) | Must implement manually |
| Prisma ORM | PDO (raw SQL) | No ORM, full control |
| Validation | Manual validation | No built-in system |
| Middleware | Custom implementation | No framework support |

**Pros**:
- ✅ Full control over every aspect
- ✅ Minimal dependencies
- ✅ Great for learning PHP fundamentals
- ✅ Lightweight and fast

**Cons**:
- ❌ Must implement everything from scratch
- ❌ No standard patterns or conventions
- ❌ Security concerns (no built-in CSRF, XSS protection)
- ❌ Time-consuming for production apps

**When to Use**:
- Learning PHP and web development fundamentals
- Building extremely simple APIs
- Educational projects or tutorials
- When you need absolute performance

**Example**: See Section 2.6 for vanilla PHP examples.

---

## 2.3 Laravel + React Implementation (Detailed)

### Step 1: Setup Laravel Project

```bash
# Install Laravel
composer create-project laravel/laravel expense-tracker-php
cd expense-tracker-php

# Install dependencies
composer require laravel/sanctum  # API authentication
composer require openai-php/laravel  # OpenAI integration
composer require barryvdh/laravel-cors  # CORS for React SPA

# Install dev dependencies
composer require --dev laravel/pint  # Code formatting
composer require --dev pestphp/pest  # Modern testing framework
composer require --dev pestphp/pest-plugin-laravel
```

### Step 2: Database Configuration

**Configure `.env`**:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=expense_tracker
DB_USERNAME=root
DB_PASSWORD=your_password

OPENAI_API_KEY=sk-...
```

**Create Migration** (`database/migrations/xxxx_create_expenses_table.php`):
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->string('id')->primary();  // CUID like Next.js
            $table->date('date');
            $table->decimal('amount', 10, 2);
            $table->string('category', 100);
            $table->string('description', 500);
            $table->timestamps();  // created_at, updated_at

            // Indexes for performance
            $table->index('date');
            $table->index('category');
            $table->index('created_at');
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->string('name', 100)->primary();
            $table->string('description', 500);
            $table->integer('order');
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index('order');
            $table->index('is_archived');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('categories');
    }
};
```

**Run Migration**:
```bash
php artisan migrate
```

### Step 3: Create Eloquent Models

**Expense Model** (`app/Models/Expense.php`):
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Expense extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'expenses';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The data type of the primary key.
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'id',
        'date',
        'amount',
        'category',
        'description',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Boot method - auto-generate ID
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = self::generateId();
            }
        });
    }

    /**
     * Generate ID similar to Next.js generateId()
     */
    private static function generateId(): string
    {
        return (string) time() . '-' . Str::random(8);
    }
}
```

**Category Model** (`app/Models/Category.php`):
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'name';

    protected $fillable = [
        'name',
        'description',
        'order',
        'is_archived',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Get expense count for this category
     */
    public function getExpenseCountAttribute(): int
    {
        return Expense::where('category', $this->name)->count();
    }
}
```

### Step 4: Create API Controllers

**Expense Controller** (`app/Http/Controllers/Api/ExpenseController.php`):
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    /**
     * GET /api/expenses - List all expenses
     */
    public function index(): JsonResponse
    {
        try {
            $expenses = Expense::orderBy('date', 'desc')->get();

            // Format response to match Next.js API
            $formatted = $expenses->map(function ($expense) {
                return [
                    'id' => $expense->id,
                    'date' => $expense->date->format('Y-m-d'),
                    'amount' => (float) $expense->amount,
                    'category' => $expense->category,
                    'description' => $expense->description,
                    'createdAt' => $expense->created_at->toIso8601String(),
                ];
            });

            return response()->json($formatted);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to fetch expenses'],
                500
            );
        }
    }

    /**
     * POST /api/expenses - Create new expense
     */
    public function store(Request $request): JsonResponse
    {
        // Validation (similar to TypeScript type checking)
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'description' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(
                ['error' => 'Missing required fields', 'details' => $validator->errors()],
                400
            );
        }

        try {
            $expense = Expense::create($validator->validated());

            return response()->json([
                'id' => $expense->id,
                'date' => $expense->date->format('Y-m-d'),
                'amount' => (float) $expense->amount,
                'category' => $expense->category,
                'description' => $expense->description,
                'createdAt' => $expense->created_at->toIso8601String(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to create expense'],
                500
            );
        }
    }

    /**
     * GET /api/expenses/{id} - Get single expense
     */
    public function show(string $id): JsonResponse
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(
                ['error' => 'Expense not found'],
                404
            );
        }

        return response()->json([
            'id' => $expense->id,
            'date' => $expense->date->format('Y-m-d'),
            'amount' => (float) $expense->amount,
            'category' => $expense->category,
            'description' => $expense->description,
            'createdAt' => $expense->created_at->toIso8601String(),
        ]);
    }

    /**
     * PUT /api/expenses/{id} - Update expense
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(
                ['error' => 'Expense not found'],
                404
            );
        }

        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|date',
            'amount' => 'sometimes|numeric|min:0',
            'category' => 'sometimes|string|max:100',
            'description' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(
                ['error' => 'Validation failed', 'details' => $validator->errors()],
                400
            );
        }

        try {
            $expense->update($validator->validated());

            return response()->json([
                'id' => $expense->id,
                'date' => $expense->date->format('Y-m-d'),
                'amount' => (float) $expense->amount,
                'category' => $expense->category,
                'description' => $expense->description,
                'createdAt' => $expense->created_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to update expense'],
                500
            );
        }
    }

    /**
     * DELETE /api/expenses/{id} - Delete expense
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $expense = Expense::find($id);

            if (!$expense) {
                return response()->json(
                    ['error' => 'Expense not found'],
                    404
                );
            }

            $expense->delete();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to delete expense'],
                500
            );
        }
    }

    /**
     * POST /api/expenses/bulk-delete - Delete multiple expenses
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(
                ['error' => 'Invalid ids array'],
                400
            );
        }

        try {
            $deleted = Expense::whereIn('id', $request->ids)->delete();

            return response()->json(['deleted' => $deleted]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to bulk delete expenses'],
                500
            );
        }
    }
}
```

**Category Controller** (`app/Http/Controllers/Api/CategoryController.php`):
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * GET /api/categories - List all categories
     */
    public function index(): JsonResponse
    {
        try {
            $categories = Category::orderBy('order', 'asc')->get();

            // Add expense counts
            $formatted = $categories->map(function ($category) {
                return [
                    'name' => $category->name,
                    'description' => $category->description,
                    'order' => $category->order,
                    'isArchived' => $category->is_archived,
                    'expenseCount' => $category->expense_count,
                ];
            });

            return response()->json($formatted);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to fetch categories'],
                500
            );
        }
    }

    /**
     * POST /api/categories - Create new category
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100|unique:categories,name',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(
                ['error' => 'Validation failed', 'details' => $validator->errors()],
                400
            );
        }

        try {
            // Get max order
            $maxOrder = Category::max('order') ?? -1;

            $category = Category::create([
                'name' => trim($request->name),
                'description' => trim($request->description ?? 'No description provided'),
                'order' => $maxOrder + 1,
                'is_archived' => false,
            ]);

            return response()->json([
                'name' => $category->name,
                'description' => $category->description,
                'order' => $category->order,
                'isArchived' => $category->is_archived,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to create category'],
                500
            );
        }
    }

    /**
     * PUT /api/categories/{name} - Update category
     */
    public function update(Request $request, string $name): JsonResponse
    {
        $category = Category::find(urldecode($name));

        if (!$category) {
            return response()->json(
                ['error' => 'Category not found'],
                404
            );
        }

        $validator = Validator::make($request->all(), [
            'newName' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(
                ['error' => 'Validation failed', 'details' => $validator->errors()],
                400
            );
        }

        try {
            // Use transaction to update category and expenses atomically
            DB::transaction(function () use ($category, $request) {
                $oldName = $category->name;
                $newName = trim($request->newName);

                // Update category
                $category->name = $newName;
                if ($request->has('description')) {
                    $category->description = trim($request->description);
                }
                $category->save();

                // Update all expenses with this category (if name changed)
                if ($newName !== $oldName) {
                    Expense::where('category', $oldName)
                        ->update(['category' => $newName]);
                }
            });

            return response()->json([
                'name' => $category->name,
                'description' => $category->description,
                'order' => $category->order,
                'isArchived' => $category->is_archived,
            ]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to update category'],
                500
            );
        }
    }

    /**
     * DELETE /api/categories/{name} - Archive category
     */
    public function destroy(string $name): JsonResponse
    {
        try {
            $category = Category::find(urldecode($name));

            if (!$category) {
                return response()->json(
                    ['error' => 'Category not found'],
                    404
                );
            }

            $category->is_archived = true;
            $category->save();

            return response()->json([
                'name' => $category->name,
                'description' => $category->description,
                'order' => $category->order,
                'isArchived' => $category->is_archived,
            ]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to archive category'],
                500
            );
        }
    }

    /**
     * POST /api/categories/{name}/restore - Restore archived category
     */
    public function restore(string $name): JsonResponse
    {
        try {
            $category = Category::find(urldecode($name));

            if (!$category) {
                return response()->json(
                    ['error' => 'Category not found'],
                    404
                );
            }

            $category->is_archived = false;
            $category->save();

            return response()->json([
                'name' => $category->name,
                'description' => $category->description,
                'order' => $category->order,
                'isArchived' => $category->is_archived,
            ]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to restore category'],
                500
            );
        }
    }

    /**
     * POST /api/categories/reorder - Reorder categories
     */
    public function reorder(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'categories' => 'required|array',
            'categories.*.name' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(
                ['error' => 'Validation failed', 'details' => $validator->errors()],
                400
            );
        }

        try {
            DB::transaction(function () use ($request) {
                foreach ($request->categories as $index => $categoryData) {
                    Category::where('name', $categoryData['name'])
                        ->update(['order' => $index]);
                }
            });

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to reorder categories'],
                500
            );
        }
    }
}
```

**Categorize Controller** (`app/Http/Controllers/Api/CategorizeController.php`):
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenAI\Laravel\Facades\OpenAI;

class CategorizeController extends Controller
{
    /**
     * POST /api/categorize - Categorize expenses using OpenAI
     */
    public function __invoke(Request $request): JsonResponse
    {
        // Check if API key is configured
        if (empty(config('openai.api_key'))) {
            return response()->json(
                ['error' => 'OpenAI API key not configured'],
                500
            );
        }

        // Validation
        $validator = Validator::make($request->all(), [
            'expenses' => 'required|array|min:1',
            'expenses.*.description' => 'required|string',
            'expenses.*.amount' => 'required|numeric',
            'expenses.*.date' => 'required|string',
            'categories' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(
                ['error' => 'Invalid request', 'details' => $validator->errors()],
                400
            );
        }

        try {
            $expenses = $request->expenses;

            // Get active categories
            $categories = $request->categories
                ? collect($request->categories)->where('isArchived', false)->sortBy('order')
                : Category::where('is_archived', false)->orderBy('order')->get();

            $categoryNames = $categories->pluck('name')->implode(', ');
            $categoryDescriptions = $categories->map(function ($cat) {
                $name = is_array($cat) ? $cat['name'] : $cat->name;
                $desc = is_array($cat) ? $cat['description'] : $cat->description;
                return "- {$name}: {$desc}";
            })->implode("\n");

            // Build merchant context
            $merchantGroups = [];
            foreach ($expenses as $idx => $exp) {
                $merchant = strtoupper(trim($exp['description']));
                if (!isset($merchantGroups[$merchant])) {
                    $merchantGroups[$merchant] = [];
                }
                $merchantGroups[$merchant][] = $idx;
            }

            $merchantContext = collect($merchantGroups)
                ->map(fn($indices, $merchant) => "{$merchant}: appears " . count($indices) . " time(s)")
                ->implode("\n");

            // Process in batches
            $batchSize = 40;
            $batches = array_chunk($expenses, $batchSize);
            $allCategorizations = [];

            foreach ($batches as $batchIdx => $batch) {
                $startIdx = $batchIdx * $batchSize;

                // Build numbered transaction list
                $numberedTransactions = collect($batch)
                    ->map(fn($exp, $idx) => ($startIdx + $idx + 1) . ". {$exp['description']} (£{$exp['amount']}, {$exp['date']})")
                    ->implode("\n");

                $prompt = "You are an expert expense categorization assistant. Follow this two-step process:

AVAILABLE CATEGORIES:
{$categoryDescriptions}

MERCHANT CONTEXT (for consistency across all " . count($expenses) . " transactions):
{$merchantContext}

STEP 1: GROUP BY MERCHANT
Analyze the " . count($batch) . " transactions below and identify unique merchants (group by description field).
For each merchant group, decide which category best matches based on the category descriptions above.

STEP 2: APPLY CATEGORIZATION
Apply your categorization decision to each transaction, ensuring all transactions from the same merchant get the SAME category.

TRANSACTIONS (" . count($batch) . " items - this is batch " . ($batchIdx + 1) . " of " . count($batches) . "):
{$numberedTransactions}

CONFIDENCE LEVELS:
- \"high\": Clear merchant type, obvious category match
- \"medium\": Reasonable inference needed
- \"low\": Uncertain or ambiguous (use empty \"\" for category)

OUTPUT FORMAT:
Return a JSON array with EXACTLY " . count($batch) . " objects in the SAME ORDER as the numbered list above.
Format: [{\"category\": \"CategoryName\", \"confidence\": \"high\"|\"medium\"|\"low\"}, ...]
Valid categories: {$categoryNames}, or empty string \"\"

Output ONLY the JSON array. No markdown, no explanations.";

                // Call OpenAI
                $response = OpenAI::chat()->create([
                    'model' => 'gpt-4o',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an expense categorization assistant. Always respond with valid JSON only.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.1,
                    'max_tokens' => 4096,
                ]);

                $responseText = $response->choices[0]->message->content;

                // Strip markdown code blocks
                $cleanedResponse = preg_replace('/^```json\s*/', '', $responseText);
                $cleanedResponse = preg_replace('/^```\s*/', '', $cleanedResponse);
                $cleanedResponse = preg_replace('/\s*```$/', '', $cleanedResponse);
                $cleanedResponse = trim($cleanedResponse);

                $batchCategorizations = json_decode($cleanedResponse, true);

                if (!is_array($batchCategorizations)) {
                    throw new \Exception('Invalid JSON response from OpenAI');
                }

                $allCategorizations = array_merge($allCategorizations, $batchCategorizations);
            }

            // Combine expenses with categorizations
            $categorizedExpenses = array_map(function ($expense, $idx) use ($allCategorizations) {
                return array_merge($expense, [
                    'category' => $allCategorizations[$idx]['category'] ?? '',
                    'confidence' => $allCategorizations[$idx]['confidence'] ?? 'low',
                ]);
            }, $expenses, array_keys($expenses));

            return response()->json(['categorizedExpenses' => $categorizedExpenses]);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to categorize expenses: ' . $e->getMessage()],
                500
            );
        }
    }
}
```

### Step 5: Define API Routes

**API Routes** (`routes/api.php`):
```php
<?php

use App\Http\Controllers\Api\CategorizeController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExpenseController;
use Illuminate\Support\Facades\Route;

// Expense routes
Route::get('/expenses', [ExpenseController::class, 'index']);
Route::post('/expenses', [ExpenseController::class, 'store']);
Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);
Route::post('/expenses/bulk-delete', [ExpenseController::class, 'bulkDestroy']);

// Category routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{name}', [CategoryController::class, 'update']);
Route::delete('/categories/{name}', [CategoryController::class, 'destroy']);
Route::post('/categories/{name}/restore', [CategoryController::class, 'restore']);
Route::post('/categories/reorder', [CategoryController::class, 'reorder']);

// AI categorization
Route::post('/categorize', CategorizeController::class);
```

### Step 6: Configure CORS for React Frontend

**CORS Configuration** (`config/cors.php`):
```php
<?php

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:3000'], // React dev server

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
```

### Step 7: Testing with PHPUnit/Pest

**Expense Test** (`tests/Feature/ExpenseTest.php`):
```php
<?php

use App\Models\Expense;

test('can list all expenses', function () {
    // Arrange: Create test data
    Expense::factory()->count(3)->create();

    // Act: Call API
    $response = $this->getJson('/api/expenses');

    // Assert: Verify response
    $response->assertStatus(200);
    $response->assertJsonCount(3);
});

test('can create new expense', function () {
    $data = [
        'date' => '2025-10-01',
        'amount' => 50.00,
        'category' => 'Food',
        'description' => 'Test expense',
    ];

    $response = $this->postJson('/api/expenses', $data);

    $response->assertStatus(201);
    $response->assertJson(['category' => 'Food']);

    $this->assertDatabaseHas('expenses', [
        'description' => 'Test expense',
    ]);
});

test('validates required fields', function () {
    $response = $this->postJson('/api/expenses', []);

    $response->assertStatus(400);
    $response->assertJsonStructure(['error', 'details']);
});

test('can update expense', function () {
    $expense = Expense::factory()->create([
        'description' => 'Original',
    ]);

    $response = $this->putJson("/api/expenses/{$expense->id}", [
        'description' => 'Updated',
    ]);

    $response->assertStatus(200);
    $response->assertJson(['description' => 'Updated']);
});

test('can delete expense', function () {
    $expense = Expense::factory()->create();

    $response = $this->deleteJson("/api/expenses/{$expense->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
});
```

**Factory for Testing** (`database/factories/ExpenseFactory.php`):
```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ExpenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => time() . '-' . $this->faker->uuid,
            'date' => $this->faker->date(),
            'amount' => $this->faker->randomFloat(2, 1, 1000),
            'category' => $this->faker->randomElement(['Food', 'Transportation', 'Entertainment']),
            'description' => $this->faker->sentence(),
        ];
    }
}
```

**Run Tests**:
```bash
php artisan test
```

### Step 8: React Frontend Integration

**Update React API calls** (no changes needed if using same endpoints!):

The React frontend can continue using the same API endpoints:
- `fetch('/api/expenses')` → Laravel handles it
- Same request/response format
- No frontend code changes required

**Update Environment Variable**:
```bash
# .env.local (React)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 2.4 Laravel Full-Stack (Blade Templates)

### Architecture Overview

**Instead of React SPA**, use Laravel's Blade templates with Livewire for reactivity.

### Example: Expense List Component

**Livewire Component** (`app/Livewire/ExpenseList.php`):
```php
<?php

namespace App\Livewire;

use App\Models\Expense;
use Livewire\Component;

class ExpenseList extends Component
{
    public $expenses;
    public $selectedExpenses = [];

    public function mount()
    {
        $this->loadExpenses();
    }

    public function loadExpenses()
    {
        $this->expenses = Expense::orderBy('date', 'desc')->get();
    }

    public function deleteExpense($id)
    {
        Expense::find($id)->delete();
        $this->loadExpenses();
        session()->flash('message', 'Expense deleted successfully');
    }

    public function bulkDelete()
    {
        Expense::whereIn('id', $this->selectedExpenses)->delete();
        $this->selectedExpenses = [];
        $this->loadExpenses();
        session()->flash('message', 'Selected expenses deleted');
    }

    public function render()
    {
        return view('livewire.expense-list');
    }
}
```

**Blade Template** (`resources/views/livewire/expense-list.blade.php`):
```blade
<div>
    @if (session()->has('message'))
        <div class="alert alert-success">
            {{ session('message') }}
        </div>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th><input type="checkbox" wire:model="selectAll"></th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($expenses as $expense)
                <tr>
                    <td>
                        <input type="checkbox" wire:model="selectedExpenses" value="{{ $expense->id }}">
                    </td>
                    <td>{{ $expense->date->format('Y-m-d') }}</td>
                    <td>{{ $expense->category }}</td>
                    <td>{{ $expense->description }}</td>
                    <td>£{{ number_format($expense->amount, 2) }}</td>
                    <td>
                        <button wire:click="deleteExpense('{{ $expense->id }}')" class="btn btn-danger">
                            Delete
                        </button>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if (count($selectedExpenses) > 0)
        <button wire:click="bulkDelete" class="btn btn-danger">
            Delete Selected ({{ count($selectedExpenses) }})
        </button>
    @endif
</div>
```

**Pros**:
- No JavaScript needed for basic interactivity
- Fast development
- Single codebase

**Cons**:
- Less flexible than React
- Not suitable for complex UIs (charts, drag-and-drop)

---

## 2.5 Symfony + React (Brief Overview)

**Key Differences from Laravel**:
- More explicit routing and configuration
- Doctrine ORM (more complex than Eloquent)
- API Platform for automatic API generation
- Stronger typing with PHP attributes

**Example Controller**:
```php
<?php

namespace App\Controller\Api;

use App\Entity\Expense;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/expenses', name: 'api_expenses_')]
class ExpenseController extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(EntityManagerInterface $em): JsonResponse
    {
        $expenses = $em->getRepository(Expense::class)->findAll();

        return $this->json($expenses);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $expense = new Expense();
        $expense->setDate(new \DateTime($data['date']));
        $expense->setAmount($data['amount']);
        $expense->setCategory($data['category']);
        $expense->setDescription($data['description']);

        $em->persist($expense);
        $em->flush();

        return $this->json($expense, 201);
    }
}
```

**When to use**: Enterprise applications, microservices, when you need strict architecture.

---

## 2.6 Vanilla PHP + React (Brief Overview)

**Example API Endpoint** (`api/expenses.php`):
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');

// Database connection
$pdo = new PDO('mysql:host=localhost;dbname=expense_tracker', 'root', 'password');

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM expenses ORDER BY date DESC');
        $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($expenses);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $pdo->prepare('INSERT INTO expenses (id, date, amount, category, description) VALUES (?, ?, ?, ?, ?)');
        $id = time() . '-' . bin2hex(random_bytes(4));
        $stmt->execute([
            $id,
            $data['date'],
            $data['amount'],
            $data['category'],
            $data['description']
        ]);

        echo json_encode(['id' => $id]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
```

**When to use**: Learning fundamentals, very simple APIs, educational projects.

---

## 2.7 Comparison Matrix: All PHP Options

| Aspect | Laravel + React | Laravel Full-Stack | Symfony + React | Vanilla PHP |
|--------|-----------------|-------------------|-----------------|-------------|
| **Complexity** | Medium | Low | High | Very Low |
| **Development Speed** | Fast | Very Fast | Medium | Slow |
| **Flexibility** | High | Medium | Very High | Complete |
| **Learning Curve** | Medium | Low | Steep | Easy |
| **Type Safety** | Medium (PHP 8) | Medium | High (Attributes) | Low |
| **Testing Tools** | Excellent | Excellent | Excellent | Basic |
| **Community** | Largest | Largest | Large | N/A |
| **Best For** | Modern APIs | Traditional apps | Enterprise | Learning |
| **React Integration** | Seamless | Not needed | Seamless | Manual |
| **ORM** | Eloquent (easy) | Eloquent | Doctrine (powerful) | Raw SQL |
| **Validation** | Built-in | Built-in | Built-in | Manual |
| **Auth** | Laravel Sanctum | Laravel Breeze | Symfony Security | Manual |
| **Job Queues** | ✅ | ✅ | ✅ | ❌ |
| **WebSockets** | ✅ (Pusher/Echo) | ✅ (Livewire) | ✅ (Mercure) | ❌ |
| **Production Ready** | ✅ | ✅ | ✅ | ⚠️ (needs hardening) |

---

## 2.8 Summary: PHP8 Backend Rewrite

### Recommended Approach for Interview Prep
**Laravel 11 + React** because:
1. Most similar to Node.js/Express + React pattern
2. Widely used in PHP→Node migrations
3. Best documentation and community support
4. Modern PHP 8 features (enums, attributes, readonly properties)
5. Easiest to demonstrate full-stack understanding

### What Changes (Next.js → Laravel)
- ✅ Backend language: TypeScript → PHP 8
- ✅ Framework: Next.js API Routes → Laravel Controllers
- ✅ ORM: Prisma → Eloquent
- ✅ Validation: Zod/TypeScript → Laravel Validation
- ✅ Testing: Jest → PHPUnit/Pest
- ✅ Package manager: npm → Composer
- ✅ Runtime: Node.js → PHP-FPM

### What Stays the Same
- ✅ Frontend: React (can stay unchanged!)
- ✅ Database: MySQL
- ✅ API design: REST endpoints
- ✅ Business logic: Same patterns, different syntax
- ✅ Architecture: MVC pattern

### Complexity Rating
**High** - Requires understanding of:
- PHP 8 syntax and features
- Laravel framework conventions
- ORM differences (Active Record vs Data Mapper)
- PHP ecosystem and tooling
- Web server configuration (Nginx/Apache + PHP-FPM)

### Estimated Timeline
- Laravel setup: 2-3 hours
- Models & migrations: 3-4 hours
- Controllers & routes: 6-8 hours
- Testing: 4-6 hours
- Frontend integration: 2-3 hours
- **Total: 17-24 hours**

---

# Part 3: Execution Strategy

## 3.1 Recommended Order of Operations

### Option 1: Sequential Approach (Lower Risk)

**Phase 1: MySQL Migration (Weeks 1-3)**
1. Week 1: Setup Prisma, create schema, build API routes
2. Week 2: Update components to use async storage
3. Week 3: Testing, rollout with feature flag

**Phase 2: PHP Backend Rewrite (Weeks 4-7)**
1. Week 4: Setup Laravel, recreate database schema
2. Week 5: Build controllers and routes
3. Week 6: Testing and API parity verification
4. Week 7: Frontend integration, deployment

**Total Time: 7 weeks**

**Pros**:
- ✅ Lower risk (one change at a time)
- ✅ Easy rollback (feature flags)
- ✅ Can validate MySQL migration before PHP rewrite
- ✅ Learn incrementally

**Cons**:
- ❌ Longer overall timeline
- ❌ More intermediate states to maintain

---

### Option 2: Big Bang Approach (Faster but Riskier)

**Phase 1: Parallel Development (Weeks 1-4)**
- Weeks 1-2: Build Laravel + MySQL backend
- Weeks 3-4: Update React frontend to call Laravel APIs

**Phase 2: Testing & Deployment (Week 5)**
- Week 5: Integration testing, deployment

**Total Time: 5 weeks**

**Pros**:
- ✅ Faster overall timeline
- ✅ Fewer intermediate states
- ✅ Direct migration (localStorage → MySQL + PHP)

**Cons**:
- ❌ Higher risk (multiple changes at once)
- ❌ Harder to debug issues
- ❌ No incremental validation

---

### Option 3: Hybrid Approach (Recommended)

**Phase 1: MySQL with TypeScript (Weeks 1-2)**
- Quick MySQL migration using Prisma (as described in Part 1)
- Validate database design and API contracts
- Ensure all functionality works

**Phase 2: PHP Backend Rewrite (Weeks 3-5)**
- Rewrite API layer in Laravel
- Use exact same API contracts (no frontend changes)
- Direct swap: Next.js API routes → Laravel controllers

**Phase 3: Deployment (Week 6)**
- Integration testing
- Performance testing
- Production rollout

**Total Time: 6 weeks**

**Pros**:
- ✅ Validates database design early
- ✅ API contracts proven before rewrite
- ✅ Medium risk (staged but efficient)
- ✅ Frontend changes once (localStorage → MySQL), then no more changes

**Cons**:
- ⚠️ Some rework (Prisma → Eloquent)
- ⚠️ Need to maintain Next.js APIs briefly

**Why this is recommended**:
- Database design mistakes are expensive to fix later
- API contract validation prevents frontend rework
- Incremental validation reduces risk
- Matches real-world migration patterns

---

## 3.2 Risk Mitigation Strategies

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data loss during migration** | Critical | Backup localStorage, database backups, migration tool with dry-run mode |
| **API contract mismatch** | High | Contract testing (Pact.js), API documentation (OpenAPI), integration tests |
| **Performance degradation** | Medium | Load testing, database indexing, caching layer (Redis) |
| **Type safety loss** | Medium | PHPStan/Psalm for PHP, maintain TypeScript on frontend, API schema validation |
| **OpenAI API failures** | Low | Graceful degradation, fallback to manual categorization, error handling |
| **Breaking changes** | High | Feature flags, canary deployment, rollback plan |

### Process Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Underestimated timeline** | Medium | Add 20% buffer, break into smaller milestones, track progress weekly |
| **Knowledge gaps** | Medium | Research phase before coding, pair programming, code reviews |
| **Scope creep** | Low | Strict feature parity requirement, defer improvements to Phase 2 |
| **Testing gaps** | High | Test coverage requirements (80%+), automated E2E tests, manual QA checklist |

---

## 3.3 Testing Checkpoints

### Checkpoint 1: MySQL Migration Complete
**Exit Criteria**:
- ✅ All existing functionality works with MySQL
- ✅ Data persists after browser refresh
- ✅ All unit tests pass
- ✅ Integration tests cover CRUD operations
- ✅ Performance is acceptable (<200ms for API calls)
- ✅ Feature flag allows rollback to localStorage

**Validation**:
```bash
# Run all tests
npm run test

# Run E2E tests
npx playwright test

# Manual testing checklist
- [ ] Add expense
- [ ] Edit expense
- [ ] Delete expense
- [ ] Bulk delete
- [ ] Filter by category
- [ ] Filter by date range
- [ ] Search expenses
- [ ] CSV import
- [ ] CSV export
- [ ] Category management
- [ ] AI categorization
```

### Checkpoint 2: PHP Backend Rewrite Complete
**Exit Criteria**:
- ✅ All API endpoints return same format as Next.js
- ✅ All Laravel tests pass
- ✅ React frontend works without changes
- ✅ OpenAI integration works
- ✅ Performance is equivalent or better
- ✅ Error handling is comprehensive

**Validation**:
```bash
# Run Laravel tests
php artisan test

# Run React tests (unchanged)
npm run test

# Contract testing
npm run test:contract

# Performance testing
ab -n 1000 -c 10 http://localhost:8000/api/expenses
```

### Checkpoint 3: Production Readiness
**Exit Criteria**:
- ✅ All tests pass (unit, integration, E2E)
- ✅ Load testing shows acceptable performance
- ✅ Security audit completed
- ✅ Database backups configured
- ✅ Monitoring and logging in place
- ✅ Rollback plan documented and tested
- ✅ User documentation updated

---

## 3.4 Rollback Plan

### Scenario 1: MySQL Migration Fails
**Rollback Steps**:
1. Change feature flag: `USE_MYSQL=false`
2. Redeploy application
3. Verify localStorage mode works
4. Investigate MySQL issues offline

**Time to rollback: ~5 minutes**

### Scenario 2: PHP Backend Fails
**Rollback Steps**:
1. Route traffic back to Next.js API routes
2. Update DNS/load balancer to point to Next.js server
3. Verify all functionality works
4. Debug PHP backend offline

**Time to rollback: ~15 minutes**

### Scenario 3: Data Corruption
**Rollback Steps**:
1. Stop application immediately
2. Restore database from last known good backup
3. Verify data integrity
4. Investigate root cause

**Time to rollback: ~30-60 minutes (depends on backup size)**

---

# Part 4: Interview Preparation

## 4.1 Key Talking Points for PHP → Node.js Migrations

### Why Companies Migrate from PHP to Node.js

**Common Reasons**:
1. **JavaScript Everywhere**: Single language for frontend and backend (developer efficiency)
2. **Modern Tooling**: Better IDE support, type safety with TypeScript, npm ecosystem
3. **Performance**: Node.js handles concurrent connections better (event loop vs PHP-FPM processes)
4. **Real-time Features**: WebSockets, Server-Sent Events easier in Node.js
5. **Cloud-Native**: Better Docker/Kubernetes support, serverless options (Lambda, Vercel)
6. **Talent Pool**: Easier to hire JavaScript/TypeScript developers
7. **Modern Frameworks**: Next.js, NestJS offer better DX than older PHP frameworks

**When NOT to Migrate**:
- Existing PHP codebase is well-maintained and performant
- Team has strong PHP expertise
- No significant pain points with current stack
- Migration cost outweighs benefits

---

### Migration Challenges (What Interviewers Ask About)

| Challenge | PHP → Node.js Context | Your Answer |
|-----------|----------------------|-------------|
| **Type Safety** | PHP types are optional/runtime, TS types are compile-time | "Migrated from dynamic typing (PHP) to static typing (TypeScript) improved IDE support and caught bugs at compile-time. Added strict null checks." |
| **ORM Differences** | Eloquent (Active Record) vs Prisma (Data Mapper) | "Eloquent models include business logic and DB access together. Prisma separates concerns - models are types, queries are explicit. Required refactoring but improved testability." |
| **Async/Await** | PHP has Promises now but less common | "PHP code is mostly synchronous. Node.js requires understanding async patterns. Updated all database calls to use async/await. Added proper error handling with try/catch." |
| **Middleware** | Laravel middleware vs Express/Next.js middleware | "Laravel middleware is route-based and powerful. Next.js middleware is edge-based. Recreated auth, CORS, and logging middleware with similar functionality." |
| **Testing** | PHPUnit vs Jest | "PHPUnit and Jest have similar syntax. Main difference: Jest has better mocking for async code. Rewrote tests but kept same test cases and coverage goals." |
| **Deployment** | PHP-FPM + Nginx vs Node.js + PM2 | "PHP requires separate web server (Nginx/Apache) + PHP-FPM. Node.js is self-contained. Simplified deployment with Docker but needed process manager (PM2) for production." |
| **Database Connections** | PHP creates new connection per request, Node.js uses connection pool | "PHP-FPM creates new DB connection per request (fine for short-lived requests). Node.js requires connection pooling to avoid exhaustion. Configured Prisma pool settings." |

---

### Architecture Decision Framework

**How to Approach Migration Discussions**:

1. **Assess Current State**
   - What pain points exist?
   - What works well?
   - What's the business value of migration?

2. **Define Success Criteria**
   - Performance targets
   - Developer experience improvements
   - Cost savings (infrastructure, maintenance)
   - Timeline constraints

3. **Choose Migration Strategy**
   - Strangler Pattern (gradual replacement)
   - Big Bang (all at once)
   - Parallel Run (run both, switch over)

4. **Plan for Risks**
   - Data migration risks
   - API contract changes
   - Performance regressions
   - Team knowledge gaps

5. **Measure Results**
   - Compare metrics before/after
   - Developer satisfaction surveys
   - Bug rates, deployment frequency

---

## 4.2 Interview Questions & Answers

### Question 1: "Have you migrated from one tech stack to another?"

**Your Answer** (referencing this project):
> "Yes, I worked on migrating an expense tracking application through two phases. First, I migrated from browser localStorage to MySQL using Prisma ORM. This involved creating a REST API layer, updating the data access patterns from synchronous to asynchronous, and ensuring zero data loss during migration.
>
> Then I explored rewriting the backend from TypeScript/Next.js to PHP/Laravel to understand the reverse pattern. This taught me about ORM differences (Eloquent vs Prisma), async patterns in Node vs PHP, and API contract design. The key learning was maintaining API contracts during migration - the React frontend didn't need changes because the API surface stayed the same."

### Question 2: "What challenges did you face with async/await migration?"

**Your Answer**:
> "The main challenge was that localStorage operations are synchronous, but database operations are async. I had to update all React components to handle promises - adding `async` to handlers, using `await` for storage calls, and adding loading states.
>
> I also had to handle error cases properly - localStorage fails silently, but database calls can fail due to network issues, validation errors, etc. I added try/catch blocks and user-friendly error messages.
>
> Another challenge was testing async code - I learned to use Jest's async testing patterns and mocked the API layer for unit tests."

### Question 3: "How did you ensure data integrity during migration?"

**Your Answer**:
> "I used several strategies:
> 1. **Database transactions** - All related updates (like renaming a category and updating expenses) happened atomically using Prisma transactions.
> 2. **Validation** - Added schema validation at the API layer to catch invalid data before it reached the database.
> 3. **Migration tool** - Built a tool to export localStorage data and import to MySQL, with a dry-run mode to verify before committing.
> 4. **Backups** - Implemented automated database backups with point-in-time recovery.
> 5. **Testing** - Wrote integration tests to verify CRUD operations maintained data consistency."

### Question 4: "Why choose Prisma over Eloquent or raw SQL?"

**Your Answer**:
> "I chose Prisma for the TypeScript version because:
> - **Type Safety**: Prisma generates TypeScript types from the schema, giving compile-time errors for invalid queries.
> - **Migration Management**: Built-in migration tool tracks schema changes over time.
> - **Developer Experience**: Intuitive query API with great autocomplete.
>
> For the Laravel version, I used Eloquent because it's the standard Laravel ORM and provides similar benefits within the PHP ecosystem. Eloquent uses Active Record pattern (models include DB logic), while Prisma uses Data Mapper (separation of concerns). Both are valid approaches depending on the language and team preferences."

### Question 5: "How would you convince a team to migrate from PHP to Node.js?"

**Your Answer**:
> "I'd start by identifying actual pain points, not just 'new tech is better.' Valid reasons include:
> - **JavaScript Everywhere**: If the frontend is React/Vue, using TypeScript on backend reduces context switching.
> - **Real-time Features**: If we need WebSockets or SSE, Node.js handles this better than PHP.
> - **Modern Tooling**: If the PHP codebase is old (PHP 5.x, no type hints), modern TypeScript offers better DX.
> - **Cloud-Native**: If we're moving to serverless or Kubernetes, Node.js has better ecosystem support.
>
> However, I'd also present the costs:
> - **Rewrite Time**: Typically 6-12 months for a medium-sized app.
> - **Training**: Team needs to learn Node.js, async patterns, TypeScript.
> - **Risk**: Bugs introduced during rewrite.
>
> I'd recommend starting with a proof-of-concept on one service or feature, measuring results, then deciding on full migration."

### Question 6: "What metrics would you track during migration?"

**Your Answer**:
> "I'd track both technical and business metrics:
>
> **Technical Metrics**:
> - API response times (p50, p95, p99)
> - Error rates
> - Database query performance
> - Test coverage
> - Deployment frequency
> - Mean time to recovery (MTTR)
>
> **Business Metrics**:
> - User-facing performance (Lighthouse scores, Core Web Vitals)
> - Bug reports (before vs after)
> - Development velocity (story points per sprint)
> - Developer satisfaction (survey)
>
> **Migration-Specific**:
> - Percentage of endpoints migrated
> - Feature parity checklist
> - Data consistency checks
>
> I'd set up dashboards to track these in real-time and have rollback criteria (e.g., if error rate increases 10%, rollback)."

---

## 4.3 Red Flags to Avoid

**Don't Say**:
- ❌ "PHP is old and bad, Node.js is modern and good" (oversimplification)
- ❌ "We should migrate just because it's trending" (no business case)
- ❌ "The migration will be easy and fast" (underestimates complexity)
- ❌ "We'll improve things while migrating" (scope creep)
- ❌ "No need for testing, it's a straightforward rewrite" (risky)

**Do Say**:
- ✅ "Both PHP and Node.js are mature technologies with tradeoffs"
- ✅ "Migration should be driven by business needs and pain points"
- ✅ "I'd estimate X weeks with Y people, plus 20% buffer for unknowns"
- ✅ "Focus on feature parity first, improvements in Phase 2"
- ✅ "Comprehensive testing is critical - I'd aim for 80%+ coverage"

---

## 4.4 Whiteboard Exercise: Design a Migration Plan

**Interviewer Prompt**:
> "We have a PHP monolith with 500k lines of code. How would you migrate to a Node.js microservices architecture?"

**Your Approach** (whiteboard this):

```
Step 1: Assessment (Weeks 1-2)
┌─────────────────────────────────────┐
│ Current State Analysis               │
│ - Map dependencies                   │
│ - Identify bounded contexts          │
│ - Find high-value, low-risk targets │
│ - Interview developers               │
└─────────────────────────────────────┘

Step 2: Proof of Concept (Weeks 3-6)
┌─────────────────────────────────────┐
│ Pilot Service Migration              │
│ - Choose one service (e.g., Reports)│
│ - Build in Node.js + TypeScript     │
│ - Measure: perf, bugs, dev time     │
│ - Get team feedback                 │
└─────────────────────────────────────┘

Step 3: Strategy Decision (Week 7)
┌─────────────────────────────────────┐
│ Based on POC results, choose:        │
│                                     │
│ Option A: Strangler Pattern         │
│   - Gradual replacement             │
│   - Route new features to Node.js   │
│   - Lower risk, slower timeline     │
│                                     │
│ Option B: Service-by-Service        │
│   - Extract services one by one     │
│   - Medium risk, medium timeline    │
│                                     │
│ Option C: Keep PHP                  │
│   - If POC shows no benefit         │
└─────────────────────────────────────┘

Step 4: Execution (Months 3-18)
┌─────────────────────────────────────┐
│ If proceeding:                       │
│ - Migrate 1 service per sprint      │
│ - Maintain PHP during transition    │
│ - Use API gateway for routing       │
│ - Parallel testing (shadow mode)    │
│ - Gradual traffic shift (10%→100%) │
└─────────────────────────────────────┘

Step 5: Decommissioning (Months 18-24)
┌─────────────────────────────────────┐
│ - Remove PHP services               │
│ - Consolidate infrastructure        │
│ - Document architecture             │
│ - Celebrate! 🎉                     │
└─────────────────────────────────────┘
```

**Key Points to Emphasize**:
- Start small (proof of concept)
- Measure results (data-driven decisions)
- Plan for coexistence (PHP + Node.js running together)
- Risk mitigation (gradual rollout, rollback plans)
- Team buy-in (involve developers early)

---

## 4.5 Additional Resources for Research

### Books
- **"Refactoring: Improving the Design of Existing Code"** by Martin Fowler (migration patterns)
- **"Working Effectively with Legacy Code"** by Michael Feathers (dealing with old codebases)
- **"The Phoenix Project"** by Gene Kim (DevOps and migrations)

### Articles/Guides
- **Strangler Fig Pattern** (Martin Fowler) - Gradual migration strategy
- **Blue-Green Deployment** - Zero-downtime deployments
- **Database Migration Best Practices** (by Prisma, Laravel docs)
- **TypeScript Handbook** - PHP to TS mental model

### Open Source Examples
- **Modernizing Legacy Applications** (GitHub topics)
- **Laravel to NestJS migrations** (search GitHub)
- **PHP to TypeScript migration stories** (dev.to, Medium)

---

## 4.6 Sample Interview Coding Exercise

**Prompt**:
> "Convert this PHP Eloquent query to a Prisma query"

**PHP (Laravel)**:
```php
$expenses = Expense::where('category', 'Food')
    ->whereBetween('date', ['2025-01-01', '2025-12-31'])
    ->orderBy('amount', 'desc')
    ->limit(10)
    ->get();

$total = $expenses->sum('amount');
```

**Your Answer (Prisma/TypeScript)**:
```typescript
const expenses = await prisma.expense.findMany({
  where: {
    category: 'Food',
    date: {
      gte: new Date('2025-01-01'),
      lte: new Date('2025-12-31'),
    },
  },
  orderBy: {
    amount: 'desc',
  },
  take: 10,
});

const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
```

**Key Differences to Explain**:
- Eloquent uses `where()` chaining, Prisma uses nested objects
- Eloquent has `sum()` helper, Prisma requires manual reduce
- Eloquent returns Collection, Prisma returns plain array
- Both are type-safe (Eloquent with PHP 8, Prisma with TS)

---

# Conclusion

This migration plan covers:

1. ✅ **MySQL Migration** - Complete implementation with Prisma, API routes, and testing
2. ✅ **PHP8 Rewrite Options** - Laravel, Symfony, Vanilla PHP with detailed pros/cons
3. ✅ **Execution Strategy** - Sequential, Big Bang, and Hybrid approaches
4. ✅ **Interview Prep** - Key talking points, questions, and coding exercises

## Next Steps for You

1. **Research Phase** (1-2 days)
   - Read Laravel documentation (focus on Controllers, Eloquent, Validation)
   - Watch "Laravel for Beginners" tutorial
   - Compare Eloquent vs Prisma query examples
   - Read about Strangler Pattern for migrations

2. **Hands-on Practice** (3-5 days)
   - Install Laravel and create sample API
   - Migrate one endpoint (e.g., `/api/expenses`) from this project
   - Write tests with PHPUnit
   - Compare performance (Node.js vs PHP)

3. **Interview Prep** (2-3 days)
   - Practice explaining migration decisions
   - Whiteboard a migration plan
   - Prepare questions about their PHP codebase
   - Review common migration pitfalls

## Final Thoughts

Both MySQL and PHP migrations are **valuable exercises** for understanding:
- API design and contracts
- ORM differences and patterns
- Async vs sync programming models
- Migration strategies and risk management
- Testing methodologies across stacks

**For your interview**, focus on demonstrating:
- **Critical thinking** (why migrate? what are tradeoffs?)
- **Risk awareness** (what could go wrong? how to mitigate?)
- **Practical experience** (even if from this project, it's real experience!)
- **Adaptability** (can learn new stacks quickly)

Good luck with your interview! 🚀

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude Code (AI Assistant)
**Purpose**: Research and interview preparation
