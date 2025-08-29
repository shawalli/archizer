/**
 * Unit tests for GoogleSheetsTransformer
 */

import { GoogleSheetsTransformer, defaultTransformer } from './transformer.js';

// Mock the logger
jest.mock('../../utils/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe('GoogleSheetsTransformer', () => {
    let transformer;
    let mockLogger;

    beforeEach(() => {
        transformer = new GoogleSheetsTransformer();
        mockLogger = require('../../utils/logger.js').logger;
    });

    afterEach(() => {
        jest.clearAllMocks();
        transformer.clearState();
    });

    describe('Constructor', () => {
        it('should initialize with default state', () => {
            expect(transformer.transformErrors).toEqual([]);
            expect(transformer.recoveryAttempts).toBe(0);
            expect(transformer.maxRecoveryAttempts).toBe(3);
        });
    });

    describe('transformFromSheets', () => {
        const mockSheetsData = {
            hiddenOrders: [
                ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics,gift', 'details', '2024-01-15T10:30:00Z', '2024-01-15T10:30:00Z']
            ],
            actionLog: [
                ['hide', '123-4567890-1234567', 'john_doe', '2024-01-15T10:30:00Z', 'electronics,gift', 'Chrome/120.0.0.0']
            ],
            userSettings: [
                ['john_doe', '2024-01-15T10:30:00Z']
            ]
        };

        it('should transform valid sheets data successfully', () => {
            const result = transformer.transformFromSheets(mockSheetsData);

            expect(result.hiddenOrders).toHaveLength(1);
            expect(result.actionLog).toHaveLength(1);
            expect(result.userSettings).toHaveLength(1);
            expect(result.metadata.source).toBe('google-sheets');
            expect(result.metadata.transformedAt).toBeDefined();
            expect(transformer.transformErrors).toHaveLength(0);
        });

        it('should handle missing sheets gracefully', () => {
            const result = transformer.transformFromSheets({});

            expect(result.hiddenOrders).toEqual([]);
            expect(result.actionLog).toEqual([]);
            expect(result.userSettings).toEqual([]);
        });

        it('should handle transformation errors gracefully', () => {
            const invalidData = {
                hiddenOrders: [['invalid']], // Missing required fields
                actionLog: [],
                userSettings: []
            };

            const result = transformer.transformFromSheets(invalidData);

            expect(result.hiddenOrders).toEqual([]);
            expect(transformer.transformErrors.length).toBeGreaterThan(0);
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should throw error on critical transformation failure', () => {
            // Mock a method to throw an error
            jest.spyOn(transformer, 'transformHiddenOrdersFromSheets').mockImplementation(() => {
                throw new Error('Critical error');
            });

            expect(() => transformer.transformFromSheets(mockSheetsData)).toThrow('Failed to transform Google Sheets data: Critical error');
        });
    });

    describe('transformToSheets', () => {
        const mockLocalData = {
            hiddenOrders: [{
                orderId: '123-4567890-1234567',
                orderDate: '2024-01-15',
                hiddenBy: 'john_doe',
                tags: 'electronics,gift',
                hiddenType: 'details',
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
            }],
            actionLog: [{
                action: 'hide',
                orderId: '123-4567890-1234567',
                performedBy: 'john_doe',
                timestamp: '2024-01-15T10:30:00Z',
                tags: 'electronics,gift',
                browserInfo: 'Chrome/120.0.0.0'
            }],
            userSettings: [{
                username: 'john_doe',
                lastModified: '2024-01-15T10:30:00Z'
            }]
        };

        it('should transform valid local data successfully', () => {
            const result = transformer.transformToSheets(mockLocalData);

            expect(result.hiddenOrders).toHaveLength(1);
            expect(result.actionLog).toHaveLength(1);
            expect(result.userSettings).toHaveLength(1);
            expect(result.metadata.source).toBe('local-storage');
            expect(result.metadata.transformedAt).toBeDefined();
            expect(transformer.transformErrors).toHaveLength(0);
        });

        it('should handle missing data gracefully', () => {
            const result = transformer.transformToSheets({});

            expect(result.hiddenOrders).toEqual([]);
            expect(result.actionLog).toEqual([]);
            expect(result.userSettings).toEqual([]);
        });

        it('should handle transformation errors gracefully', () => {
            const invalidData = {
                hiddenOrders: [null], // Invalid object
                actionLog: [],
                userSettings: []
            };

            const result = transformer.transformToSheets(invalidData);

            expect(result.hiddenOrders).toEqual([]);
            expect(transformer.transformErrors.length).toBeGreaterThan(0);
            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    describe('transformHiddenOrdersFromSheets', () => {
        it('should transform valid hidden order rows', () => {
            const sheetsData = [
                ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics,gift', 'details', '2024-01-15T10:30:00Z', '2024-01-15T10:30:00Z']
            ];

            const result = transformer.transformHiddenOrdersFromSheets(sheetsData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                orderId: '123-4567890-1234567',
                orderDate: '2024-01-15',
                hiddenBy: 'john_doe',
                tags: 'electronics,gift',
                hiddenType: 'details',
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
            });
        });

        it('should handle insufficient columns', () => {
            const sheetsData = [['123-4567890-1234567', 'john_doe']]; // Missing required fields

            const result = transformer.transformHiddenOrdersFromSheets(sheetsData);

            expect(result).toHaveLength(0);
            expect(transformer.transformErrors).toContain('Row 1: Insufficient columns for hidden order');
        });

        it('should handle missing required fields', () => {
            const sheetsData = [
                ['', '2024-01-15', '', 'electronics,gift', 'details', '2024-01-15T10:30:00Z', '2024-01-15T10:30:00Z']
            ];

            const result = transformer.transformHiddenOrdersFromSheets(sheetsData);

            expect(result).toHaveLength(0);
            expect(transformer.transformErrors).toContain('Row 1: Missing required fields (orderId, hiddenBy, or hiddenAt)');
        });

        it('should handle non-array input', () => {
            const result = transformer.transformHiddenOrdersFromSheets('not an array');

            expect(result).toEqual([]);
            expect(transformer.transformErrors).toContain('Hidden orders data is not an array');
        });
    });

    describe('transformHiddenOrdersToSheets', () => {
        it('should transform valid hidden order objects', () => {
            const localData = [{
                orderId: '123-4567890-1234567',
                orderDate: '2024-01-15',
                hiddenBy: 'john_doe',
                tags: 'electronics,gift',
                hiddenType: 'details',
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
            }];

            const result = transformer.transformHiddenOrdersToSheets(localData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual([
                '123-4567890-1234567',
                '2024-01-15',
                'john_doe',
                'electronics,gift',
                'details',
                '2024-01-15T10:30:00Z',
                '2024-01-15T10:30:00Z'
            ]);
        });

        it('should handle invalid objects', () => {
            const localData = [null];

            const result = transformer.transformHiddenOrdersToSheets(localData);

            expect(result).toHaveLength(0);
            expect(transformer.transformErrors).toContain('Order 1: Invalid order object');
        });

        it('should handle non-array input', () => {
            const result = transformer.transformHiddenOrdersToSheets('not an array');

            expect(result).toEqual([]);
            expect(transformer.transformErrors).toContain('Local hidden orders data is not an array');
        });
    });

    describe('transformActionLogFromSheets', () => {
        it('should transform valid action log rows', () => {
            const sheetsData = [
                ['hide', '123-4567890-1234567', 'john_doe', '2024-01-15T10:30:00Z', 'electronics,gift', 'Chrome/120.0.0.0']
            ];

            const result = transformer.transformActionLogFromSheets(sheetsData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                action: 'hide',
                orderId: '123-4567890-1234567',
                performedBy: 'john_doe',
                timestamp: '2024-01-15T10:30:00Z',
                tags: 'electronics,gift',
                browserInfo: 'Chrome/120.0.0.0'
            });
        });

        it('should handle insufficient columns', () => {
            const sheetsData = [['hide', '123-4567890-1234567']]; // Missing required fields

            const result = transformer.transformActionLogFromSheets(sheetsData);

            expect(result).toHaveLength(0);
            expect(transformer.transformErrors).toContain('Row 1: Insufficient columns for action log');
        });

        it('should handle missing required fields', () => {
            const sheetsData = [
                ['', '123-4567890-1234567', '', '2024-01-15T10:30:00Z', 'electronics,gift', 'Chrome/120.0.0.0']
            ];

            const result = transformer.transformActionLogFromSheets(sheetsData);

            expect(result).toHaveLength(0);
            expect(transformer.transformErrors).toContain('Row 1: Missing required fields (action, orderId, performedBy, or timestamp)');
        });
    });

    describe('transformActionLogToSheets', () => {
        it('should transform valid action log objects', () => {
            const localData = [{
                action: 'hide',
                orderId: '123-4567890-1234567',
                performedBy: 'john_doe',
                timestamp: '2024-01-15T10:30:00Z',
                tags: 'electronics,gift',
                browserInfo: 'Chrome/120.0.0.0'
            }];

            const result = transformer.transformActionLogToSheets(localData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual([
                'hide',
                '123-4567890-1234567',
                'john_doe',
                '2024-01-15T10:30:00Z',
                'electronics,gift',
                'Chrome/120.0.0.0'
            ]);
        });
    });

    describe('transformUserSettingsFromSheets', () => {
        it('should transform valid user settings rows', () => {
            const sheetsData = [
                ['john_doe', '2024-01-15T10:30:00Z']
            ];

            const result = transformer.transformUserSettingsFromSheets(sheetsData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                username: 'john_doe',
                lastModified: '2024-01-15T10:30:00Z'
            });
        });

        it('should handle missing username', () => {
            const sheetsData = [
                ['', '2024-01-15T10:30:00Z']
            ];

            const result = transformer.transformUserSettingsFromSheets(sheetsData);

            expect(result).toHaveLength(0);
            expect(transformer.transformErrors).toContain('Row 1: Missing required field (username)');
        });

        it('should provide default lastModified when missing', () => {
            const sheetsData = [
                ['john_doe']
            ];

            const result = transformer.transformUserSettingsFromSheets(sheetsData);

            expect(result).toHaveLength(1);
            expect(result[0].lastModified).toBeDefined();
        });
    });

    describe('transformUserSettingsToSheets', () => {
        it('should transform valid user settings objects', () => {
            const localData = [{
                username: 'john_doe',
                lastModified: '2024-01-15T10:30:00Z'
            }];

            const result = transformer.transformUserSettingsToSheets(localData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual([
                'john_doe',
                '2024-01-15T10:30:00Z'
            ]);
        });
    });

    describe('Validation Methods', () => {
        describe('validateTransformedHiddenOrder', () => {
            it('should validate valid hidden order', () => {
                const order = {
                    orderId: '123-4567890-1234567',
                    hiddenBy: 'john_doe',
                    tags: 'electronics,gift',
                    hiddenType: 'details'
                };

                const result = transformer.validateTransformedHiddenOrder(order, 0);
                expect(result).toBe(true);
            });

            it('should reject empty order ID', () => {
                const order = {
                    orderId: '',
                    hiddenBy: 'john_doe'
                };

                const result = transformer.validateTransformedHiddenOrder(order, 0);
                expect(result).toBe(false);
                expect(transformer.transformErrors).toContain('Row 1: Invalid order ID (empty or too long)');
            });

            it('should reject overly long order ID', () => {
                const order = {
                    orderId: 'a'.repeat(51),
                    hiddenBy: 'john_doe'
                };

                const result = transformer.validateTransformedHiddenOrder(order, 0);
                expect(result).toBe(false);
                expect(transformer.transformErrors).toContain('Row 1: Invalid order ID (empty or too long)');
            });

            it('should reject invalid hidden type', () => {
                const order = {
                    orderId: '123-4567890-1234567',
                    hiddenBy: 'john_doe',
                    hiddenType: 'invalid'
                };

                const result = transformer.validateTransformedHiddenOrder(order, 0);
                expect(result).toBe(false);
                expect(transformer.transformErrors).toContain('Row 1: Invalid hidden type: invalid');
            });
        });

        describe('validateTransformedActionLog', () => {
            it('should validate valid action log', () => {
                const action = {
                    action: 'hide',
                    orderId: '123-4567890-1234567',
                    performedBy: 'john_doe'
                };

                const result = transformer.validateTransformedActionLog(action, 0);
                expect(result).toBe(true);
            });

            it('should reject invalid action', () => {
                const action = {
                    action: 'invalid_action',
                    orderId: '123-4567890-1234567',
                    performedBy: 'john_doe'
                };

                const result = transformer.validateTransformedActionLog(action, 0);
                expect(result).toBe(false);
                expect(transformer.transformErrors).toContain('Row 1: Invalid action: invalid_action');
            });
        });

        describe('validateTransformedUserSettings', () => {
            it('should validate valid user settings', () => {
                const setting = {
                    username: 'john_doe'
                };

                const result = transformer.validateTransformedUserSettings(setting, 0);
                expect(result).toBe(true);
            });

            it('should reject empty username', () => {
                const setting = {
                    username: ''
                };

                const result = transformer.validateTransformedUserSettings(setting, 0);
                expect(result).toBe(false);
                expect(transformer.transformErrors).toContain('Row 1: Invalid username (empty or too long)');
            });
        });
    });

    describe('Recovery Mechanisms', () => {
        describe('attemptRecovery', () => {
            it('should attempt recovery when errors occur', () => {
                const originalData = {
                    hiddenOrders: [['123-4567890-1234567', 'john_doe']], // Minimal data
                    actionLog: [],
                    userSettings: []
                };

                const errors = ['Some error'];

                const result = transformer.attemptRecovery(originalData, errors);

                expect(transformer.recoveryAttempts).toBe(1);
                expect(result).toBeDefined();
                expect(result.metadata.recovered).toBe(true);
            });

            it('should respect max recovery attempts', () => {
                transformer.recoveryAttempts = 3;

                const result = transformer.attemptRecovery({}, []);

                expect(result).toBeNull();
                expect(mockLogger.error).toHaveBeenCalledWith('Max recovery attempts reached, giving up');
            });
        });

        describe('transformWithRecovery', () => {
            it('should apply more lenient transformation rules', () => {
                const data = {
                    hiddenOrders: [['123-4567890-1234567', 'john_doe']], // Minimal data
                    actionLog: [],
                    userSettings: []
                };

                const result = transformer.transformWithRecovery(data);

                expect(result).toBeDefined();
                expect(result.metadata.recovered).toBe(true);
                // Note: transformWithRecovery doesn't increment recoveryAttempts
                // It's meant to be called internally by attemptRecovery
                expect(result.metadata.recoveryAttempt).toBe(0);
            });
        });

        describe('Recovery transformation methods', () => {
            it('should transform hidden orders with recovery rules', () => {
                const sheetsData = [['123-4567890-1234567', 'john_doe']]; // Minimal data

                const result = transformer.transformHiddenOrdersFromSheetsRecovery(sheetsData);

                expect(result).toHaveLength(1);
                expect(result[0].hiddenType).toBe('details'); // Default value
            });

            it('should transform action log with recovery rules', () => {
                const sheetsData = [['invalid_action', '123-4567890-1234567', 'john_doe']]; // Invalid action

                const result = transformer.transformActionLogFromSheetsRecovery(sheetsData);

                expect(result).toHaveLength(1);
                expect(result[0].action).toBe('hide'); // Default to safe value
            });

            it('should skip problematic rows during recovery', () => {
                const sheetsData = [null, ['123-4567890-1234567', 'john_doe']];

                const result = transformer.transformHiddenOrdersFromSheetsRecovery(sheetsData);

                expect(result).toHaveLength(1); // Only valid row
            });
        });
    });

    describe('Utility Methods', () => {
        describe('getTransformationStats', () => {
            it('should return correct transformation statistics', () => {
                transformer.transformErrors = ['error1', 'error2'];
                transformer.recoveryAttempts = 1;

                const stats = transformer.getTransformationStats();

                expect(stats.errors).toBe(2);
                expect(stats.recoveryAttempts).toBe(1);
                expect(stats.maxRecoveryAttempts).toBe(3);
                expect(stats.hasErrors).toBe(true);
                expect(stats.canRecover).toBe(true);
            });
        });

        describe('clearState', () => {
            it('should clear transformation state', () => {
                transformer.transformErrors = ['error1'];
                transformer.recoveryAttempts = 2;

                transformer.clearState();

                expect(transformer.transformErrors).toEqual([]);
                expect(transformer.recoveryAttempts).toBe(0);
            });
        });
    });

    describe('defaultTransformer', () => {
        it('should be an instance of GoogleSheetsTransformer', () => {
            expect(defaultTransformer).toBeInstanceOf(GoogleSheetsTransformer);
        });

        it('should have all required methods', () => {
            expect(typeof defaultTransformer.transformFromSheets).toBe('function');
            expect(typeof defaultTransformer.transformToSheets).toBe('function');
            expect(typeof defaultTransformer.attemptRecovery).toBe('function');
            expect(typeof defaultTransformer.getTransformationStats).toBe('function');
        });
    });

    describe('Edge Cases', () => {
        it('should handle null and undefined values gracefully', () => {
            const sheetsData = {
                hiddenOrders: [['123-4567890-1234567', null, 'john_doe', undefined, 'details', '2024-01-15T10:30:00Z']],
                actionLog: [],
                userSettings: []
            };

            const result = transformer.transformFromSheets(sheetsData);

            expect(result.hiddenOrders).toHaveLength(1);
            expect(result.hiddenOrders[0].orderDate).toBeNull();
            expect(result.hiddenOrders[0].tags).toBe('');
        });

        it('should handle empty strings and whitespace', () => {
            const sheetsData = {
                hiddenOrders: [['  123-4567890-1234567  ', '  2024-01-15  ', '  john_doe  ', '  electronics,gift  ', 'details', '2024-01-15T10:30:00Z']],
                actionLog: [],
                userSettings: []
            };

            const result = transformer.transformFromSheets(sheetsData);

            expect(result.hiddenOrders).toHaveLength(1);
            expect(result.hiddenOrders[0].orderId).toBe('123-4567890-1234567');
            expect(result.hiddenOrders[0].orderDate).toBe('2024-01-15');
            expect(result.hiddenOrders[0].hiddenBy).toBe('john_doe');
            expect(result.hiddenOrders[0].tags).toBe('electronics,gift');
        });

        it('should handle mixed valid and invalid data', () => {
            const sheetsData = {
                hiddenOrders: [
                    ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics,gift', 'details', '2024-01-15T10:30:00Z'], // Valid
                    ['', '2024-01-15', 'john_doe', 'electronics,gift', 'details', '2024-01-15T10:30:00Z'], // Invalid (empty orderId)
                    ['123-4567890-1234568', '2024-01-16', 'jane_doe', 'books', 'details', '2024-01-16T10:30:00Z'] // Valid
                ],
                actionLog: [],
                userSettings: []
            };

            const result = transformer.transformFromSheets(sheetsData);

            expect(result.hiddenOrders).toHaveLength(2); // Only valid rows
            expect(transformer.transformErrors.length).toBeGreaterThan(0);
        });
    });
});
