/**
 * Unit Tests for Advanced Export Functions
 *
 * This file tests the export functionality for CSV, JSON, and PDF formats
 *
 * For developers coming from Java/C#:
 * - We use jest.fn() to create mock functions (similar to Mockito.mock() or Moq)
 * - jest.spyOn() allows us to spy on existing methods (like verifying method calls)
 * - These tests focus on testing the logic, not actual file downloads
 *
 * DOM API Mocking:
 * Since exports involve browser APIs (Blob, createElement, etc.), we need to mock them
 * This is similar to mocking file system operations in unit tests
 */

import { exportToCSV, exportToJSON, exportToPDF, exportExpenses } from '../advancedExport';
import { Expense } from '@/types/expense';

describe('advancedExport', () => {
  // Sample test data
  const mockExpenses: Expense[] = [
    {
      id: '1',
      date: '2025-10-01',
      amount: 50.00,
      category: 'Food',
      description: 'Groceries with "special" items',
      createdAt: '2025-10-01T10:00:00Z',
    },
    {
      id: '2',
      date: '2025-10-15',
      amount: 30.00,
      category: 'Transportation',
      description: 'Bus ticket',
      createdAt: '2025-10-15T14:00:00Z',
    },
  ];

  // Mock DOM APIs that are used in export functions
  let createElementSpy: jest.SpyInstance;
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;

  /**
   * beforeEach runs before each test
   * Similar to @Before in JUnit or [SetUp] in NUnit
   */
  beforeEach(() => {
    // Create a mock link element for download simulation
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };

    // Create a mock iframe for PDF generation
    const mockIframe = {
      style: {},
      contentWindow: {
        document: {
          open: jest.fn(),
          write: jest.fn(),
          close: jest.fn(),
        },
        print: jest.fn(),
      },
    };

    // Mock document.createElement to return our mock elements
    createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockLink as any;
      if (tag === 'iframe') return mockIframe as any;
      return document.createElement(tag);
    });

    // Mock document.body methods
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    // Mock URL methods
    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Mock Blob constructor
    global.Blob = jest.fn().mockImplementation((content, options) => ({
      content,
      options,
      size: content[0].length,
      type: options.type,
    })) as any;
  });

  /**
   * afterEach runs after each test to clean up
   * Similar to @After in JUnit or [TearDown] in NUnit
   */
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  /**
   * Tests for exportToCSV()
   */
  describe('exportToCSV', () => {
    test('should create CSV with correct headers', () => {
      exportToCSV(mockExpenses, 'test-export');

      // Verify Blob was created with CSV content
      expect(global.Blob).toHaveBeenCalled();
      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0];

      // Check headers are present
      expect(blobContent).toContain('Date,Category,Amount,Description,ID,Created At');
    });

    test('should escape quotes in descriptions', () => {
      exportToCSV(mockExpenses, 'test-export');

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0];

      // Quote in description should be escaped as double quotes
      expect(blobContent).toContain('""special""');
    });

    test('should include all expense data', () => {
      exportToCSV(mockExpenses, 'test-export');

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0];

      // Verify all expense data is present
      expect(blobContent).toContain('2025-10-01');
      expect(blobContent).toContain('Food');
      expect(blobContent).toContain('50');
      expect(blobContent).toContain('Transportation');
      expect(blobContent).toContain('30');
    });

    test('should trigger download with correct filename', () => {
      exportToCSV(mockExpenses, 'my-expenses');

      // Verify link was created and clicked
      const mockLink = (createElementSpy as jest.Mock).mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'my-expenses.csv');
      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should use correct MIME type for CSV', () => {
      exportToCSV(mockExpenses, 'test');

      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'text/csv;charset=utf-8;' })
      );
    });
  });

  /**
   * Tests for exportToJSON()
   */
  describe('exportToJSON', () => {
    test('should create JSON with metadata', () => {
      exportToJSON(mockExpenses, 'test-export');

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      const jsonData = JSON.parse(blobContent);

      // Verify metadata fields exist
      expect(jsonData).toHaveProperty('exportedAt');
      expect(jsonData).toHaveProperty('totalRecords');
      expect(jsonData).toHaveProperty('totalAmount');
      expect(jsonData).toHaveProperty('expenses');
    });

    test('should calculate totals correctly', () => {
      exportToJSON(mockExpenses, 'test-export');

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      const jsonData = JSON.parse(blobContent);

      expect(jsonData.totalRecords).toBe(2);
      expect(jsonData.totalAmount).toBe(80); // 50 + 30
    });

    test('should include all expense fields', () => {
      exportToJSON(mockExpenses, 'test-export');

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
      const jsonData = JSON.parse(blobContent);

      const firstExpense = jsonData.expenses[0];
      expect(firstExpense).toHaveProperty('id');
      expect(firstExpense).toHaveProperty('date');
      expect(firstExpense).toHaveProperty('category');
      expect(firstExpense).toHaveProperty('amount');
      expect(firstExpense).toHaveProperty('description');
      expect(firstExpense).toHaveProperty('createdAt');
    });

    test('should format JSON with proper indentation', () => {
      exportToJSON(mockExpenses, 'test-export');

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0];

      // JSON.stringify with indent=2 creates readable output with newlines
      expect(blobContent).toContain('\n');
      expect(blobContent).toContain('  '); // 2-space indentation
    });

    test('should trigger download with correct filename', () => {
      exportToJSON(mockExpenses, 'my-data');

      const mockLink = (createElementSpy as jest.Mock).mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'my-data.json');
    });

    test('should use correct MIME type for JSON', () => {
      exportToJSON(mockExpenses, 'test');

      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'application/json;charset=utf-8;' })
      );
    });
  });

  /**
   * Tests for exportToPDF()
   */
  describe('exportToPDF', () => {
    // Use fake timers to test setTimeout behavior
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should create iframe for PDF generation', () => {
      exportToPDF(mockExpenses, 'test-export');

      // Verify iframe was created
      expect(createElementSpy).toHaveBeenCalledWith('iframe');
    });

    test('should write HTML content to iframe', () => {
      exportToPDF(mockExpenses, 'test-export');

      const mockIframe = (createElementSpy as jest.Mock).mock.results.find(
        (result) => result.value.contentWindow
      ).value;

      // Verify document methods were called
      expect(mockIframe.contentWindow.document.open).toHaveBeenCalled();
      expect(mockIframe.contentWindow.document.write).toHaveBeenCalled();
      expect(mockIframe.contentWindow.document.close).toHaveBeenCalled();

      // Verify HTML content includes expense data
      const htmlContent = mockIframe.contentWindow.document.write.mock.calls[0][0];
      expect(htmlContent).toContain('Expense Report');
      expect(htmlContent).toContain('Food');
      expect(htmlContent).toContain('Groceries');
    });

    test('should trigger print dialog after delay', () => {
      exportToPDF(mockExpenses, 'test-export');

      const mockIframe = (createElementSpy as jest.Mock).mock.results.find(
        (result) => result.value.contentWindow
      ).value;

      // Print should not be called immediately
      expect(mockIframe.contentWindow.print).not.toHaveBeenCalled();

      // Fast-forward time by 250ms
      jest.advanceTimersByTime(250);

      // Now print should be called
      expect(mockIframe.contentWindow.print).toHaveBeenCalled();
    });

    test('should include category breakdown in PDF', () => {
      exportToPDF(mockExpenses, 'test-export');

      const mockIframe = (createElementSpy as jest.Mock).mock.results.find(
        (result) => result.value.contentWindow
      ).value;

      const htmlContent = mockIframe.contentWindow.document.write.mock.calls[0][0];

      // Verify category breakdown section exists
      expect(htmlContent).toContain('Category Breakdown');
      expect(htmlContent).toContain('Food');
      expect(htmlContent).toContain('Transportation');
    });

    test('should handle cleanup after print', () => {
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');

      exportToPDF(mockExpenses, 'test-export');

      // Fast-forward past both timeouts (250ms + 1000ms)
      jest.advanceTimersByTime(1500);

      // Verify iframe was removed
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  /**
   * Tests for exportExpenses() - main export function
   */
  describe('exportExpenses', () => {
    test('should call exportToCSV for csv format', async () => {
      await exportExpenses(mockExpenses, 'csv', 'test');

      // Verify CSV blob was created
      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'text/csv;charset=utf-8;' })
      );
    });

    test('should call exportToJSON for json format', async () => {
      await exportExpenses(mockExpenses, 'json', 'test');

      // Verify JSON blob was created
      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'application/json;charset=utf-8;' })
      );
    });

    test('should call exportToPDF for pdf format', async () => {
      jest.useFakeTimers();

      await exportExpenses(mockExpenses, 'pdf', 'test');

      // Verify iframe was created (indicating PDF export)
      const iframeCreated = (createElementSpy as jest.Mock).mock.calls.some(
        call => call[0] === 'iframe'
      );
      expect(iframeCreated).toBe(true);

      jest.useRealTimers();
    });

    test('should reject with error for unsupported format', async () => {
      // TypeScript won't allow invalid format, so we cast to bypass type checking
      await expect(
        exportExpenses(mockExpenses, 'xml' as any, 'test')
      ).rejects.toThrow('Unsupported format: xml');
    });

    test('should resolve successfully for valid exports', async () => {
      // All valid formats should resolve without error
      await expect(exportExpenses(mockExpenses, 'csv', 'test')).resolves.toBeUndefined();
      await expect(exportExpenses(mockExpenses, 'json', 'test')).resolves.toBeUndefined();
    });
  });
});
