/**
 * Google Sheets Configuration Module
 * Manages configuration settings for Google Sheets integration
 */

import { specializedLogger as log } from '../../utils/logger.js';

export class GoogleSheetsConfig {
    constructor() {
        this.configKey = 'google_sheets_config';
        this.defaultConfig = {
            sheetUrl: null,
            sheetName: 'Orders',
            lastSync: null
        };
    }

    /**
     * Get current configuration
     */
    async getConfig() {
        try {
            const result = await chrome.storage.local.get([this.configKey]);
            const config = result[this.configKey] || {};

            // Merge with defaults
            return { ...this.defaultConfig, ...config };
        } catch (error) {
            log.error('Error getting Google Sheets config:', error);
            return { ...this.defaultConfig };
        }
    }

    /**
     * Save configuration
     */
    async saveConfig(config) {
        try {
            await chrome.storage.local.set({
                [this.configKey]: { ...this.defaultConfig, ...config }
            });
            log.info('Google Sheets configuration saved');
        } catch (error) {
            log.error('Error saving Google Sheets config:', error);
            throw error;
        }
    }

    /**
     * Update specific configuration values
     */
    async updateConfig(updates) {
        try {
            const currentConfig = await this.getConfig();
            const newConfig = { ...currentConfig, ...updates };
            await this.saveConfig(newConfig);
            return newConfig;
        } catch (error) {
            log.error('Error updating Google Sheets config:', error);
            throw error;
        }
    }

    /**
     * Check if configuration is complete
     */
    async isConfigured() {
        const config = await this.getConfig();
        return !!(config.sheetUrl);
    }

    /**
     * Get sheet URL
     */
    async getSheetUrl() {
        const config = await this.getConfig();
        return config.sheetUrl;
    }

    /**
     * Extract Sheet ID from stored URL
     */
    async getSheetId() {
        const config = await this.getConfig();
        if (!config.sheetUrl) return null;

        const match = config.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    }

    /**
     * Get sheet name
     */
    async getSheetName() {
        const config = await this.getConfig();
        return config.sheetName;
    }

    /**
     * Set sheet URL
     */
    async setSheetUrl(sheetUrl) {
        await this.updateConfig({ sheetUrl });
    }

    /**
     * Set sheet name
     */
    async setSheetName(sheetName) {
        await this.updateConfig({ sheetName });
    }

    /**
     * Update last sync timestamp
     */
    async updateLastSync() {
        await this.updateConfig({ lastSync: new Date().toISOString() });
    }

    /**
     * Get last sync timestamp
     */
    async getLastSync() {
        const config = await this.getConfig();
        return config.lastSync;
    }

    /**
     * Clear configuration
     */
    async clearConfig() {
        try {
            await chrome.storage.local.remove([this.configKey]);
            log.info('Google Sheets configuration cleared');
        } catch (error) {
            log.error('Error clearing Google Sheets config:', error);
            throw error;
        }
    }

    /**
     * Validate configuration
     */
    async validateConfig() {
        const config = await this.getConfig();
        const errors = [];

        if (!config.sheetUrl) {
            errors.push('Sheet URL is required');
        }

        if (!config.sheetName) {
            errors.push('Sheet name is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Export a default instance
export const googleSheetsConfig = new GoogleSheetsConfig();
