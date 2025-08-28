/**
 * Google Sheets Sync Orchestration
 * Manages the complete resync flow: clear cache → pull from sheets → rebuild cache
 * 
 * This module coordinates the resync process when users click the resync button,
 * ensuring Google Sheets remains the source of truth.
 */

import { defaultImporter } from './importer.js';
import { StorageManager } from '../local-storage/storage.js';
import { specializedLogger as log } from '../../utils/logger.js';

export class GoogleSheetsSync {
    constructor() {
        this.importer = defaultImporter;
        this.storage = new StorageManager();
        this.isSyncing = false;
    }

    /**
     * Perform a complete resync from Google Sheets
     * @param {Object} sheetsData - Raw data from Google Sheets API
     * @returns {Object} Sync result with statistics
     */
    async performResync(sheetsData) {
        if (this.isSyncing) {
            throw new Error('Sync already in progress');
        }

        this.isSyncing = true;
        log.info('Starting Google Sheets resync...');

        const result = {
            timestamp: new Date().toISOString(),
            steps: [],
            statistics: {
                hiddenOrders: { before: 0, after: 0 },
                actionLog: { before: 0, after: 0 },
                userSettings: { before: 0, after: 0 }
            }
        };

        try {

            // Step 1: Get current cache statistics
            result.steps.push('Getting current cache statistics...');
            const beforeStats = await this.getCacheStatistics();
            result.statistics.hiddenOrders.before = beforeStats.hiddenOrders;
            result.statistics.actionLog.before = beforeStats.actionLog;
            result.statistics.userSettings.before = beforeStats.userSettings;

            // Step 2: Clear existing cache
            result.steps.push('Clearing existing cache...');
            await this.clearCache();

            // Step 3: Import data from Google Sheets
            result.steps.push('Importing data from Google Sheets...');
            const importedData = await this.importFromSheets(sheetsData);

            // Step 4: Rebuild cache with imported data
            result.steps.push('Rebuilding cache with imported data...');
            await this.rebuildCache(importedData);

            // Step 5: Get final cache statistics
            result.steps.push('Getting final cache statistics...');
            const afterStats = await this.getCacheStatistics();
            result.statistics.hiddenOrders.after = afterStats.hiddenOrders;
            result.statistics.actionLog.after = afterStats.actionLog;
            result.statistics.userSettings.after = afterStats.userSettings;

            // Step 6: Validate sync integrity
            result.steps.push('Validating sync integrity...');
            const validationResult = await this.validateSyncIntegrity(importedData);
            result.validation = validationResult;

            log.success('Google Sheets resync completed successfully');
            result.success = true;
            return result;

        } catch (error) {
            log.error('Google Sheets resync failed:', error);
            result.success = false;
            result.error = error.message;
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Get current cache statistics
     * @returns {Object} Statistics about current cache
     */
    async getCacheStatistics() {
        try {
            const hiddenOrders = await this.storage.getAllHiddenOrders();
            const actionLog = await this.storage.getAllActionLog();
            const userSettings = await this.storage.getAllUserSettings();

            return {
                hiddenOrders: hiddenOrders.length,
                actionLog: actionLog.length,
                userSettings: userSettings.length
            };
        } catch (error) {
            log.warning('Error getting cache statistics:', error);
            return { hiddenOrders: 0, actionLog: 0, userSettings: 0 };
        }
    }

    /**
     * Clear existing cache completely
     */
    async clearCache() {
        try {
            log.info('Clearing existing cache...');

            // Get all storage keys
            const allData = await chrome.storage.local.get(null);
            const keysToRemove = [];

            // Find all keys that belong to our extension
            if (allData && typeof allData === 'object') {
                for (const key of Object.keys(allData)) {
                    if (key.startsWith('amazon_archiver_')) {
                        keysToRemove.push(key);
                    }
                }
            }

            // Remove all found keys
            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                log.success(`Cleared ${keysToRemove.length} cache entries`);
            } else {
                log.info('No cache entries found to clear');
            }
        } catch (error) {
            log.error('Error clearing cache:', error);
            throw error;
        }
    }

    /**
     * Import data from Google Sheets format
     * @param {Object} sheetsData - Raw data from Google Sheets API
     * @returns {Object} Imported and formatted data
     */
    async importFromSheets(sheetsData) {
        try {
            log.info('Importing data from Google Sheets...');

            // Use the importer to convert sheets data to browser storage format
            const importedData = this.importer.importAllData(sheetsData);

            // Log validation summary if available
            if (importedData.validationSummary) {
                const { totalErrors, totalWarnings, successRates } = importedData.validationSummary;
                log.info(`Validation Summary: ${totalErrors} errors, ${totalWarnings} warnings`);
                Object.entries(successRates).forEach(([dataType, rate]) => {
                    log.info(`${dataType}: ${rate}% success rate`);
                });
            }

            log.success('Data imported from Google Sheets successfully');
            return importedData;
        } catch (error) {
            log.error('Error importing from Google Sheets:', error);
            throw error;
        }
    }

    /**
     * Rebuild cache with imported data
     * @param {Object} importedData - Data imported from Google Sheets
     */
    async rebuildCache(importedData) {
        try {
            log.info('Rebuilding cache with imported data...');

            const promises = [];

            // Rebuild hidden orders cache
            if (importedData.imported.hiddenOrders && importedData.imported.hiddenOrders.data) {
                promises.push(this.rebuildHiddenOrdersCache(importedData.imported.hiddenOrders.data));
            }

            // Rebuild action log cache
            if (importedData.imported.actionLog && importedData.imported.actionLog.data) {
                promises.push(this.rebuildActionLogCache(importedData.imported.actionLog.data));
            }

            // Rebuild user settings cache
            if (importedData.imported.userSettings && importedData.imported.userSettings.data) {
                promises.push(this.rebuildUserSettingsCache(importedData.imported.userSettings.data));
            }

            // Wait for all cache rebuilds to complete
            await Promise.all(promises);

            log.success('Cache rebuilt successfully');
        } catch (error) {
            log.error('Error rebuilding cache:', error);
            throw error;
        }
    }

    /**
     * Rebuild hidden orders cache
     * @param {Array} hiddenOrders - Hidden orders data
     */
    async rebuildHiddenOrdersCache(hiddenOrders) {
        try {
            log.info(`Rebuilding hidden orders cache with ${hiddenOrders.length} orders...`);

            for (const order of hiddenOrders) {
                await this.storage.storeHiddenOrder(
                    order.orderId,
                    order.type,
                    order.orderData
                );
            }

            log.success(`Hidden orders cache rebuilt with ${hiddenOrders.length} orders`);
        } catch (error) {
            log.error('Error rebuilding hidden orders cache:', error);
            throw error;
        }
    }

    /**
     * Rebuild action log cache
     * @param {Array} actionLog - Action log data
     */
    async rebuildActionLogCache(actionLog) {
        try {
            log.info(`Rebuilding action log cache with ${actionLog.length} entries...`);

            for (const action of actionLog) {
                await this.storage.storeActionLog(action);
            }

            log.success(`Action log cache rebuilt with ${actionLog.length} entries`);
        } catch (error) {
            log.error('Error rebuilding action log cache:', error);
            throw error;
        }
    }

    /**
     * Rebuild user settings cache
     * @param {Array} userSettings - User settings data
     */
    async rebuildUserSettingsCache(userSettings) {
        try {
            log.info(`Rebuilding user settings cache with ${userSettings.length} users...`);

            for (const user of userSettings) {
                await this.storage.storeUserSettings(user);
            }

            log.success(`User settings cache rebuilt with ${userSettings.length} users`);
        } catch (error) {
            log.error('Error rebuilding user settings cache:', error);
            throw error;
        }
    }

    /**
     * Validate sync integrity
     * @param {Object} importedData - Data that was imported
     * @returns {Object} Validation results
     */
    async validateSyncIntegrity(importedData) {
        try {
            log.info('Validating sync integrity...');

            const validation = {
                timestamp: new Date().toISOString(),
                checks: [],
                passed: true
            };

            // Check if all imported data is now in cache
            const cacheStats = await this.getCacheStatistics();
            const expectedStats = {
                hiddenOrders: importedData.imported.hiddenOrders?.length || 0,
                actionLog: importedData.imported.actionLog?.length || 0,
                userSettings: importedData.imported.userSettings?.length || 0
            };

            // Validate hidden orders
            if (cacheStats.hiddenOrders === expectedStats.hiddenOrders) {
                validation.checks.push('Hidden orders count matches');
            } else {
                validation.checks.push(`Hidden orders count mismatch: expected ${expectedStats.hiddenOrders}, got ${cacheStats.hiddenOrders}`);
                validation.passed = false;
            }

            // Validate action log
            if (cacheStats.actionLog === expectedStats.actionLog) {
                validation.checks.push('Action log count matches');
            } else {
                validation.checks.push(`Action log count mismatch: expected ${expectedStats.actionLog}, got ${cacheStats.actionLog}`);
                validation.passed = false;
            }

            // Validate user settings
            if (cacheStats.userSettings === expectedStats.userSettings) {
                validation.checks.push('User settings count matches');
            } else {
                validation.checks.push(`User settings count mismatch: expected ${expectedStats.userSettings}, got ${cacheStats.userSettings}`);
                validation.passed = false;
            }

            if (validation.passed) {
                log.success('Sync integrity validation passed');
            } else {
                log.warning('Sync integrity validation failed');
            }

            return validation;
        } catch (error) {
            log.error('Error validating sync integrity:', error);
            return {
                timestamp: new Date().toISOString(),
                checks: [`Error during validation: ${error.message}`],
                passed: false
            };
        }
    }

    /**
     * Check if a resync is currently in progress
     * @returns {boolean} True if syncing is in progress
     */
    isResyncInProgress() {
        return this.isSyncing;
    }

    /**
     * Get sync status
     * @returns {Object} Current sync status
     */
    getSyncStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSync: this.lastSyncTimestamp,
            timestamp: new Date().toISOString()
        };
    }
}

// Export a default instance
export const defaultSync = new GoogleSheetsSync();
