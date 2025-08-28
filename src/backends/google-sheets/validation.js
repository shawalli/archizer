/**
 * Google Sheets Data Validation and Sanitization
 * Ensures data integrity when importing from Google Sheets to browser storage
 */

import { specializedLogger as log } from '../../utils/logger.js';

export class GoogleSheetsValidator {
    constructor() {
        this.maxTextLength = 1000; // Maximum text field length
        this.maxTagsCount = 20; // Maximum number of tags per order
        this.maxTagLength = 50; // Maximum individual tag length
        this.maxUsernameLength = 100; // Maximum username length
        this.maxOrderIdLength = 50; // Maximum order ID length
        this.maxActionTypeLength = 20; // Maximum action type length
        this.maxBrowserInfoLength = 200; // Maximum browser info length
    }

    /**
     * Validate and sanitize hidden orders data from Google Sheets
     * @param {Array} sheetRows - Raw rows from Google Sheets HiddenOrders
     * @returns {Object} Validation result with sanitized data and errors
     */
    validateHiddenOrders(sheetRows) {
        const result = {
            isValid: true,
            sanitizedData: [],
            errors: [],
            warnings: []
        };

        if (!Array.isArray(sheetRows)) {
            result.isValid = false;
            result.errors.push('Hidden orders data must be an array');
            return result;
        }

        sheetRows.forEach((row, index) => {
            const rowValidation = this.validateHiddenOrderRow(row, index);

            if (!rowValidation.isValid) {
                result.isValid = false;
                result.errors.push(...rowValidation.errors);
            }

            if (rowValidation.warnings.length > 0) {
                result.warnings.push(...rowValidation.warnings);
            }

            if (rowValidation.sanitizedData) {
                result.sanitizedData.push(rowValidation.sanitizedData);
            }
        });

        return result;
    }

    /**
     * Validate and sanitize a single hidden order row
     * @param {Array} row - Single row from Google Sheets
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result for this row
     */
    validateHiddenOrderRow(row, index) {
        const result = {
            isValid: true,
            sanitizedData: null,
            errors: [],
            warnings: []
        };

        try {
            // Check if row has minimum required columns
            if (!Array.isArray(row) || row.length < 6) {
                result.isValid = false;
                result.errors.push(`Row ${index + 1}: Insufficient columns (expected 6, got ${row.length || 0})`);
                return result;
            }

            const [orderId, orderDate, username, tags, hiddenType, timestamp] = row;

            // Validate and sanitize order ID
            const orderIdValidation = this.validateOrderId(orderId, index);
            if (!orderIdValidation.isValid) {
                result.isValid = false;
                result.errors.push(...orderIdValidation.errors);
            }

            // Validate and sanitize order date
            const orderDateValidation = this.validateOrderDate(orderDate, index);
            if (!orderDateValidation.isValid) {
                result.isValid = false;
                result.errors.push(...orderDateValidation.errors);
            }

            // Validate and sanitize username
            const usernameValidation = this.validateUsername(username, index);
            if (!usernameValidation.isValid) {
                result.isValid = false;
                result.errors.push(...usernameValidation.errors);
            }

            // Validate and sanitize tags
            const tagsValidation = this.validateTags(tags, index);
            if (!tagsValidation.isValid) {
                result.isValid = false;
                result.errors.push(...tagsValidation.errors);
            }

            // Validate and sanitize hidden type
            const hiddenTypeValidation = this.validateHiddenType(hiddenType, index);
            if (!hiddenTypeValidation.isValid) {
                result.isValid = false;
                result.errors.push(...hiddenTypeValidation.errors);
            }

            // Validate and sanitize timestamp
            const timestampValidation = this.validateTimestamp(timestamp, index);
            if (!timestampValidation.isValid) {
                result.isValid = false;
                result.errors.push(...timestampValidation.errors);
            }

            // If all validations pass, create sanitized data
            if (result.isValid) {
                result.sanitizedData = {
                    orderId: orderIdValidation.sanitizedValue,
                    orderDate: orderDateValidation.sanitizedValue,
                    username: usernameValidation.sanitizedValue,
                    tags: tagsValidation.sanitizedValue,
                    hiddenType: hiddenTypeValidation.sanitizedValue,
                    timestamp: timestampValidation.sanitizedValue
                };
            }

        } catch (error) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Unexpected error during validation: ${error.message}`);
        }

        return result;
    }

    /**
     * Validate and sanitize action log data from Google Sheets
     * @param {Array} sheetRows - Raw rows from Google Sheets ActionLog
     * @returns {Object} Validation result with sanitized data and errors
     */
    validateActionLog(sheetRows) {
        const result = {
            isValid: true,
            sanitizedData: [],
            errors: [],
            warnings: []
        };

        if (!Array.isArray(sheetRows)) {
            result.isValid = false;
            result.errors.push('Action log data must be an array');
            return result;
        }

        sheetRows.forEach((row, index) => {
            const rowValidation = this.validateActionLogRow(row, index);

            if (!rowValidation.isValid) {
                result.isValid = false;
                result.errors.push(...rowValidation.errors);
            }

            if (rowValidation.warnings.length > 0) {
                result.warnings.push(...rowValidation.warnings);
            }

            if (rowValidation.sanitizedData) {
                result.sanitizedData.push(rowValidation.sanitizedData);
            }
        });

        return result;
    }

    /**
     * Validate and sanitize a single action log row
     * @param {Array} row - Single row from Google Sheets
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result for this row
     */
    validateActionLogRow(row, index) {
        const result = {
            isValid: true,
            sanitizedData: null,
            errors: [],
            warnings: []
        };

        try {
            // Check if row has minimum required columns
            if (!Array.isArray(row) || row.length < 6) {
                result.isValid = false;
                result.errors.push(`Row ${index + 1}: Insufficient columns (expected 6, got ${row.length || 0})`);
                return result;
            }

            const [actionType, orderId, username, tags, timestamp, browserInfo] = row;

            // Validate and sanitize action type
            const actionTypeValidation = this.validateActionType(actionType, index);
            if (!actionTypeValidation.isValid) {
                result.isValid = false;
                result.errors.push(...actionTypeValidation.errors);
            }

            // Validate and sanitize order ID
            const orderIdValidation = this.validateOrderId(orderId, index);
            if (!orderIdValidation.isValid) {
                result.isValid = false;
                result.errors.push(...orderIdValidation.errors);
            }

            // Validate and sanitize username
            const usernameValidation = this.validateUsername(username, index);
            if (!usernameValidation.isValid) {
                result.isValid = false;
                result.errors.push(...usernameValidation.errors);
            }

            // Validate and sanitize tags
            const tagsValidation = this.validateTags(tags, index);
            if (!tagsValidation.isValid) {
                result.isValid = false;
                result.errors.push(...tagsValidation.errors);
            }

            // Validate and sanitize timestamp
            const timestampValidation = this.validateTimestamp(timestamp, index);
            if (!timestampValidation.isValid) {
                result.isValid = false;
                result.errors.push(...timestampValidation.errors);
            }

            // Validate and sanitize browser info
            const browserInfoValidation = this.validateBrowserInfo(browserInfo, index);
            if (!browserInfoValidation.isValid) {
                result.isValid = false;
                result.errors.push(...browserInfoValidation.errors);
            }

            // If all validations pass, create sanitized data
            if (result.isValid) {
                result.sanitizedData = {
                    actionType: actionTypeValidation.sanitizedValue,
                    orderId: orderIdValidation.sanitizedValue,
                    username: usernameValidation.sanitizedValue,
                    tags: tagsValidation.sanitizedValue,
                    timestamp: timestampValidation.sanitizedValue,
                    browserInfo: browserInfoValidation.sanitizedValue
                };
            }

        } catch (error) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Unexpected error during validation: ${error.message}`);
        }

        return result;
    }

    /**
     * Validate and sanitize user settings data from Google Sheets
     * @param {Array} sheetRows - Raw rows from Google Sheets UserSettings
     * @returns {Object} Validation result with sanitized data and errors
     */
    validateUserSettings(sheetRows) {
        const result = {
            isValid: true,
            sanitizedData: [],
            errors: [],
            warnings: []
        };

        if (!Array.isArray(sheetRows)) {
            result.isValid = false;
            result.errors.push('User settings data must be an array');
            return result;
        }

        sheetRows.forEach((row, index) => {
            const rowValidation = this.validateUserSettingsRow(row, index);

            if (!rowValidation.isValid) {
                result.isValid = false;
                result.errors.push(...rowValidation.errors);
            }

            if (rowValidation.warnings.length > 0) {
                result.warnings.push(...rowValidation.warnings);
            }

            if (rowValidation.sanitizedData) {
                result.sanitizedData.push(rowValidation.sanitizedData);
            }
        });

        return result;
    }

    /**
     * Validate and sanitize a single user settings row
     * @param {Array} row - Single row from Google Sheets
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result for this row
     */
    validateUserSettingsRow(row, index) {
        const result = {
            isValid: true,
            sanitizedData: null,
            errors: [],
            warnings: []
        };

        try {
            // Check if row has minimum required columns
            if (!Array.isArray(row) || row.length < 2) {
                result.isValid = false;
                result.errors.push(`Row ${index + 1}: Insufficient columns (expected 2, got ${row.length || 0})`);
                return result;
            }

            const [username, timestamp] = row;

            // Validate and sanitize username
            const usernameValidation = this.validateUsername(username, index);
            if (!usernameValidation.isValid) {
                result.isValid = false;
                result.errors.push(...usernameValidation.errors);
            }

            // Validate and sanitize timestamp
            const timestampValidation = this.validateTimestamp(timestamp, index);
            if (!timestampValidation.isValid) {
                result.isValid = false;
                result.errors.push(...timestampValidation.errors);
            }

            // If all validations pass, create sanitized data
            if (result.isValid) {
                result.sanitizedData = {
                    username: usernameValidation.sanitizedValue,
                    timestamp: timestampValidation.sanitizedValue
                };
            }

        } catch (error) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Unexpected error during validation: ${error.message}`);
        }

        return result;
    }

    /**
     * Validate and sanitize order ID
     * @param {string} orderId - Order ID to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateOrderId(orderId, index) {
        const result = {
            isValid: true,
            sanitizedValue: null,
            errors: [],
            warnings: []
        };

        if (!orderId || typeof orderId !== 'string') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Order ID must be a non-empty string`);
            return result;
        }

        const trimmed = orderId.trim();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Order ID cannot be empty or whitespace only`);
            return result;
        }

        if (trimmed.length > this.maxOrderIdLength) {
            result.warnings.push(`Row ${index + 1}: Order ID exceeds maximum length (${this.maxOrderIdLength}), truncating`);
            result.sanitizedValue = trimmed.substring(0, this.maxOrderIdLength);
        } else {
            result.sanitizedValue = trimmed;
        }

        return result;
    }

    /**
     * Validate and sanitize order date
     * @param {string} orderDate - Order date to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateOrderDate(orderDate, index) {
        const result = {
            isValid: true,
            sanitizedValue: null,
            errors: [],
            warnings: []
        };

        if (!orderDate || typeof orderDate !== 'string') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Order date must be a non-empty string`);
            return result;
        }

        const trimmed = orderDate.trim();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Order date cannot be empty or whitespace only`);
            return result;
        }

        // Try to parse the date
        const parsedDate = new Date(trimmed);
        if (isNaN(parsedDate.getTime())) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Invalid date format: ${trimmed}`);
            return result;
        }

        // Check if date is reasonable (not too far in past or future)
        const now = new Date();
        const yearDiff = Math.abs(now.getFullYear() - parsedDate.getFullYear());
        if (yearDiff > 50) {
            result.warnings.push(`Row ${index + 1}: Date seems unusual (${yearDiff} years from now): ${trimmed}`);
        }

        result.sanitizedValue = parsedDate.toISOString();
        return result;
    }

    /**
     * Validate and sanitize username
     * @param {string} username - Username to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateUsername(username, index) {
        const result = {
            isValid: true,
            sanitizedValue: null,
            errors: [],
            warnings: []
        };

        if (!username || typeof username !== 'string') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Username must be a non-empty string`);
            return result;
        }

        const trimmed = username.trim();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Username cannot be empty or whitespace only`);
            return result;
        }

        if (trimmed.length > this.maxUsernameLength) {
            result.warnings.push(`Row ${index + 1}: Username exceeds maximum length (${this.maxUsernameLength}), truncating`);
            result.sanitizedValue = trimmed.substring(0, this.maxUsernameLength);
        } else {
            result.sanitizedValue = trimmed;
        }

        return result;
    }

    /**
     * Validate and sanitize tags
     * @param {string} tags - Tags string to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateTags(tags, index) {
        const result = {
            isValid: true,
            sanitizedValue: [],
            errors: [],
            warnings: []
        };

        if (!tags || typeof tags !== 'string') {
            // Tags are optional, return empty array
            return result;
        }

        const trimmed = tags.trim();
        if (trimmed.length === 0) {
            // Empty tags string, return empty array
            return result;
        }

        // Split by comma and clean up each tag
        const tagArray = trimmed.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        if (tagArray.length > this.maxTagsCount) {
            result.warnings.push(`Row ${index + 1}: Too many tags (${tagArray.length}), limiting to ${this.maxTagsCount}`);
            tagArray.splice(this.maxTagsCount);
        }

        // Validate individual tags
        const sanitizedTags = [];
        tagArray.forEach((tag, tagIndex) => {
            if (tag.length > this.maxTagLength) {
                result.warnings.push(`Row ${index + 1}, Tag ${tagIndex + 1}: Tag exceeds maximum length (${this.maxTagLength}), truncating`);
                sanitizedTags.push(tag.substring(0, this.maxTagLength));
            } else {
                sanitizedTags.push(tag);
            }
        });

        result.sanitizedValue = sanitizedTags;
        return result;
    }

    /**
     * Validate and sanitize hidden type
     * @param {string} hiddenType - Hidden type to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateHiddenType(hiddenType, index) {
        const result = {
            isValid: true,
            sanitizedValue: null,
            errors: [],
            warnings: []
        };

        if (!hiddenType || typeof hiddenType !== 'string') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Hidden type must be a non-empty string`);
            return result;
        }

        const trimmed = hiddenType.trim().toLowerCase();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Hidden type cannot be empty or whitespace only`);
            return result;
        }

        // Only allow 'details' as per the simplified schema
        if (trimmed !== 'details') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Invalid hidden type '${trimmed}'. Only 'details' is allowed.`);
            return result;
        }

        result.sanitizedValue = trimmed;
        return result;
    }

    /**
     * Validate and sanitize action type
     * @param {string} actionType - Action type to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateActionType(actionType, index) {
        const result = {
            isValid: true,
            sanitizedValue: null,
            errors: [],
            warnings: []
        };

        if (!actionType || typeof actionType !== 'string') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Action type must be a non-empty string`);
            return result;
        }

        const trimmed = actionType.trim().toLowerCase();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Action type cannot be empty or whitespace only`);
            return result;
        }

        // Validate against allowed action types
        const allowedActions = ['hide', 'unhide'];
        if (!allowedActions.includes(trimmed)) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Invalid action type '${trimmed}'. Allowed values: ${allowedActions.join(', ')}`);
            return result;
        }

        if (trimmed.length > this.maxActionTypeLength) {
            result.warnings.push(`Row ${index + 1}: Action type exceeds maximum length (${this.maxActionTypeLength}), truncating`);
            result.sanitizedValue = trimmed.substring(0, this.maxActionTypeLength);
        } else {
            result.sanitizedValue = trimmed;
        }

        return result;
    }

    /**
     * Validate and sanitize timestamp
     * @param {string} timestamp - Timestamp to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateTimestamp(timestamp, index) {
        const result = {
            isValid: true,
            sanitizedValue: null,
            errors: [],
            warnings: []
        };

        if (!timestamp || typeof timestamp !== 'string') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Timestamp must be a non-empty string`);
            return result;
        }

        const trimmed = timestamp.trim();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Timestamp cannot be empty or whitespace only`);
            return result;
        }

        // Try to parse the timestamp
        const parsedDate = new Date(trimmed);
        if (isNaN(parsedDate.getTime())) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Invalid timestamp format: ${trimmed}`);
            return result;
        }

        // Check if timestamp is reasonable (not too far in past or future)
        const now = new Date();
        const timeDiff = Math.abs(now.getTime() - parsedDate.getTime());
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        if (daysDiff > 365 * 10) { // More than 10 years
            result.warnings.push(`Row ${index + 1}: Timestamp seems unusual (${Math.round(daysDiff)} days from now): ${trimmed}`);
        }

        result.sanitizedValue = parsedDate.toISOString();
        return result;
    }

    /**
     * Validate and sanitize browser info
     * @param {string} browserInfo - Browser info to validate
     * @param {number} index - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateBrowserInfo(browserInfo, index) {
        const result = {
            isValid: true,
            sanitizedValue: null,
            errors: [],
            warnings: []
        };

        if (!browserInfo || typeof browserInfo !== 'string') {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Browser info must be a non-empty string`);
            return result;
        }

        const trimmed = browserInfo.trim();
        if (trimmed.length === 0) {
            result.isValid = false;
            result.errors.push(`Row ${index + 1}: Browser info cannot be empty or whitespace only`);
            return result;
        }

        if (trimmed.length > this.maxBrowserInfoLength) {
            result.warnings.push(`Row ${index + 1}: Browser info exceeds maximum length (${this.maxBrowserInfoLength}), truncating`);
            result.sanitizedValue = trimmed.substring(0, this.maxBrowserInfoLength);
        } else {
            result.sanitizedValue = trimmed;
        }

        return result;
    }

    /**
     * Get validation statistics
     * @param {Object} validationResult - Result from any validation method
     * @returns {Object} Statistics about the validation
     */
    getValidationStats(validationResult) {
        const totalRows = validationResult.sanitizedData.length + validationResult.errors.length;
        const successRate = totalRows > 0 ?
            Math.round((validationResult.sanitizedData.length / totalRows) * 1000) / 10 : 0;

        return {
            totalRows,
            validRows: validationResult.sanitizedData.length,
            errorRows: validationResult.errors.length,
            warningRows: validationResult.warnings.length,
            successRate
        };
    }
}

// Export default instance
export const defaultValidator = new GoogleSheetsValidator();
