# Testing Guide

This document explains how testing works in this React/Next.js application and how to write and run tests.

## For Developers Coming from Java/C#

If you're familiar with JUnit (Java) or NUnit/xUnit (C#), you'll find Jest very similar:

| Java/C# | JavaScript (Jest) | Purpose |
|---------|------------------|---------|
| `@Test` or `[Test]` | `test()` or `it()` | Defines a test case |
| `@Before` or `[SetUp]` | `beforeEach()` | Runs before each test |
| `@After` or `[TearDown]` | `afterEach()` | Runs after each test |
| `@BeforeClass` or `[OneTimeSetUp]` | `beforeAll()` | Runs once before all tests |
| `Assert.assertEquals()` | `expect().toBe()` | Assertions |
| `@Mock` or `Mock<T>` | `jest.fn()` | Creating mocks |
| Test class | `describe()` block | Grouping tests |

## Testing Stack

This project uses:

- **Jest**: Testing framework (like JUnit/NUnit)
- **React Testing Library**: For testing React components
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **jsdom**: Simulates browser environment in Node.js

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Project Test Structure

```
expense-tracker-ai/
├── utils/
│   ├── __tests__/              # Test files for utilities
│   │   ├── expenseUtils.test.ts
│   │   └── advancedExport.test.ts
│   ├── expenseUtils.ts
│   └── advancedExport.ts
├── jest.config.js              # Jest configuration
└── jest.setup.js               # Global test setup
```

**Convention**: Test files are placed in `__tests__` directories next to the code they test, with `.test.ts` or `.test.tsx` extension.

## Anatomy of a Test File

```typescript
/**
 * Import the code you want to test
 */
import { calculateSummary } from '../expenseUtils';
import { Expense } from '@/types/expense';

/**
 * describe() groups related tests together
 * Think of it as a test class in Java/C#
 */
describe('expenseUtils', () => {

  /**
   * Define test data that multiple tests can use
   * Similar to test fixtures in JUnit/NUnit
   */
  const mockExpenses: Expense[] = [
    {
      id: '1',
      date: '2025-10-01',
      amount: 50.00,
      category: 'Food',
      description: 'Groceries',
      createdAt: '2025-10-01T10:00:00Z',
    },
  ];

  /**
   * Nested describe() for grouping tests by function
   */
  describe('calculateSummary', () => {
    /**
     * test() defines a single test case
     * Also can use it() - they're identical
     */
    test('should calculate total spending correctly', () => {
      // Arrange: Set up test data (already done with mockExpenses)

      // Act: Execute the function being tested
      const summary = calculateSummary(mockExpenses);

      // Assert: Verify the results
      expect(summary.totalSpending).toBe(50);
    });
  });
});
```

## Writing Tests: Arrange-Act-Assert Pattern

This is the same pattern used in Java/C# testing:

```typescript
test('example test', () => {
  // Arrange: Set up test data and conditions
  const input = { amount: 100 };

  // Act: Execute the code being tested
  const result = processExpense(input);

  // Assert: Verify the outcome
  expect(result).toBe(expected);
});
```

## Common Jest Assertions (Matchers)

```typescript
// Equality
expect(value).toBe(5);                    // Strict equality (===)
expect(object).toEqual({ a: 1 });         // Deep equality for objects/arrays

// Truthiness
expect(value).toBeTruthy();               // Truthy value
expect(value).toBeFalsy();                // Falsy value
expect(value).toBeDefined();              // Not undefined
expect(value).toBeNull();                 // Null value

// Numbers
expect(value).toBeGreaterThan(3);         // value > 3
expect(value).toBeLessThan(10);           // value < 10
expect(value).toBeCloseTo(0.3);           // For floating point

// Strings
expect(text).toContain('substring');      // String contains
expect(text).toMatch(/regex/);            // Regex match

// Arrays
expect(array).toHaveLength(3);            // Array length
expect(array).toContain(item);            // Array contains item

// Exceptions
expect(() => {
  throwError();
}).toThrow();                             // Function throws
expect(() => {
  throwError();
}).toThrow('error message');              // Throws with message

// Async (Promises)
await expect(promise).resolves.toBe(value);     // Promise resolves to value
await expect(promise).rejects.toThrow();        // Promise rejects
```

## Testing React Components

When testing React components, use React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('should display text', () => {
    // Render the component
    render(<MyComponent />);

    // Query for elements (like querySelector but with better messages)
    const heading = screen.getByText(/welcome/i);

    // Assert element is in the document
    expect(heading).toBeInTheDocument();
  });

  test('should handle click events', async () => {
    const handleClick = jest.fn();  // Mock function
    render(<MyComponent onClick={handleClick} />);

    // Simulate user interaction
    const button = screen.getByRole('button');
    await userEvent.click(button);

    // Verify function was called
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Mocking

Mocking is essential for isolating code under test. Jest provides powerful mocking capabilities:

### Mock Functions

```typescript
// Create a mock function
const mockFn = jest.fn();

// Mock a function's return value
const mockFn = jest.fn().mockReturnValue(42);

// Mock different return values for consecutive calls
const mockFn = jest.fn()
  .mockReturnValueOnce(1)
  .mockReturnValueOnce(2);

// Verify function was called
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
```

### Mocking Modules

```typescript
// Mock an entire module
jest.mock('../api/client');

// Mock specific exports
jest.mock('../utils', () => ({
  calculateTotal: jest.fn().mockReturnValue(100),
}));
```

### Spying on Methods

```typescript
// Spy on an existing method (like Mockito.spy() or Moq.Verify())
const spy = jest.spyOn(object, 'methodName');

// Verify it was called
expect(spy).toHaveBeenCalled();

// Restore original implementation
spy.mockRestore();
```

## Testing Async Code

```typescript
// Testing Promises
test('async test with promises', () => {
  return fetchData().then(data => {
    expect(data).toBe('expected');
  });
});

// Testing with async/await (cleaner!)
test('async test with async/await', async () => {
  const data = await fetchData();
  expect(data).toBe('expected');
});

// Testing rejected promises
test('should handle errors', async () => {
  await expect(fetchData()).rejects.toThrow('Error message');
});
```

## Testing Timers

When testing code that uses `setTimeout` or `setInterval`:

```typescript
test('should execute after delay', () => {
  jest.useFakeTimers();  // Replace real timers with fake ones

  const callback = jest.fn();
  setTimeout(callback, 1000);

  // Fast-forward time
  jest.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalled();

  jest.useRealTimers();  // Restore real timers
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**: Testing internal implementation details
```typescript
test('should have correct internal state', () => {
  expect(component.state.counter).toBe(5);
});
```

✅ **Good**: Testing observable behavior
```typescript
test('should display count of 5', () => {
  render(<Counter />);
  expect(screen.getByText('Count: 5')).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

❌ **Bad**
```typescript
test('test1', () => { ... });
```

✅ **Good**
```typescript
test('should calculate total spending when expenses are provided', () => { ... });
```

### 3. Keep Tests Independent

Each test should run independently and not rely on other tests:

```typescript
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
});
```

### 4. Test Edge Cases

Don't just test the happy path:

```typescript
describe('divideNumbers', () => {
  test('should divide two numbers', () => {
    expect(divideNumbers(10, 2)).toBe(5);
  });

  test('should handle division by zero', () => {
    expect(() => divideNumbers(10, 0)).toThrow('Cannot divide by zero');
  });

  test('should handle negative numbers', () => {
    expect(divideNumbers(-10, 2)).toBe(-5);
  });
});
```

### 5. Don't Test External Libraries

Focus on testing your code, not third-party libraries:

```typescript
// ❌ Don't test that React works
test('useState should update state', () => { ... });

// ✅ Test your component's behavior
test('should display updated count after button click', () => { ... });
```

## Common Testing Patterns

### Testing Error Handling

```typescript
test('should handle invalid input', () => {
  expect(() => {
    processExpense({ amount: -50 });
  }).toThrow('Amount must be positive');
});
```

### Testing with Multiple Test Cases

```typescript
const testCases = [
  { input: 'Food', expected: 'Food' },
  { input: 'FOOD', expected: 'Food' },
  { input: 'food', expected: 'Food' },
];

testCases.forEach(({ input, expected }) => {
  test(`should normalize "${input}" to "${expected}"`, () => {
    expect(normalizeCategory(input)).toBe(expected);
  });
});
```

## Debugging Tests

### Run a Single Test

```typescript
// Run only this test
test.only('should run only this test', () => {
  // ...
});

// Skip this test
test.skip('should skip this test', () => {
  // ...
});
```

### Add Debug Output

```typescript
test('debug example', () => {
  const result = myFunction();
  console.log('Result:', result);  // Will show in test output
  expect(result).toBe(expected);
});
```

### Use VS Code Debugger

1. Add a breakpoint in your test file
2. Run "Debug Jest Tests" in VS Code
3. Step through code like you would in Java/C#

## Test Coverage

View test coverage to see which code is tested:

```bash
npm run test:coverage
```

This generates a report showing:
- **% Statements**: Percentage of statements executed
- **% Branches**: Percentage of if/else branches tested
- **% Functions**: Percentage of functions called
- **% Lines**: Percentage of lines executed

Coverage reports are in `coverage/lcov-report/index.html` - open in browser for detailed view.

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

- Check existing tests in `utils/__tests__/` for examples
- Jest error messages are usually very helpful - read them carefully
- Use `console.log()` to debug test data
- Try running tests in watch mode (`npm run test:watch`) for faster feedback
