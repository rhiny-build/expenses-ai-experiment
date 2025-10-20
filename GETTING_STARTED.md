# Getting Started Guide

Welcome to the Expense Tracker application! This guide will help you set up your development environment and start working with the codebase.

## For Developers Coming from Java/C#

If you're familiar with Java or C# development, here's what you need to know:

- **Node.js** is like the JVM or .NET Runtime - it runs JavaScript code
- **npm** is like Maven/Gradle or NuGet - it manages dependencies
- **package.json** is like pom.xml or .csproj - it defines project metadata and dependencies
- **TypeScript** adds static typing to JavaScript, similar to how C# adds typing to C

## Prerequisites

Before you begin, make sure you have the following installed:

### Required Software

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Includes npm (Node Package Manager)
   - Verify installation:
     ```bash
     node --version  # Should show v18.x.x or higher
     npm --version   # Should show 9.x.x or higher
     ```

2. **Git** (for version control)
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation:
     ```bash
     git --version
     ```

### Recommended Tools

1. **Visual Studio Code** (VS Code)
   - Free, powerful code editor optimized for web development
   - Download from [code.visualstudio.com](https://code.visualstudio.com/)

2. **VS Code Extensions** (install from Extensions panel in VS Code):
   - **ES7+ React/Redux/React-Native snippets**: Code snippets for React
   - **Tailwind CSS IntelliSense**: Autocomplete for Tailwind classes
   - **TypeScript Error Translator**: Better error messages
   - **ESLint**: Code linting
   - **Prettier**: Code formatting
   - **Jest**: Test runner integration

3. **Chrome or Firefox** with React DevTools extension
   - [React Developer Tools](https://react.dev/learn/react-developer-tools)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd expense-tracker-ai
```

### 2. Install Dependencies

This downloads all required packages (defined in `package.json`):

```bash
npm install
```

**What this does:**
- Reads `package.json` to see what packages are needed
- Downloads packages from npm registry to `node_modules/` folder
- Creates `package-lock.json` to lock dependency versions
- Similar to `mvn install` or `dotnet restore`

**If you see warnings:**
- Deprecation warnings are usually OK to ignore
- Audit warnings can usually be ignored for now
- If install fails, try deleting `node_modules/` and `package-lock.json` and running again

### 3. Start the Development Server

```bash
npm run dev
```

**What this does:**
- Starts Next.js development server
- Watches files for changes and auto-reloads
- Compiles TypeScript to JavaScript
- Serves app at http://localhost:3000

**You should see:**
```
- Local:        http://localhost:3000
- ready in 2.3s
```

### 4. Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the Expense Tracker interface!

## Project Commands

All commands are defined in `package.json` under the `scripts` section.

### Development

```bash
# Start development server (with hot-reload)
npm run dev

# The dev server will:
# - Compile TypeScript to JavaScript
# - Watch for file changes
# - Auto-reload browser on changes
# - Show errors in terminal and browser
```

### Building for Production

```bash
# Create optimized production build
npm run build

# This will:
# - Compile TypeScript
# - Optimize and minify code
# - Check for type errors
# - Generate static files in .next/ folder
```

```bash
# Run production build locally
npm run start

# Must run `npm run build` first
# Serves optimized version at http://localhost:3000
```

### Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

See [TESTING.md](./TESTING.md) for detailed testing guide.

### Linting

```bash
# Check code for issues
npm run lint

# This uses ESLint to check for:
# - Syntax errors
# - Potential bugs
# - Code style issues
# - React best practices
```

## Development Workflow

### Typical Development Session

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Install any new dependencies**
   ```bash
   npm install
   ```

3. **Start dev server**
   ```bash
   npm run dev
   ```

4. **Make your changes**
   - Edit files in your code editor
   - Browser auto-reloads to show changes
   - Check console for errors

5. **Run tests**
   ```bash
   npm test
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

### Hot Reload

The development server supports "hot reload":
- Save a file → Browser automatically refreshes
- No need to manually restart server
- Component state is preserved when possible

**If hot reload isn't working:**
- Check terminal for errors
- Try refreshing browser manually (F5)
- Restart dev server (Ctrl+C, then `npm run dev`)

## Understanding the Codebase

### File Organization

```
expense-tracker-ai/
├── app/                # Next.js pages and routes
│   ├── page.tsx        # Main application (homepage)
│   ├── layout.tsx      # HTML wrapper for all pages
│   └── api/            # Server-side API endpoints
│
├── components/         # React UI components
│   ├── Dashboard.tsx
│   ├── ExpenseForm.tsx
│   └── ...
│
├── lib/                # Core services
│   └── storage.ts      # localStorage service
│
├── types/              # TypeScript type definitions
│   └── expense.ts
│
├── utils/              # Utility functions
│   └── expenseUtils.ts
│
└── __tests__/          # Test files
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture explanation.

### Where to Start Exploring

**For your first code tour:**

1. **Start with types**: `types/expense.ts`
   - Defines data structures
   - Heavily documented for learning

2. **Understand data flow**: `lib/storage.ts`
   - Simple localStorage wrapper
   - Shows how data is persisted

3. **Check utilities**: `utils/expenseUtils.ts`
   - Pure functions with business logic
   - Good examples of functional programming

4. **Explore components**: Start with `components/Dashboard.tsx`
   - Simple display component
   - Shows props and JSX basics

5. **Main app**: `app/page.tsx`
   - Ties everything together
   - Shows state management

### Quick Navigation Tips

**In VS Code:**
- `Cmd/Ctrl + P`: Quick file open
- `Cmd/Ctrl + Click`: Go to definition
- `F12`: Go to definition (same as above)
- `Shift + F12`: Find all references
- `Cmd/Ctrl + F`: Find in file
- `Cmd/Ctrl + Shift + F`: Find in all files

## Common Tasks

### Adding a New Component

1. Create new file in `components/` folder:
   ```typescript
   // components/MyComponent.tsx
   export default function MyComponent() {
     return (
       <div>
         My Component Content
       </div>
     );
   }
   ```

2. Import and use it:
   ```typescript
   import MyComponent from '@/components/MyComponent';

   // In another component:
   <MyComponent />
   ```

### Adding a Utility Function

1. Add function to appropriate utils file:
   ```typescript
   // utils/expenseUtils.ts
   export const myUtilFunction = (input: string): string => {
     return input.toUpperCase();
   };
   ```

2. Write tests for it:
   ```typescript
   // utils/__tests__/expenseUtils.test.ts
   test('myUtilFunction should uppercase string', () => {
     expect(myUtilFunction('hello')).toBe('HELLO');
   });
   ```

3. Use it in components:
   ```typescript
   import { myUtilFunction } from '@/utils/expenseUtils';
   ```

### Modifying Expense Data Structure

1. Update type definition:
   ```typescript
   // types/expense.ts
   export interface Expense {
     id: string;
     date: string;
     amount: number;
     category: ExpenseCategory;
     description: string;
     createdAt: string;
     newField: string;  // Add new field
   }
   ```

2. TypeScript will show errors everywhere the type is used
3. Fix each error by adding the new field
4. Update tests to include new field

This is the advantage of TypeScript - it catches breaking changes!

## Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Find and kill process using port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found Errors

If you see "Cannot find module...":

```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

VS Code might show TypeScript errors that aren't real:

```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd/Ctrl + Shift + P)
# Type: "TypeScript: Restart TS Server"
```

### Build Errors

If build fails:

```bash
# Clear Next.js cache
rm -rf .next

# Re-build
npm run build
```

### Tests Failing

If tests fail unexpectedly:

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests again
npm test
```

## Learning Resources

### JavaScript/TypeScript Fundamentals

- **JavaScript.info**: https://javascript.info/
  - Comprehensive JavaScript tutorial
  - Start with "The JavaScript language" section

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
  - Official TypeScript documentation
  - Good for Java/C# developers (similar concepts)

### React Basics

- **React Official Tutorial**: https://react.dev/learn
  - Start with "Your First Component"
  - Interactive code examples

- **React Hooks**: https://react.dev/reference/react
  - Learn useState, useEffect, etc.
  - Essential for understanding modern React

### Next.js

- **Next.js Learn Course**: https://nextjs.org/learn
  - Step-by-step tutorial
  - Takes about 2 hours

### Tailwind CSS

- **Tailwind Documentation**: https://tailwindcss.com/docs
  - Browse utility classes
  - See examples

### Key Concepts for Java/C# Developers

1. **JavaScript is not Java**
   - Dynamic typing (unless using TypeScript)
   - Functions are first-class citizens
   - Prototype-based, not class-based (though classes exist)
   - Asynchronous by default

2. **React's Component Model**
   - Components are functions that return UI
   - Props are like constructor parameters (immutable)
   - State is like instance variables (but immutable)
   - No inheritance - use composition instead

3. **Functional Programming**
   - JavaScript/React heavily use FP concepts
   - Pure functions, immutability, higher-order functions
   - Array methods: `map`, `filter`, `reduce`

4. **Asynchronous Programming**
   - Callbacks, Promises, async/await
   - Similar to Task/await in C# or CompletableFuture in Java
   - Single-threaded event loop (not multi-threaded)

## Common Development Patterns

### Reading Component Code

```typescript
// 1. Imports
import { useState } from 'react';
import { Expense } from '@/types/expense';

// 2. Props interface (like method parameters)
interface MyComponentProps {
  expenses: Expense[];
  onUpdate: (expense: Expense) => void;
}

// 3. Component function
export default function MyComponent({ expenses, onUpdate }: MyComponentProps) {
  // 4. State (data that can change)
  const [filter, setFilter] = useState('');

  // 5. Event handlers (like event listeners)
  const handleClick = () => {
    console.log('Clicked!');
  };

  // 6. Computed values (derived from props/state)
  const filteredExpenses = expenses.filter(exp =>
    exp.description.includes(filter)
  );

  // 7. Return JSX (UI definition)
  return (
    <div onClick={handleClick}>
      {filteredExpenses.map(exp => (
        <div key={exp.id}>{exp.description}</div>
      ))}
    </div>
  );
}
```

### Making API Calls (for future use)

```typescript
// Using fetch (built-in) - similar to HttpClient in C#
const response = await fetch('/api/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

const result = await response.json();
```

## Getting Help

### In-Code Documentation

- All types have JSDoc comments: `types/expense.ts`
- Storage service is documented: `lib/storage.ts`
- Test files have learning comments: `utils/__tests__/`

### Architecture Questions

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- Comments explain "why", not just "what"

### Testing Questions

- See [TESTING.md](./TESTING.md) for testing guide
- Look at existing tests for examples

### Debugging

1. **Use console.log()**
   - Quick way to inspect values
   - Shows in browser console (F12)

2. **React DevTools**
   - Browser extension for inspecting React components
   - See component tree, props, state

3. **VS Code Debugger**
   - Set breakpoints in code
   - Step through execution like in Java/C# IDEs

4. **Network Tab**
   - Open browser DevTools (F12)
   - Network tab shows all HTTP requests

## Next Steps

Now that you're set up:

1. **Run the app** (`npm run dev`)
2. **Explore the UI** - add some expenses, try filters, export data
3. **Read [ARCHITECTURE.md](./ARCHITECTURE.md)** - understand how it works
4. **Look at code** - start with `types/expense.ts`, then `lib/storage.ts`
5. **Run tests** (`npm test`) - see how testing works
6. **Make a small change** - e.g., add a new expense category
7. **Read inline comments** - code is documented for learning

## Welcome to React Development!

The learning curve can feel steep coming from Java/C#, but many concepts transfer:
- **Components** = Classes that render UI
- **Props** = Constructor parameters
- **State** = Instance variables
- **Hooks** = Lifecycle methods

The main difference is React's functional and declarative style. Instead of imperatively manipulating the DOM, you describe what the UI should look like, and React handles the updates.

Happy coding!
