/**
 * GoogleSheetsValidator Unit Tests
 * Tests data validation and sanitization functionality
 */

import { GoogleSheetsValidator, defaultValidator } from './validation.js';

describe('GoogleSheetsValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new GoogleSheetsValidator();
    });

    describe('Constructor', () => {
        it('should initialize with default validation limits', () => {
            expect(validator.maxTextLength).toBe(1000);
            expect(validator.maxTagsCount).toBe(20);
            expect(validator.maxTagLength).toBe(50);
            expect(validator.maxUsernameLength).toBe(100);
            expect(validator.maxOrderIdLength).toBe(50);
            expect(validator.maxActionTypeLength).toBe(20);
            expect(validator.maxBrowserInfoLength).toBe(200);
        });
    });

    describe('validateOrderId', () => {
        it('should validate valid order ID', () => {
            const result = validator.validateOrderId('123-4567890-1234567', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toBe('123-4567890-1234567');
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        it('should reject null order ID', () => {
            const result = validator.validateOrderId(null, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Order ID must be a non-empty string');
        });

        it('should reject undefined order ID', () => {
            const result = validator.validateOrderId(undefined, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Order ID must be a non-empty string');
        });

        it('should reject empty string order ID', () => {
            const result = validator.validateOrderId('', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Order ID must be a non-empty string');
        });

        it('should reject whitespace-only order ID', () => {
            const result = validator.validateOrderId('   ', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Order ID cannot be empty or whitespace only');
        });

        it('should truncate overly long order ID with warning', () => {
            const longOrderId = 'A'.repeat(validator.maxOrderIdLength + 10);
            const result = validator.validateOrderId(longOrderId, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toHaveLength(validator.maxOrderIdLength);
            expect(result.warnings).toContain('Row 1: Order ID exceeds maximum length (50), truncating');
        });

        it('should trim whitespace from order ID', () => {
            const result = validator.validateOrderId('  123-4567890-1234567  ', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toBe('123-4567890-1234567');
        });
    });

    describe('validateOrderDate', () => {
        it('should validate valid date string', () => {
            const result = validator.validateOrderDate('2024-01-15', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('should validate various date formats', () => {
            const formats = [
                '2024-01-15',
                '01/15/2024',
                '2024-01-15T10:30:00',
                'January 15, 2024'
            ];

            formats.forEach(dateStr => {
                const result = validator.validateOrderDate(dateStr, 0);
                expect(result.isValid).toBe(true);
                expect(result.sanitizedValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            });
        });

        it('should reject invalid date format', () => {
            const result = validator.validateOrderDate('not-a-date', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Invalid date format: not-a-date');
        });

        it('should warn about unusual dates', () => {
            const result = validator.validateOrderDate('1970-01-01', 0);
            expect(result.isValid).toBe(true);
            expect(result.warnings[0]).toMatch(/Row 1: Date seems unusual \(\d+ years from now\): 1970-01-01/);
        });

        it('should reject null date', () => {
            const result = validator.validateOrderDate(null, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Order date must be a non-empty string');
        });
    });

    describe('validateUsername', () => {
        it('should validate valid username', () => {
            const result = validator.validateUsername('john_doe', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toBe('john_doe');
        });

        it('should truncate overly long username with warning', () => {
            const longUsername = 'A'.repeat(validator.maxUsernameLength + 10);
            const result = validator.validateUsername(longUsername, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toHaveLength(validator.maxUsernameLength);
            expect(result.warnings).toContain('Row 1: Username exceeds maximum length (100), truncating');
        });

        it('should reject empty username', () => {
            const result = validator.validateUsername('', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Username must be a non-empty string');
        });

        it('should trim whitespace from username', () => {
            const result = validator.validateUsername('  john_doe  ', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toBe('john_doe');
        });
    });

    describe('validateTags', () => {
        it('should validate empty tags', () => {
            const result = validator.validateTags('', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toEqual([]);
        });

        it('should validate single tag', () => {
            const result = validator.validateTags('electronics', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toEqual(['electronics']);
        });

        it('should validate multiple tags', () => {
            const result = validator.validateTags('electronics, gadgets, tech', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toEqual(['electronics', 'gadgets', 'tech']);
        });

        it('should handle tags with whitespace', () => {
            const result = validator.validateTags('  electronics  ,  gadgets  ,  tech  ', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toEqual(['electronics', 'gadgets', 'tech']);
        });

        it('should limit tag count with warning', () => {
            const manyTags = Array.from({ length: validator.maxTagsCount + 5 }, (_, i) => `tag${i}`).join(',');
            const result = validator.validateTags(manyTags, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toHaveLength(validator.maxTagsCount);
            expect(result.warnings).toContain('Row 1: Too many tags (25), limiting to 20');
        });

        it('should truncate overly long tags with warning', () => {
            const longTag = 'A'.repeat(validator.maxTagLength + 10);
            const result = validator.validateTags(longTag, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue[0]).toHaveLength(validator.maxTagLength);
            expect(result.warnings).toContain('Row 1, Tag 1: Tag exceeds maximum length (50), truncating');
        });

        it('should handle null tags', () => {
            const result = validator.validateTags(null, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toEqual([]);
        });
    });

    describe('validateHiddenType', () => {
        it('should validate valid hidden type', () => {
            const result = validator.validateHiddenType('details', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toBe('details');
        });

        it('should normalize case', () => {
            const result = validator.validateHiddenType('DETAILS', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toBe('details');
        });

        it('should reject invalid hidden type', () => {
            const result = validator.validateHiddenType('order', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Row 1: Invalid hidden type 'order'. Only 'details' is allowed.");
        });

        it('should reject empty hidden type', () => {
            const result = validator.validateHiddenType('', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Hidden type must be a non-empty string');
        });
    });

    describe('validateActionType', () => {
        it('should validate valid action types', () => {
            const validActions = ['hide', 'unhide'];
            validActions.forEach(action => {
                const result = validator.validateActionType(action, 0);
                expect(result.isValid).toBe(true);
                expect(result.sanitizedValue).toBe(action);
            });
        });

        it('should reject invalid action type', () => {
            const result = validator.validateActionType('invalid', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Row 1: Invalid action type 'invalid'. Allowed values: hide, unhide");
        });

        it('should truncate overly long action type with warning', () => {
            const longAction = 'hide' + 'A'.repeat(validator.maxActionTypeLength + 10);
            const result = validator.validateActionType(longAction, 0);
            expect(result.isValid).toBe(false); // Invalid action type after truncation
            expect(result.errors).toContain(`Row 1: Invalid action type 'hideaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'. Allowed values: hide, unhide`);
        });
    });

    describe('validateTimestamp', () => {
        it('should validate valid timestamp', () => {
            const result = validator.validateTimestamp('2024-01-15T10:30:00Z', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('should warn about unusual timestamps', () => {
            const result = validator.validateTimestamp('1900-01-01T00:00:00Z', 0);
            expect(result.isValid).toBe(true);
            expect(result.warnings[0]).toMatch(/Row 1: Timestamp seems unusual \(\d+ days from now\): 1900-01-01T00:00:00Z/);
        });

        it('should reject invalid timestamp', () => {
            const result = validator.validateTimestamp('not-a-timestamp', 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Invalid timestamp format: not-a-timestamp');
        });
    });

    describe('validateBrowserInfo', () => {
        it('should validate valid browser info', () => {
            const result = validator.validateBrowserInfo('Chrome 120.0.0.0', 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toBe('Chrome 120.0.0.0');
        });

        it('should truncate overly long browser info with warning', () => {
            const longInfo = 'A'.repeat(validator.maxBrowserInfoLength + 10);
            const result = validator.validateBrowserInfo(longInfo, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedValue).toHaveLength(validator.maxBrowserInfoLength);
            expect(result.warnings).toContain('Row 1: Browser info exceeds maximum length (200), truncating');
        });
    });

    describe('validateHiddenOrderRow', () => {
        it('should validate valid hidden order row', () => {
            const validRow = ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics, gadgets', 'details', '2024-01-15T10:30:00Z'];
            const result = validator.validateHiddenOrderRow(validRow, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toBeDefined();
            expect(result.sanitizedData.orderId).toBe('123-4567890-1234567');
            expect(result.sanitizedData.username).toBe('john_doe');
            expect(result.sanitizedData.tags).toEqual(['electronics', 'gadgets']);
        });

        it('should reject row with insufficient columns', () => {
            const invalidRow = ['123-4567890-1234567', '2024-01-15'];
            const result = validator.validateHiddenOrderRow(invalidRow, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Insufficient columns (expected 6, got 2)');
        });

        it('should reject row with invalid order ID', () => {
            const invalidRow = [null, '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z'];
            const result = validator.validateHiddenOrderRow(invalidRow, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Order ID must be a non-empty string');
        });
    });

    describe('validateActionLogRow', () => {
        it('should validate valid action log row', () => {
            const validRow = ['hide', '123-4567890-1234567', 'john_doe', 'electronics, gadgets', '2024-01-15T10:30:00Z', 'Chrome 120.0.0.0'];
            const result = validator.validateActionLogRow(validRow, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toBeDefined();
            expect(result.sanitizedData.actionType).toBe('hide');
            expect(result.sanitizedData.orderId).toBe('123-4567890-1234567');
        });

        it('should reject row with insufficient columns', () => {
            const invalidRow = ['hide', '123-4567890-1234567'];
            const result = validator.validateHiddenOrderRow(invalidRow, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Insufficient columns (expected 6, got 2)');
        });
    });

    describe('validateUserSettingsRow', () => {
        it('should validate valid user settings row', () => {
            const validRow = ['john_doe', '2024-01-15T10:30:00Z'];
            const result = validator.validateUserSettingsRow(validRow, 0);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toBeDefined();
            expect(result.sanitizedData.username).toBe('john_doe');
        });

        it('should reject row with insufficient columns', () => {
            const invalidRow = ['john_doe'];
            const result = validator.validateUserSettingsRow(invalidRow, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Row 1: Insufficient columns (expected 2, got 1)');
        });
    });

    describe('validateHiddenOrders', () => {
        it('should validate valid hidden orders array', () => {
            const validRows = [
                ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z'],
                ['987-6543210-7654321', '2024-01-16', 'jane_doe', 'books', 'details', '2024-01-16T11:30:00Z']
            ];
            const result = validator.validateHiddenOrders(validRows);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toHaveLength(2);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle mixed valid/invalid rows', () => {
            const mixedRows = [
                ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z'],
                [null, '2024-01-16', 'jane_doe', 'books', 'details', '2024-01-16T11:30:00Z'] // Invalid
            ];
            const result = validator.validateHiddenOrders(mixedRows);
            expect(result.isValid).toBe(false);
            expect(result.sanitizedData).toHaveLength(1);
            expect(result.errors).toHaveLength(1);
        });

        it('should reject non-array input', () => {
            const result = validator.validateHiddenOrders('not-an-array');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Hidden orders data must be an array');
        });
    });

    describe('validateActionLog', () => {
        it('should validate valid action log array', () => {
            const validRows = [
                ['hide', '123-4567890-1234567', 'john_doe', 'electronics', '2024-01-15T10:30:00Z', 'Chrome 120.0.0.0'],
                ['unhide', '987-6543210-7654321', 'jane_doe', 'books', '2024-01-16T11:30:00Z', 'Firefox 121.0.0']
            ];
            const result = validator.validateActionLog(validRows);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toHaveLength(2);
        });
    });

    describe('validateUserSettings', () => {
        it('should validate valid user settings array', () => {
            const validRows = [
                ['john_doe', '2024-01-15T10:30:00Z'],
                ['jane_doe', '2024-01-16T11:30:00Z']
            ];
            const result = validator.validateUserSettings(validRows);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toHaveLength(2);
        });
    });

    describe('getValidationStats', () => {
        it('should calculate correct statistics', () => {
            const validationResult = {
                sanitizedData: [{ id: 1 }, { id: 2 }],
                errors: ['Error 1'],
                warnings: ['Warning 1', 'Warning 2']
            };
            const stats = validator.getValidationStats(validationResult);
            expect(stats.totalRows).toBe(3);
            expect(stats.validRows).toBe(2);
            expect(stats.errorRows).toBe(1);
            expect(stats.warningRows).toBe(2);
            expect(stats.successRate).toBe(66.7);
        });

        it('should handle empty validation result', () => {
            const validationResult = {
                sanitizedData: [],
                errors: [],
                warnings: []
            };
            const stats = validator.getValidationStats(validationResult);
            expect(stats.totalRows).toBe(0);
            expect(stats.successRate).toBe(0);
        });
    });

    describe('defaultValidator', () => {
        it('should be an instance of GoogleSheetsValidator', () => {
            expect(defaultValidator).toBeInstanceOf(GoogleSheetsValidator);
        });

        it('should have all required methods', () => {
            expect(typeof defaultValidator.validateHiddenOrders).toBe('function');
            expect(typeof defaultValidator.validateActionLog).toBe('function');
            expect(typeof defaultValidator.validateUserSettings).toBe('function');
            expect(typeof defaultValidator.getValidationStats).toBe('function');
        });
    });
});
