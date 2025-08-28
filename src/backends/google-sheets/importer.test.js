/**
 * GoogleSheetsImporter Unit Tests
 * Tests data import functionality from Google Sheets to browser storage format
 */

import { GoogleSheetsImporter, defaultImporter } from './importer.js';
import { defaultSchema } from './schema.js';
import { defaultValidator } from './validation.js';

// Mock the logger
jest.mock('../../utils/logger.js', () => ({
    specializedLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn()
    }
}));

// Mock the validator
jest.mock('./validation.js', () => ({
    defaultValidator: {
        validateHiddenOrders: jest.fn(),
        validateActionLog: jest.fn(),
        validateUserSettings: jest.fn(),
        getValidationStats: jest.fn()
    }
}));

describe('GoogleSheetsImporter', () => {
    let importer;
    let mockLogger;
    let mockValidator;

    beforeEach(() => {
        importer = new GoogleSheetsImporter();
        mockLogger = require('../../utils/logger.js').specializedLogger;
        mockValidator = require('./validation.js').defaultValidator;

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with default schema', () => {
            expect(importer.schema).toBe(defaultSchema);
        });

        it('should create a new instance', () => {
            expect(importer).toBeInstanceOf(GoogleSheetsImporter);
        });
    });

    describe('importHiddenOrders', () => {
        it('should import valid hidden orders with validation', () => {
            const mockSheetRows = [
                ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z'],
                ['987-6543210-7654321', '2024-01-16', 'jane_doe', 'books', 'details', '2024-01-16T11:30:00Z']
            ];

            const mockValidationResult = {
                isValid: true,
                sanitizedData: [
                    {
                        orderId: '123-4567890-1234567',
                        orderDate: '2024-01-15T00:00:00.000Z',
                        username: 'john_doe',
                        tags: ['electronics'],
                        hiddenType: 'details',
                        timestamp: '2024-01-15T10:30:00.000Z'
                    },
                    {
                        orderId: '987-6543210-7654321',
                        orderDate: '2024-01-16T00:00:00.000Z',
                        username: 'jane_doe',
                        tags: ['books'],
                        hiddenType: 'details',
                        timestamp: '2024-01-16T11:30:00.000Z'
                    }
                ],
                errors: [],
                warnings: []
            };

            const mockStats = {
                totalRows: 2,
                validRows: 2,
                errorRows: 0,
                warningRows: 0,
                successRate: '100.0'
            };

            mockValidator.validateHiddenOrders.mockReturnValue(mockValidationResult);
            mockValidator.getValidationStats.mockReturnValue(mockStats);

            const result = importer.importHiddenOrders(mockSheetRows);

            expect(mockValidator.validateHiddenOrders).toHaveBeenCalledWith(mockSheetRows);
            expect(mockValidator.getValidationStats).toHaveBeenCalledWith(mockValidationResult);
            expect(mockLogger.info).toHaveBeenCalledWith('Importing hidden orders from Google Sheets format...');
            expect(mockLogger.info).toHaveBeenCalledWith('Hidden orders import complete. 2/2 rows valid (100.0% success rate)');

            expect(result).toEqual({
                data: mockValidationResult.sanitizedData,
                validation: {
                    isValid: true,
                    errors: [],
                    warnings: [],
                    stats: mockStats
                }
            });
        });

        it('should handle validation failures with warnings', () => {
            const mockSheetRows = [
                ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z']
            ];

            const mockValidationResult = {
                isValid: false,
                sanitizedData: [],
                errors: ['Row 1: Invalid order ID format'],
                warnings: ['Row 1: Username seems unusual']
            };

            const mockStats = {
                totalRows: 1,
                validRows: 0,
                errorRows: 1,
                warningRows: 1,
                successRate: '0.0'
            };

            mockValidator.validateHiddenOrders.mockReturnValue(mockValidationResult);
            mockValidator.getValidationStats.mockReturnValue(mockStats);

            const result = importer.importHiddenOrders(mockSheetRows);

            expect(mockLogger.warn).toHaveBeenCalledWith('Hidden orders validation failed:', ['Row 1: Invalid order ID format']);
            expect(mockLogger.info).toHaveBeenCalledWith('Hidden orders import complete. 0/1 rows valid (0.0% success rate)');

            expect(result.validation.isValid).toBe(false);
            expect(result.validation.errors).toContain('Row 1: Invalid order ID format');
        });

        it('should handle validation warnings', () => {
            const mockSheetRows = [
                ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z']
            ];

            const mockValidationResult = {
                isValid: true,
                sanitizedData: [
                    {
                        orderId: '123-4567890-1234567',
                        orderDate: '2024-01-15T00:00:00.000Z',
                        username: 'john_doe',
                        tags: ['electronics'],
                        hiddenType: 'details',
                        timestamp: '2024-01-15T10:30:00.000Z'
                    }
                ],
                errors: [],
                warnings: ['Row 1: Username length exceeds recommended limit']
            };

            const mockStats = {
                totalRows: 1,
                validRows: 1,
                errorRows: 0,
                warningRows: 1,
                successRate: '100.0'
            };

            mockValidator.validateHiddenOrders.mockReturnValue(mockValidationResult);
            mockValidator.getValidationStats.mockReturnValue(mockStats);

            const result = importer.importHiddenOrders(mockSheetRows);

            expect(mockLogger.warn).toHaveBeenCalledWith('Hidden orders validation warnings:', ['Row 1: Username length exceeds recommended limit']);
            expect(result.validation.warnings).toContain('Row 1: Username length exceeds recommended limit');
        });

        it('should handle errors during import', () => {
            const mockSheetRows = [['invalid-data']];
            mockValidator.validateHiddenOrders.mockImplementation(() => {
                throw new Error('Validation error');
            });

            expect(() => importer.importHiddenOrders(mockSheetRows)).toThrow('Validation error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error importing hidden orders:', expect.any(Error));
        });
    });

    describe('importActionLog', () => {
        it('should import valid action log with validation', () => {
            const mockSheetRows = [
                ['hide', '123-4567890-1234567', 'john_doe', 'electronics', '2024-01-15T10:30:00Z', 'Chrome 120.0.0.0'],
                ['unhide', '987-6543210-7654321', 'jane_doe', 'books', '2024-01-16T11:30:00Z', 'Firefox 121.0.0']
            ];

            const mockValidationResult = {
                isValid: true,
                sanitizedData: [
                    {
                        actionType: 'hide',
                        orderId: '123-4567890-1234567',
                        username: 'john_doe',
                        tags: ['electronics'],
                        timestamp: '2024-01-15T10:30:00.000Z',
                        browserInfo: 'Chrome 120.0.0.0'
                    },
                    {
                        actionType: 'unhide',
                        orderId: '987-6543210-7654321',
                        username: 'jane_doe',
                        tags: ['books'],
                        timestamp: '2024-01-16T11:30:00.000Z',
                        browserInfo: 'Firefox 121.0.0'
                    }
                ],
                errors: [],
                warnings: []
            };

            const mockStats = {
                totalRows: 2,
                validRows: 2,
                errorRows: 0,
                warningRows: 0,
                successRate: '100.0'
            };

            mockValidator.validateActionLog.mockReturnValue(mockValidationResult);
            mockValidator.getValidationStats.mockReturnValue(mockStats);

            const result = importer.importActionLog(mockSheetRows);

            expect(mockValidator.validateActionLog).toHaveBeenCalledWith(mockSheetRows);
            expect(mockLogger.info).toHaveBeenCalledWith('Action log import complete. 2/2 rows valid (100.0% success rate)');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].actionType).toBe('hide');
            expect(result.data[1].actionType).toBe('unhide');
        });

        it('should handle validation failures', () => {
            const mockSheetRows = [['invalid-action', '123-4567890-1234567']];
            const mockValidationResult = {
                isValid: false,
                sanitizedData: [],
                errors: ['Row 1: Invalid action type'],
                warnings: []
            };

            mockValidator.validateActionLog.mockReturnValue(mockValidationResult);

            const result = importer.importActionLog(mockSheetRows);

            expect(mockLogger.warn).toHaveBeenCalledWith('Action log validation failed:', ['Row 1: Invalid action type']);
            expect(result.validation.isValid).toBe(false);
        });
    });

    describe('importUserSettings', () => {
        it('should import valid user settings with validation', () => {
            const mockSheetRows = [
                ['john_doe', '2024-01-15T10:30:00Z'],
                ['jane_doe', '2024-01-16T11:30:00Z']
            ];

            const mockValidationResult = {
                isValid: true,
                sanitizedData: [
                    {
                        username: 'john_doe',
                        timestamp: '2024-01-15T10:30:00.000Z'
                    },
                    {
                        username: 'jane_doe',
                        timestamp: '2024-01-16T11:30:00.000Z'
                    }
                ],
                errors: [],
                warnings: []
            };

            const mockStats = {
                totalRows: 2,
                validRows: 2,
                errorRows: 0,
                warningRows: 0,
                successRate: '100.0'
            };

            mockValidator.validateUserSettings.mockReturnValue(mockValidationResult);
            mockValidator.getValidationStats.mockReturnValue(mockStats);

            const result = importer.importUserSettings(mockSheetRows);

            expect(mockValidator.validateUserSettings).toHaveBeenCalledWith(mockSheetRows);
            expect(mockLogger.info).toHaveBeenCalledWith('User settings import complete. 2/2 rows valid (100.0% success rate)');

            expect(result.data).toHaveLength(2);
            expect(result.data[0].username).toBe('john_doe');
            expect(result.data[1].username).toBe('jane_doe');
        });

        it('should handle validation failures', () => {
            const mockSheetRows = [['', '2024-01-15T10:30:00Z']];
            const mockValidationResult = {
                isValid: false,
                sanitizedData: [],
                errors: ['Row 1: Username cannot be empty'],
                warnings: []
            };

            mockValidator.validateUserSettings.mockReturnValue(mockValidationResult);

            const result = importer.importUserSettings(mockSheetRows);

            expect(mockLogger.warn).toHaveBeenCalledWith('User settings validation failed:', ['Row 1: Username cannot be empty']);
            expect(result.validation.isValid).toBe(false);
        });
    });

    describe('importAllData', () => {
        it('should import all data types successfully', () => {
            const mockSheetsData = {
                hiddenOrders: [
                    ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z']
                ],
                actionLog: [
                    ['hide', '123-4567890-1234567', 'john_doe', 'electronics', '2024-01-15T10:30:00Z', 'Chrome 120.0.0.0']
                ],
                userSettings: [
                    ['john_doe', '2024-01-15T10:30:00Z']
                ]
            };

            // Mock validation results for each data type
            const mockHiddenOrdersResult = {
                data: [{ orderId: '123-4567890-1234567' }],
                validation: { isValid: true, errors: [], warnings: [], stats: { successRate: '100.0' } }
            };

            const mockActionLogResult = {
                data: [{ actionType: 'hide' }],
                validation: { isValid: true, errors: [], warnings: [], stats: { successRate: '100.0' } }
            };

            const mockUserSettingsResult = {
                data: [{ username: 'john_doe' }],
                validation: { isValid: true, errors: [], warnings: [], stats: { successRate: '100.0' } }
            };

            // Mock the individual import methods
            jest.spyOn(importer, 'importHiddenOrders').mockReturnValue(mockHiddenOrdersResult);
            jest.spyOn(importer, 'importActionLog').mockReturnValue(mockActionLogResult);
            jest.spyOn(importer, 'importUserSettings').mockReturnValue(mockUserSettingsResult);

            const result = importer.importAllData(mockSheetsData);

            expect(importer.importHiddenOrders).toHaveBeenCalledWith(mockSheetsData.hiddenOrders);
            expect(importer.importActionLog).toHaveBeenCalledWith(mockSheetsData.actionLog);
            expect(importer.importUserSettings).toHaveBeenCalledWith(mockSheetsData.userSettings);

            expect(result.imported.hiddenOrders).toBe(mockHiddenOrdersResult);
            expect(result.imported.actionLog).toBe(mockActionLogResult);
            expect(result.imported.userSettings).toBe(mockUserSettingsResult);

            expect(result.validationSummary).toBeDefined();
            expect(result.validationSummary.totalErrors).toBe(0);
            expect(result.validationSummary.totalWarnings).toBe(0);
            expect(result.validationSummary.successRates.hiddenOrders).toBe('100.0');
            expect(result.validationSummary.successRates.actionLog).toBe('100.0');
            expect(result.validationSummary.successRates.userSettings).toBe('100.0');

            expect(mockLogger.success).toHaveBeenCalledWith('All data imported successfully with no validation issues');
        });

        it('should handle missing data types gracefully', () => {
            const mockSheetsData = {
                hiddenOrders: [
                    ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z']
                ]
                // Missing actionLog and userSettings
            };

            const mockHiddenOrdersResult = {
                data: [{ orderId: '123-4567890-1234567' }],
                validation: { isValid: true, errors: [], warnings: [], stats: { successRate: '100.0' } }
            };

            jest.spyOn(importer, 'importHiddenOrders').mockReturnValue(mockHiddenOrdersResult);

            const result = importer.importAllData(mockSheetsData);

            expect(result.imported.hiddenOrders).toBe(mockHiddenOrdersResult);
            expect(result.imported.actionLog).toBeUndefined();
            expect(result.imported.userSettings).toBeUndefined();
        });

        it('should handle validation errors with warnings', () => {
            const mockSheetsData = {
                hiddenOrders: [
                    ['123-4567890-1234567', '2024-01-15', 'john_doe', 'electronics', 'details', '2024-01-15T10:30:00Z']
                ]
            };

            const mockHiddenOrdersResult = {
                data: [{ orderId: '123-4567890-1234567' }],
                validation: {
                    isValid: false,
                    errors: ['Row 1: Invalid order ID format'],
                    warnings: ['Row 1: Username seems unusual'],
                    stats: { successRate: '100.0' }
                }
            };

            jest.spyOn(importer, 'importHiddenOrders').mockReturnValue(mockHiddenOrdersResult);

            const result = importer.importAllData(mockSheetsData);

            expect(result.validationSummary.totalErrors).toBe(1);
            expect(result.validationSummary.totalWarnings).toBe(1);
            expect(mockLogger.warn).toHaveBeenCalledWith('Import completed with 1 errors and 1 warnings');
        });

        it('should handle errors during import', () => {
            const mockSheetsData = { hiddenOrders: [['invalid-data']] };

            jest.spyOn(importer, 'importHiddenOrders').mockImplementation(() => {
                throw new Error('Import error');
            });

            expect(() => importer.importAllData(mockSheetsData)).toThrow('Import error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error importing all data:', expect.any(Error));
        });
    });

    describe('getHeaders methods', () => {
        it('should return correct headers for HiddenOrders', () => {
            const headers = importer.getHiddenOrdersHeaders();
            expect(Array.isArray(headers)).toBe(true);
            expect(headers.length).toBeGreaterThan(0);
        });

        it('should return correct headers for ActionLog', () => {
            const headers = importer.getActionLogHeaders();
            expect(Array.isArray(headers)).toBe(true);
            expect(headers.length).toBeGreaterThan(0);
        });

        it('should return correct headers for UserSettings', () => {
            const headers = importer.getUserSettingsHeaders();
            expect(Array.isArray(headers)).toBe(true);
            expect(headers.length).toBeGreaterThan(0);
        });
    });

    describe('defaultImporter', () => {
        it('should be an instance of GoogleSheetsImporter', () => {
            expect(defaultImporter).toBeInstanceOf(GoogleSheetsImporter);
        });

        it('should have all required methods', () => {
            expect(typeof defaultImporter.importHiddenOrders).toBe('function');
            expect(typeof defaultImporter.importActionLog).toBe('function');
            expect(typeof defaultImporter.importUserSettings).toBe('function');
            expect(typeof defaultImporter.importAllData).toBe('function');
            expect(typeof defaultImporter.getHiddenOrdersHeaders).toBe('function');
            expect(typeof defaultImporter.getActionLogHeaders).toBe('function');
            expect(typeof defaultImporter.getUserSettingsHeaders).toBe('function');
        });
    });
});
