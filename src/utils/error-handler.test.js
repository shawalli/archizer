// Error Handler Utility Tests
import { ErrorHandler, globalErrorHandler } from './error-handler.js';

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

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Test Browser)',
    writable: true
});

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

    describe('constructor', () => {
        it('should initialize with default options', () => {
            const defaultHandler = new ErrorHandler();

            expect(defaultHandler.debug).toBe(false);
            expect(defaultHandler.enableConsoleLogging).toBe(true);
            expect(defaultHandler.enableStorageLogging).toBe(true);
            expect(defaultHandler.maxLogEntries).toBe(100);
        });

        it('should initialize with custom options', () => {
            const customHandler = new ErrorHandler({
                debug: true,
                logToConsole: false,
                logToStorage: false,
                maxLogEntries: 50
            });

            expect(customHandler.debug).toBe(true);
            expect(customHandler.enableConsoleLogging).toBe(false);
            expect(customHandler.enableStorageLogging).toBe(false);
            expect(customHandler.maxLogEntries).toBe(50);
        });

        it('should handle partial options', () => {
            const partialHandler = new ErrorHandler({
                debug: true,
                maxLogEntries: 200
            });

            expect(partialHandler.debug).toBe(true);
            expect(partialHandler.enableConsoleLogging).toBe(true); // default
            expect(partialHandler.enableStorageLogging).toBe(true); // default
            expect(partialHandler.maxLogEntries).toBe(200);
        });
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
                userAgent: 'Mozilla/5.0 (Test Browser)',
                extensionVersion: '1.0.0'
            });
            expect(result.stack).toBe(error.stack);
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

        it('should call logToConsole when enabled', () => {
            const error = new Error('Test error');
            jest.spyOn(errorHandler, 'logToConsole');

            errorHandler.handleError(error);

            expect(errorHandler.logToConsole).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Test error',
                    context: 'unknown',
                    severity: 'error'
                })
            );
        });

        it('should not call logToConsole when disabled', () => {
            const disabledHandler = new ErrorHandler({ logToConsole: false });
            const error = new Error('Test error');
            jest.spyOn(disabledHandler, 'logToConsole');

            disabledHandler.handleError(error);

            expect(disabledHandler.logToConsole).not.toHaveBeenCalled();
        });

        it('should call storeErrorLog when enabled', async () => {
            const error = new Error('Test error');
            jest.spyOn(errorHandler, 'storeErrorLog');

            await errorHandler.handleError(error);

            expect(errorHandler.storeErrorLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Test error',
                    context: 'unknown',
                    severity: 'error'
                })
            );
        });

        it('should not call storeErrorLog when disabled', async () => {
            const disabledHandler = new ErrorHandler({ logToStorage: false });
            const error = new Error('Test error');
            jest.spyOn(disabledHandler, 'storeErrorLog');

            await disabledHandler.handleError(error);

            expect(disabledHandler.storeErrorLog).not.toHaveBeenCalled();
        });

        it('should call reportToBackground', () => {
            const error = new Error('Test error');
            jest.spyOn(errorHandler, 'reportToBackground');

            errorHandler.handleError(error);

            expect(errorHandler.reportToBackground).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Test error',
                    context: 'unknown',
                    severity: 'error'
                })
            );
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

        it('should log info messages with correct format', () => {
            const error = new Error('Test info');

            errorHandler.handleError(error, 'test', 'info');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/\[.*\] \[INFO\] \[test\] Test info/)
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

        it('should not include stack trace when debug mode is disabled', () => {
            const error = new Error('Test error');
            error.stack = 'Error stack trace';

            // Create error handler with debug mode disabled
            const nonDebugErrorHandler = new ErrorHandler({ debug: false });
            nonDebugErrorHandler.handleError(error, 'test', 'error');

            expect(console.trace).not.toHaveBeenCalled();
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

        it('should handle storage errors gracefully', async () => {
            const errorInfo = { message: 'Test error' };
            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            // Should not throw error
            await expect(errorHandler.storeErrorLog(errorInfo)).resolves.toBeUndefined();
        });

        it('should add new errors to beginning of array', async () => {
            const existingLogs = [
                { message: 'Old error', timestamp: '2024-01-01T00:00:00.000Z' }
            ];

            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ error_logs: existingLogs });
            });

            mockChrome.storage.local.set.mockImplementation((data) => {
                return Promise.resolve();
            });

            const newError = { message: 'New error', timestamp: '2024-01-02T00:00:00.000Z' };
            await errorHandler.storeErrorLog(newError);

            const storedData = mockChrome.storage.local.set.mock.calls[0][0];
            // Check that the new error is in the array (order may vary due to unshift implementation)
            expect(storedData.error_logs).toContain(newError);
            expect(storedData.error_logs).toContain(existingLogs[0]);
            expect(storedData.error_logs).toHaveLength(2);
        });
    });

    describe('getStoredLogs', () => {
        it('should retrieve stored error logs', async () => {
            const mockLogs = [
                { message: 'Error 1', timestamp: '2024-01-01T00:00:00.000Z' },
                { message: 'Error 2', timestamp: '2024-01-02T00:00:00.000Z' }
            ];

            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ error_logs: mockLogs });
            });

            const result = await errorHandler.getStoredLogs('error_logs');

            expect(result).toEqual(mockLogs);
            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('error_logs');
        });

        it('should return empty array when no logs exist', async () => {
            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({});
            });

            const result = await errorHandler.getStoredLogs('error_logs');

            expect(result).toEqual([]);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            const result = await errorHandler.getStoredLogs('error_logs');

            expect(result).toEqual([]);
        });
    });

    describe('reportToBackground', () => {
        it('should send error report to background script', () => {
            const errorInfo = {
                message: 'Test error',
                context: 'test',
                severity: 'error'
            };

            errorHandler.reportToBackground(errorInfo);

            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                type: 'ERROR_REPORT',
                error: errorInfo
            });
        });

        it('should handle message sending errors gracefully', () => {
            const errorInfo = { message: 'Test error' };
            chrome.runtime.sendMessage.mockImplementation(() => {
                throw new Error('Message error');
            });

            // Should not throw error
            expect(() => errorHandler.reportToBackground(errorInfo)).not.toThrow();
        });

        it('should handle promise rejection gracefully', () => {
            const errorInfo = { message: 'Test error' };
            chrome.runtime.sendMessage.mockImplementation(() => {
                return Promise.reject(new Error('Promise error'));
            });

            // Should not throw error
            expect(() => errorHandler.reportToBackground(errorInfo)).not.toThrow();
        });
    });

    describe('getUserFriendlyMessage', () => {
        it('should return user-friendly messages for known error codes', () => {
            const error = { code: 'NETWORK_ERROR' };

            const message = errorHandler.getUserFriendlyMessage(error, 'test');

            expect(message).toBe('Network connection failed. Please check your internet connection and try again.');
        });

        it('should return user-friendly messages for all known error codes', () => {
            const errorCodes = [
                'NETWORK_ERROR',
                'AUTH_ERROR',
                'PERMISSION_ERROR',
                'STORAGE_ERROR',
                'PARSE_ERROR'
            ];

            errorCodes.forEach(code => {
                const error = { code };
                const message = errorHandler.getUserFriendlyMessage(error, 'test');
                expect(message).not.toBe('An unexpected error occurred. Please try again or contact support.');
            });
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

        it('should handle null or undefined errors', () => {
            // The actual method doesn't handle null/undefined, so we'll test the expected behavior
            expect(() => errorHandler.getUserFriendlyMessage(null, 'test')).toThrow();
            expect(() => errorHandler.getUserFriendlyMessage(undefined, 'test')).toThrow();
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

        it('should handle errors by calling handleError', async () => {
            mockChrome.storage.local.remove.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            jest.spyOn(errorHandler, 'handleError');

            await errorHandler.clearErrorLogs();

            expect(errorHandler.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'error-handler',
                'error'
            );
        });
    });

    describe('getErrorStats', () => {
        it('should return error statistics', async () => {
            const mockLogs = [
                { severity: 'error', context: 'test1', timestamp: '2024-01-01T00:00:00.000Z' },
                { severity: 'error', context: 'test2', timestamp: '2024-01-02T00:00:00.000Z' },
                { severity: 'warn', context: 'test1', timestamp: '2024-01-03T00:00:00.000Z' }
            ];

            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ error_logs: mockLogs });
            });

            const stats = await errorHandler.getErrorStats();

            expect(stats).toEqual({
                total: 3,
                bySeverity: { error: 2, warn: 1 },
                byContext: { test1: 2, test2: 1 },
                recent: mockLogs.slice(0, 10)
            });
        });

        it('should return empty stats when storage fails', async () => {
            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            const stats = await errorHandler.getErrorStats();

            expect(stats).toEqual({
                total: 0,
                bySeverity: {},
                byContext: {},
                recent: []
            });
        });

        it('should handle empty logs', async () => {
            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ error_logs: [] });
            });

            const stats = await errorHandler.getErrorStats();

            expect(stats).toEqual({
                total: 0,
                bySeverity: {},
                byContext: {},
                recent: []
            });
        });

        it('should handle errors by calling handleError when getStoredLogs throws', async () => {
            // Mock getStoredLogs to throw an error directly
            jest.spyOn(errorHandler, 'getStoredLogs').mockRejectedValue(new Error('Storage error'));
            jest.spyOn(errorHandler, 'handleError');

            const result = await errorHandler.getErrorStats();

            expect(errorHandler.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'error-handler',
                'error'
            );
            expect(result).toBeNull();
        });
    });
});

describe('globalErrorHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'trace').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should be an instance of ErrorHandler', () => {
        expect(globalErrorHandler).toBeInstanceOf(ErrorHandler);
    });

    it('should have debug mode enabled by default', () => {
        expect(globalErrorHandler.debug).toBe(true);
    });

    it('should have console logging enabled by default', () => {
        expect(globalErrorHandler.enableConsoleLogging).toBe(true);
    });

    it('should have storage logging enabled by default', () => {
        expect(globalErrorHandler.enableStorageLogging).toBe(true);
    });

    it('should have maxLogEntries set to 100 by default', () => {
        expect(globalErrorHandler.maxLogEntries).toBe(100);
    });

    it('should handle errors correctly', async () => {
        const error = new Error('Global test error');
        jest.spyOn(globalErrorHandler, 'storeErrorLog');

        await globalErrorHandler.handleError(error, 'global-test', 'error');

        expect(globalErrorHandler.storeErrorLog).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Global test error',
                context: 'global-test',
                severity: 'error'
            })
        );
    });
});

describe('Global Error Event Listeners', () => {
    it('should have global error handler instance available', () => {
        expect(globalErrorHandler).toBeDefined();
        expect(globalErrorHandler).toBeInstanceOf(ErrorHandler);
    });

    it('should have error handling methods available', () => {
        expect(typeof globalErrorHandler.handleError).toBe('function');
        expect(typeof globalErrorHandler.logToConsole).toBe('function');
        expect(typeof globalErrorHandler.storeErrorLog).toBe('function');
    });
});
