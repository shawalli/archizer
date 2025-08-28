/**
 * GoogleSheetsSync Unit Tests
 * Tests resync orchestration functionality
 */

import { GoogleSheetsSync, defaultSync } from './sync.js';
import { defaultImporter } from './importer.js';
import { StorageManager } from '../local-storage/storage.js';

// Mock the logger
jest.mock('../../utils/logger.js', () => ({
    specializedLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn(),
        warning: jest.fn()
    }
}));

// Mock the importer
jest.mock('./importer.js', () => ({
    defaultImporter: {
        importAllData: jest.fn()
    }
}));

// Mock the storage manager
jest.mock('../local-storage/storage.js', () => ({
    StorageManager: jest.fn()
}));

// Mock Chrome storage API
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
        }
    }
};

global.chrome = mockChrome;

describe('GoogleSheetsSync', () => {
    let sync;
    let mockStorage;
    let mockImporter;
    let mockLogger;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock storage
        mockStorage = {
            getAllHiddenOrders: jest.fn(),
            getAllActionLog: jest.fn(),
            getAllUserSettings: jest.fn(),
            storeHiddenOrder: jest.fn(),
            storeActionLog: jest.fn(),
            storeUserSettings: jest.fn(),
            clear: jest.fn()
        };

        // Setup mock importer
        mockImporter = {
            importAllData: jest.fn()
        };

        // Setup mock logger
        mockLogger = require('../../utils/logger.js').specializedLogger;

        // Create sync instance with mocked dependencies
        sync = new GoogleSheetsSync();
        sync.storage = mockStorage;
        sync.importer = mockImporter;
    });

    describe('Constructor', () => {
        it('should initialize with default importer', () => {
            const newSync = new GoogleSheetsSync();
            expect(newSync.importer).toBe(defaultImporter);
        });

        it('should initialize sync state', () => {
            expect(sync.isSyncing).toBe(false);
        });
    });

    describe('performResync', () => {
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

        const mockImportedData = {
            timestamp: '2024-01-15T10:30:00.000Z',
            imported: {
                hiddenOrders: {
                    data: [{ orderId: '123-4567890-1234567' }],
                    validation: { isValid: true, errors: [], warnings: [], stats: { successRate: '100.0' } }
                },
                actionLog: {
                    data: [{ actionType: 'hide' }],
                    validation: { isValid: true, errors: [], warnings: [], stats: { successRate: '100.0' } }
                },
                userSettings: {
                    data: [{ username: 'john_doe' }],
                    validation: { isValid: true, errors: [], warnings: [], stats: { successRate: '100.0' } }
                }
            },
            validationSummary: {
                totalErrors: 0,
                totalWarnings: 0,
                successRates: {
                    hiddenOrders: '100.0',
                    actionLog: '100.0',
                    userSettings: '100.0'
                }
            }
        };

        it('should perform complete resync successfully', async () => {
            // Setup mocks
            mockStorage.getAllHiddenOrders.mockResolvedValue([{ orderId: 'old-order' }]);
            mockStorage.getAllActionLog.mockResolvedValue([{ actionType: 'old-action' }]);
            mockStorage.getAllUserSettings.mockResolvedValue([{ username: 'old-user' }]);
            mockImporter.importAllData.mockResolvedValue(mockImportedData);

            const result = await sync.performResync(mockSheetsData);

            // Verify sync state management
            expect(sync.isSyncing).toBe(false);
            expect(result.success).toBe(true);
            expect(result.timestamp).toBeDefined();
            expect(result.steps).toHaveLength(6);

            // Verify cache statistics were collected
            expect(mockStorage.getAllHiddenOrders).toHaveBeenCalled();
            expect(mockStorage.getAllActionLog).toHaveBeenCalled();
            expect(mockStorage.getAllUserSettings).toHaveBeenCalled();

            // Verify data was imported
            expect(mockImporter.importAllData).toHaveBeenCalledWith(mockSheetsData);

            // Note: Validation summary logging is tested separately in importFromSheets tests
            // The core functionality (successful resync) is what matters here

            // Verify success was logged
            expect(mockLogger.success).toHaveBeenCalledWith('Google Sheets resync completed successfully');
        });

        it('should prevent concurrent resyncs', async () => {
            sync.isSyncing = true;

            await expect(sync.performResync(mockSheetsData)).rejects.toThrow('Sync already in progress');
        });

        it('should handle errors during resync', async () => {
            // Mock storage to fail when getting cache statistics
            mockStorage.getAllHiddenOrders.mockRejectedValue(new Error('Storage error'));
            mockStorage.getAllActionLog.mockResolvedValue([]);
            mockStorage.getAllUserSettings.mockResolvedValue([]);

            // Mock the importer to return data
            mockImporter.importAllData.mockResolvedValue(mockImportedData);

            // The resync should still succeed because storage errors are handled gracefully
            const result = await sync.performResync(mockSheetsData);

            expect(sync.isSyncing).toBe(false);
            expect(result.success).toBe(true);

            // Verify that storage errors were logged as warnings
            expect(mockLogger.warning).toHaveBeenCalledWith('Error getting cache statistics:', expect.any(Error));
        });

        it('should handle validation errors and warnings', async () => {
            const mockImportedDataWithErrors = {
                ...mockImportedData,
                validationSummary: {
                    totalErrors: 2,
                    totalWarnings: 1,
                    successRates: {
                        hiddenOrders: '80.0',
                        actionLog: '90.0',
                        userSettings: '100.0'
                    }
                }
            };

            mockStorage.getAllHiddenOrders.mockResolvedValue([]);
            mockStorage.getAllActionLog.mockResolvedValue([]);
            mockStorage.getAllUserSettings.mockResolvedValue([]);
            mockImporter.importAllData.mockReturnValue(mockImportedDataWithErrors);

            const result = await sync.performResync(mockSheetsData);

            expect(result.success).toBe(true);
            // The validation summary logging happens in importFromSheets, which is called by performResync
            expect(mockLogger.info).toHaveBeenCalledWith('Validation Summary: 2 errors, 1 warnings');
        });
    });

    describe('getCacheStatistics', () => {
        it('should return correct cache statistics', async () => {
            mockStorage.getAllHiddenOrders.mockResolvedValue([{ id: 1 }, { id: 2 }]);
            mockStorage.getAllActionLog.mockResolvedValue([{ id: 1 }]);
            mockStorage.getAllUserSettings.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

            const stats = await sync.getCacheStatistics();

            expect(stats).toEqual({
                hiddenOrders: 2,
                actionLog: 1,
                userSettings: 3
            });
        });

        it('should handle storage errors gracefully', async () => {
            mockStorage.getAllHiddenOrders.mockRejectedValue(new Error('Storage error'));

            const stats = await sync.getCacheStatistics();

            expect(stats).toEqual({
                hiddenOrders: 0,
                actionLog: 0,
                userSettings: 0
            });

            expect(mockLogger.warning).toHaveBeenCalledWith('Error getting cache statistics:', expect.any(Error));
        });
    });

    describe('clearCache', () => {
        it('should clear all storage data', async () => {
            // Mock chrome storage to return some data
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_hidden_orders': [],
                'amazon_archiver_action_log': [],
                'amazon_archiver_user_settings': []
            });
            mockChrome.storage.local.remove.mockResolvedValue();

            await sync.clearCache();

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith(null);
            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith([
                'amazon_archiver_hidden_orders',
                'amazon_archiver_action_log',
                'amazon_archiver_user_settings'
            ]);
            expect(mockLogger.info).toHaveBeenCalledWith('Clearing existing cache...');
        });

        it('should handle storage errors during clear', async () => {
            mockChrome.storage.local.get.mockRejectedValue(new Error('Clear error'));

            await expect(sync.clearCache()).rejects.toThrow('Clear error');
        });
    });

    describe('importFromSheets', () => {
        it('should import data from Google Sheets', async () => {
            const mockSheetsData = { hiddenOrders: [] };
            const mockImportedData = { imported: {} };

            mockImporter.importAllData.mockReturnValue(mockImportedData);

            const result = await sync.importFromSheets(mockSheetsData);

            expect(mockImporter.importAllData).toHaveBeenCalledWith(mockSheetsData);
            expect(result).toBe(mockImportedData);
            expect(mockLogger.success).toHaveBeenCalledWith('Data imported from Google Sheets successfully');
        });

        it('should log validation summary when available', async () => {
            const mockSheetsData = { hiddenOrders: [] };
            const mockImportedData = {
                imported: {},
                validationSummary: {
                    totalErrors: 1,
                    totalWarnings: 2,
                    successRates: { hiddenOrders: '80.0' }
                }
            };

            mockImporter.importAllData.mockReturnValue(mockImportedData);

            await sync.importFromSheets(mockSheetsData);

            expect(mockLogger.info).toHaveBeenCalledWith('Validation Summary: 1 errors, 2 warnings');
            expect(mockLogger.info).toHaveBeenCalledWith('hiddenOrders: 80.0% success rate');
        });

        it('should handle import errors', async () => {
            const mockSheetsData = { hiddenOrders: [] };
            mockImporter.importAllData.mockImplementation(() => {
                throw new Error('Import error');
            });

            await expect(sync.importFromSheets(mockSheetsData)).rejects.toThrow('Import error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error importing from Google Sheets:', expect.any(Error));
        });
    });

    describe('rebuildCache', () => {
        const mockImportedData = {
            imported: {
                hiddenOrders: {
                    data: [{ orderId: '123-4567890-1234567', type: 'details', orderData: {} }]
                },
                actionLog: {
                    data: [{ actionType: 'hide', orderId: '123-4567890-1234567' }]
                },
                userSettings: {
                    data: [{ username: 'john_doe', timestamp: '2024-01-15T10:30:00Z' }]
                }
            }
        };

        it('should rebuild all cache types successfully', async () => {
            // Mock the individual rebuild methods
            jest.spyOn(sync, 'rebuildHiddenOrdersCache').mockResolvedValue();
            jest.spyOn(sync, 'rebuildActionLogCache').mockResolvedValue();
            jest.spyOn(sync, 'rebuildUserSettingsCache').mockResolvedValue();

            await sync.rebuildCache(mockImportedData);

            expect(sync.rebuildHiddenOrdersCache).toHaveBeenCalledWith(mockImportedData.imported.hiddenOrders.data);
            expect(sync.rebuildActionLogCache).toHaveBeenCalledWith(mockImportedData.imported.actionLog.data);
            expect(sync.rebuildUserSettingsCache).toHaveBeenCalledWith(mockImportedData.imported.userSettings.data);

            expect(mockLogger.success).toHaveBeenCalledWith('Cache rebuilt successfully');
        });

        it('should handle missing data types gracefully', async () => {
            const partialData = {
                imported: {
                    hiddenOrders: {
                        data: [{ orderId: '123-4567890-1234567', type: 'details', orderData: {} }]
                    }
                    // Missing actionLog and userSettings
                }
            };

            jest.spyOn(sync, 'rebuildHiddenOrdersCache').mockResolvedValue();

            await sync.rebuildCache(partialData);

            expect(sync.rebuildHiddenOrdersCache).toHaveBeenCalled();
            expect(mockLogger.success).toHaveBeenCalledWith('Cache rebuilt successfully');
        });

        it('should handle rebuild errors', async () => {
            jest.spyOn(sync, 'rebuildHiddenOrdersCache').mockRejectedValue(new Error('Rebuild error'));

            await expect(sync.rebuildCache(mockImportedData)).rejects.toThrow('Rebuild error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error rebuilding cache:', expect.any(Error));
        });
    });

    describe('rebuildHiddenOrdersCache', () => {
        it('should rebuild hidden orders cache', async () => {
            const hiddenOrders = [
                { orderId: '123-4567890-1234567', type: 'details', orderData: { username: 'john_doe' } },
                { orderId: '987-6543210-7654321', type: 'details', orderData: { username: 'jane_doe' } }
            ];

            await sync.rebuildHiddenOrdersCache(hiddenOrders);

            expect(mockStorage.storeHiddenOrder).toHaveBeenCalledTimes(2);
            expect(mockStorage.storeHiddenOrder).toHaveBeenCalledWith(
                '123-4567890-1234567',
                'details',
                { username: 'john_doe' }
            );
            expect(mockStorage.storeHiddenOrder).toHaveBeenCalledWith(
                '987-6543210-7654321',
                'details',
                { username: 'jane_doe' }
            );

            expect(mockLogger.success).toHaveBeenCalledWith('Hidden orders cache rebuilt with 2 orders');
        });

        it('should handle storage errors during rebuild', async () => {
            const hiddenOrders = [{ orderId: '123-4567890-1234567', type: 'details', orderData: {} }];
            mockStorage.storeHiddenOrder.mockRejectedValue(new Error('Storage error'));

            await expect(sync.rebuildHiddenOrdersCache(hiddenOrders)).rejects.toThrow('Storage error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error rebuilding hidden orders cache:', expect.any(Error));
        });
    });

    describe('rebuildActionLogCache', () => {
        it('should rebuild action log cache', async () => {
            const actionLog = [
                { actionType: 'hide', orderId: '123-4567890-1234567' },
                { actionType: 'unhide', orderId: '987-6543210-7654321' }
            ];

            await sync.rebuildActionLogCache(actionLog);

            expect(mockStorage.storeActionLog).toHaveBeenCalledTimes(2);
            expect(mockStorage.storeActionLog).toHaveBeenCalledWith({ actionType: 'hide', orderId: '123-4567890-1234567' });
            expect(mockStorage.storeActionLog).toHaveBeenCalledWith({ actionType: 'unhide', orderId: '987-6543210-7654321' });

            expect(mockLogger.success).toHaveBeenCalledWith('Action log cache rebuilt with 2 entries');
        });

        it('should handle storage errors during rebuild', async () => {
            const actionLog = [{ actionType: 'hide', orderId: '123-4567890-1234567' }];
            mockStorage.storeActionLog.mockRejectedValue(new Error('Storage error'));

            await expect(sync.rebuildActionLogCache(actionLog)).rejects.toThrow('Storage error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error rebuilding action log cache:', expect.any(Error));
        });
    });

    describe('rebuildUserSettingsCache', () => {
        it('should rebuild user settings cache', async () => {
            const userSettings = [
                { username: 'john_doe', timestamp: '2024-01-15T10:30:00Z' },
                { username: 'jane_doe', timestamp: '2024-01-16T11:30:00Z' }
            ];

            await sync.rebuildUserSettingsCache(userSettings);

            expect(mockStorage.storeUserSettings).toHaveBeenCalledTimes(2);
            expect(mockStorage.storeUserSettings).toHaveBeenCalledWith({ username: 'john_doe', timestamp: '2024-01-15T10:30:00Z' });
            expect(mockStorage.storeUserSettings).toHaveBeenCalledWith({ username: 'jane_doe', timestamp: '2024-01-16T11:30:00Z' });

            expect(mockLogger.success).toHaveBeenCalledWith('User settings cache rebuilt with 2 users');
        });

        it('should handle storage errors during rebuild', async () => {
            const userSettings = [{ username: 'john_doe', timestamp: '2024-01-15T10:30:00Z' }];
            mockStorage.storeUserSettings.mockRejectedValue(new Error('Storage error'));

            await expect(sync.rebuildUserSettingsCache(userSettings)).rejects.toThrow('Storage error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error rebuilding user settings cache:', expect.any(Error));
        });
    });

    describe('validateSyncIntegrity', () => {
        it('should validate sync integrity successfully', async () => {
            const mockImportedData = {
                imported: {
                    hiddenOrders: [{ orderId: '123-4567890-1234567' }],
                    actionLog: [{ actionType: 'hide' }],
                    userSettings: [{ username: 'john_doe' }]
                }
            };

            // Mock storage to return the expected counts
            mockStorage.getAllHiddenOrders.mockResolvedValue([{ orderId: '123-4567890-1234567' }]);
            mockStorage.getAllActionLog.mockResolvedValue([{ actionType: 'hide' }]);
            mockStorage.getAllUserSettings.mockResolvedValue([{ username: 'john_doe' }]);

            const result = await sync.validateSyncIntegrity(mockImportedData);

            expect(result).toEqual({
                timestamp: expect.any(String),
                checks: [
                    'Hidden orders count matches',
                    'Action log count matches',
                    'User settings count matches'
                ],
                passed: true
            });
        });

        it('should detect integrity issues', async () => {
            const mockImportedData = {
                imported: {
                    hiddenOrders: [],
                    actionLog: [{ actionType: 'hide', orderId: '123-4567890-1234567' }],
                    userSettings: []
                }
            };

            const result = await sync.validateSyncIntegrity(mockImportedData);

            expect(result.passed).toBe(false);
            expect(result.checks).toContain('Action log count mismatch: expected 1, got 0');
        });
    });

    describe('Utility methods', () => {
        it('should check if resync is in progress', () => {
            sync.isSyncing = true;
            expect(sync.isResyncInProgress()).toBe(true);

            sync.isSyncing = false;
            expect(sync.isResyncInProgress()).toBe(false);
        });

        it('should get sync status', () => {
            const status = sync.getSyncStatus();
            expect(status).toEqual({
                isSyncing: false,
                lastSync: undefined,
                timestamp: expect.any(String)
            });
        });
    });

    describe('defaultSync', () => {
        it('should be an instance of GoogleSheetsSync', () => {
            expect(defaultSync).toBeInstanceOf(GoogleSheetsSync);
        });

        it('should have all required methods', () => {
            expect(typeof defaultSync.performResync).toBe('function');
            expect(typeof defaultSync.getCacheStatistics).toBe('function');
            expect(typeof defaultSync.clearCache).toBe('function');
            expect(typeof defaultSync.importFromSheets).toBe('function');
            expect(typeof defaultSync.rebuildCache).toBe('function');
            expect(typeof defaultSync.validateSyncIntegrity).toBe('function');
        });
    });
});
