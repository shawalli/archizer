/**
 * Unified Configuration Manager
 * Handles all extension configuration as key-value pairs with validation and auto-save
 */

import { specializedLogger as log } from './logger.js';

export class ConfigManager {
    constructor() {
        this.prefix = 'amazon_archiver_config_';
        this.configs = new Map();
        this.validators = new Map();
        this.autoSaveCallbacks = new Map();

        // Initialize default configurations
        this.initializeDefaultConfigs();
    }

    /**
     * Initialize default configuration schemas
     */
    initializeDefaultConfigs() {
        // Username configuration
        this.registerConfig('username', {
            type: 'string',
            required: false,
            default: null,
            description: 'User display name'
        });

        // Google Sheets configuration
        this.registerConfig('google_sheets', {
            type: 'object',
            required: false,
            default: {
                sheetUrl: null,
                sheetName: 'Orders',
                lastSync: null
            },
            description: 'Google Sheets integration settings',
            schema: {
                sheetUrl: { type: 'string', required: true },
                sheetName: { type: 'string', required: false, default: 'Orders' },
                lastSync: { type: 'string', required: false, default: null }
            }
        });
    }

    /**
     * Register a configuration schema
     * @param {string} key - Configuration key
     * @param {Object} schema - Configuration schema
     */
    registerConfig(key, schema) {
        this.configs.set(key, schema);

        // Set up validator
        if (schema.validator) {
            this.validators.set(key, schema.validator);
        }

        log.info(`Registered config schema for: ${key}`);
    }

    /**
     * Get configuration value
     * @param {string} key - Configuration key
     * @returns {*} Configuration value
     */
    async get(key) {
        try {
            const schema = this.configs.get(key);
            if (!schema) {
                throw new Error(`Unknown configuration key: ${key}`);
            }

            const fullKey = this.prefix + key;
            const result = await chrome.storage.local.get(fullKey);
            const value = result[fullKey];

            // Return default if no value stored
            if (value === undefined || value === null) {
                return schema.default;
            }

            return value;
        } catch (error) {
            log.error(`Error getting config ${key}:`, error);
            const schema = this.configs.get(key);
            return schema ? schema.default : null;
        }
    }

    /**
     * Set configuration value
     * @param {string} key - Configuration key
     * @param {*} value - Configuration value
     * @param {boolean} validate - Whether to validate the value
     */
    async set(key, value, validate = true) {
        try {
            const schema = this.configs.get(key);
            if (!schema) {
                throw new Error(`Unknown configuration key: ${key}`);
            }

            // Validate if requested
            if (validate) {
                const validation = this.validate(key, value);
                if (!validation.valid) {
                    throw new Error(`Validation failed for ${key}: ${validation.errors.join(', ')}`);
                }
            }

            const fullKey = this.prefix + key;
            await chrome.storage.local.set({ [fullKey]: value });

            log.info(`Configuration ${key} saved successfully`);

            // Trigger auto-save callbacks
            if (this.autoSaveCallbacks.has(key)) {
                const callback = this.autoSaveCallbacks.get(key);
                callback(value);
            }

            return true;
        } catch (error) {
            log.error(`Error setting config ${key}:`, error);
            throw error;
        }
    }

    /**
     * Set configuration value with lenient validation (for auto-save)
     * @param {string} key - Configuration key
     * @param {*} value - Configuration value
     */
    async setLenient(key, value) {
        try {
            const schema = this.configs.get(key);
            if (!schema) {
                throw new Error(`Unknown configuration key: ${key}`);
            }

            // For lenient validation, only validate basic structure, not required fields
            if (schema.type === 'object' && typeof value === 'object') {
                // Basic type check passed, allow saving
            } else if (schema.type === 'string' && typeof value === 'string') {
                // Basic type check passed, allow saving
            } else if (value === null || value === undefined) {
                // Allow null/undefined values
            } else {
                throw new Error(`Type mismatch: expected ${schema.type}, got ${typeof value}`);
            }

            const fullKey = this.prefix + key;
            await chrome.storage.local.set({ [fullKey]: value });

            log.info(`Configuration ${key} saved successfully (lenient)`);

            // Trigger auto-save callbacks
            if (this.autoSaveCallbacks.has(key)) {
                const callback = this.autoSaveCallbacks.get(key);
                callback(value);
            }

            return true;
        } catch (error) {
            log.error(`Error setting config ${key} (lenient):`, error);
            throw error;
        }
    }

    /**
     * Update multiple configuration values
     * @param {Object} updates - Object with key-value pairs to update
     */
    async update(updates) {
        try {
            const results = {};

            for (const [key, value] of Object.entries(updates)) {
                await this.set(key, value);
                results[key] = value;
            }

            log.info(`Updated configurations:`, Object.keys(updates));
            return results;
        } catch (error) {
            log.error('Error updating configurations:', error);
            throw error;
        }
    }

    /**
     * Validate configuration value
     * @param {string} key - Configuration key
     * @param {*} value - Value to validate
     * @returns {Object} Validation result
     */
    validate(key, value) {
        const schema = this.configs.get(key);
        if (!schema) {
            return { valid: false, errors: [`Unknown configuration key: ${key}`] };
        }

        const errors = [];

        // Check required fields
        if (schema.required && (value === null || value === undefined || value === '')) {
            errors.push(`${key} is required`);
        }

        // Type validation
        if (value !== null && value !== undefined) {
            if (schema.type === 'string' && typeof value !== 'string') {
                errors.push(`${key} must be a string`);
            } else if (schema.type === 'object' && typeof value !== 'object') {
                errors.push(`${key} must be an object`);
            } else if (schema.type === 'number' && typeof value !== 'number') {
                errors.push(`${key} must be a number`);
            } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
                errors.push(`${key} must be a boolean`);
            }
        }

        // Object schema validation
        if (schema.type === 'object' && schema.schema && typeof value === 'object') {
            for (const [fieldKey, fieldSchema] of Object.entries(schema.schema)) {
                if (fieldSchema.required && (value[fieldKey] === null || value[fieldKey] === undefined || value[fieldKey] === '')) {
                    errors.push(`${key}.${fieldKey} is required`);
                }
            }
        }

        // Custom validator
        if (this.validators.has(key)) {
            const validator = this.validators.get(key);
            const customValidation = validator(value);
            if (!customValidation.valid) {
                errors.push(...customValidation.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if configuration is complete
     * @param {string} key - Configuration key
     * @returns {boolean} Whether configuration is complete
     */
    async isConfigured(key) {
        try {
            const value = await this.get(key);
            const schema = this.configs.get(key);

            if (!schema) return false;

            if (schema.type === 'object' && schema.schema) {
                // For objects, check if all required fields are present
                for (const [fieldKey, fieldSchema] of Object.entries(schema.schema)) {
                    if (fieldSchema.required && (!value || value[fieldKey] === null || value[fieldKey] === undefined || value[fieldKey] === '')) {
                        return false;
                    }
                }
                return true;
            } else {
                // For simple types, check if value exists
                return value !== null && value !== undefined && value !== '';
            }
        } catch (error) {
            log.error(`Error checking if ${key} is configured:`, error);
            return false;
        }
    }

    /**
     * Get all configuration values
     * @returns {Object} All configuration values
     */
    async getAll() {
        try {
            const allConfigs = {};

            for (const key of this.configs.keys()) {
                allConfigs[key] = await this.get(key);
            }

            return allConfigs;
        } catch (error) {
            log.error('Error getting all configurations:', error);
            return {};
        }
    }

    /**
     * Clear configuration
     * @param {string} key - Configuration key
     */
    async clear(key) {
        try {
            const fullKey = this.prefix + key;
            await chrome.storage.local.remove(fullKey);
            log.info(`Configuration ${key} cleared`);
        } catch (error) {
            log.error(`Error clearing config ${key}:`, error);
            throw error;
        }
    }

    /**
     * Clear all configurations
     */
    async clearAll() {
        try {
            const keysToRemove = [];

            for (const key of this.configs.keys()) {
                keysToRemove.push(this.prefix + key);
            }

            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                log.info(`Cleared ${keysToRemove.length} configurations`);
            }
        } catch (error) {
            log.error('Error clearing all configurations:', error);
            throw error;
        }
    }

    /**
     * Register auto-save callback
     * @param {string} key - Configuration key
     * @param {Function} callback - Callback function
     */
    onAutoSave(key, callback) {
        this.autoSaveCallbacks.set(key, callback);
    }

    /**
     * Extract Sheet ID from Google Sheets URL
     * @param {string} url - Google Sheets URL
     * @returns {string} Sheet ID
     */
    extractSheetId(url) {
        if (!url) return null;

        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
            return match[1];
        }

        throw new Error('Invalid Google Sheets URL format. Please provide the full URL.');
    }

    /**
     * Get Sheet ID from stored Google Sheets URL
     * @returns {string|null} Sheet ID
     */
    async getSheetId() {
        try {
            const config = await this.get('google_sheets');
            if (!config || !config.sheetUrl) return null;

            return this.extractSheetId(config.sheetUrl);
        } catch (error) {
            log.error('Error getting Sheet ID:', error);
            return null;
        }
    }
}

// Export a default instance
export const configManager = new ConfigManager();
