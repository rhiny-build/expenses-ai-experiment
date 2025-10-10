# Quick Start Guide

## 🚀 Running the Application

The application is **currently running**!

**Access it at:** http://localhost:3000

## 📋 Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## ✨ Key Features at a Glance

1. **Add Expenses** - Fill out the form at the top
2. **View Dashboard** - See your spending summary in colorful cards
3. **Filter & Search** - Use the controls above the expense list
4. **Edit/Delete** - Click buttons next to each expense
5. **View Analytics** - Scroll down to see charts
6. **Export Data** - Click "Export to CSV" button in the header

## 🎯 First Steps

1. Open http://localhost:3000 in your browser
2. Add your first expense using the form
3. Watch the dashboard and charts update automatically!

## 📊 What You'll See

- **Dashboard Cards**: Total spending, monthly spending, top category, expense count
- **Expense Form**: Add/edit expenses with validation
- **Filters**: Search, category filter, date range filter
- **Expense List**: All expenses in a sortable table
- **Charts**: Pie chart (category breakdown) and bar chart (monthly trends)
- **Category Details**: Spending breakdown by category

## 💡 Pro Tips

- All data is saved automatically in your browser
- Data persists across page refreshes
- Use date range filters to analyze specific time periods
- Export to CSV for use in Excel or Google Sheets
- Works great on both desktop and mobile!

## 📁 Project Structure

```
expense-tracker-ai/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main application page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Dashboard.tsx      # Summary cards
│   ├── ExpenseForm.tsx    # Add/edit form
│   ├── ExpenseList.tsx    # Expense table with filters
│   └── ExpenseCharts.tsx  # Analytics charts
├── lib/                   # Core utilities
│   └── storage.ts         # localStorage management
├── types/                 # TypeScript definitions
│   └── expense.ts         # Type definitions
├── utils/                 # Helper functions
│   └── expenseUtils.ts    # Business logic
└── README.md             # Full documentation
```

## 🐛 Troubleshooting

**Port 3000 already in use?**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
# Then run npm run dev again
```

**Build errors?**
```bash
# Clean install
rm -rf node_modules .next
npm install
npm run build
```

**Data disappeared?**
- Check if browser localStorage was cleared
- Data is browser-specific (won't sync between different browsers)

## 📖 Full Documentation

For detailed testing instructions, see `TESTING_GUIDE.md`
For complete documentation, see `README.md`

---

**Happy expense tracking!** 💰
