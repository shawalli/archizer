module.exports = {
    // Test environment
    testEnvironment: 'jsdom',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.js'],

    // Test file patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.js',
        '<rootDir>/src/**/*.test.js',
        '<rootDir>/src/**/*.spec.js'
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js',
        '!src/test-setup.js'
    ],

    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // Module name mapping for imports
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },

    // Transform configuration
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // Test timeout
    testTimeout: 10000,

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks between tests
    restoreMocks: true
};
