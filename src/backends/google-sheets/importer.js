/**
 * Google Sheets Data Import/Sync Utilities
 * Converts Google Sheets data into browser storage format for caching
 * 
 * This module handles the transformation between Google Sheets format
 * and local storage format, enabling Google Sheets as the backend.
 */

import { defaultSchema } from './schema.js';
import { defaultValidator } from './validation.js';
import { specializedLogger as log } from '../../utils/logger.js';

export class GoogleSheetsImporter {
    constructor() {
        this.schema = defaultSchema;
    }

    /**
     * Import hidden orders data from Google Sheets format to browser storage
     * @param {Array} sheetRows - Array of rows from Google Sheets HiddenOrders
     * @returns {Object} Import result with validated data and validation info
     */
    importHiddenOrders(sheetRows) {
        try {
            log.info('Importing hidden orders from Google Sheets format...');

            // Validate and sanitize the data first
            const validationResult = defaultValidator.validateHiddenOrders(sheetRows);

            if (!validationResult.isValid) {
                log.warn('Hidden orders validation failed:', validationResult.errors);
            }

            if (validationResult.warnings.length > 0) {
                log.warn('Hidden orders validation warnings:', validationResult.warnings);
            }

            // Get validation statistics
            const stats = defaultValidator.getValidationStats(validationResult);
            log.info(`Hidden orders import complete. ${stats.validRows}/${stats.totalRows} rows valid (${stats.successRate}% success rate)`);

            return {
                data: validationResult.sanitizedData,
                validation: {
                    isValid: validationResult.isValid,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    stats: stats
                }
            };

        } catch (error) {
            log.error('Error importing hidden orders:', error);
            throw error;
        }
    }

    /**
     * Import action log data from Google Sheets format to browser storage
     * @param {Array} sheetRows - Array of rows from Google Sheets ActionLog
     * @returns {Object} Import result with validated data and validation info
     */
    importActionLog(sheetRows) {
        try {
            log.info('Importing action log from Google Sheets format...');

            // Validate and sanitize the data first
            const validationResult = defaultValidator.validateActionLog(sheetRows);

            if (!validationResult.isValid) {
                log.warn('Action log validation failed:', validationResult.errors);
            }

            if (validationResult.warnings.length > 0) {
                log.warn('Action log validation warnings:', validationResult.warnings);
            }

            // Get validation statistics
            const stats = defaultValidator.getValidationStats(validationResult);
            log.info(`Action log import complete. ${stats.validRows}/${stats.totalRows} rows valid (${stats.successRate}% success rate)`);

            return {
                data: validationResult.sanitizedData,
                validation: {
                    isValid: validationResult.isValid,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    stats: stats
                }
            };

        } catch (error) {
            log.error('Error importing action log:', error);
            throw error;
        }
    }

    /**
     * Import user settings data from Google Sheets format to browser storage
     * @param {Array} sheetRows - Array of rows from Google Sheets UserSettings
     * @returns {Object} Import result with validated data and validation info
     */
    importUserSettings(sheetRows) {
        try {
            log.info('Importing user settings from Google Sheets format...');

            // Validate and sanitize the data first
            const validationResult = defaultValidator.validateUserSettings(sheetRows);

            if (!validationResult.isValid) {
                log.warn('User settings validation failed:', validationResult.errors);
            }

            if (validationResult.warnings.length > 0) {
                log.warn('User settings validation warnings:', validationResult.warnings);
            }

            // Get validation statistics
            const stats = defaultValidator.getValidationStats(validationResult);
            log.info(`User settings import complete. ${stats.validRows}/${stats.totalRows} rows valid (${stats.successRate}% success rate)`);

            return {
                data: validationResult.sanitizedData,
                validation: {
                    isValid: validationResult.isValid,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    stats: stats
                }
            };

        } catch (error) {
            log.error('Error importing user settings:', error);
            throw error;
        }
    }

    /**
     * Import all data from Google Sheets format to browser storage
     * @param {Object} sheetsData - Complete sheets data object
     * @returns {Object} All formatted data ready for browser storage
     */
    importAllData(sheetsData) {
        try {
            log.info('Importing all data from Google Sheets format...');

            const result = {
                timestamp: new Date().toISOString(),
                imported: {}
            };

            // Import each data type
            if (sheetsData.hiddenOrders) {
                result.imported.hiddenOrders = this.importHiddenOrders(sheetsData.hiddenOrders);
            }

            if (sheetsData.actionLog) {
                result.imported.actionLog = this.importActionLog(sheetsData.actionLog);
            }

            if (sheetsData.userSettings) {
                result.imported.userSettings = this.importUserSettings(sheetsData.userSettings);
            }

            // Collect validation summary
            const validationSummary = {
                totalErrors: 0,
                totalWarnings: 0,
                successRates: {}
            };

            Object.entries(result.imported).forEach(([key, importResult]) => {
                if (importResult.validation) {
                    validationSummary.totalErrors += importResult.validation.errors.length;
                    validationSummary.totalWarnings += importResult.validation.warnings.length;
                    validationSummary.successRates[key] = importResult.validation.stats.successRate;
                }
            });

            result.validationSummary = validationSummary;

            if (validationSummary.totalErrors > 0) {
                log.warn(`Import completed with ${validationSummary.totalErrors} errors and ${validationSummary.totalWarnings} warnings`);
            } else if (validationSummary.totalWarnings > 0) {
                log.warn(`Import completed with ${validationSummary.totalWarnings} warnings`);
            } else {
                log.success('All data imported successfully with no validation issues');
            }

            return result;
        } catch (error) {
            log.error('Error importing all data:', error);
            throw error;
        }
    }

    /**
     * Get headers for HiddenOrders sheet
     * @returns {Array} Array of column headers
     */
    getHiddenOrdersHeaders() {
        return this.schema.sheets.hiddenOrders.columns.map(col => col.displayName);
    }

    /**
     * Get headers for ActionLog sheet
     * @returns {Array} Array of column headers
     */
    getActionLogHeaders() {
        return this.schema.sheets.actionLog.columns.map(col => col.displayName);
    }

    /**
     * Get headers for UserSettings sheet
     * @returns {Array} Array of column headers
     */
    getUserSettingsHeaders() {
        return this.schema.sheets.userSettings.columns.map(col => col.displayName);
    }

    /**
     * Parse a hidden order row from Google Sheets format to browser storage format
     * @param {Array} row - Row data from Google Sheets
     * @param {number} index - Row index for error reporting
     * @returns {Object|null} Parsed order data or null if invalid
     */
    parseHiddenOrderRow(row, index) {
        try {
            // Validate row structure
            if (!Array.isArray(row) || row.length < 8) {
                log.warning(`Skipping invalid hidden order row ${index}: insufficient columns`);
                return null;
            }

            // Parse the row according to schema
            const order = {
                orderId: row[0] || '',
                orderData: {
                    orderDate: row[1] || null,
                    tags: this.parseTagsFromSheets(row[5]),
                    notes: row[6] || ''
                },
                username: row[2] || 'Unknown User',
                timestamp: row[3] || new Date().toISOString(),
                type: row[4] || 'details',
                lastModified: row[7] || new Date().toISOString()
            };

            // Validate the parsed data
            const validation = this.schema.validateData('hiddenOrders', order);
            if (!validation.valid) {
                log.warning(`Skipping invalid hidden order row ${index}:`, validation.errors);
                return null;
            }

            return order;
        } catch (error) {
            log.error(`Error parsing hidden order row ${index}:`, error);
            return null;
        }
    }

    /**
     * Parse an action log row from Google Sheets format to browser storage format
     * @param {Array} row - Row data from Google Sheets
     * @param {number} index - Row index for error reporting
     * @returns {Object|null} Parsed action data or null if invalid
     */
    parseActionLogRow(row, index) {
        try {
            // Validate row structure
            if (!Array.isArray(row) || row.length < 8) {
                log.warning(`Skipping invalid action log row ${index}: insufficient columns`);
                return null;
            }

            // Parse the row according to schema
            const action = {
                timestamp: row[0] || new Date().toISOString(),
                orderId: row[1] || '',
                action: row[2] || 'hide',
                type: row[3] || 'details',
                username: row[4] || 'Unknown User',
                orderData: {
                    tags: this.parseTagsFromSheets(row[5]),
                    notes: row[6] || ''
                },
                browserInfo: row[7] || ''
            };

            // Validate the parsed data
            const validation = this.schema.validateData('actionLog', action);
            if (!validation.valid) {
                log.warning(`Skipping invalid action log row ${index}:`, validation.errors);
                return null;
            }

            return action;
        } catch (error) {
            log.error(`Error parsing action log row ${index}:`, error);
            return null;
        }
    }

    /**
     * Parse a user settings row from Google Sheets format to browser storage format
     * @param {Array} row - Row data from Google Sheets
     * @param {number} index - Row index for error reporting
     * @returns {Object|null} Parsed user data or null if invalid
     */
    parseUserSettingsRow(row, index) {
        try {
            // Validate row structure
            if (!Array.isArray(row) || row.length < 4) {
                log.warning(`Skipping invalid user settings row ${index}: insufficient columns`);
                return null;
            }

            // Parse the row according to schema
            const user = {
                username: row[0] || '',
                createdAt: row[1] || new Date().toISOString(),
                lastActive: row[2] || new Date().toISOString(),
                isActive: row[3] === true || row[3] === 'true' || row[3] === 1
            };

            // Validate the parsed data
            const validation = this.schema.validateData('userSettings', user);
            if (!validation.valid) {
                log.warning(`Skipping invalid user settings row ${index}:`, validation.errors);
                return null;
            }

            return user;
        } catch (error) {
            log.error(`Error parsing user settings row ${index}:`, error);
            return null;
        }
    }

    /**
     * Format date for Google Sheets (YYYY-MM-DD format)
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDateForSheets(date) {
        try {
            if (!date) return '';

            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return '';

            return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        } catch (error) {
            log.warning('Error formatting date for sheets:', error);
            return '';
        }
    }

    /**
     * Format date/time for Google Sheets (ISO 8601 format)
     * @param {string|Date} dateTime - Date/time to format
     * @returns {string} Formatted date/time string
     */
    formatDateTimeForSheets(dateTime) {
        try {
            if (!dateTime) return '';

            const dateObj = new Date(dateTime);
            if (isNaN(dateObj.getTime())) return '';

            return dateObj.toISOString();
        } catch (error) {
            log.warning('Error formatting date/time for sheets:', error);
            return '';
        }
    }

    /**
 * Parse tags from Google Sheets format (comma-separated string to array)
 * @param {string} tagsString - Tags string from Google Sheets
 * @returns {Array} Parsed tags array
 */
    parseTagsFromSheets(tagsString) {
        try {
            if (!tagsString || typeof tagsString !== 'string') return [];

            // Split by comma and clean up each tag
            return tagsString
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        } catch (error) {
            log.warning('Error parsing tags from sheets:', error);
            return [];
        }
    }

    /**
     * Get current browser information
     * @returns {string} Browser and version information
     */
    getBrowserInfo() {
        try {
            const userAgent = navigator.userAgent;

            // Detect Chrome
            if (userAgent.includes('Chrome')) {
                const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
                if (chromeMatch) {
                    return `Chrome ${chromeMatch[1]}`;
                }
            }

            // Detect Arc (based on user agent patterns)
            if (userAgent.includes('Arc')) {
                const arcMatch = userAgent.match(/Arc\/(\d+\.\d+\.\d+)/);
                if (arcMatch) {
                    return `Arc ${arcMatch[1]}`;
                }
                return 'Arc (version unknown)';
            }

            // Detect Edge
            if (userAgent.includes('Edg')) {
                const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
                if (edgeMatch) {
                    return `Edge ${edgeMatch[1]}`;
                }
            }

            // Fallback
            return userAgent.split(' ')[0] || 'Unknown Browser';
        } catch (error) {
            log.warning('Error getting browser info:', error);
            return 'Unknown Browser';
        }
    }

    /**
     * Generate CSV format for a sheet
     * @param {Object} sheetData - Formatted sheet data
     * @returns {string} CSV string
     */
    generateCSV(sheetData) {
        try {
            if (!sheetData || !sheetData.headers || !sheetData.rows) {
                throw new Error('Invalid sheet data format');
            }

            const csvRows = [];

            // Add headers
            csvRows.push(sheetData.headers.join(','));

            // Add data rows
            sheetData.rows.forEach(row => {
                const escapedRow = row.map(cell => {
                    if (cell === null || cell === undefined) return '';
                    const cellStr = String(cell);
                    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                });
                csvRows.push(escapedRow.join(','));
            });

            return csvRows.join('\n');
        } catch (error) {
            log.error('Error generating CSV:', error);
            throw error;
        }
    }

    /**
     * Generate JSON format for a sheet
     * @param {Object} sheetData - Formatted sheet data
     * @returns {string} JSON string
     */
    generateJSON(sheetData) {
        try {
            if (!sheetData || !sheetData.headers || !sheetData.rows) {
                throw new Error('Invalid sheet data format');
            }

            const jsonData = sheetData.rows.map(row => {
                const obj = {};
                sheetData.headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });

            return JSON.stringify(jsonData, null, 2);
        } catch (error) {
            log.error('Error generating JSON:', error);
            throw error;
        }
    }
}

// Export a default instance
export const defaultImporter = new GoogleSheetsImporter();
