/**
 * Validation Utility Functions
 * Consolidates common validation patterns to reduce code duplication
 */

/**
 * Validate if a string is not empty and has minimum length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum required length
 * @returns {boolean} Whether the string is valid
 */
export function isValidString(value, minLength = 1) {
    return typeof value === 'string' &&
        value.trim().length >= minLength;
}

/**
 * Validate if a value is a valid number
 * @param {*} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} Whether the value is a valid number
 */
export function isValidNumber(value, min = null, max = null) {
    if (typeof value !== 'number' || isNaN(value)) {
        return false;
    }

    if (min !== null && value < min) {
        return false;
    }

    if (max !== null && value > max) {
        return false;
    }

    return true;
}

/**
 * Validate if a value is a valid array
 * @param {*} value - Value to validate
 * @param {number} minLength - Minimum array length
 * @param {number} maxLength - Maximum array length
 * @returns {boolean} Whether the value is a valid array
 */
export function isValidArray(value, minLength = 0, maxLength = null) {
    if (!Array.isArray(value)) {
        return false;
    }

    if (value.length < minLength) {
        return false;
    }

    if (maxLength !== null && value.length > maxLength) {
        return false;
    }

    return true;
}

/**
 * Validate if a value is a valid object
 * @param {*} value - Value to validate
 * @param {string[]} requiredKeys - Required object keys
 * @returns {boolean} Whether the value is a valid object
 */
export function isValidObject(value, requiredKeys = []) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }

    if (requiredKeys.length > 0) {
        return requiredKeys.every(key => key in value);
    }

    return true;
}

/**
 * Validate if a value is a valid function
 * @param {*} value - Value to validate
 * @returns {boolean} Whether the value is a valid function
 */
export function isValidFunction(value) {
    return typeof value === 'function';
}

/**
 * Validate if a value is a valid DOM element
 * @param {*} value - Value to validate
 * @returns {boolean} Whether the value is a valid DOM element
 */
export function isValidElement(value) {
    return value &&
        typeof value === 'object' &&
        'nodeType' in value &&
        'tagName' in value;
}

/**
 * Validate if a string matches a specific pattern
 * @param {string} value - String to validate
 * @param {RegExp} pattern - Regular expression pattern
 * @returns {boolean} Whether the string matches the pattern
 */
export function matchesPattern(value, pattern) {
    if (!isValidString(value)) {
        return false;
    }

    try {
        return pattern.test(value);
    } catch (error) {
        console.warn('Invalid regex pattern:', error);
        return false;
    }
}

/**
 * Validate if a string contains only allowed characters
 * @param {string} value - String to validate
 * @param {string|RegExp} allowedChars - Allowed characters or pattern
 * @returns {boolean} Whether the string contains only allowed characters
 */
export function containsOnlyAllowedChars(value, allowedChars) {
    if (!isValidString(value)) {
        return false;
    }

    if (typeof allowedChars === 'string') {
        const pattern = new RegExp(`^[${allowedChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]*$`);
        return pattern.test(value);
    }

    if (allowedChars instanceof RegExp) {
        return allowedChars.test(value);
    }

    return false;
}

/**
 * Validate if a string is within length limits
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} Whether the string length is within limits
 */
export function isWithinLength(value, minLength, maxLength) {
    if (!isValidString(value)) {
        return false;
    }

    const length = value.trim().length;
    return length >= minLength && length <= maxLength;
}

/**
 * Validate if a value is one of the allowed values
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @returns {boolean} Whether the value is allowed
 */
export function isAllowedValue(value, allowedValues) {
    if (!isValidArray(allowedValues)) {
        return false;
    }

    return allowedValues.includes(value);
}

/**
 * Validate if a value is a valid email address
 * @param {string} value - String to validate
 * @returns {boolean} Whether the string is a valid email
 */
export function isValidEmail(value) {
    if (!isValidString(value)) {
        return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value.trim());
}

/**
 * Validate if a value is a valid URL
 * @param {string} value - String to validate
 * @returns {boolean} Whether the string is a valid URL
 */
export function isValidUrl(value) {
    if (!isValidString(value)) {
        return false;
    }

    try {
        new URL(value);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate if a value is a valid date
 * @param {*} value - Value to validate
 * @returns {boolean} Whether the value is a valid date
 */
export function isValidDate(value) {
    if (value instanceof Date) {
        return !isNaN(value.getTime());
    }

    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return !isNaN(date.getTime());
    }

    return false;
}

/**
 * Validate if a value is a valid boolean
 * @param {*} value - Value to validate
 * @returns {boolean} Whether the value is a valid boolean
 */
export function isValidBoolean(value) {
    return typeof value === 'boolean';
}

/**
 * Validate if a value is null or undefined
 * @param {*} value - Value to validate
 * @returns {boolean} Whether the value is null or undefined
 */
export function isNullOrUndefined(value) {
    return value === null || value === undefined;
}

/**
 * Validate if a value is not null or undefined
 * @param {*} value - Value to validate
 * @returns {boolean} Whether the value is not null or undefined
 */
export function isNotNullOrUndefined(value) {
    return !isNullOrUndefined(value);
}
