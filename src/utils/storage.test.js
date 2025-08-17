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

    describe('storeHiddenOrder', () => {
        it('should store hidden order with username', async () => {
            const mockUsername = 'TestUser';
            const mockOrderData = { orderId: '123', type: 'details' };

            // Mock the get method to return a username
            jest.spyOn(storageManager, 'get').mockResolvedValue(mockUsername);
            mockChrome.storage.local.set.mockImplementation((data) => {
                return Promise.resolve();
            });

            await storageManager.storeHiddenOrder('123', 'details', mockOrderData);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_hidden_order_123_details': {
                    orderId: '123',
                    type: 'details',
                    orderData: mockOrderData,
                    username: mockUsername,
                    timestamp: expect.any(String)
                }
            });
        });

        it('should use default username when no username is stored', async () => {
            const mockOrderData = { orderId: '123', type: 'details' };

            // Mock the get method to return null (no username)
            jest.spyOn(storageManager, 'get').mockResolvedValue(null);
            mockChrome.storage.local.set.mockImplementation((data) => {
                return Promise.resolve();
            });

            await storageManager.storeHiddenOrder('123', 'details', mockOrderData);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_hidden_order_123_details': {
                    orderId: '123',
                    type: 'details',
                    orderData: mockOrderData,
                    username: 'Unknown User',
                    timestamp: expect.any(String)
                }
            });
        });
    });

    describe('getAllHiddenOrders', () => {
        it('should retrieve all hidden orders from storage', async () => {
            const mockHiddenOrders = {
                'amazon_archiver_hidden_order_123_details': {
                    orderId: '123',
                    type: 'details',
                    orderData: { orderId: '123' },
                    username: 'TestUser',
                    timestamp: '2025-01-01T00:00:00.000Z'
                },
                'amazon_archiver_hidden_order_456_order': {
                    orderId: '456',
                    type: 'order',
                    orderData: { orderId: '456' },
                    username: 'TestUser2',
                    timestamp: '2025-01-02T00:00:00.000Z'
                },
                'amazon_archiver_other_data': 'not a hidden order'
            };

            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.resolve(mockHiddenOrders);
            });

            const result = await storageManager.getAllHiddenOrders();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                orderId: '123',
                type: 'details',
                orderData: { orderId: '123' },
                username: 'TestUser',
                timestamp: '2025-01-01T00:00:00.000Z'
            });
            expect(result[1]).toEqual({
                orderId: '456',
                type: 'order',
                orderData: { orderId: '456' },
                username: 'TestUser2',
                timestamp: '2025-01-02T00:00:00.000Z'
            });
        });

        it('should return empty array when no hidden orders exist', async () => {
            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.resolve({});
            });

            const result = await storageManager.getAllHiddenOrders();

            expect(result).toEqual([]);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            const result = await storageManager.getAllHiddenOrders();

            expect(result).toEqual([]);
        });
    });

    describe('storeOrderTags', () => {
        it('should store order tags data with timestamp', async () => {
            const mockTagData = { tags: ['electronics', 'gift'], notes: 'Birthday present' };
            const orderId = '123';

            mockChrome.storage.local.set.mockImplementation(() => {
                return Promise.resolve();
            });

            await storageManager.storeOrderTags(orderId, mockTagData);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_order_tags_123': {
                    orderId: '123',
                    tagData: mockTagData,
                    timestamp: expect.any(String)
                }
            });
        });

        it('should handle storage errors gracefully', async () => {
            const mockTagData = { tags: ['electronics'] };
            const orderId = '123';

            mockChrome.storage.local.set.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            // Should not throw error
            await expect(storageManager.storeOrderTags(orderId, mockTagData)).resolves.toBeUndefined();
        });
    });

    describe('getOrderTags', () => {
        it('should retrieve order tags data', async () => {
            const mockTagData = { tags: ['electronics', 'gift'], notes: 'Birthday present' };
            const orderId = '123';

            mockChrome.storage.local.get.mockImplementation((key) => {
                if (key === 'amazon_archiver_order_tags_123') {
                    return Promise.resolve({
                        'amazon_archiver_order_tags_123': {
                            orderId: '123',
                            tagData: mockTagData,
                            timestamp: '2025-01-01T00:00:00.000Z'
                        }
                    });
                }
                return Promise.resolve({});
            });

            const result = await storageManager.getOrderTags(orderId);

            expect(result).toEqual(mockTagData);
            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('amazon_archiver_order_tags_123');
        });

        it('should return null when order tags do not exist', async () => {
            const orderId = '123';

            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.resolve({});
            });

            const result = await storageManager.getOrderTags(orderId);

            expect(result).toBeNull();
        });

        it('should handle storage errors gracefully', async () => {
            const orderId = '123';

            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            const result = await storageManager.getOrderTags(orderId);

            expect(result).toBeNull();
        });
    });

    describe('removeOrderTags', () => {
        it('should remove order tags data', async () => {
            const orderId = '123';

            mockChrome.storage.local.remove.mockImplementation(() => {
                return Promise.resolve();
            });

            await storageManager.removeOrderTags(orderId);

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('amazon_archiver_order_tags_123');
        });

        it('should handle storage errors gracefully', async () => {
            const orderId = '123';

            mockChrome.storage.local.remove.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            // Should not throw error
            await expect(storageManager.removeOrderTags(orderId)).resolves.toBeUndefined();
        });
    });

    describe('getAllOrderTags', () => {
        it('should retrieve all order tags from storage', async () => {
            const mockOrderTags = {
                'amazon_archiver_order_tags_123': {
                    orderId: '123',
                    tagData: { tags: ['electronics'], notes: 'Test' },
                    timestamp: '2025-01-01T00:00:00.000Z'
                },
                'amazon_archiver_order_tags_456': {
                    orderId: '456',
                    tagData: { tags: ['gift'], notes: 'Another test' },
                    timestamp: '2025-01-02T00:00:00.000Z'
                },
                'amazon_archiver_other_data': 'not order tags'
            };

            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.resolve(mockOrderTags);
            });

            const result = await storageManager.getAllOrderTags();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                orderId: '123',
                tagData: { tags: ['electronics'], notes: 'Test' },
                timestamp: '2025-01-01T00:00:00.000Z'
            });
            expect(result[1]).toEqual({
                orderId: '456',
                tagData: { tags: ['gift'], notes: 'Another test' },
                timestamp: '2025-01-02T00:00:00.000Z'
            });
        });

        it('should return empty array when no order tags exist', async () => {
            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.resolve({});
            });

            const result = await storageManager.getAllOrderTags();

            expect(result).toEqual([]);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockImplementation(() => {
                return Promise.reject(new Error('Storage error'));
            });

            const result = await storageManager.getAllOrderTags();

            expect(result).toEqual([]);
        });
    });
});
