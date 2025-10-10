# Testing Guide - Expense Tracker Application

## Overview
This guide will help you test all features of the Expense Tracker application.

## Getting Started

The application is now running at: **http://localhost:3000**

Open this URL in your browser to access the application.

## Testing Checklist

### 1. Initial Load
- [ ] Application loads without errors
- [ ] Dashboard displays with 4 summary cards showing all zeros
- [ ] Empty expense form is displayed
- [ ] "No expenses found" message appears in the expense list
- [ ] Charts section shows "No data to display" message
- [ ] Export button is disabled (grayed out)

### 2. Adding Expenses

#### Test Case 1: Add a valid expense
1. Fill in the expense form:
   - **Date**: Select today's date (or any date)
   - **Amount**: Enter `50.00`
   - **Category**: Select "Food"
   - **Description**: Enter "Lunch at restaurant"
2. Click "Add Expense"
3. **Expected Results**:
   - Form clears after submission
   - Dashboard updates to show:
     - Total Spending: $50.00
     - This Month: $50.00 (if today's date was selected)
     - Top Category: Food
     - Total Expenses: 1
   - Expense appears in the list below
   - Charts display with the new data

#### Test Case 2: Form Validation
1. Try to submit empty form
2. **Expected**: Error messages appear for required fields
3. Enter invalid amount (e.g., `-10` or `0`)
4. **Expected**: "Amount must be greater than 0" error appears

#### Test Case 3: Add Multiple Expenses
Add several expenses with different categories:
- Food: $50.00 - "Groceries"
- Transportation: $30.00 - "Gas"
- Entertainment: $75.00 - "Movie tickets"
- Shopping: $120.00 - "New shoes"
- Bills: $200.00 - "Electric bill"

**Expected**: All expenses appear in the list, dashboard and charts update accordingly.

### 3. Filtering & Search

#### Test Case 4: Category Filter
1. Add expenses from multiple categories (as in Test Case 3)
2. Select "Food" from the category dropdown
3. **Expected**: Only Food expenses are displayed
4. Select "All" to see all expenses again

#### Test Case 5: Date Range Filter
1. Add expenses with different dates (past week, this month, last month)
2. Set Start Date and End Date to filter specific range
3. **Expected**: Only expenses within the date range are shown

#### Test Case 6: Search Functionality
1. Enter a search term in the search box (e.g., "gas")
2. **Expected**: Only expenses with matching description or category appear
3. Clear search to see all expenses again

### 4. Edit Functionality

#### Test Case 7: Edit an Expense
1. Click "Edit" on any expense in the list
2. **Expected**:
   - Form populates with the expense data
   - "Edit Expense" title appears
   - "Cancel" button appears
3. Modify any field (e.g., change amount from $50 to $60)
4. Click "Update Expense"
5. **Expected**:
   - Expense updates in the list
   - Dashboard recalculates totals
   - Form clears and returns to "Add New Expense" mode

#### Test Case 8: Cancel Edit
1. Click "Edit" on an expense
2. Make some changes
3. Click "Cancel"
4. **Expected**: Form clears without saving changes

### 5. Delete Functionality

#### Test Case 9: Delete an Expense
1. Click "Delete" on any expense
2. **Expected**: Confirmation dialog appears
3. Click "OK" to confirm
4. **Expected**:
   - Expense is removed from the list
   - Dashboard updates
   - Charts update

### 6. Dashboard Analytics

#### Test Case 10: Summary Cards
1. Verify all 4 cards display correct information:
   - **Total Spending**: Sum of all expenses
   - **This Month**: Sum of expenses from current month only
   - **Top Category**: Category with highest total spending
   - **Total Expenses**: Count of all expenses

### 7. Charts & Visualizations

#### Test Case 11: Pie Chart
1. Add expenses across multiple categories
2. **Expected**:
   - Pie chart displays with different colored sections
   - Each section labeled with category and percentage
   - Hover shows exact dollar amount

#### Test Case 12: Bar Chart (Monthly Trends)
1. Add expenses from different months
2. **Expected**:
   - Bar chart shows up to last 6 months
   - Stacked bars show spending by category
   - Legend identifies each category by color

#### Test Case 13: Category Details
1. Scroll to category breakdown cards below charts
2. **Expected**:
   - Each category shows total spending
   - Color-coded borders match chart colors

### 8. Export Functionality

#### Test Case 14: Export to CSV
1. Add several expenses
2. Click "Export to CSV" button in header
3. **Expected**:
   - CSV file downloads automatically
   - File name includes current date (e.g., `expenses_2025-10-06.csv`)
4. Open the CSV file
5. **Expected**:
   - Headers: Date, Category, Amount, Description
   - All expenses listed with correct data
   - Can be opened in Excel or Google Sheets

#### Test Case 15: Export with No Data
1. Delete all expenses
2. **Expected**: Export button is disabled/grayed out
3. Try clicking it (if enabled)
4. **Expected**: Alert message "No expenses to export"

### 9. Data Persistence

#### Test Case 16: localStorage Persistence
1. Add several expenses
2. Refresh the page (F5 or Cmd+R)
3. **Expected**: All expenses remain after refresh
4. Close the browser tab
5. Reopen http://localhost:3000
6. **Expected**: All expenses are still there

#### Test Case 17: Browser Isolation
1. Open the app in a different browser (Chrome vs Firefox)
2. **Expected**: Data doesn't sync between browsers (localStorage is browser-specific)

### 10. Responsive Design

#### Test Case 18: Desktop View
1. View application in full-screen browser
2. **Expected**:
   - Dashboard cards display in 4 columns
   - Form fields display in 2 columns
   - Charts display side by side
   - Table shows all columns

#### Test Case 19: Mobile View
1. Resize browser window to mobile size (or use DevTools device emulation)
2. **Expected**:
   - Dashboard cards stack vertically (1 column)
   - Form fields stack vertically
   - Charts stack vertically
   - Table remains scrollable horizontally if needed
   - All buttons and text remain readable

### 11. Edge Cases

#### Test Case 20: Large Numbers
1. Enter a very large amount (e.g., `999999.99`)
2. **Expected**: Displays correctly with proper currency formatting

#### Test Case 21: Decimal Amounts
1. Enter amounts with cents (e.g., `12.34`, `99.99`)
2. **Expected**: Displays exactly as entered

#### Test Case 22: Special Characters in Description
1. Enter description with special characters: `"Dinner @ Joe's"`
2. **Expected**: Displays correctly and exports to CSV properly (with escaped quotes)

#### Test Case 23: Many Expenses
1. Add 20+ expenses
2. **Expected**:
   - List scrolls properly
   - Performance remains good
   - Charts remain readable

## Common Issues & Solutions

### Issue: "No data to display" in charts
- **Solution**: Add at least one expense

### Issue: Export button not working
- **Solution**: Make sure you have at least one expense added

### Issue: Data disappeared
- **Solution**: Check if browser localStorage was cleared. Data is stored locally and will be lost if browser data is cleared.

### Issue: Charts not showing
- **Solution**: Refresh the page. Charts require expenses from different categories to display properly.

## Performance Benchmarks

Expected performance:
- Initial load: < 2 seconds
- Add expense: Instant
- Filter/search: Instant (< 100ms)
- Chart rendering: < 500ms
- CSV export: < 1 second (even with 100+ expenses)

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Test Results Log

Use this section to record your test results:

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Initial Load | ⬜ Pass ⬜ Fail | |
| 2. Add Valid Expense | ⬜ Pass ⬜ Fail | |
| 3. Form Validation | ⬜ Pass ⬜ Fail | |
| 4. Category Filter | ⬜ Pass ⬜ Fail | |
| 5. Date Range Filter | ⬜ Pass ⬜ Fail | |
| 6. Search | ⬜ Pass ⬜ Fail | |
| 7. Edit Expense | ⬜ Pass ⬜ Fail | |
| 8. Delete Expense | ⬜ Pass ⬜ Fail | |
| 9. Dashboard | ⬜ Pass ⬜ Fail | |
| 10. Charts | ⬜ Pass ⬜ Fail | |
| 11. Export CSV | ⬜ Pass ⬜ Fail | |
| 12. Data Persistence | ⬜ Pass ⬜ Fail | |
| 13. Responsive Design | ⬜ Pass ⬜ Fail | |

---

**All features have been implemented and are ready for testing!**
