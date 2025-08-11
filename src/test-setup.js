// Test setup file for Jest
// Configures test environment for Chrome extension testing

// Mock Chrome extension APIs
global.chrome = {
    storage: {
        local: {
            get: jest.fn(() => Promise.resolve({})),
            set: jest.fn(() => Promise.resolve()),
            remove: jest.fn(() => Promise.resolve())
        }
    },
    identity: {
        getAuthToken: jest.fn()
    },
    tabs: {
        query: jest.fn()
    },
    runtime: {
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
        sendMessage: jest.fn()
    }
};

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};
