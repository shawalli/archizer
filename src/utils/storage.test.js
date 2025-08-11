// Storage utility tests
import { StorageManager } from './storage.js';

// Mock Chrome storage API
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn()
        }
    }
};

global.chrome = mockChrome;

describe('StorageManager', () => {
    let storageManager;

    beforeEach(() => {
        storageManager = new StorageManager();
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('should retrieve data from Chrome storage', async () => {
            const mockData = { key: 'value' };
            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ [key]: mockData });
            });

            const result = await storageManager.get('test-key');

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('amazon_archiver_test-key');
            expect(result).toEqual(mockData);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockImplementation((key) => {
                return Promise.resolve({ [key]: null });
            });

            const result = await storageManager.get('test-key');

            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should store data in Chrome storage', async () => {
            const testData = { key: 'value' };
            mockChrome.storage.local.set.mockImplementation((data) => {
                return Promise.resolve();
            });

            await storageManager.set('test-key', testData);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
                { 'amazon_archiver_test-key': testData }
            );
        });
    });

    describe('remove', () => {
        it('should remove data from Chrome storage', async () => {
            mockChrome.storage.local.remove.mockImplementation((key) => {
                return Promise.resolve();
            });

            await storageManager.remove('test-key');

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('amazon_archiver_test-key');
        });
    });
});
