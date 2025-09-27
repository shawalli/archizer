import { PopupStorageManager, PopupManager } from './popup.js';

// Mock Chrome APIs
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn()
        }
    },
    tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
    }
};

// Mock DOM elements
const createMockDOM = () => {
    document.body.innerHTML = `
        <div id="main-view">
            <button id="settings-btn">Settings</button>
            <button id="resync-btn">Resync</button>
            <div id="hidden-orders-list"></div>
        </div>
        <div id="settings-view" class="hidden">
            <button id="back-btn">Back</button>
            <input id="username" type="text" placeholder="Enter username">
            <button id="save-username">Save Username</button>
        </div>
        <div id="resync-dialog" class="hidden">
            <button id="resync-confirm">Confirm</button>
            <button id="resync-cancel">Cancel</button>
        </div>
    `;
};

// Mock logger
// Mock the logger module
jest.mock('../utils/logger.js', () => ({
    specializedLogger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        warning: jest.fn(),
        success: jest.fn()
    }
}));

// Mock the config-manager module
jest.mock('../utils/config-manager.js', () => ({
    configManager: {
        get: jest.fn(),
        set: jest.fn(),
        setLenient: jest.fn(),
        onAutoSave: jest.fn(),
        extractSheetId: jest.fn(),
        autoSaveCallbacks: new Map()
    }
}));

const { specializedLogger } = require('../utils/logger.js');

describe('PopupStorageManager', () => {
    let storageManager;

    beforeEach(() => {
        global.chrome = mockChrome;
        storageManager = new PopupStorageManager();
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete global.chrome;
    });

    describe('constructor', () => {
        it('should initialize with correct prefix', () => {
            expect(storageManager.prefix).toBe('amazon_archiver_');
        });
    });

    describe('get method', () => {
        it('should retrieve data from storage successfully', async () => {
            const mockData = { 'amazon_archiver_username': 'testuser' };
            mockChrome.storage.local.get.mockResolvedValue(mockData);

            const result = await storageManager.get('username');

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('amazon_archiver_username');
            expect(result).toBe('testuser');
        });

        it('should return null when key does not exist', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});

            const result = await storageManager.get('nonexistent');

            expect(result).toBe(null);
        });

        it('should handle storage errors gracefully', async () => {
            const error = new Error('Storage error');
            mockChrome.storage.local.get.mockRejectedValue(error);

            const result = await storageManager.get('username');

            expect(specializedLogger.error).toHaveBeenCalledWith('Error getting from storage:', error);
            expect(result).toBe(null);
        });
    });

    describe('set method', () => {
        it('should store data successfully', async () => {
            mockChrome.storage.local.set.mockResolvedValue();

            await storageManager.set('username', 'testuser');

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_username': 'testuser'
            });
        });

        it('should throw error when storage fails', async () => {
            const error = new Error('Storage error');
            mockChrome.storage.local.set.mockRejectedValue(error);

            await expect(storageManager.set('username', 'testuser')).rejects.toThrow('Storage error');
            expect(specializedLogger.error).toHaveBeenCalledWith('Error setting storage:', error);
        });
    });

    describe('remove method', () => {
        it('should remove data successfully', async () => {
            mockChrome.storage.local.remove.mockResolvedValue();

            await storageManager.remove('username');

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('amazon_archiver_username');
        });

        it('should handle removal errors gracefully', async () => {
            const error = new Error('Storage error');
            mockChrome.storage.local.remove.mockRejectedValue(error);

            await storageManager.remove('username');

            expect(specializedLogger.error).toHaveBeenCalledWith('Error removing from storage:', error);
        });
    });
});

describe('PopupManager', () => {
    let popupManager;

    beforeEach(() => {
        global.chrome = mockChrome;
        createMockDOM();
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete global.chrome;
        document.body.innerHTML = '';
    });

    describe('constructor and initialization', () => {
        it('should create instance with correct properties', () => {
            popupManager = new PopupManager();

            expect(popupManager.storage).toBeInstanceOf(PopupStorageManager);
            expect(popupManager.currentView).toBe('main');
        });

        it('should initialize storage manager', () => {
            popupManager = new PopupManager();

            expect(popupManager.storage).toBeDefined();
            expect(popupManager.storage.prefix).toBe('amazon_archiver_');
        });
    });

    describe('showView method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should show main view and hide settings view', () => {
            popupManager.showView('main');

            const mainView = document.getElementById('main-view');
            const settingsView = document.getElementById('settings-view');

            expect(mainView.classList.contains('hidden')).toBe(false);
            expect(settingsView.classList.contains('hidden')).toBe(true);
            expect(popupManager.currentView).toBe('main');
        });

        it('should show settings view and hide main view', () => {
            popupManager.showView('settings');

            const mainView = document.getElementById('main-view');
            const settingsView = document.getElementById('settings-view');

            expect(mainView.classList.contains('hidden')).toBe(true);
            expect(settingsView.classList.contains('hidden')).toBe(false);
            expect(popupManager.currentView).toBe('settings');
        });
    });

    describe('loadUserSettings method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should load and display username from storage', async () => {
            // Mock configManager.get to return username
            const { configManager } = require('../utils/config-manager.js');
            configManager.get.mockResolvedValue('testuser');

            await popupManager.loadUserSettings();

            const usernameInput = document.getElementById('username');
            expect(usernameInput.value).toBe('testuser');
        });

        it('should handle missing username gracefully', async () => {
            // Clear any existing value first
            const usernameInput = document.getElementById('username');
            usernameInput.value = '';

            // Mock configManager.get to return null (no username)
            const { configManager } = require('../utils/config-manager.js');
            configManager.get.mockResolvedValue(null);

            await popupManager.loadUserSettings();

            expect(usernameInput.value).toBe('');
        });

        it('should handle storage errors gracefully', async () => {
            const error = new Error('Storage error');
            // Mock configManager.get to throw error
            const { configManager } = require('../utils/config-manager.js');
            configManager.get.mockRejectedValue(error);

            await popupManager.loadUserSettings();

            expect(specializedLogger.error).toHaveBeenCalledWith('Error loading user settings:', error);
        });
    });

    describe('getAllHiddenOrders method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should retrieve all hidden orders from storage', async () => {
            const mockStorageData = {
                'amazon_archiver_hidden_order_123_details': { orderId: '123', type: 'details' },
                'amazon_archiver_hidden_order_456_details': { orderId: '456', type: 'details' },
                'amazon_archiver_other_data': 'unrelated'
            };
            mockChrome.storage.local.get.mockResolvedValue(mockStorageData);

            const result = await popupManager.getAllHiddenOrders();

            expect(result).toHaveLength(2);
            expect(result).toContainEqual({ orderId: '123', type: 'details' });
            expect(result).toContainEqual({ orderId: '456', type: 'details' });
        });

        it('should return empty array when no hidden orders exist', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_other_data': 'unrelated'
            });

            const result = await popupManager.getAllHiddenOrders();

            expect(result).toHaveLength(0);
        });

        it('should handle storage errors gracefully', async () => {
            const error = new Error('Storage error');
            mockChrome.storage.local.get.mockRejectedValue(error);

            const result = await popupManager.getAllHiddenOrders();

            expect(specializedLogger.error).toHaveBeenCalledWith('Error getting all hidden orders:', error);
            expect(result).toEqual([]);
        });
    });

    describe('displayHiddenOrders method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should display hidden orders with correct HTML structure', () => {
            const hiddenOrders = [
                {
                    orderId: '123',
                    type: 'details',
                    username: 'testuser',
                    orderData: {
                        orderDate: '2023-01-01',
                        orderTotal: '$99.99',
                        tags: ['electronics', 'gift']
                    }
                }
            ];

            popupManager.displayHiddenOrders(hiddenOrders);

            const container = document.getElementById('hidden-orders-list');
            expect(container.innerHTML).toContain('Order #123');
            expect(container.innerHTML).toContain('@testuser');
            expect(container.innerHTML).toContain('electronics');
            expect(container.innerHTML).toContain('gift');
            expect(container.innerHTML).toContain('2023-01-01');
            expect(container.innerHTML).toContain('$99.99');
        });

        it('should display message when no hidden orders exist', () => {
            popupManager.displayHiddenOrders([]);

            const container = document.getElementById('hidden-orders-list');
            expect(container.innerHTML).toContain('No hidden orders found');
        });

        it('should handle missing order data gracefully', () => {
            const hiddenOrders = [
                {
                    orderId: '123',
                    type: 'details'
                    // Missing orderData, username, tags
                }
            ];

            popupManager.displayHiddenOrders(hiddenOrders);

            const container = document.getElementById('hidden-orders-list');
            expect(container.innerHTML).toContain('Order #123');
            expect(container.innerHTML).toContain('Date unknown');
            expect(container.innerHTML).toContain('Total unknown');
        });

        it('should add event listeners to show details buttons', () => {
            const hiddenOrders = [
                {
                    orderId: '123',
                    type: 'details',
                    orderData: {
                        orderDate: '2023-01-01',
                        orderTotal: '$29.99'
                    }
                }
            ];

            popupManager.displayHiddenOrders(hiddenOrders);

            const showDetailsBtn = document.querySelector('.show-details-btn');
            expect(showDetailsBtn).toBeDefined();
            expect(showDetailsBtn.dataset.orderId).toBe('123');
            expect(showDetailsBtn.dataset.type).toBe('details');
        });
    });

    describe('unhideOrder method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should remove order from storage and reload list', async () => {
            mockChrome.storage.local.remove.mockResolvedValue();

            // Mock loadHiddenOrders to avoid complex setup
            popupManager.loadHiddenOrders = jest.fn();

            await popupManager.unhideOrder('123', 'details');

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('amazon_archiver_hidden_order_123_details');
            expect(popupManager.loadHiddenOrders).toHaveBeenCalled();
        });

        it('should show success message after unhiding', async () => {
            mockChrome.storage.local.remove.mockResolvedValue();
            popupManager.loadHiddenOrders = jest.fn();
            popupManager.showMessage = jest.fn();

            await popupManager.unhideOrder('123', 'details');

            expect(popupManager.showMessage).toHaveBeenCalledWith('Order unhidden successfully!', 'success');
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Storage error');
            // Mock the storage manager's remove method directly to throw an error
            popupManager.storage.remove = jest.fn().mockRejectedValue(error);
            popupManager.showMessage = jest.fn();

            await popupManager.unhideOrder('123', 'details');

            expect(specializedLogger.error).toHaveBeenCalledWith('Error unhiding order:', error);
            expect(popupManager.showMessage).toHaveBeenCalledWith('Error unhiding order', 'error');
        });
    });

    describe('showMessage method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should create and display message element', () => {
            popupManager.showMessage('Test message', 'success');

            const messageEl = document.querySelector('.message.message-success');
            expect(messageEl).toBeDefined();
            expect(messageEl.textContent).toBe('Test message');
            expect(messageEl.style.background).toBe('rgb(40, 167, 69)'); // #28a745
        });

        it('should apply correct styling for different message types', () => {
            popupManager.showMessage('Error message', 'error');

            const messageEl = document.querySelector('.message.message-error');
            expect(messageEl.style.background).toBe('rgb(220, 53, 69)'); // #dc3545
        });

        it('should apply default styling for info messages', () => {
            popupManager.showMessage('Info message');

            const messageEl = document.querySelector('.message.message-info');
            expect(messageEl.style.background).toBe('rgb(23, 162, 184)'); // #17a2b8
        });

        it('should remove message after 3 seconds', () => {
            jest.useFakeTimers();

            popupManager.showMessage('Test message');

            const messageEl = document.querySelector('.message');
            expect(messageEl).toBeDefined();

            jest.advanceTimersByTime(3000);

            expect(document.querySelector('.message')).toBeNull();

            jest.useRealTimers();
        });
    });

    describe('resync dialog methods', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should show resync dialog', () => {
            popupManager.showResyncDialog();

            const dialog = document.getElementById('resync-dialog');
            expect(dialog.classList.contains('hidden')).toBe(false);
        });

        it('should hide resync dialog', () => {
            popupManager.hideResyncDialog();

            const dialog = document.getElementById('resync-dialog');
            expect(dialog.classList.contains('hidden')).toBe(true);
        });
    });

    describe('executeResync method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should clear hidden orders and communicate with content script', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_hidden_order_123_details': { orderId: '123' }
            });
            mockChrome.storage.local.remove.mockResolvedValue();
            mockChrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://amazon.com/orders' }]);
            mockChrome.tabs.sendMessage.mockResolvedValue({ success: true, restoredCount: 5 });

            popupManager.hideResyncDialog = jest.fn();
            popupManager.showMessage = jest.fn();
            popupManager.loadHiddenOrders = jest.fn();

            await popupManager.executeResync();

            expect(mockChrome.storage.local.remove).toHaveBeenCalled();
            expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'resync-orders' });
            expect(popupManager.hideResyncDialog).toHaveBeenCalled();
            expect(popupManager.showMessage).toHaveBeenCalledWith('Orders resynced successfully! No hidden orders found in Google Sheets.', 'success');
            expect(popupManager.loadHiddenOrders).toHaveBeenCalled();
        });

        it('should handle non-Amazon pages gracefully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});
            mockChrome.storage.local.remove.mockResolvedValue();
            mockChrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://google.com' }]);

            popupManager.hideResyncDialog = jest.fn();
            popupManager.showMessage = jest.fn();
            popupManager.loadHiddenOrders = jest.fn();

            await popupManager.executeResync();

            expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
            expect(popupManager.hideResyncDialog).toHaveBeenCalled();
            expect(popupManager.showMessage).toHaveBeenCalledWith('Orders resynced successfully! No hidden orders found in Google Sheets.', 'success');
        });

        it('should handle content script communication errors gracefully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});
            mockChrome.storage.local.remove.mockResolvedValue();
            mockChrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://amazon.com/orders' }]);
            mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Communication error'));

            popupManager.hideResyncDialog = jest.fn();
            popupManager.showMessage = jest.fn();
            popupManager.loadHiddenOrders = jest.fn();

            await popupManager.executeResync();

            expect(specializedLogger.warning).toHaveBeenCalledWith('⚠️ Could not communicate with content script (may not be on orders page):', expect.any(Error));
            expect(popupManager.hideResyncDialog).toHaveBeenCalled();
        });

        it('should handle general errors gracefully', async () => {
            const error = new Error('General error');
            mockChrome.storage.local.get.mockRejectedValue(error);

            popupManager.showMessage = jest.fn();

            await popupManager.executeResync();

            expect(specializedLogger.error).toHaveBeenCalledWith('❌ Error during resync:', error);
            expect(popupManager.showMessage).toHaveBeenCalledWith('Error during resync process: General error', 'error');
        });
    });

    describe('clearAllHiddenOrders method', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should clear all hidden order data from storage', async () => {
            const mockStorageData = {
                'amazon_archiver_hidden_order_123_details': { orderId: '123' },
                'amazon_archiver_hidden_order_456_details': { orderId: '456' },
                'amazon_archiver_order_tags_123': ['tag1', 'tag2'],
                'amazon_archiver_other_data': 'unrelated'
            };
            mockChrome.storage.local.get.mockResolvedValue(mockStorageData);
            mockChrome.storage.local.remove.mockResolvedValue();

            const result = await popupManager.clearAllHiddenOrders();

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith([
                'amazon_archiver_hidden_order_123_details',
                'amazon_archiver_hidden_order_456_details'
            ]);
            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith([
                'amazon_archiver_order_tags_123'
            ]);
            expect(result).toBe(2);
        });

        it('should handle empty storage gracefully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_other_data': 'unrelated'
            });

            const result = await popupManager.clearAllHiddenOrders();

            expect(mockChrome.storage.local.remove).not.toHaveBeenCalled();
            expect(result).toBe(0);
        });

        it('should handle storage errors gracefully', async () => {
            const error = new Error('Storage error');
            mockChrome.storage.local.get.mockRejectedValue(error);

            await expect(popupManager.clearAllHiddenOrders()).rejects.toThrow('Storage error');
            expect(specializedLogger.error).toHaveBeenCalledWith('❌ Error clearing hidden orders:', error);
        });
    });

    describe('event listeners', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should set up settings button click listener', () => {
            const settingsBtn = document.getElementById('settings-btn');
            const clickEvent = new Event('click');

            settingsBtn.dispatchEvent(clickEvent);

            expect(popupManager.currentView).toBe('settings');
        });

        it('should set up back button click listener', () => {
            // First go to settings view
            popupManager.showView('settings');
            expect(popupManager.currentView).toBe('settings');

            const backBtn = document.getElementById('back-btn');
            const clickEvent = new Event('click');

            backBtn.dispatchEvent(clickEvent);

            expect(popupManager.currentView).toBe('main');
        });

        it('should set up resync button click listener', () => {
            const resyncBtn = document.getElementById('resync-btn');
            const clickEvent = new Event('click');

            resyncBtn.dispatchEvent(clickEvent);

            const dialog = document.getElementById('resync-dialog');
            expect(dialog.classList.contains('hidden')).toBe(false);
        });

        it('should set up resync confirm button click listener', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});
            mockChrome.storage.local.remove.mockResolvedValue();
            mockChrome.tabs.query.mockResolvedValue([]);

            popupManager.hideResyncDialog = jest.fn();
            popupManager.showMessage = jest.fn();
            popupManager.loadHiddenOrders = jest.fn();

            const confirmBtn = document.getElementById('resync-confirm');
            const clickEvent = new Event('click');

            confirmBtn.dispatchEvent(clickEvent);

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(popupManager.hideResyncDialog).toHaveBeenCalled();
        });

        it('should set up resync cancel button click listener', () => {
            const cancelBtn = document.getElementById('resync-cancel');
            const clickEvent = new Event('click');

            cancelBtn.dispatchEvent(clickEvent);

            const dialog = document.getElementById('resync-dialog');
            expect(dialog.classList.contains('hidden')).toBe(true);
        });

        it('should not save username on non-enter key press', async () => {
            const usernameInput = document.getElementById('username');
            usernameInput.value = 'testuser';

            const keypressEvent = new KeyboardEvent('keypress', { key: 'Tab' });
            usernameInput.dispatchEvent(keypressEvent);

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
        });
    });
});

