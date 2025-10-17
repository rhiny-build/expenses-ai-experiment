# CSV Upload Feature - Technical Specification

## Introduction

The CSV Upload feature enables users to import expense data from CSV files into the expense tracker application. The feature supports two CSV formats (with or without categories), integrates AI-powered categorization using OpenAI's GPT-4o, and provides an intelligent review workflow that only prompts users when manual intervention is needed.

This document provides technical implementation details for engineers working with this feature.

---

## Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│  ┌────────────────────┐         ┌──────────────────────┐           │
│  │  Import CSV Button │────────▶│  File Input Dialog   │           │
│  │   (app/page.tsx)   │         │   (HTML5 FileAPI)    │           │
│  └────────────────────┘         └──────────┬───────────┘           │
└────────────────────────────────────────────┼─────────────────────────┘
                                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CSV PARSING LAYER                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  importFromCSV() - utils/expenseUtils.ts:15                │    │
│  │                                                             │    │
│  │  • FileReader API reads file content                       │    │
│  │  • Auto-detect format from header                          │    │
│  │  • Parse CSV with quote handling                           │    │
│  │  • Validate date/amount/description                        │    │
│  │  • Return UncategorizedExpense[]                           │    │
│  └────────────────────┬───────────────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CATEGORIZATION LOGIC                               │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  handleFileSelected() - app/page.tsx:89                   │      │
│  │                                                            │      │
│  │  Split expenses:                                          │      │
│  │  • alreadyCategorized (has category field)                │      │
│  │  • needsCategorization (no category)                      │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   ▼                                                 │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  Is API key configured?                                 │        │
│  └────┬─────YES──────────────────────────────┬─────NO─────┘        │
│       ▼                                       ▼                     │
│  ┌─────────────────────────┐       ┌──────────────────────┐        │
│  │ Call AI Categorization  │       │  Manual Review Modal │        │
│  │ POST /api/categorize    │       │  (all expenses)      │        │
│  └──────────┬──────────────┘       └──────────────────────┘        │
│             ▼                                                       │
│  ┌───────────────────────────────┐                                 │
│  │ Check Confidence Levels:      │                                 │
│  │ • High/Medium → Add directly  │                                 │
│  │ • Low → Show review modal     │                                 │
│  └───────────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI CATEGORIZATION API                            │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  POST /api/categorize - app/api/categorize/route.ts    │        │
│  │                                                         │        │
│  │  Input: { expenses: Array<{description, amount, date}> }│       │
│  │                                                         │        │
│  │  Processing:                                            │        │
│  │  • Validate API key exists                             │        │
│  │  • Construct categorization prompt                     │        │
│  │  • Call OpenAI GPT-4o (temperature: 0.3)               │        │
│  │  • Parse JSON response                                 │        │
│  │  • Assign confidence levels                            │        │
│  │                                                         │        │
│  │  Output: { categorizedExpenses: Array<{...}>}          │        │
│  └─────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REVIEW MODAL (IF NEEDED)                         │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  ImportModal - components/ImportModal.tsx              │        │
│  │                                                         │        │
│  │  • Display expenses needing review                     │        │
│  │  • Show confidence badges (high/medium/low)            │        │
│  │  • Category dropdown for each expense                  │        │
│  │  • Validate all categories selected                    │        │
│  │  • Confirm and proceed                                 │        │
│  └─────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE                                 │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  storage.addExpense() - lib/storage.ts:45              │        │
│  │                                                         │        │
│  │  • Generate unique expense IDs                         │        │
│  │  • Add createdAt timestamps                            │        │
│  │  • Write to localStorage                               │        │
│  │  • Refresh UI state                                    │        │
│  │  • Show success notification                           │        │
│  └─────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Core Implementation Files

| File Path | Purpose | Key Functions/Components |
|-----------|---------|--------------------------|
| `components/ImportModal.tsx` | Review modal UI for categorization | `ImportModal` component |
| `utils/expenseUtils.ts` | CSV parsing and validation | `importFromCSV()`, `parseCSVLine()` |
| `app/api/categorize/route.ts` | AI categorization endpoint | `POST` handler |
| `app/page.tsx` | Main import orchestration | `handleFileSelected()`, `addImportedExpenses()` |
| `types/expense.ts` | Type definitions | `ExpenseCategory`, `Expense` |
| `lib/storage.ts` | Data persistence | `addExpense()`, `getExpenses()` |

### Supporting Files

- `sample-import.csv` - Example CSV without categories
- `sample-import-with-categories.csv` - Example CSV with categories
- `IMPORT_GUIDE.md` - User-facing import documentation

---

## Implementation Details

### 1. CSV Parsing (utils/expenseUtils.ts:15)

**Function Signature:**
```typescript
export const importFromCSV = (file: File): Promise<UncategorizedExpense[]>
```

**Key Implementation Details:**

```typescript
// Format Detection
const header = lines[0];
const hasCategory = header.includes('category');

// Two supported formats:
// Format 1: Date,Amount,Description
// Format 2: Date,Category,Amount,Description
```

**CSV Line Parsing Algorithm:**
- Character-by-character iteration
- Quote state tracking for proper field extraction
- Handles escaped quotes (`""` becomes `"`)
- Splits on commas only when outside quoted fields
- Trims whitespace from all fields

**Validation Rules:**
1. **Date**: Must parse to valid JavaScript `Date` object
2. **Amount**: Must be positive number (`parseFloat() > 0`)
3. **Description**: Required (non-empty after trim)
4. **Category** (if present): Must match valid `ExpenseCategory` type

**Error Handling:**
- Invalid rows are skipped with console warnings
- Empty file or no valid rows throws error
- FileReader errors are caught and re-thrown with context

**Technical Challenges:**
- **Quoted field handling**: Commas inside quoted fields must not split the field
- **Escaped quotes**: Double quotes (`""`) inside quoted fields need unescaping
- **Date parsing**: Various date formats must be handled gracefully
- **Browser compatibility**: FileReader API is async, requires Promise wrapper

### 2. AI Categorization API (app/api/categorize/route.ts)

**Endpoint:** `POST /api/categorize`

**Request Schema:**
```typescript
{
  expenses: Array<{
    description: string;
    amount: number;
    date: string;
  }>
}
```

**Response Schema:**
```typescript
{
  categorizedExpenses: Array<{
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    confidence: 'high' | 'medium' | 'low';
  }>
}
```

**OpenAI Configuration:**
```typescript
model: "gpt-4o"
temperature: 0.3  // Low temperature for consistent categorization
```

**Prompt Engineering:**
The API constructs a prompt that:
1. Lists all valid categories with definitions
2. Provides numbered expense list with description and amount
3. Requests JSON array response with category and confidence
4. Uses examples to guide format

**Response Parsing:**
```typescript
// Strips markdown code blocks if present
cleanedContent = content.replace(/```json\n?|\n?```/g, '');

// Parses JSON and validates array length
const results = JSON.parse(cleanedContent);
if (results.length !== expenses.length) {
  // Handle partial response
}
```

**Technical Challenges:**
- **Token limits**: Large CSV files may exceed context window
- **Response formatting**: GPT may wrap JSON in markdown code blocks
- **Partial responses**: API may return fewer results than requested
- **Rate limiting**: OpenAI API rate limits need consideration for bulk imports
- **Cost management**: Each import incurs API costs

**Engineer Notes:**
- Consider implementing batch processing for large files (>50 expenses)
- Add retry logic for transient API failures
- Consider caching categorization results based on description hash
- Monitor API costs and implement usage limits if needed

### 3. Import Orchestration (app/page.tsx:89)

**Function:** `handleFileSelected()`

**Flow Control Logic:**

```typescript
// Step 1: Parse CSV
const uncategorizedExpenses = await importFromCSV(file);

// Step 2: Separate by categorization status
const needsCategorization = uncategorizedExpenses.filter(exp => !exp.category);
const alreadyCategorized = uncategorizedExpenses.filter(exp => exp.category);

// Step 3: Determine if AI categorization is available
const hasApiKey = process.env.NEXT_PUBLIC_HAS_OPENAI_KEY === 'true';

// Step 4: Decision tree
if (needsCategorization.length === 0) {
  // All categorized, add directly
  addImportedExpenses(alreadyCategorized);
} else if (hasApiKey) {
  // Call AI API
  const response = await fetch('/api/categorize', { ... });

  // Check confidence levels
  const lowConfidence = categorized.filter(exp =>
    exp.confidence === 'low' || !exp.category
  );

  if (lowConfidence.length > 0) {
    // Show review modal for low confidence items
    showImportModal(lowConfidence);
  } else {
    // Add all with high/medium confidence
    addImportedExpenses([...alreadyCategorized, ...categorized]);
  }
} else {
  // No API key, show manual categorization modal
  showImportModal(needsCategorization);
}
```

**State Management:**
```typescript
const [isImporting, setIsImporting] = useState(false);
const [importModalOpen, setImportModalOpen] = useState(false);
const [pendingExpenses, setPendingExpenses] = useState<...>([]);
const [importFileName, setImportFileName] = useState<string>();
```

**Technical Challenges:**
- **Async state updates**: Multiple state updates must be sequenced properly
- **Error boundaries**: Failed API calls need graceful degradation
- **File input reset**: Input element must be reset for re-importing same file
- **Loading states**: UI must indicate processing during async operations

### 4. Review Modal (components/ImportModal.tsx)

**Component Props:**
```typescript
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expensesNeedingCategory: Array<UncategorizedExpense & { index: number }>;
  onCategorySelected: (index: number, category: ExpenseCategory) => void;
  onConfirmAll: () => void;
  isProcessing: boolean;
  fileName?: string;
}
```

**Key Features:**
- Displays expense cards with description, amount, date, confidence badge
- Category dropdown for each expense
- Submit button disabled until all categories selected
- Color-coded confidence levels:
  - `high`: Green badge
  - `medium`: Yellow badge
  - `low`: Red badge

**Validation:**
```typescript
const allCategorized = expensesNeedingCategory.every(exp => exp.category);
// Submit button disabled if !allCategorized
```

**Technical Challenges:**
- **Controlled inputs**: Dropdown state must sync with parent component
- **Index tracking**: Each expense needs stable index for updates
- **Validation feedback**: Clear indication when submission is blocked

### 5. Data Persistence (lib/storage.ts:45)

**Function:** `addExpense(expense: Expense): void`

**Implementation:**
```typescript
const expenses = this.getExpenses(); // Read from localStorage
expenses.push(expense);
localStorage.setItem('expense_tracker_expenses', JSON.stringify(expenses));
```

**Storage Key:** `'expense_tracker_expenses'`

**Data Format:** JSON stringified array of `Expense` objects

**Expense Object Structure:**
```typescript
{
  id: string;           // Generated UUID
  date: string;         // ISO date string
  amount: number;       // Positive number
  category: ExpenseCategory;
  description: string;
  createdAt: string;    // ISO timestamp
}
```

**Technical Challenges:**
- **Concurrency**: Multiple rapid imports could conflict (localStorage is synchronous)
- **Storage limits**: localStorage has 5-10MB limit depending on browser
- **Data migration**: Schema changes require migration logic
- **Error handling**: localStorage can throw quota exceeded errors

**Engineer Notes:**
- Consider implementing storage abstraction layer for easier migration to IndexedDB
- Add storage quota checking before large imports
- Implement batch insert for performance with many expenses

---

## Configuration Requirements

### Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...           # Required for AI categorization
NEXT_PUBLIC_HAS_OPENAI_KEY=true # Client-side flag to enable AI features
```

**Note:** The feature works without API key but requires manual categorization for all expenses.

### CSV File Requirements

**Format 1: Without Categories (AI Categorization)**
```csv
Date,Amount,Description
2025-10-01,45.50,Whole Foods grocery shopping
2025-10-02,12.99,Netflix subscription
```

**Format 2: With Categories (Direct Import)**
```csv
Date,Category,Amount,Description
2025-10-01,Food,45.50,Whole Foods grocery shopping
2025-10-02,Entertainment,12.99,Netflix subscription
```

**Valid Categories:**
- Food
- Transportation
- Entertainment
- Shopping
- Bills
- Other

**Date Formats Supported:**
- ISO format: `2025-10-01`
- US format: `10/01/2025`
- Any format parseable by JavaScript `Date` constructor

---

## Error Handling Strategy

### CSV Parsing Errors
- **Invalid row format**: Skip row, log warning, continue parsing
- **Empty file**: Throw error with user-friendly message
- **No valid rows**: Throw error indicating data validation failure
- **FileReader error**: Catch and re-throw with context

### API Errors
- **No API key configured**: Skip AI categorization, show manual modal
- **API request failure**: Catch error, show manual categorization modal
- **Partial response**: Use received results, mark rest as low confidence
- **Invalid JSON response**: Log error, fallback to manual categorization

### Storage Errors
- **Quota exceeded**: Show error alert to user
- **localStorage disabled**: Graceful degradation message
- **Parse errors on read**: Clear corrupted data, log error

### User-Facing Error Messages
- "CSV file is empty or invalid"
- "No valid expenses found in CSV file"
- "Failed to parse CSV file: [details]"
- "Failed to read file"
- "Failed to save expenses. Please try again."

---

## Testing Considerations

### Unit Tests Needed
1. `parseCSVLine()` - Quote handling, edge cases
2. `importFromCSV()` - Format detection, validation
3. Category validation logic
4. Date parsing edge cases
5. Amount validation (negative, zero, invalid)

### Integration Tests Needed
1. Full import flow with valid CSV
2. Import flow with invalid rows
3. AI categorization with mock API
4. Manual categorization flow
5. Storage persistence after import

### E2E Tests Needed
1. Import CSV without categories (with API)
2. Import CSV with categories
3. Review modal interaction
4. Error handling paths
5. Large file import (performance)

### Sample Test Data
See `sample-import.csv` and `sample-import-with-categories.csv` for test fixtures.

---

## Performance Considerations

### Current Limitations
- **Large files**: No pagination or chunking for files with 100+ expenses
- **AI API**: Sequential processing, no batching for large imports
- **localStorage**: Synchronous writes can block UI thread
- **No web workers**: File parsing happens on main thread

### Optimization Opportunities
1. **Batch AI requests**: Send expenses in chunks of 50
2. **Web Workers**: Move CSV parsing off main thread
3. **IndexedDB**: Replace localStorage for better performance
4. **Streaming parser**: Process CSV incrementally for large files
5. **Caching**: Cache AI categorization results by description hash

### Recommended Limits
- **Max file size**: 1MB (~ 10,000 expenses)
- **Max expenses per import**: 500
- **AI batch size**: 50 expenses per request

---

## Security Considerations

### Input Validation
- File type validation (CSV only)
- File size limits to prevent DoS
- CSV injection prevention (formula injection in descriptions)
- XSS prevention in description fields

### API Security
- API key stored server-side only
- Rate limiting on categorization endpoint
- Input sanitization before sending to OpenAI
- Cost limits per user/session

### Data Privacy
- All data stored client-side (localStorage)
- API requests include expense descriptions (consider PII)
- No server-side storage of expense data

---

## Dependencies

### External Libraries
- `openai` - OpenAI API client
- `date-fns` - Date parsing and validation (if used)

### Browser APIs
- `FileReader` - File content reading
- `localStorage` - Data persistence
- `File` API - File object handling

### Internal Dependencies
- `types/expense.ts` - Type definitions
- `lib/storage.ts` - Storage service
- `utils/expenseUtils.ts` - CSV utilities

---

## Future Enhancement Ideas

1. **Excel Support**: Import from .xlsx files
2. **Cloud Import**: Connect to bank APIs or Google Sheets
3. **Drag & Drop**: Drag CSV files onto UI
4. **Import History**: Track previous imports
5. **Duplicate Detection**: Warn about duplicate expenses
6. **Undo Import**: Ability to revert an import
7. **Custom Categories**: Allow user-defined categories
8. **Bulk Edit**: Edit multiple imported expenses at once
9. **Import Templates**: Save and reuse CSV column mappings
10. **Progress Bar**: Show progress for large file imports

---

## Troubleshooting Guide

### Common Issues

**Issue: "No valid expenses found in CSV file"**
- **Cause**: Date or amount fields are invalid
- **Solution**: Check date format and ensure amounts are positive numbers
- **Debug**: Check browser console for specific row errors

**Issue: AI categorization not working**
- **Cause**: OPENAI_API_KEY not configured
- **Solution**: Add API key to `.env.local` and restart dev server
- **Debug**: Check `process.env.OPENAI_API_KEY` is defined in API route

**Issue: Import modal shows all expenses even with high confidence**
- **Cause**: Logic bug in confidence checking
- **Solution**: Verify confidence values are exactly 'high', 'medium', or 'low'
- **Debug**: Log `categorizedExpenses` array before filtering

**Issue: Storage quota exceeded**
- **Cause**: localStorage limit reached (5-10MB)
- **Solution**: Clear old expenses or migrate to IndexedDB
- **Debug**: Check `localStorage.getItem('expense_tracker_expenses').length`

**Issue: CSV parsing fails with quoted fields**
- **Cause**: Complex nested quotes or malformed CSV
- **Solution**: Use proper CSV escaping (double quotes for quotes)
- **Debug**: Test with `parseCSVLine()` function directly

---

## Contact & Support

For questions or issues with this feature:
1. Check `IMPORT_GUIDE.md` for user-facing documentation
2. Review sample CSV files for correct format
3. Check browser console for detailed error messages
4. Review OpenAI API logs if categorization fails

---

**Last Updated:** 2025-10-17
**Feature Version:** 1.0
**Maintained By:** Development Team
