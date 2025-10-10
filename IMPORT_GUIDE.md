# CSV Import Guide - AI-Powered Expense Categorization

## Overview

The expense tracker now features an intelligent CSV import system powered by OpenAI GPT-4o that automatically categorizes your expenses. This minimizes manual work while ensuring accurate categorization.

## How It Works

### 1. **Automatic Categorization**
When you import a CSV file, the system:
- Parses the CSV and extracts expense data
- Sends uncategorized expenses to OpenAI GPT-4o for intelligent categorization
- Returns categorized expenses with confidence levels (high, medium, low)

### 2. **Smart User Intervention**
The system only prompts you when necessary:
- **High confidence** categorizations are automatically applied
- **Medium confidence** categorizations are automatically applied
- **Low confidence** categorizations require your review
- You can review and adjust any categorization before finalizing

### 3. **Optimized Flow**
The import process is designed to minimize interruptions:
- CSV files with categories are imported instantly
- High-confidence AI categorizations are applied without user input
- Only uncertain categorizations require review
- Batch import multiple expenses at once

## CSV Format

### Option 1: Without Categories (Recommended for AI Categorization)
```csv
Date,Amount,Description
2025-10-01,45.50,Whole Foods grocery shopping
2025-10-02,12.99,Netflix subscription
2025-10-03,65.00,Shell gas station
```

**Columns:**
- `Date`: Date in YYYY-MM-DD format (or any format JavaScript can parse)
- `Amount`: Numeric amount (positive number)
- `Description`: Text description of the expense

### Option 2: With Categories (Skip AI Categorization)
```csv
Date,Category,Amount,Description
2025-10-01,Food,45.50,Whole Foods grocery shopping
2025-10-02,Entertainment,12.99,Netflix subscription
2025-10-03,Transportation,65.00,Shell gas station
```

**Columns:**
- `Date`: Date in YYYY-MM-DD format
- `Category`: Must be one of: Food, Transportation, Entertainment, Shopping, Bills, Other
- `Amount`: Numeric amount (positive number)
- `Description`: Text description of the expense

## Valid Categories

The system recognizes these categories:
- **Food**: Groceries, restaurants, cafes, food delivery
- **Transportation**: Gas, public transit, uber/taxi, parking, car maintenance
- **Entertainment**: Movies, games, concerts, streaming services, hobbies
- **Shopping**: Clothing, electronics, home goods, general retail
- **Bills**: Utilities, rent, phone, internet, insurance, subscriptions
- **Other**: Anything that doesn't clearly fit the above

## Setup Instructions

### 1. Configure OpenAI API Key

The AI categorization feature requires an OpenAI API key.

1. Get your API key from: https://platform.openai.com/api-keys
2. Open `.env.local` in the project root
3. Add your API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Restart the development server

**Without an API key:**
- Import still works, but requires manual categorization for all expenses
- You'll see a categorization modal for every import

### 2. Test the Import Feature

Sample CSV files are provided:
- `sample-import.csv` - Without categories (tests AI categorization)
- `sample-import-with-categories.csv` - With categories (direct import)

## Using the Import Feature

### Step 1: Click Import CSV
1. Open the expense tracker at http://localhost:3000
2. Click the **"📤 Import CSV"** button in the header
3. Select your CSV file

### Step 2: Automatic Processing
The system will:
- Parse your CSV file
- Validate date, amount, and description fields
- For expenses without categories:
  - Send to Claude AI for categorization
  - Receive categorizations with confidence levels

### Step 3: Review (If Needed)
If any expenses have low-confidence categorizations:
- A modal appears showing expenses needing review
- Expenses with categories show a green checkmark
- Expenses without categories show a dropdown to select
- Select the appropriate category for any uncertain expenses

### Step 4: Confirm Import
- Click **"Add [X] Expenses"** to import
- All expenses are added to your tracker
- Dashboard and charts update automatically
- You'll see a success message

## Import Behavior

### Scenario 1: CSV with Categories
**Input:** CSV with valid categories in Category column
**Result:** ✅ Direct import, no modal, instant success

### Scenario 2: CSV without Categories + API Key Configured
**Input:** CSV without categories, OpenAI API key set
**Result:**
- ✨ AI categorization runs automatically
- ⚡ High/medium confidence: Applied instantly
- ⚠️ Low confidence: Review modal appears

### Scenario 3: CSV without Categories + No API Key
**Input:** CSV without categories, no API key
**Result:** 📝 Manual categorization modal appears for all expenses

### Scenario 4: API Error
**Input:** API call fails (network issue, rate limit, etc.)
**Result:** 📝 Fallback to manual categorization modal

## Tips for Best Results

### For AI Categorization
1. **Be descriptive**: "Whole Foods grocery shopping" works better than "Shopping"
2. **Include merchant names**: "Shell gas station" is clearer than "Gas"
3. **Avoid abbreviations**: "Starbucks coffee" beats "SBUX"
4. **Be specific**: "Electric bill payment" not just "Bill"

### For Manual Categorization
1. Use consistent descriptions for similar expenses
2. Review the category explanations in the modal
3. When uncertain, choose "Other" and edit later

## Troubleshooting

### Import Button Disabled
- Check if another import is in progress
- Refresh the page if stuck

### "CSV file is empty or invalid"
- Ensure file has headers and at least one data row
- Check for proper comma separation
- Verify no empty lines at the end

### "No valid expenses found"
- Check date format (must be parseable by JavaScript)
- Ensure amounts are positive numbers
- Verify each row has required fields

### API Categorization Not Working
- Verify `.env.local` has OPENAI_API_KEY set
- Restart the development server after adding API key
- Check console for error messages
- Ensure API key is valid and has credits

### Wrong Categories Assigned
- Review and adjust in the modal before confirming
- For already imported expenses, use the Edit button
- Provide more descriptive expense descriptions

## Performance

- **Small files (< 50 expenses)**: < 3 seconds including AI categorization
- **Medium files (50-200 expenses)**: 5-10 seconds
- **Large files (200+ expenses)**: 15-30 seconds

The AI processes expenses in batches efficiently.

## Privacy & Security

- **API Key**: Never committed to git, stored in `.env.local`
- **Data Processing**: Expenses sent to OpenAI API only for categorization
- **Storage**: All data remains in your browser's localStorage
- **No Backend**: No database, no server-side storage

## Sample CSV Files

Two sample files are included:

### sample-import.csv
Tests AI categorization with common expenses without categories.

### sample-import-with-categories.csv
Tests direct import with pre-categorized expenses.

You can use these to test the import feature immediately!

## Export & Re-Import

You can export your expenses and re-import them:
1. Click **"📥 Export CSV"** to download
2. Edit in Excel/Google Sheets if needed
3. Save as CSV
4. Click **"📤 Import CSV"** to re-import

The exported format includes categories, so re-importing is instant!

---

**Enjoy effortless expense tracking with AI-powered categorization!** 🎉
