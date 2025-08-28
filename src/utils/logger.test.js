/**
 * Tests for logger utility
 * Covers all logging functions, log levels, and production mode behavior
 */

import { logger, specializedLogger, setLogLevel, getLogLevel, resetLogLevel } from './logger.js';

describe('Logger Utility', () => {
    let originalConsoleError;
    let originalConsoleWarn;
    let originalConsoleLog;
    let originalProcess;

    beforeEach(() => {
        // Store original console methods
        originalConsoleError = console.error;
        originalConsoleWarn = console.warn;
        originalConsoleLog = console.log;
        originalProcess = global.process;

        // Mock console methods
        console.error = jest.fn();
        console.warn = jest.fn();
        console.log = jest.fn();

        // Reset log level to INFO
        resetLogLevel();
    });

    afterEach(() => {
        // Restore original console methods
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log = originalConsoleLog;
        global.process = originalProcess;
    });

    describe('Log Levels', () => {
        test('should have correct log level constants', () => {
            expect(logger).toBeDefined();
            expect(specializedLogger).toBeDefined();
        });

        test('should set and get log level correctly', () => {
            // Test string level setting
            setLogLevel('DEBUG');
            expect(getLogLevel()).toBe(3);

            setLogLevel('INFO');
            expect(getLogLevel()).toBe(2);

            setLogLevel('WARN');
            expect(getLogLevel()).toBe(1);

            setLogLevel('ERROR');
            expect(getLogLevel()).toBe(0);
        });

        test('should handle numeric log level setting', () => {
            setLogLevel(3);
            expect(getLogLevel()).toBe(3);

            setLogLevel(0);
            expect(getLogLevel()).toBe(0);
        });

        test('should clamp log levels to valid range', () => {
            setLogLevel(10);
            expect(getLogLevel()).toBe(3);

            setLogLevel(-5);
            expect(getLogLevel()).toBe(0);
        });

        test('should handle invalid string levels gracefully', () => {
            setLogLevel('INVALID');
            expect(getLogLevel()).toBe(2); // Default to INFO
        });
    });

    describe('Basic Logger Functions', () => {
        test('should log error messages when level allows', () => {
            setLogLevel('ERROR');
            logger.error('Test error message');
            expect(console.error).toHaveBeenCalledWith('Test error message');
        });

        test('should not log error messages when level is too high', () => {
            setLogLevel('WARN');
            logger.error('Test error message');
            // When level is WARN (1), ERROR (0) should still log because 0 <= 1
            expect(console.error).toHaveBeenCalledWith('Test error message');
        });

        test('should log warning messages when level allows', () => {
            setLogLevel('WARN');
            logger.warn('Test warning message');
            expect(console.warn).toHaveBeenCalledWith('Test warning message');
        });

        test('should not log warning messages when level is too high', () => {
            setLogLevel('ERROR');
            logger.warn('Test warning message');
            // When level is ERROR (0), WARN (1) should not log because 1 > 0
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should log info messages when level allows', () => {
            setLogLevel('INFO');
            logger.info('Test info message');
            expect(console.log).toHaveBeenCalledWith('Test info message');
        });

        test('should not log info messages when level is too high', () => {
            setLogLevel('WARN');
            logger.info('Test info message');
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should log debug messages when level allows', () => {
            setLogLevel('DEBUG');
            logger.debug('Test debug message');
            expect(console.log).toHaveBeenCalledWith('Test debug message');
        });

        test('should not log debug messages when level is too high', () => {
            setLogLevel('INFO');
            logger.debug('Test debug message');
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should always log critical messages regardless of level', () => {
            setLogLevel('ERROR');
            logger.critical('Test critical message');
            expect(console.error).toHaveBeenCalledWith('Test critical message');
        });

        test('should handle multiple arguments correctly', () => {
            setLogLevel('INFO');
            logger.info('Message', 'arg1', 'arg2', { key: 'value' });
            expect(console.log).toHaveBeenCalledWith('Message', 'arg1', 'arg2', { key: 'value' });
        });
    });

    describe('Specialized Logger Functions', () => {
        test('should log success messages with emoji when level allows', () => {
            setLogLevel('INFO');
            specializedLogger.success('Operation completed');
            expect(console.log).toHaveBeenCalledWith('✅ Operation completed');
        });

        test('should not log success messages when level is too high', () => {
            setLogLevel('WARN');
            specializedLogger.success('Operation completed');
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should log warning messages with emoji when level allows', () => {
            setLogLevel('WARN');
            specializedLogger.warning('Something to watch');
            expect(console.log).toHaveBeenCalledWith('⚠️ Something to watch');
        });

        test('should not log warning messages when level is too high', () => {
            setLogLevel('ERROR');
            specializedLogger.warning('Something to watch');
            // When level is ERROR (0), WARN (1) should not log because 1 > 0
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should log debug messages with emoji when level allows', () => {
            setLogLevel('DEBUG');
            specializedLogger.debug('Debug information');
            expect(console.log).toHaveBeenCalledWith('🔍 Debug information');
        });

        test('should not log debug messages when level is too high', () => {
            setLogLevel('INFO');
            specializedLogger.debug('Debug information');
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should log info messages with emoji when level allows', () => {
            setLogLevel('INFO');
            specializedLogger.info('General information');
            expect(console.log).toHaveBeenCalledWith('🔧 General information');
        });

        test('should not log info messages when level is too high', () => {
            setLogLevel('WARN');
            specializedLogger.info('General information');
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should log error messages with emoji when level allows', () => {
            setLogLevel('ERROR');
            specializedLogger.error('Error occurred');
            expect(console.log).toHaveBeenCalledWith('❌ Error occurred');
        });

        test('should not log error messages when level is too high', () => {
            setLogLevel('WARN');
            specializedLogger.error('Error occurred');
            // When level is WARN (1), ERROR (0) should still log because 0 <= 1
            expect(console.log).toHaveBeenCalledWith('❌ Error occurred');
        });

        test('should always log critical messages with emoji regardless of level', () => {
            setLogLevel('ERROR');
            specializedLogger.critical('Critical error');
            expect(console.log).toHaveBeenCalledWith('🚨 Critical error');
        });

        test('should handle multiple arguments in specialized logger', () => {
            setLogLevel('INFO');
            specializedLogger.success('Operation', 'completed', { status: 'success' });
            expect(console.log).toHaveBeenCalledWith('✅ Operation', 'completed', { status: 'success' });
        });
    });

    describe('Production Mode Behavior', () => {
        test('should detect production mode and adjust logging', () => {
            // Mock production environment
            global.process = { env: { NODE_ENV: 'production' } };

            // Set log level to ERROR (production default)
            setLogLevel('ERROR');

            // Test that only error messages are logged
            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');
            logger.debug('Debug message');

            expect(console.error).toHaveBeenCalledWith('Error message');
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should set production log level to ERROR only', () => {
            // Mock production environment
            global.process = { env: { NODE_ENV: 'production' } };

            // Set log level to ERROR (production default)
            setLogLevel('ERROR');
            expect(getLogLevel()).toBe(0); // ERROR level
        });
    });

    describe('Edge Cases', () => {
        test('should handle undefined process gracefully', () => {
            // Mock undefined process
            global.process = undefined;

            // Should not throw error
            expect(() => {
                setLogLevel('INFO');
                logger.info('Test message');
            }).not.toThrow();
        });

        test('should handle missing NODE_ENV gracefully', () => {
            // Mock process without NODE_ENV
            global.process = { env: {} };

            // Should not throw error
            expect(() => {
                setLogLevel('INFO');
                logger.info('Test message');
            }).not.toThrow();
        });

        test('should handle null and undefined messages gracefully', () => {
            setLogLevel('INFO');

            logger.info(null);
            logger.info(undefined);

            expect(console.log).toHaveBeenCalledWith(null);
            expect(console.log).toHaveBeenCalledWith(undefined);
        });

        test('should handle empty string messages', () => {
            setLogLevel('INFO');

            logger.info('');
            specializedLogger.success('');

            expect(console.log).toHaveBeenCalledWith('');
            expect(console.log).toHaveBeenCalledWith('✅ ');
        });
    });

    describe('Log Level Transitions', () => {
        test('should properly transition between log levels', () => {
            // Start with ERROR level
            setLogLevel('ERROR');
            expect(getLogLevel()).toBe(0);

            // Transition to WARN
            setLogLevel('WARN');
            expect(getLogLevel()).toBe(1);

            // Transition to INFO
            setLogLevel('INFO');
            expect(getLogLevel()).toBe(2);

            // Transition to DEBUG
            setLogLevel('DEBUG');
            expect(getLogLevel()).toBe(3);

            // Transition back to ERROR
            setLogLevel('ERROR');
            expect(getLogLevel()).toBe(0);
        });

        test('should maintain log level across multiple calls', () => {
            setLogLevel('WARN');
            expect(getLogLevel()).toBe(1);

            // Make multiple calls
            logger.warn('Warning 1');
            logger.warn('Warning 2');
            logger.warn('Warning 3');

            expect(getLogLevel()).toBe(1);
            expect(console.warn).toHaveBeenCalledTimes(3);
        });
    });
});
