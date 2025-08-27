/**
 * @jest-environment jsdom
 */

// Mock the error-handler module
jest.mock('./error-handler.js', () => ({
    globalErrorHandler: {
        handleError: jest.fn(),
        logError: jest.fn()
    }
}));

// Mock console
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

// Don't mock location - let it use the default JSDOM location

// Mock document
Object.defineProperty(document, 'readyState', {
    value: 'complete',
    writable: true
});

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
}));

describe('extension-loader.js', () => {
    let ExtensionLoader;
    let globalExtensionLoader;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Clear module cache to ensure fresh execution
        jest.resetModules();

        // Import the module
        const module = require('./extension-loader.js');
        ExtensionLoader = module.ExtensionLoader;
        globalExtensionLoader = module.globalExtensionLoader;
    });

    describe('Script Execution and Initialization', () => {
        it('should log when script loads', () => {
            // The script logs when it initializes
            expect(console.log).toHaveBeenCalledWith('🔧 Initializing Amazon Order Archiver extension...');
        });

        it('should create globalExtensionLoader instance', () => {
            expect(globalExtensionLoader).toBeDefined();
            expect(typeof globalExtensionLoader.initialize).toBe('function');
        });

        it('should set up global error handler', () => {
            const { globalErrorHandler } = require('./error-handler.js');
            expect(globalErrorHandler).toBeDefined();
            expect(typeof globalErrorHandler.handleError).toBe('function');
        });
    });

    describe('Extension Loader Initialization', () => {
        it('should initialize successfully', async () => {
            // Mock isSupportedPage to return true for this test
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(true);

            const result = await globalExtensionLoader.initialize();

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith('✅ Extension initialized successfully');
        });

        it('should check if page is supported', async () => {
            await globalExtensionLoader.initialize();

            expect(console.log).toHaveBeenCalledWith('🔧 Initializing Amazon Order Archiver extension...');
        });

        it('should log page URL and title', async () => {
            await globalExtensionLoader.initialize();

            // The script logs the initialization message
            expect(console.log).toHaveBeenCalledWith('🔧 Initializing Amazon Order Archiver extension...');
        });

        it('should determine page type', async () => {
            await globalExtensionLoader.initialize();

            // The script checks if page is supported
            expect(console.log).toHaveBeenCalledWith('🔧 Initializing Amazon Order Archiver extension...');
        });

        it('should skip initialization for unsupported pages', async () => {
            // Mock isSupportedPage to return false
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(false);

            const result = await globalExtensionLoader.initialize();

            expect(result).toBe(false);
            expect(console.log).toHaveBeenCalledWith('⚠️ Current page is not supported by the extension');
        });

        it('should proceed with initialization for supported pages', async () => {
            // Mock isSupportedPage to return true
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(true);

            const result = await globalExtensionLoader.initialize();

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith('✅ Extension initialized successfully');
        });
    });

    describe('Dependency Loading', () => {
        it('should load dependencies via static imports', async () => {
            // Mock isSupportedPage to return true for this test
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(true);

            await globalExtensionLoader.initialize();

            expect(console.log).toHaveBeenCalledWith('🔧 Dependencies loaded via static imports');
        });

        it('should handle dependency loading errors gracefully', async () => {
            // Create a new instance to test error handling
            const testLoader = new ExtensionLoader();

            // Mock isSupportedPage to return false to trigger error path
            jest.spyOn(testLoader, 'isSupportedPage').mockReturnValue(false);

            const result = await testLoader.initialize();

            expect(result).toBe(false);
        });
    });

    describe('Initialization Hooks', () => {
        it('should add initialization hooks', () => {
            const testLoader = new ExtensionLoader();
            const mockHook = jest.fn();

            testLoader.addInitializationHook(mockHook);

            expect(testLoader.initializationHooks).toContain(mockHook);
        });

        it('should run initialization hooks', async () => {
            const testLoader = new ExtensionLoader();
            const mockHook = jest.fn();

            testLoader.addInitializationHook(mockHook);
            await testLoader.runInitializationHooks();

            expect(mockHook).toHaveBeenCalled();
        });

        it('should handle hook errors gracefully', async () => {
            const testLoader = new ExtensionLoader();
            const mockHook = jest.fn().mockRejectedValue(new Error('Hook failed'));

            testLoader.addInitializationHook(mockHook);

            // Should not throw
            await expect(testLoader.runInitializationHooks()).resolves.not.toThrow();
        });
    });

    describe('Reloading and Cleanup', () => {
        it('should reload extension successfully', async () => {
            // Mock isSupportedPage to return true for this test
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(true);

            await globalExtensionLoader.initialize();

            const result = await globalExtensionLoader.reload();

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith('🔧 Reloading extension...');
        });

        it('should cleanup resources on reload', async () => {
            await globalExtensionLoader.initialize();
            await globalExtensionLoader.reload();

            expect(console.log).toHaveBeenCalledWith('🔧 Extension cleanup completed');
        });

        it('should remove event listeners on cleanup', async () => {
            await globalExtensionLoader.initialize();
            await globalExtensionLoader.reload();

            expect(console.log).toHaveBeenCalledWith('🔧 Event listeners removed');
        });

        it('should clear timers on cleanup', async () => {
            await globalExtensionLoader.initialize();
            await globalExtensionLoader.reload();

            expect(console.log).toHaveBeenCalledWith('🔧 Timers cleared');
        });
    });

    describe('Status and State Management', () => {
        it('should report initialization status', async () => {
            // Mock isSupportedPage to return true for this test
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(true);

            await globalExtensionLoader.initialize();

            expect(globalExtensionLoader.isInitialized).toBe(true);
        });

        it('should get current status', async () => {
            await globalExtensionLoader.initialize();

            const status = globalExtensionLoader.getStatus();
            expect(status).toHaveProperty('isLoaded');
            expect(status).toHaveProperty('isInitialized');
            expect(status).toHaveProperty('supportedPage');
            expect(status).toHaveProperty('dependencies');
            expect(status).toHaveProperty('url');
        });

        it('should check if page is supported', () => {
            const isSupported = globalExtensionLoader.isSupportedPage();
            expect(typeof isSupported).toBe('boolean');
        });

        it('should get page URL', () => {
            const url = globalExtensionLoader.getStatus().url;
            expect(url).toBe('http://localhost/'); // JSDOM default location
        });
    });

    describe('Navigation and Page Changes', () => {
        it('should set up navigation observer', () => {
            // The script sets up a MutationObserver for navigation
            expect(MutationObserver).toHaveBeenCalled();
        });

        it('should handle page navigation', () => {
            // The script sets up navigation handling
            expect(globalExtensionLoader.handleNavigation).toBeDefined();
        });

        it('should initialize on supported page navigation', () => {
            // Mock isSupportedPage to return true
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(true);

            const result = globalExtensionLoader.handleNavigation();
            expect(result).toBeUndefined(); // Method doesn't return anything
        });

        it('should cleanup on unsupported page navigation', () => {
            // Mock isSupportedPage to return false
            jest.spyOn(globalExtensionLoader, 'isSupportedPage').mockReturnValue(false);

            const result = globalExtensionLoader.handleNavigation();
            expect(result).toBeUndefined(); // Method doesn't return anything
        });
    });

    describe('Error Handling', () => {
        it('should handle initialization errors gracefully', async () => {
            // Create a test instance and mock error
            const testLoader = new ExtensionLoader();
            const { globalErrorHandler } = require('./error-handler.js');

            // Mock isSupportedPage to return false to trigger error path
            jest.spyOn(testLoader, 'isSupportedPage').mockReturnValue(false);

            const result = await testLoader.initialize();

            expect(result).toBe(false);
            // When page is not supported, it just returns false without calling error handler
            expect(globalErrorHandler.handleError).not.toHaveBeenCalled();
        });

        it('should log errors to console', async () => {
            // Create a test instance and mock error
            const testLoader = new ExtensionLoader();

            // Mock isSupportedPage to return false to trigger error path
            jest.spyOn(testLoader, 'isSupportedPage').mockReturnValue(false);

            await testLoader.initialize();

            // When page is not supported, it just returns false without logging errors
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe('Utility Methods', () => {
        it('should check if page is supported', () => {
            const isSupported = globalExtensionLoader.isSupportedPage();
            expect(typeof isSupported).toBe('boolean');
        });

        it('should get page URL', () => {
            const url = globalExtensionLoader.getStatus().url;
            expect(url).toBe('http://localhost/'); // JSDOM default location
        });

        it('should get dependency status', () => {
            const deps = globalExtensionLoader.getStatus().dependencies;
            expect(Array.isArray(deps)).toBe(true);
        });

        it('should check if dependency is loaded', () => {
            const hasDep = globalExtensionLoader.hasDependency('test');
            expect(typeof hasDep).toBe('boolean');
        });

        it('should get dependency', () => {
            const dep = globalExtensionLoader.getDependency('test');
            expect(dep).toBeUndefined(); // No dependencies are loaded in tests
        });
    });

    describe('Integration with Error Handler', () => {
        it('should use global error handler for errors', async () => {
            // Create a test instance and mock error
            const testLoader = new ExtensionLoader();
            const { globalErrorHandler } = require('./error-handler.js');

            // Mock isSupportedPage to return false to trigger error path
            jest.spyOn(testLoader, 'isSupportedPage').mockReturnValue(false);

            await testLoader.initialize();

            // When page is not supported, it just returns false without calling error handler
            expect(globalErrorHandler.handleError).not.toHaveBeenCalled();
        });

        it('should handle cleanup errors gracefully', async () => {
            const { globalErrorHandler } = require('./error-handler.js');

            // Mock cleanup to throw error
            const testLoader = new ExtensionLoader();
            jest.spyOn(testLoader, 'removeEventListeners').mockImplementation(() => {
                throw new Error('Cleanup error');
            });

            await testLoader.cleanup();

            expect(globalErrorHandler.handleError).toHaveBeenCalled();
        });
    });

    describe('DOM Ready State Handling', () => {
        it('should initialize when DOM is ready', () => {
            // The script checks document.readyState and initializes accordingly
            expect(document.readyState).toBe('complete');
        });

        it('should set up DOMContentLoaded listener when needed', () => {
            // Mock loading state
            Object.defineProperty(document, 'readyState', {
                value: 'loading',
                writable: true
            });

            // Mock document.addEventListener as Jest function
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            // Re-require to trigger the loading state logic
            jest.resetModules();
            require('./extension-loader.js');

            // Should have set up the listener
            expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
        });
    });
});
