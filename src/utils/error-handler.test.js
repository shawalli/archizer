// Error Handler Utility Tests
import { ErrorHandler } from './error-handler.js';

// Mock Chrome storage API
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn()
        }
    },
    runtime: {
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
        sendMessage: jest.fn()
    }
};

global.chrome = mockChrome;

describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler({
            debug: true,
            logToConsole: true,
            logToStorage: true
        });
        jest.clearAllMocks();

        // Mock console methods
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'trace').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('handleError', () => {
        it('should create error info with all required fields', () => {
            const error = new Error('Test error');
            const context = 'test-context';
            const severity = 'warn';

            const result = errorHandler.handleError(error, context, severity);

            expect(result).toMatchObject({
                message: 'Test error',
                context: 'test-context',
                severity: 'warn',
                timestamp: expect.any(String),
                userAgent: expect.any(String),
                extensionVersion: expect.any(String)
            });
        });

        it('should handle errors without stack trace', () => {
            const error = { message: 'Simple error' };

            const result = errorHandler.handleError(error);

            expect(result.message).toBe('Simple error');
            expect(result.stack).toBeUndefined();
        });

        it('should use default values for missing parameters', () => {
            const error = new Error('Test error');

            const result = errorHandler.handleError(error);

            expect(result.context).toBe('unknown');
            expect(result.severity).toBe('error');
        });
    });

    describe('logToConsole', () => {
        it('should log errors with correct format', () => {
            const error = new Error('Test error');

            errorHandler.handleError(error, 'test', 'error');

            expect(console.error).toHaveBeenCalledWith(
                expect.stringMatching(/\[.*\] \[ERROR\] \[test\] Test error/)
            );
        });

        it('should log warnings with correct format', () => {
            const error = new Error('Test warning');

            errorHandler.handleError(error, 'test', 'warn');

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringMatching(/\[.*\] \[WARN\] \[test\] Test warning/)
            );
        });

        it('should include stack trace in debug mode', () => {
            const error = new Error('Test error');
            error.stack = 'Error stack trace';

            // Create error handler with debug mode enabled
            const debugErrorHandler = new ErrorHandler({ debug: true });
            debugErrorHandler.handleError(error, 'test', 'error');

            expect(console.trace).toHaveBeenCalledWith('Error stack trace');
        });
    });

    describe('storeErrorLog', () => {
        it('should store error logs in Chrome storage', async () => {
            const errorInfo = {
                message: 'Test error',
                timestamp: '2024-01-01T00:00:00.000Z'
            };

            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ error_logs: [] });
            });

            mockChrome.storage.local.set.mockImplementation((data) => {
                return Promise.resolve();
            });

            await errorHandler.storeErrorLog(errorInfo);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
                { error_logs: [errorInfo] }
            );
        });

        it('should limit stored logs to maxLogEntries', async () => {
            const existingLogs = Array.from({ length: 150 }, (_, i) => ({
                message: `Error ${i}`,
                timestamp: new Date().toISOString()
            }));

            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ error_logs: existingLogs });
            });

            mockChrome.storage.local.set.mockImplementation((data) => {
                return Promise.resolve();
            });

            const newError = { message: 'New error', timestamp: new Date().toISOString() };
            await errorHandler.storeErrorLog(newError);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
                { error_logs: expect.arrayContaining([newError]) }
            );

            const storedData = mockChrome.storage.local.set.mock.calls[0][0];
            expect(storedData.error_logs).toHaveLength(100); // maxLogEntries
        });
    });

    describe('getUserFriendlyMessage', () => {
        it('should return user-friendly messages for known error codes', () => {
            const error = { code: 'NETWORK_ERROR' };

            const message = errorHandler.getUserFriendlyMessage(error, 'test');

            expect(message).toBe('Network connection failed. Please check your internet connection and try again.');
        });

        it('should return default message for unknown error codes', () => {
            const error = { code: 'UNKNOWN_CODE' };

            const message = errorHandler.getUserFriendlyMessage(error, 'test');

            expect(message).toBe('An unexpected error occurred. Please try again or contact support.');
        });

        it('should handle errors without code property', () => {
            const error = { message: 'Some error' };

            const message = errorHandler.getUserFriendlyMessage(error, 'test');

            expect(message).toBe('An unexpected error occurred. Please try again or contact support.');
        });
    });

    describe('clearErrorLogs', () => {
        it('should clear error logs from storage', async () => {
            mockChrome.storage.local.remove.mockImplementation(() => {
                return Promise.resolve();
            });

            const result = await errorHandler.clearErrorLogs();

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('error_logs');
            expect(result).toBe(true);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.remove.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            const result = await errorHandler.clearErrorLogs();

            expect(result).toBe(false);
        });
    });
});
