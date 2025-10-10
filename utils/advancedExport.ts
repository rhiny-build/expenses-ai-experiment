import { Expense } from '@/types/expense';
import { formatCurrency } from './expenseUtils';

export type ExportFormat = 'csv' | 'json' | 'pdf';

/**
 * Export expenses to CSV format
 */
export const exportToCSV = (expenses: Expense[], filename: string): void => {
  const headers = ['Date', 'Category', 'Amount', 'Description', 'ID', 'Created At'];
  const rows = expenses.map(exp => [
    exp.date,
    exp.category,
    exp.amount.toString(),
    `"${exp.description.replace(/"/g, '""')}"`, // Escape quotes
    exp.id,
    exp.createdAt,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Export expenses to JSON format
 */
export const exportToJSON = (expenses: Expense[], filename: string): void => {
  const jsonData = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    expenses: expenses.map(exp => ({
      id: exp.id,
      date: exp.date,
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      createdAt: exp.createdAt,
    })),
  };

  const jsonContent = JSON.stringify(jsonData, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
};

/**
 * Export expenses to PDF format
 * This creates a simple PDF using HTML canvas rendering
 */
export const exportToPDF = (expenses: Expense[], filename: string): void => {
  // Create a printable HTML structure
  const htmlContent = generatePDFHTML(expenses);

  // Create an invisible iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create PDF');
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for content to load, then trigger print
  setTimeout(() => {
    iframe.contentWindow?.print();

    // Clean up after print dialog closes
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};

/**
 * Generate HTML content for PDF export
 */
const generatePDFHTML = (expenses: Expense[]): string => {
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const exportDate = new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const categoryBreakdown: Record<string, number> = {};
  expenses.forEach(exp => {
    categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Expense Report</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #4F46E5;
          font-size: 32px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #F3F4F6;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
        }
        .summary-card p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #4F46E5;
        }
        .category-breakdown {
          margin-bottom: 30px;
        }
        .category-breakdown h2 {
          color: #4F46E5;
          margin-bottom: 15px;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: #F9FAFB;
          margin-bottom: 5px;
          border-radius: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #4F46E5;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #E5E7EB;
        }
        tr:nth-child(even) {
          background: #F9FAFB;
        }
        .amount {
          text-align: right;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #999;
          font-size: 12px;
          border-top: 1px solid #E5E7EB;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Expense Report</h1>
        <p>Generated on ${exportDate}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Expenses</h3>
          <p>${expenses.length}</p>
        </div>
        <div class="summary-card">
          <h3>Total Amount</h3>
          <p>${formatCurrency(totalAmount)}</p>
        </div>
        <div class="summary-card">
          <h3>Date Range</h3>
          <p style="font-size: 14px;">
            ${expenses.length > 0
              ? `${new Date(expenses[expenses.length - 1].date).toLocaleDateString('en-GB')} - ${new Date(expenses[0].date).toLocaleDateString('en-GB')}`
              : 'N/A'
            }
          </p>
        </div>
      </div>

      <div class="category-breakdown">
        <h2>Category Breakdown</h2>
        ${Object.entries(categoryBreakdown)
          .sort((a, b) => b[1] - a[1])
          .map(([category, amount]) => `
            <div class="category-item">
              <span><strong>${category}</strong></span>
              <span>${formatCurrency(amount)}</span>
            </div>
          `).join('')}
      </div>

      <h2 style="color: #4F46E5; margin-bottom: 10px;">Detailed Expenses</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(exp => `
            <tr>
              <td>${new Date(exp.date).toLocaleDateString('en-GB')}</td>
              <td>${exp.category}</td>
              <td>${exp.description}</td>
              <td class="amount">${formatCurrency(exp.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated automatically by the Expense Tracker application.</p>
        <p>Total of ${expenses.length} expense record(s) | Total amount: ${formatCurrency(totalAmount)}</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Helper function to download a file
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Main export function that handles all formats
 */
export const exportExpenses = (
  expenses: Expense[],
  format: ExportFormat,
  filename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      switch (format) {
        case 'csv':
          exportToCSV(expenses, filename);
          break;
        case 'json':
          exportToJSON(expenses, filename);
          break;
        case 'pdf':
          exportToPDF(expenses, filename);
          break;
        default:
          reject(new Error(`Unsupported format: ${format}`));
          return;
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
