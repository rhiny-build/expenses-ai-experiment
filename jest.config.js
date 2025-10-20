/**
 * Jest Configuration for Next.js Application
 *
 * This configuration file sets up Jest to work with:
 * - TypeScript files (.ts, .tsx)
 * - Next.js specific features (App Router, path aliases)
 * - React Testing Library for component testing
 * - jsdom environment to simulate browser APIs
 *
 * For developers coming from Java/C#:
 * - Jest is similar to JUnit/NUnit - it's a testing framework
 * - jsdom simulates a browser environment (like running tests in a headless browser)
 * - Path aliases (@/*) allow importing modules using absolute paths instead of relative paths
 */

const nextJest = require('next/jest')

// Create Jest config that loads Next.js configuration
const createJestConfig = nextJest({
  // Path to your Next.js app (where next.config.ts is located)
  dir: './',
})

// Custom Jest configuration
const customJestConfig = {
  // Setup files that run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Use jsdom environment to simulate browser APIs (DOM, localStorage, etc.)
  testEnvironment: 'jest-environment-jsdom',

  // Where to look for test files
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],

  // Folders to ignore during testing
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],

  // Module path aliases (matches tsconfig.json paths)
  // This allows using @/components/... instead of ../../components/...
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Code coverage configuration (optional but useful for tracking test completeness)
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

// Export the merged configuration
module.exports = createJestConfig(customJestConfig)
