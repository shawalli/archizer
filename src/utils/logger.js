/**
 * Logger utility for controlling console output levels
 * Reduces excessive logging in production while maintaining debugging capabilities
 */

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// Current log level (can be set via environment or config)
let currentLogLevel = LOG_LEVELS.INFO;

// Production mode detection
const isProduction = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

// Set log level
export function setLogLevel(level) {
    if (typeof level === 'string') {
        currentLogLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    } else if (typeof level === 'number') {
        currentLogLevel = Math.max(0, Math.min(3, level));
    }
}

// Get current log level
export function getLogLevel() {
    return currentLogLevel;
}

// Check if a log level should be displayed
function shouldLog(level) {
    return level <= currentLogLevel && !isProduction;
}

// Logger functions
export const logger = {
    error: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.ERROR)) {
            console.error(message, ...args);
        }
    },

    warn: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.WARN)) {
            console.warn(message, ...args);
        }
    },

    info: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.INFO)) {
            console.log(message, ...args);
        }
    },

    debug: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(message, ...args);
        }
    },

    // Always log critical errors regardless of level
    critical: (message, ...args) => {
        console.error(message, ...args);
    }
};

// Specialized logging functions for common patterns
export const specializedLogger = {
    // Success messages with ✅ emoji
    success: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.INFO)) {
            console.log(`✅ ${message}`, ...args);
        }
    },

    // Warning messages with ⚠️ emoji
    warning: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.WARN)) {
            console.log(`⚠️ ${message}`, ...args);
        }
    },

    // Debug messages with 🔍 emoji
    debug: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(`🔍 ${message}`, ...args);
        }
    },

    // Info messages with 🔧 emoji
    info: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.INFO)) {
            console.log(`🔧 ${message}`, ...args);
        }
    },

    // Error messages with ❌ emoji
    error: (message, ...args) => {
        if (shouldLog(LOG_LEVELS.ERROR)) {
            console.log(`❌ ${message}`, ...args);
        }
    },

    // Critical messages with 🚨 emoji
    critical: (message, ...args) => {
        console.log(`🚨 ${message}`, ...args);
    }
};

// Initialize with production-friendly defaults
if (isProduction) {
    setLogLevel(LOG_LEVELS.ERROR); // Only show errors in production
}

export default logger;
