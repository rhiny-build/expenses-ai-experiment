# Expense Tracker

A modern, professional expense tracking web application built with Next.js 14, TypeScript, and Tailwind CSS, featuring AI-powered expense categorization.

## Features

- ✅ **Add Expenses**: Easily add expenses with date, amount, category, and description
- 📊 **Dashboard**: View spending summaries and key metrics at a glance
- 🔍 **Filter & Search**: Filter expenses by date range, category, and search terms
- 📈 **Analytics**: Visual charts showing spending by category and monthly trends
- ✏️ **Edit & Delete**: Manage existing expenses with full CRUD functionality
- 📤 **Import from CSV**: Import expenses with AI-powered categorization using Claude
- 📥 **Export to CSV**: Download your expense data for external analysis
- 🤖 **AI Categorization**: Automatic expense categorization with smart user prompts
- 💾 **Persistent Storage**: All data saved locally in your browser using localStorage
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode**: Sleek dark theme for comfortable viewing

## Categories

- Food
- Transportation
- Entertainment
- Shopping
- Bills
- Other

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Charts**: Recharts
- **AI**: OpenAI API (GPT-4o)
- **Date Handling**: date-fns
- **Storage**: localStorage

## Getting Started

### Prerequisites

- Node.js 18+ installed on your machine
- npm or yarn package manager

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. **(Optional)** Configure AI categorization:
   - Get your OpenAI API key from https://platform.openai.com/api-keys
   - Copy `.env.local.example` to `.env.local`
   - Add your API key to `.env.local`:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
   - Without an API key, CSV import works but requires manual categorization

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## How to Use

### Adding an Expense

1. Fill in the expense form at the top of the page
2. Select a date (defaults to today)
3. Enter the amount in dollars
4. Choose a category from the dropdown
5. Add a description
6. Click "Add Expense"

### Viewing Dashboard

The dashboard displays:
- **Total Spending**: All-time total of expenses
- **This Month**: Current month's spending
- **Top Category**: Category with highest spending
- **Total Expenses**: Count of all expenses

### Filtering Expenses

Use the filter controls above the expense list:
- **Search**: Find expenses by description or category
- **Category**: Filter by specific category or view all
- **Date Range**: Set start and end dates to view expenses within a specific period

### Editing an Expense

1. Click "Edit" on any expense in the list
2. The form will populate with the expense data
3. Make your changes
4. Click "Update Expense"

### Deleting an Expense

1. Click "Delete" on any expense in the list
2. Confirm the deletion in the popup dialog

### Importing from CSV

The expense tracker features AI-powered CSV import with smart categorization:

1. Click the **"📤 Import CSV"** button in the header
2. Select a CSV file with your expenses
3. The system automatically:
   - Parses the CSV and validates data
   - Uses OpenAI GPT-4o to categorize expenses (if API key configured)
   - Shows a review modal only for uncertain categorizations
4. Review and adjust categories if needed
5. Click "Add Expenses" to complete the import

**CSV Format Options:**

Without categories (AI will categorize):
```csv
Date,Amount,Description
2025-10-01,45.50,Whole Foods grocery shopping
2025-10-02,12.99,Netflix subscription
```

With categories (instant import):
```csv
Date,Category,Amount,Description
2025-10-01,Food,45.50,Whole Foods grocery shopping
2025-10-02,Entertainment,12.99,Netflix subscription
```

**See `IMPORT_GUIDE.md` for detailed instructions and tips.**

Sample CSV files are included:
- `sample-import.csv` - Tests AI categorization
- `sample-import-with-categories.csv` - Direct import

### Exporting Data

1. Click the "Export CSV" button in the header
2. Your browser will download a CSV file with all expenses
3. Open the file in Excel, Google Sheets, or any spreadsheet application
4. The exported file includes categories and can be re-imported

### Viewing Analytics

Scroll down to the analytics section to see:
- **Pie Chart**: Visual breakdown of spending by category
- **Bar Chart**: Monthly spending trends over the last 6 months
- **Category Details**: Detailed breakdown of spending per category

## Data Storage

All expense data is stored locally in your browser using localStorage. This means:
- ✅ Your data never leaves your computer
- ✅ No backend server or database required
- ⚠️ Data is specific to your browser - clearing browser data will remove expenses
- ⚠️ Data won't sync across different browsers or devices

## Browser Support

Works on all modern browsers that support:
- ES2017+
- localStorage API
- CSS Grid and Flexbox

Recommended browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Structure

```
expense-tracker-ai/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page with all components
│   └── globals.css         # Global styles
├── components/
│   ├── Dashboard.tsx       # Dashboard summary cards
│   ├── ExpenseCharts.tsx   # Charts and analytics
│   ├── ExpenseForm.tsx     # Form for adding/editing expenses
│   └── ExpenseList.tsx     # List with filters and actions
├── lib/
│   └── storage.ts          # localStorage utilities
├── types/
│   └── expense.ts          # TypeScript type definitions
├── utils/
│   └── expenseUtils.ts     # Helper functions
└── package.json
```

## License

MIT

## Support

For issues or questions, please open an issue on the GitHub repository.
