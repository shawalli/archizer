// Error Handler Utility
// Centralized error handling and logging for the Chrome extension

export class ErrorHandler {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.enableConsoleLogging = options.logToConsole !== false;
        this.enableStorageLogging = options.logToStorage !== false;
        this.maxLogEntries = options.maxLogEntries || 100;
    }

    // Handle and log errors
    handleError(error, context = 'unknown', severity = 'error') {
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            context,
            severity,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            extensionVersion: chrome.runtime.getManifest().version
        };

        // Log to console if enabled
        if (this.enableConsoleLogging) {
            this.logToConsole(errorInfo);
        }

        // Store error log if enabled
        if (this.enableStorageLogging) {
            this.storeErrorLog(errorInfo);
        }

        // Report to background script for potential external logging
        this.reportToBackground(errorInfo);

        return errorInfo;
    }

    // Log error to console with formatting
    logToConsole(errorInfo) {
        const { severity, context, message, timestamp } = errorInfo;

        const logMethod = severity === 'error' ? 'error' :
            severity === 'warn' ? 'warn' : 'log';

        console[logMethod](
            `[${timestamp}] [${severity.toUpperCase()}] [${context}] ${message}`
        );

        if (this.debug && errorInfo.stack) {
            console.trace(errorInfo.stack);
        }
    }

    // Store error log in local storage
    async storeErrorLog(errorInfo) {
        try {
            const storageKey = 'error_logs';
            const existingLogs = await this.getStoredLogs(storageKey);

            // Add new error to beginning of array
            existingLogs.unshift(errorInfo);

            // Keep only the most recent errors
            if (existingLogs.length > this.maxLogEntries) {
                existingLogs.splice(this.maxLogEntries);
            }

            // Store updated logs
            await chrome.storage.local.set({ [storageKey]: existingLogs });
        } catch (storageError) {
            console.error('Failed to store error log:', storageError);
        }
    }

    // Retrieve stored error logs
    async getStoredLogs(storageKey) {
        try {
            const result = await chrome.storage.local.get(storageKey);
            return result[storageKey] || [];
        } catch (error) {
            console.error('Failed to retrieve error logs:', error);
            return [];
        }
    }

    // Report error to background script
    reportToBackground(errorInfo) {
        try {
            chrome.runtime.sendMessage({
                type: 'ERROR_REPORT',
                error: errorInfo
            }).catch(() => {
                // Background script might not be available, ignore
            });
        } catch (error) {
            // Message sending failed, ignore
        }
    }

    // Create user-friendly error messages
    getUserFriendlyMessage(error, context) {
        const errorMessages = {
            'NETWORK_ERROR': 'Network connection failed. Please check your internet connection and try again.',
            'AUTH_ERROR': 'Authentication failed. Please log in again.',
            'PERMISSION_ERROR': 'Permission denied. Please check extension permissions.',
            'STORAGE_ERROR': 'Failed to save data. Please try again.',
            'PARSE_ERROR': 'Failed to process data. Please refresh the page and try again.',
            'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again or contact support.'
        };

        return errorMessages[error.code] || errorMessages['UNKNOWN_ERROR'];
    }

    // Clear error logs
    async clearErrorLogs() {
        try {
            await chrome.storage.local.remove('error_logs');
            return true;
        } catch (error) {
            this.handleError(error, 'error-handler', 'error');
            return false;
        }
    }

    // Get error statistics
    async getErrorStats() {
        try {
            const logs = await this.getStoredLogs('error_logs');
            const stats = {
                total: logs.length,
                bySeverity: {},
                byContext: {},
                recent: logs.slice(0, 10)
            };

            logs.forEach(log => {
                stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
                stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
            });

            return stats;
        } catch (error) {
            this.handleError(error, 'error-handler', 'error');
            return null;
        }
    }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler({
    debug: true,
    logToConsole: true,
    logToStorage: true,
    maxLogEntries: 100
});

// Global error event listeners
window.addEventListener('error', (event) => {
    globalErrorHandler.handleError(event.error, 'window', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler.handleError(
        new Error(event.reason),
        'unhandled-promise',
        'error'
    );
});
