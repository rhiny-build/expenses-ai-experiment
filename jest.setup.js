/**
 * Jest Setup File
 *
 * This file runs once before all tests execute.
 * It configures the testing environment and imports necessary utilities.
 *
 * For developers coming from Java/C#:
 * - This is similar to a @BeforeClass or [AssemblyInitialize] setup method
 * - It configures global test utilities that all tests can use
 * - @testing-library/jest-dom adds custom matchers like .toBeInTheDocument()
 */

// Import custom Jest matchers from React Testing Library
// These provide helpful assertions like:
// - expect(element).toBeInTheDocument()
// - expect(element).toHaveTextContent('text')
// - expect(element).toBeVisible()
import '@testing-library/jest-dom'

// Mock localStorage for testing
// localStorage is a browser API that may not be available in the test environment
// This creates a simple mock implementation
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// Make localStorage available globally in all tests
global.localStorage = localStorageMock

// Mock window.matchMedia (used by some UI libraries for responsive behavior)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock URL.createObjectURL and URL.revokeObjectURL
// These are browser APIs used for file downloads
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()
