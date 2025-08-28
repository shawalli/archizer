/**
 * Data Transformation Utilities for Google Sheets ↔ Local Storage
 * Handles conversion between Google Sheets format and local storage format
 * with comprehensive error handling and recovery mechanisms
 */

import { logger } from '../../utils/logger.js';

/**
 * Data Transformer for converting between Google Sheets and Local Storage formats
 */
export class GoogleSheetsTransformer {
    constructor() {
        this.transformErrors = [];
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
    }

    /**
     * Transform Google Sheets data to local storage format
     * @param {Object} sheetsData - Raw data from Google Sheets
     * @param {Array} sheetsData.hiddenOrders - Hidden orders sheet data
     * @param {Array} sheetsData.actionLog - Action log sheet data
     * @param {Array} sheetsData.userSettings - User settings sheet data
     * @returns {Object} Transformed data for local storage
     */
    transformFromSheets(sheetsData) {
        this.transformErrors = [];
        this.recoveryAttempts = 0;

        try {
            logger.debug('Starting transformation from Google Sheets format');

            const transformed = {
                hiddenOrders: this.transformHiddenOrdersFromSheets(sheetsData.hiddenOrders || []),
                actionLog: this.transformActionLogFromSheets(sheetsData.actionLog || []),
                userSettings: this.transformUserSettingsFromSheets(sheetsData.userSettings || []),
                metadata: {
                    transformedAt: new Date().toISOString(),
                    source: 'google-sheets',
                    version: '1.0'
                }
            };

            if (this.transformErrors.length > 0) {
                logger.warn(`Transformation completed with ${this.transformErrors.length} errors`, this.transformErrors);
            } else {
                logger.info('Transformation completed successfully');
            }

            return transformed;

        } catch (error) {
            logger.error('Critical error during transformation from sheets:', error);
            throw new Error(`Failed to transform Google Sheets data: ${error.message}`);
        }
    }

    /**
     * Transform local storage data to Google Sheets format
     * @param {Object} localData - Data from local storage
     * @param {Array} localData.hiddenOrders - Hidden orders from local storage
     * @param {Array} localData.actionLog - Action log from local storage
     * @param {Array} localData.userSettings - User settings from local storage
     * @returns {Object} Transformed data for Google Sheets
     */
    transformToSheets(localData) {
        this.transformErrors = [];
        this.recoveryAttempts = 0;

        try {
            logger.debug('Starting transformation to Google Sheets format');

            const transformed = {
                hiddenOrders: this.transformHiddenOrdersToSheets(localData.hiddenOrders || []),
                actionLog: this.transformActionLogToSheets(localData.actionLog || []),
                userSettings: this.transformUserSettingsToSheets(localData.userSettings || []),
                metadata: {
                    transformedAt: new Date().toISOString(),
                    source: 'local-storage',
                    version: '1.0'
                }
            };

            if (this.transformErrors.length > 0) {
                logger.warn(`Transformation completed with ${this.transformErrors.length} errors`, this.transformErrors);
            } else {
                logger.info('Transformation completed successfully');
            }

            return transformed;

        } catch (error) {
            logger.error('Critical error during transformation to sheets:', error);
            throw new Error(`Failed to transform local storage data: ${error.message}`);
        }
    }

    /**
     * Transform hidden orders from Google Sheets format to local storage format
     * @param {Array} sheetsHiddenOrders - Hidden orders from sheets
     * @returns {Array} Transformed hidden orders for local storage
     */
    transformHiddenOrdersFromSheets(sheetsHiddenOrders) {
        if (!Array.isArray(sheetsHiddenOrders)) {
            this.transformErrors.push('Hidden orders data is not an array');
            return [];
        }

        return sheetsHiddenOrders
            .map((row, index) => {
                try {
                    if (!row || row.length < 6) {
                        this.transformErrors.push(`Row ${index + 1}: Insufficient columns for hidden order`);
                        return null;
                    }

                    const [orderId, orderDate, hiddenBy, tags, hiddenType, hiddenAt, lastModified] = row;

                    // Validate required fields
                    if (!orderId || !hiddenBy || !hiddenAt) {
                        this.transformErrors.push(`Row ${index + 1}: Missing required fields (orderId, hiddenBy, or hiddenAt)`);
                        return null;
                    }

                    // Transform to local storage format
                    const transformed = {
                        orderId: String(orderId).trim(),
                        orderDate: orderDate ? String(orderDate).trim() : null,
                        hiddenBy: String(hiddenBy).trim(),
                        tags: tags ? String(tags).trim() : '',
                        hiddenType: hiddenType ? String(hiddenType).trim() : 'details',
                        hiddenAt: String(hiddenAt).trim(),
                        lastModified: lastModified ? String(lastModified).trim() : hiddenAt
                    };

                    // Validate transformed data
                    if (!this.validateTransformedHiddenOrder(transformed, index)) {
                        return null;
                    }

                    return transformed;

                } catch (error) {
                    this.transformErrors.push(`Row ${index + 1}: Transformation error: ${error.message}`);
                    return null;
                }
            })
            .filter(Boolean); // Remove null entries
    }

    /**
     * Transform hidden orders from local storage format to Google Sheets format
     * @param {Array} localHiddenOrders - Hidden orders from local storage
     * @returns {Array} Transformed hidden orders for Google Sheets
     */
    transformHiddenOrdersToSheets(localHiddenOrders) {
        if (!Array.isArray(localHiddenOrders)) {
            this.transformErrors.push('Local hidden orders data is not an array');
            return [];
        }

        return localHiddenOrders
            .map((order, index) => {
                try {
                    if (!order || typeof order !== 'object') {
                        this.transformErrors.push(`Order ${index + 1}: Invalid order object`);
                        return null;
                    }

                    // Transform to sheets format (array of values)
                    const transformed = [
                        order.orderId || '',
                        order.orderDate || '',
                        order.hiddenBy || '',
                        order.tags || '',
                        order.hiddenType || 'details',
                        order.hiddenAt || '',
                        order.lastModified || order.hiddenAt || ''
                    ];

                    // Validate transformed data
                    if (!this.validateTransformedSheetsRow(transformed, index, 'hiddenOrders')) {
                        return null;
                    }

                    return transformed;

                } catch (error) {
                    this.transformErrors.push(`Order ${index + 1}: Transformation error: ${error.message}`);
                    return null;
                }
            })
            .filter(Boolean); // Remove null entries
    }

    /**
     * Transform action log from Google Sheets format to local storage format
     * @param {Array} sheetsActionLog - Action log from sheets
     * @returns {Array} Transformed action log for local storage
     */
    transformActionLogFromSheets(sheetsActionLog) {
        if (!Array.isArray(sheetsActionLog)) {
            this.transformErrors.push('Action log data is not an array');
            return [];
        }

        return sheetsActionLog
            .map((row, index) => {
                try {
                    if (!row || row.length < 6) {
                        this.transformErrors.push(`Row ${index + 1}: Insufficient columns for action log`);
                        return null;
                    }

                    const [action, orderId, performedBy, timestamp, tags, browserInfo] = row;

                    // Validate required fields
                    if (!action || !orderId || !performedBy || !timestamp) {
                        this.transformErrors.push(`Row ${index + 1}: Missing required fields (action, orderId, performedBy, or timestamp)`);
                        return null;
                    }

                    // Transform to local storage format
                    const transformed = {
                        action: String(action).trim(),
                        orderId: String(orderId).trim(),
                        performedBy: String(performedBy).trim(),
                        timestamp: String(timestamp).trim(),
                        tags: tags ? String(tags).trim() : '',
                        browserInfo: browserInfo ? String(browserInfo).trim() : ''
                    };

                    // Validate transformed data
                    if (!this.validateTransformedActionLog(transformed, index)) {
                        return null;
                    }

                    return transformed;

                } catch (error) {
                    this.transformErrors.push(`Row ${index + 1}: Transformation error: ${error.message}`);
                    return null;
                }
            })
            .filter(Boolean); // Remove null entries
    }

    /**
     * Transform action log from local storage format to Google Sheets format
     * @param {Array} localActionLog - Action log from local storage
     * @returns {Array} Transformed action log for Google Sheets
     */
    transformActionLogToSheets(localActionLog) {
        if (!Array.isArray(localActionLog)) {
            this.transformErrors.push('Local action log data is not an array');
            return [];
        }

        return localActionLog
            .map((action, index) => {
                try {
                    if (!action || typeof action !== 'object') {
                        this.transformErrors.push(`Action ${index + 1}: Invalid action object`);
                        return null;
                    }

                    // Transform to sheets format (array of values)
                    const transformed = [
                        action.action || '',
                        action.orderId || '',
                        action.performedBy || '',
                        action.timestamp || '',
                        action.tags || '',
                        action.browserInfo || ''
                    ];

                    // Validate transformed data
                    if (!this.validateTransformedSheetsRow(transformed, index, 'actionLog')) {
                        return null;
                    }

                    return transformed;

                } catch (error) {
                    this.transformErrors.push(`Action ${index + 1}: Transformation error: ${error.message}`);
                    return null;
                }
            })
            .filter(Boolean); // Remove null entries
    }

    /**
     * Transform user settings from Google Sheets format to local storage format
     * @param {Array} sheetsUserSettings - User settings from sheets
     * @returns {Array} Transformed user settings for local storage
     */
    transformUserSettingsFromSheets(sheetsUserSettings) {
        if (!Array.isArray(sheetsUserSettings)) {
            this.transformErrors.push('User settings data is not an array');
            return [];
        }

        return sheetsUserSettings
            .map((row, index) => {
                try {
                    if (!row || row.length < 1) {
                        this.transformErrors.push(`Row ${index + 1}: Insufficient columns for user settings`);
                        return null;
                    }

                    const [username, lastModified] = row;

                    // Validate required fields
                    if (!username) {
                        this.transformErrors.push(`Row ${index + 1}: Missing required field (username)`);
                        return null;
                    }

                    // Transform to local storage format
                    const transformed = {
                        username: String(username).trim(),
                        lastModified: lastModified ? String(lastModified).trim() : new Date().toISOString()
                    };

                    // Validate transformed data
                    if (!this.validateTransformedUserSettings(transformed, index)) {
                        return null;
                    }

                    return transformed;

                } catch (error) {
                    this.transformErrors.push(`Row ${index + 1}: Transformation error: ${error.message}`);
                    return null;
                }
            })
            .filter(Boolean); // Remove null entries
    }

    /**
     * Transform user settings from local storage format to Google Sheets format
     * @param {Array} localUserSettings - User settings from local storage
     * @returns {Array} Transformed user settings for Google Sheets
     */
    transformUserSettingsToSheets(localUserSettings) {
        if (!Array.isArray(localUserSettings)) {
            this.transformErrors.push('Local user settings data is not an array');
            return [];
        }

        return localUserSettings
            .map((setting, index) => {
                try {
                    if (!setting || typeof setting !== 'object') {
                        this.transformErrors.push(`Setting ${index + 1}: Invalid setting object`);
                        return null;
                    }

                    // Transform to sheets format (array of values)
                    const transformed = [
                        setting.username || '',
                        setting.lastModified || new Date().toISOString()
                    ];

                    // Validate transformed data
                    if (!this.validateTransformedSheetsRow(transformed, index, 'userSettings')) {
                        return null;
                    }

                    return transformed;

                } catch (error) {
                    this.transformErrors.push(`Setting ${index + 1}: Transformation error: ${error.message}`);
                    return null;
                }
            })
            .filter(Boolean); // Remove null entries
    }

    /**
     * Validate transformed hidden order data
     * @param {Object} order - Transformed hidden order
     * @param {number} index - Row index for error reporting
     * @returns {boolean} Whether the order is valid
     */
    validateTransformedHiddenOrder(order, index) {
        if (!order.orderId || order.orderId.length > 50) {
            this.transformErrors.push(`Row ${index + 1}: Invalid order ID (empty or too long)`);
            return false;
        }

        if (order.hiddenBy && order.hiddenBy.length > 100) {
            this.transformErrors.push(`Row ${index + 1}: Username too long (max 100 characters)`);
            return false;
        }

        if (order.tags && order.tags.length > 500) {
            this.transformErrors.push(`Row ${index + 1}: Tags too long (max 500 characters)`);
            return false;
        }

        if (order.hiddenType && !['details'].includes(order.hiddenType)) {
            this.transformErrors.push(`Row ${index + 1}: Invalid hidden type: ${order.hiddenType}`);
            return false;
        }

        return true;
    }

    /**
     * Validate transformed action log data
     * @param {Object} action - Transformed action log entry
     * @param {number} index - Row index for error reporting
     * @returns {boolean} Whether the action is valid
     */
    validateTransformedActionLog(action, index) {
        if (!['hide', 'unhide'].includes(action.action)) {
            this.transformErrors.push(`Row ${index + 1}: Invalid action: ${action.action}`);
            return false;
        }

        if (!action.orderId || action.orderId.length > 50) {
            this.transformErrors.push(`Row ${index + 1}: Invalid order ID (empty or too long)`);
            return false;
        }

        if (action.performedBy && action.performedBy.length > 100) {
            this.transformErrors.push(`Row ${index + 1}: Username too long (max 100 characters)`);
            return false;
        }

        if (action.tags && action.tags.length > 500) {
            this.transformErrors.push(`Row ${index + 1}: Tags too long (max 500 characters)`);
            return false;
        }

        return true;
    }

    /**
     * Validate transformed user settings data
     * @param {Object} setting - Transformed user setting
     * @param {number} index - Row index for error reporting
     * @returns {boolean} Whether the setting is valid
     */
    validateTransformedUserSettings(setting, index) {
        if (!setting.username || setting.username.length > 100) {
            this.transformErrors.push(`Row ${index + 1}: Invalid username (empty or too long)`);
            return false;
        }

        return true;
    }

    /**
     * Validate transformed sheets row data
     * @param {Array} row - Transformed row data
     * @param {number} index - Row index for error reporting
     * @param {string} sheetType - Type of sheet for context
     * @returns {boolean} Whether the row is valid
     */
    validateTransformedSheetsRow(row, index, sheetType) {
        if (!Array.isArray(row)) {
            this.transformErrors.push(`Row ${index + 1}: Invalid row format for ${sheetType}`);
            return false;
        }

        // Check for empty or undefined values in required fields
        if (sheetType === 'hiddenOrders' && (!row[0] || !row[2] || !row[5])) {
            this.transformErrors.push(`Row ${index + 1}: Missing required fields for ${sheetType}`);
            return false;
        }

        if (sheetType === 'actionLog' && (!row[0] || !row[1] || !row[2] || !row[3])) {
            this.transformErrors.push(`Row ${index + 1}: Missing required fields for ${sheetType}`);
            return false;
        }

        if (sheetType === 'userSettings' && !row[0]) {
            this.transformErrors.push(`Row ${index + 1}: Missing required fields for ${sheetType}`);
            return false;
        }

        return true;
    }

    /**
     * Attempt to recover from transformation errors
     * @param {Object} originalData - Original data that failed transformation
     * @param {Array} errors - Array of transformation errors
     * @returns {Object|null} Recovered data or null if recovery failed
     */
    attemptRecovery(originalData, errors) {
        if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
            logger.error('Max recovery attempts reached, giving up');
            return null;
        }

        this.recoveryAttempts++;
        logger.warn(`Attempting recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

        try {
            // Try to recover by applying more lenient transformation rules
            const recovered = this.transformWithRecovery(originalData);

            if (recovered) {
                logger.info('Recovery successful');
                return recovered;
            }

        } catch (error) {
            logger.error('Recovery attempt failed:', error);
        }

        return null;
    }

    /**
     * Transform data with more lenient rules for recovery
     * @param {Object} data - Data to transform with recovery
     * @returns {Object|null} Recovered data or null if recovery failed
     */
    transformWithRecovery(data) {
        try {
            // Reset errors for recovery attempt
            this.transformErrors = [];

            // Apply more lenient transformation rules
            const recovered = {
                hiddenOrders: this.transformHiddenOrdersFromSheetsRecovery(data.hiddenOrders || []),
                actionLog: this.transformActionLogFromSheetsRecovery(data.actionLog || []),
                userSettings: this.transformUserSettingsFromSheetsRecovery(data.userSettings || []),
                metadata: {
                    transformedAt: new Date().toISOString(),
                    source: 'google-sheets',
                    version: '1.0',
                    recovered: true,
                    recoveryAttempt: this.recoveryAttempts
                }
            };

            return recovered;

        } catch (error) {
            logger.error('Recovery transformation failed:', error);
            return null;
        }
    }

    /**
     * Transform hidden orders with recovery rules
     * @param {Array} sheetsHiddenOrders - Hidden orders from sheets
     * @returns {Array} Recovered hidden orders
     */
    transformHiddenOrdersFromSheetsRecovery(sheetsHiddenOrders) {
        return sheetsHiddenOrders
            .map((row, index) => {
                try {
                    if (!row || row.length < 2) {
                        return null; // Skip rows with insufficient data
                    }

                    // Handle different column arrangements for recovery
                    let orderId, orderDate, hiddenBy, tags, hiddenType, hiddenAt, lastModified;

                    if (row.length === 2) {
                        // Minimal data: [orderId, hiddenBy]
                        [orderId, hiddenBy] = row;
                        orderDate = null;
                        tags = '';
                        hiddenType = 'details';
                        hiddenAt = new Date().toISOString();
                        lastModified = new Date().toISOString();
                    } else {
                        // Full data: [orderId, orderDate, hiddenBy, tags, hiddenType, hiddenAt, lastModified]
                        [orderId, orderDate, hiddenBy, tags, hiddenType, hiddenAt, lastModified] = row;
                    }

                    // More lenient validation for recovery
                    if (!orderId || !hiddenBy) {
                        return null; // Skip rows missing critical data
                    }

                    return {
                        orderId: String(orderId || '').trim(),
                        orderDate: orderDate ? String(orderDate).trim() : null,
                        hiddenBy: String(hiddenBy || '').trim(),
                        tags: tags ? String(tags).trim() : '',
                        hiddenType: 'details', // Default to safe value
                        hiddenAt: String(hiddenAt || new Date().toISOString()).trim(),
                        lastModified: lastModified ? String(lastModified).trim() : new Date().toISOString()
                    };

                } catch (error) {
                    return null; // Skip problematic rows
                }
            })
            .filter(Boolean);
    }

    /**
     * Transform action log with recovery rules
     * @param {Array} sheetsActionLog - Action log from sheets
     * @returns {Array} Recovered action log
     */
    transformActionLogFromSheetsRecovery(sheetsActionLog) {
        return sheetsActionLog
            .map((row, index) => {
                try {
                    if (!row || row.length < 3) {
                        return null; // Skip rows with insufficient data
                    }

                    const [action, orderId, performedBy, timestamp, tags, browserInfo] = row;

                    // More lenient validation for recovery
                    if (!action || !orderId || !performedBy) {
                        return null; // Skip rows missing critical data
                    }

                    return {
                        action: ['hide', 'unhide'].includes(action) ? action : 'hide', // Default to safe value
                        orderId: String(orderId || '').trim(),
                        performedBy: String(performedBy || '').trim(),
                        timestamp: String(timestamp || new Date().toISOString()).trim(),
                        tags: tags ? String(tags).trim() : '',
                        browserInfo: browserInfo ? String(browserInfo).trim() : ''
                    };

                } catch (error) {
                    return null; // Skip problematic rows
                }
            })
            .filter(Boolean);
    }

    /**
     * Transform user settings with recovery rules
     * @param {Array} sheetsUserSettings - User settings from sheets
     * @returns {Array} Recovered user settings
     */
    transformUserSettingsFromSheetsRecovery(sheetsUserSettings) {
        return sheetsUserSettings
            .map((row, index) => {
                try {
                    if (!row || row.length < 1) {
                        return null; // Skip rows with insufficient data
                    }

                    const [username, lastModified] = row;

                    // More lenient validation for recovery
                    if (!username) {
                        return null; // Skip rows missing critical data
                    }

                    return {
                        username: String(username || '').trim(),
                        lastModified: lastModified ? String(lastModified).trim() : new Date().toISOString()
                    };

                } catch (error) {
                    return null; // Skip problematic rows
                }
            })
            .filter(Boolean);
    }

    /**
     * Get transformation statistics
     * @returns {Object} Transformation statistics
     */
    getTransformationStats() {
        return {
            errors: this.transformErrors.length,
            recoveryAttempts: this.recoveryAttempts,
            maxRecoveryAttempts: this.maxRecoveryAttempts,
            hasErrors: this.transformErrors.length > 0,
            canRecover: this.recoveryAttempts < this.maxRecoveryAttempts
        };
    }

    /**
     * Clear transformation state
     */
    clearState() {
        this.transformErrors = [];
        this.recoveryAttempts = 0;
    }
}

/**
 * Default transformer instance
 */
export const defaultTransformer = new GoogleSheetsTransformer();
