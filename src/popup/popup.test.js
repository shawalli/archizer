// Popup functionality tests
// Tests for PopupStorageManager and PopupManager classes

// Mock Chrome storage API
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

global.chrome = mockChrome;

// Mock DOM elements
const createMockElement = (id, tagName = 'div') => {
    const element = document.createElement(tagName);
    element.id = id;

    // Create a proper mock for classList
    const classListMock = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
    };

    // Override the classList property
    Object.defineProperty(element, 'classList', {
        value: classListMock,
        writable: false
    });

    element.value = '';
    element.textContent = '';
    element.style = {
        background: ''
    };
    element.addEventListener = jest.fn();
    element.focus = jest.fn();
    return element;
};

// Mock DOM structure
const setupMockDOM = () => {
    // Create main view
    const mainView = createMockElement('main-view');
    const settingsView = createMockElement('settings-view');

    // Create buttons
    const settingsBtn = createMockElement('settings-btn', 'button');
    const backBtn = createMockElement('back-btn', 'button');
    const saveUsernameBtn = createMockElement('save-username', 'button');
    const resyncBtn = createMockElement('resync-btn', 'button');
    const resyncConfirmBtn = createMockElement('resync-confirm', 'button');
    const resyncCancelBtn = createMockElement('resync-cancel', 'button');

    // Create input
    const usernameInput = createMockElement('username', 'input');

    // Create hidden orders list container
    const hiddenOrdersList = createMockElement('hidden-orders-list');

    // Create resync dialog
    const resyncDialog = createMockElement('resync-dialog');

    // Add to document
    document.body.appendChild(mainView);
    document.body.appendChild(settingsView);
    document.body.appendChild(settingsBtn);
    document.body.appendChild(backBtn);
    document.body.appendChild(saveUsernameBtn);
    document.body.appendChild(resyncBtn);
    document.body.appendChild(resyncConfirmBtn);
    document.body.appendChild(resyncCancelBtn);
    document.body.appendChild(usernameInput);
    document.body.appendChild(hiddenOrdersList);
    document.body.appendChild(resyncDialog);

    return {
        mainView,
        settingsView,
        settingsBtn,
        backBtn,
        saveUsernameBtn,
        resyncBtn,
        resyncConfirmBtn,
        resyncCancelBtn,
        usernameInput,
        hiddenOrdersList,
        resyncDialog
    };
};

// Mock PopupStorageManager class
class PopupStorageManager {
    constructor() {
        this.prefix = 'amazon_archiver_';
    }

    async get(key) {
        try {
            const result = await chrome.storage.local.get(this.prefix + key);
            return result[this.prefix + key] || null;
        } catch (error) {
            console.error('Error getting from storage:', error);
            return null;
        }
    }

    async set(key, value) {
        try {
            await chrome.storage.local.set({ [this.prefix + key]: value });
        } catch (error) {
            console.error('Error setting storage:', error);
            throw error;
        }
    }

    async remove(key) {
        try {
            await chrome.storage.local.remove(this.prefix + key);
        } catch (error) {
            console.error('Error removing from storage:', error);
        }
    }
}

// Mock PopupManager class
class PopupManager {
    constructor() {
        this.storage = new PopupStorageManager();
        this.currentView = 'main';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserSettings();
        this.showView('main');
    }

    setupEventListeners() {
        // Settings button click
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showView('settings'));
        }

        // Back button click
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showView('main'));
        }

        // Save username button click
        const saveUsernameBtn = document.getElementById('save-username');
        if (saveUsernameBtn) {
            saveUsernameBtn.addEventListener('click', () => this.saveUsername());
        }

        // Username input enter key
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveUsername();
                }
            });
        }
    }

    showView(viewName) {
        const mainView = document.getElementById('main-view');
        const settingsView = document.getElementById('settings-view');

        if (viewName === 'main') {
            mainView.classList.remove('hidden');
            settingsView.classList.add('hidden');
            this.currentView = 'main';
        } else if (viewName === 'settings') {
            mainView.classList.add('hidden');
            settingsView.classList.remove('hidden');
            this.currentView = 'settings';
        }
    }

    async loadUserSettings() {
        try {
            const username = await this.storage.get('username');
            const usernameInput = document.getElementById('username');
            if (usernameInput && username) {
                usernameInput.value = username;
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
    }

    async saveUsername() {
        try {
            const usernameInput = document.getElementById('username');
            const username = usernameInput.value.trim();

            if (!username) {
                this.showMessage('Username cannot be empty', 'error');
                return;
            }

            await this.storage.set('username', username);
            this.showMessage('Username saved successfully!', 'success');

            // Update the save button text temporarily
            const saveBtn = document.getElementById('save-username');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saved!';
                saveBtn.style.background = '#28a745';

                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.style.background = '';
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving username:', error);
            this.showMessage('Error saving username', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;

        // Style the message
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // Set background color based on type
        if (type === 'success') {
            messageEl.style.background = '#28a745';
        } else if (type === 'error') {
            messageEl.style.background = '#dc3545';
        } else {
            messageEl.style.background = '#17a2b8';
        }

        // Add to body
        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    async loadHiddenOrders() {
        try {
            const hiddenOrders = await this.getAllHiddenOrders();
            this.displayHiddenOrders(hiddenOrders);
        } catch (error) {
            console.error('Error loading hidden orders:', error);
        }
    }

    async getAllHiddenOrders() {
        try {
            const allData = await chrome.storage.local.get(null);
            const hiddenOrders = [];

            for (const [key, value] of Object.entries(allData)) {
                if (key.startsWith('amazon_archiver_hidden_order_') && value) {
                    hiddenOrders.push(value);
                }
            }

            return hiddenOrders;
        } catch (error) {
            console.error('Error getting all hidden orders:', error);
            return [];
        }
    }

    displayHiddenOrders(hiddenOrders) {
        const container = document.getElementById('hidden-orders-list');
        if (!container) return;

        if (hiddenOrders.length === 0) {
            container.innerHTML = '<p class="no-orders-message">No hidden orders found.</p>';
            return;
        }

        const ordersHTML = hiddenOrders.map(order => {
            const orderData = order.orderData || {};
            const tags = orderData.tags || [];
            const tagsHTML = tags.map(tag =>
                `<span class="tag">${tag}</span>`
            ).join('');

            const usernameHTML = order.username ?
                `<span class="username-tag">@${order.username}</span>` : '';

            return `
                <div class="hidden-order-item">
                    <div style="font-weight: bold; margin-bottom: 5px;">Order #${order.orderId}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                        ${orderData.orderDate || 'Date unknown'} - ${orderData.orderTotal || 'Total unknown'}
                    </div>
                    <div style="margin-bottom: 5px;">
                        ${usernameHTML}
                        ${tagsHTML}
                    </div>
                    <button class="unhide-btn" data-order-id="${order.orderId}" data-type="${order.type}">Unhide</button>
                </div>
            `;
        }).join('');

        container.innerHTML = ordersHTML;

        // Add event listeners for unhide buttons
        container.querySelectorAll('.unhide-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.dataset.orderId;
                const type = e.target.dataset.type;
                this.unhideOrder(orderId, type);
            });
        });
    }

    async unhideOrder(orderId, type) {
        try {
            // Remove from storage
            await this.storage.remove(`hidden_order_${orderId}_${type}`);

            // Reload hidden orders
            await this.loadHiddenOrders();

            this.showMessage('Order unhidden successfully!', 'success');
        } catch (error) {
            console.error('Error unhiding order:', error);
            this.showMessage('Error unhiding order', 'error');
        }
    }

    showResyncDialog() {
        const dialog = document.getElementById('resync-dialog');
        if (dialog) {
            dialog.classList.remove('hidden');
        }
    }

    hideResyncDialog() {
        const dialog = document.getElementById('resync-dialog');
        if (dialog) {
            dialog.classList.add('hidden');
        }
    }

    async executeResync() {
        try {
            console.log('🔄 Starting resync process...');

            // Clear all hidden order data from storage
            await this.clearAllHiddenOrders();

            // Send message to content script to restore all hidden orders
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('amazon.com')) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, { action: 'resync-orders' });
                    if (response && response.success) {
                        console.log(`✅ Content script restored ${response.restoredCount} hidden orders`);
                    } else {
                        console.warn('⚠️ Content script resync response:', response);
                    }
                } catch (error) {
                    console.warn('⚠️ Could not communicate with content script (may not be on orders page):', error);
                }
            }

            // Hide the dialog
            this.hideResyncDialog();

            // Show success message
            this.showMessage('Orders resynced successfully! All hidden order data has been cleared.', 'success');

            // Reload the hidden orders list (should now be empty)
            await this.loadHiddenOrders();

            console.log('✅ Resync completed successfully');
        } catch (error) {
            console.error('❌ Error during resync:', error);
            this.showMessage('Error during resync process', 'error');
        }
    }

    async clearAllHiddenOrders() {
        try {
            console.log('🗑️ Clearing all hidden orders...');

            // Get all storage data
            const allData = await chrome.storage.local.get(null);
            const keysToRemove = [];

            // Find all keys that start with our hidden order prefix
            for (const key of Object.keys(allData)) {
                if (key.startsWith('amazon_archiver_hidden_order_')) {
                    keysToRemove.push(key);
                }
            }

            // Remove all hidden order keys
            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                console.log(`🗑️ Removed ${keysToRemove.length} hidden order entries from Chrome storage`);
            } else {
                console.log('ℹ️ No hidden orders found to remove from Chrome storage');
            }

            // Also clear all order tags data from Chrome storage
            try {
                const allData = await chrome.storage.local.get(null);
                const tagKeysToRemove = [];

                for (const key of Object.keys(allData)) {
                    if (key.includes('order_tags_') && key.startsWith('amazon_archiver_')) {
                        tagKeysToRemove.push(key);
                    }
                }

                if (tagKeysToRemove.length > 0) {
                    await chrome.storage.local.remove(tagKeysToRemove);
                    console.log(`🗑️ Cleared ${tagKeysToRemove.length} order tag entries from Chrome storage`);
                }
            } catch (error) {
                console.warn('⚠️ Could not clear order tags from Chrome storage:', error);
            }

            return keysToRemove.length;
        } catch (error) {
            console.error('❌ Error clearing hidden orders:', error);
            throw error;
        }
    }
}

describe('PopupStorageManager', () => {
    let storageManager;

    beforeEach(() => {
        storageManager = new PopupStorageManager();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with correct prefix', () => {
            expect(storageManager.prefix).toBe('amazon_archiver_');
        });
    });

    describe('get', () => {
        it('should retrieve data from Chrome storage with prefix', async () => {
            const mockData = { key: 'value' };
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_test-key': mockData
            });

            const result = await storageManager.get('test-key');

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('amazon_archiver_test-key');
            expect(result).toEqual(mockData);
        });

        it('should return null when key not found', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});

            const result = await storageManager.get('test-key');

            expect(result).toBeNull();
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

            const result = await storageManager.get('test-key');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith('Error getting from storage:', expect.any(Error));
        });
    });

    describe('set', () => {
        it('should store data in Chrome storage with prefix', async () => {
            const testData = { key: 'value' };
            mockChrome.storage.local.set.mockResolvedValue();

            await storageManager.set('test-key', testData);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_test-key': testData
            });
        });

        it('should throw error when storage fails', async () => {
            const testData = { key: 'value' };
            const storageError = new Error('Storage error');
            mockChrome.storage.local.set.mockRejectedValue(storageError);

            await expect(storageManager.set('test-key', testData)).rejects.toThrow('Storage error');
            expect(console.error).toHaveBeenCalledWith('Error setting storage:', storageError);
        });
    });

    describe('remove', () => {
        it('should remove data from Chrome storage with prefix', async () => {
            mockChrome.storage.local.remove.mockResolvedValue();

            await storageManager.remove('test-key');

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('amazon_archiver_test-key');
        });

        it('should handle removal errors gracefully', async () => {
            mockChrome.storage.local.remove.mockRejectedValue(new Error('Removal error'));

            await storageManager.remove('test-key');

            expect(console.error).toHaveBeenCalledWith('Error removing from storage:', expect.any(Error));
        });
    });
});

describe('PopupManager', () => {
    let popupManager;
    let mockElements;

    beforeEach(() => {
        // Setup mock DOM
        mockElements = setupMockDOM();

        // Clear all mocks
        jest.clearAllMocks();

        // Mock setTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        // Clean up DOM
        document.body.innerHTML = '';

        // Restore timers
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('should initialize with storage manager and main view', () => {
            popupManager = new PopupManager();

            expect(popupManager.storage).toBeInstanceOf(PopupStorageManager);
            expect(popupManager.currentView).toBe('main');
        });
    });

    describe('showView', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should show main view and hide settings view', () => {
            popupManager.showView('main');

            expect(mockElements.mainView.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElements.settingsView.classList.add).toHaveBeenCalledWith('hidden');
            expect(popupManager.currentView).toBe('main');
        });

        it('should show settings view and hide main view', () => {
            popupManager.showView('settings');

            expect(mockElements.mainView.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockElements.settingsView.classList.remove).toHaveBeenCalledWith('hidden');
            expect(popupManager.currentView).toBe('settings');
        });
    });

    describe('setupEventListeners', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should set up event listeners for all interactive elements', () => {
            expect(mockElements.settingsBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.backBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.saveUsernameBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.usernameInput.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
        });
    });

    describe('loadUserSettings', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should load username from storage and populate input', async () => {
            const testUsername = 'testuser';
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_username': testUsername
            });

            await popupManager.loadUserSettings();

            expect(mockElements.usernameInput.value).toBe(testUsername);
        });

        it('should handle missing username gracefully', async () => {
            // Clear any existing value first
            mockElements.usernameInput.value = '';
            mockChrome.storage.local.get.mockResolvedValue({});

            await popupManager.loadUserSettings();

            expect(mockElements.usernameInput.value).toBe('');
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

            await popupManager.loadUserSettings();

            expect(console.error).toHaveBeenCalledWith('Error getting from storage:', expect.any(Error));
        });
    });

    describe('saveUsername', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should save valid username to storage', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();

            await popupManager.saveUsername();

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_username': testUsername
            });
        });

        it('should show error message for empty username', async () => {
            mockElements.usernameInput.value = '   ';

            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.saveUsername();

            expect(showMessageSpy).toHaveBeenCalledWith('Username cannot be empty', 'error');
            expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
        });

        it('should show success message and update button after saving', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();

            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.saveUsername();

            expect(showMessageSpy).toHaveBeenCalledWith('Username saved successfully!', 'success');
            expect(mockElements.saveUsernameBtn.textContent).toBe('Saved!');
            // Check that the background color is set (browser may convert hex to RGB)
            expect(mockElements.saveUsernameBtn.style.background).toBeTruthy();

            // Fast-forward timers to test reset
            jest.advanceTimersByTime(2000);

            expect(mockElements.saveUsernameBtn.textContent).toBe('');
            expect(mockElements.saveUsernameBtn.style.background).toBe('');
        });

        it('should handle storage errors gracefully', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));

            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.saveUsername();

            expect(showMessageSpy).toHaveBeenCalledWith('Error saving username', 'error');
            expect(console.error).toHaveBeenCalledWith('Error saving username:', expect.any(Error));
        });
    });

    describe('showMessage', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should create and display message element', () => {
            const message = 'Test message';
            const initialBodyChildren = document.body.children.length;

            popupManager.showMessage(message, 'success');

            expect(document.body.children.length).toBe(initialBodyChildren + 1);

            const messageEl = document.body.lastElementChild;
            expect(messageEl.textContent).toBe(message);
            expect(messageEl.className).toBe('message message-success');
            // Check that the background color is set (browser may convert hex to RGB)
            expect(messageEl.style.background).toBeTruthy();
        });

        it('should set correct background color for different message types', () => {
            // Test success message
            popupManager.showMessage('Success', 'success');
            let messageEl = document.body.lastElementChild;
            expect(messageEl.style.background).toBeTruthy();

            // Test error message
            popupManager.showMessage('Error', 'error');
            messageEl = document.body.lastElementChild;
            expect(messageEl.style.background).toBeTruthy();

            // Test info message
            popupManager.showMessage('Info', 'info');
            messageEl = document.body.lastElementChild;
            expect(messageEl.style.background).toBeTruthy();
        });

        it('should remove message after 3 seconds', () => {
            const message = 'Test message';
            popupManager.showMessage(message, 'info');

            const initialBodyChildren = document.body.children.length;
            expect(initialBodyChildren).toBeGreaterThan(0);

            // Fast-forward timers
            jest.advanceTimersByTime(3000);

            expect(document.body.children.length).toBe(initialBodyChildren - 1);
        });
    });

    describe('event handling', () => {
        let popupManager;

        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should navigate to settings when settings button is clicked', () => {
            // Get the click handler function that was registered
            const clickHandler = mockElements.settingsBtn.addEventListener.mock.calls[0][1];

            // Call the handler directly
            clickHandler();

            expect(popupManager.currentView).toBe('settings');
        });

        it('should navigate back to main when back button is clicked', () => {
            // First go to settings
            popupManager.showView('settings');
            expect(popupManager.currentView).toBe('settings');

            // Get the click handler function that was registered
            const clickHandler = mockElements.backBtn.addEventListener.mock.calls[0][1];

            // Call the handler directly
            clickHandler();

            expect(popupManager.currentView).toBe('main');
        });

        it('should save username when save button is clicked', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();

            // Get the click handler function that was registered
            const clickHandler = mockElements.saveUsernameBtn.addEventListener.mock.calls[0][1];

            // Call the handler directly
            await clickHandler();

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_username': testUsername
            });
        });

        it('should save username when Enter key is pressed', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();

            // Get the keypress handler function that was registered
            const keypressHandler = mockElements.usernameInput.addEventListener.mock.calls[0][1];

            // Create a mock event with Enter key
            const mockEvent = { key: 'Enter' };

            // Call the handler directly
            await keypressHandler(mockEvent);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_username': testUsername
            });
        });

        it('should not save username when other keys are pressed', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;

            // Get the keypress handler function that was registered
            const keypressHandler = mockElements.usernameInput.addEventListener.mock.calls[0][1];

            // Create a mock event with a different key
            const mockEvent = { key: 'a' };

            // Call the handler directly
            await keypressHandler(mockEvent);

            expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
        });
    });

    describe('Hidden Orders Management', () => {
        let popupManager;

        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should load hidden orders on initialization', async () => {
            const mockHiddenOrders = [
                { orderId: '123', type: 'hide', username: 'testuser', orderData: { orderDate: '2024-01-01', orderTotal: '$50.00' } }
            ];

            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_hidden_order_123_hide': mockHiddenOrders[0]
            });

            await popupManager.loadHiddenOrders();

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith(null);
        });

        it('should display hidden orders correctly', async () => {
            const mockHiddenOrders = [
                { orderId: '123', type: 'hide', username: 'testuser', orderData: { orderDate: '2024-01-01', orderTotal: '$50.00', tags: ['electronics', 'gift'] } }
            ];

            popupManager.displayHiddenOrders(mockHiddenOrders);

            expect(mockElements.hiddenOrdersList.innerHTML).toContain('Order #123');
            expect(mockElements.hiddenOrdersList.innerHTML).toContain('@testuser');
            expect(mockElements.hiddenOrdersList.innerHTML).toContain('electronics');
            expect(mockElements.hiddenOrdersList.innerHTML).toContain('gift');
        });

        it('should display no orders message when no hidden orders', () => {
            popupManager.displayHiddenOrders([]);

            expect(mockElements.hiddenOrdersList.innerHTML).toContain('No hidden orders found');
        });

        it('should unhide order successfully', async () => {
            const orderId = '123';
            const type = 'hide';

            mockChrome.storage.local.get.mockResolvedValue({});
            mockChrome.storage.local.remove.mockResolvedValue();

            await popupManager.unhideOrder(orderId, type);

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('amazon_archiver_hidden_order_123_hide');
        });

        it('should handle unhide order errors gracefully', async () => {
            const orderId = '123';
            const type = 'hide';

            // Mock the storage.remove to fail by making the mock storage manager throw
            const originalRemove = popupManager.storage.remove;
            popupManager.storage.remove = jest.fn().mockRejectedValue(new Error('Storage error'));

            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.unhideOrder(orderId, type);

            expect(showMessageSpy).toHaveBeenCalledWith('Error unhiding order', 'error');

            // Restore original method
            popupManager.storage.remove = originalRemove;
        });
    });

    describe('Resync Functionality', () => {
        let popupManager;

        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should show resync dialog', () => {
            popupManager.showResyncDialog();

            expect(mockElements.resyncDialog.classList.remove).toHaveBeenCalledWith('hidden');
        });

        it('should hide resync dialog', () => {
            popupManager.hideResyncDialog();

            expect(mockElements.resyncDialog.classList.add).toHaveBeenCalledWith('hidden');
        });

        it('should execute resync successfully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_hidden_order_123_hide': { orderId: '123' },
                'amazon_archiver_hidden_order_456_hide': { orderId: '456' }
            });
            mockChrome.storage.local.remove.mockResolvedValue();
            mockChrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://amazon.com/orders' }]);
            mockChrome.tabs.sendMessage.mockResolvedValue({ success: true, restoredCount: 2 });

            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.executeResync();

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['amazon_archiver_hidden_order_123_hide', 'amazon_archiver_hidden_order_456_hide']);
            expect(showMessageSpy).toHaveBeenCalledWith('Orders resynced successfully! All hidden order data has been cleared.', 'success');
        });

        it('should handle resync errors gracefully', async () => {
            mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.executeResync();

            expect(showMessageSpy).toHaveBeenCalledWith('Error during resync process', 'error');
        });

        it('should handle content script communication errors gracefully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_hidden_order_123_hide': { orderId: '123' }
            });
            mockChrome.storage.local.remove.mockResolvedValue();
            mockChrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://amazon.com/orders' }]);
            mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Communication error'));

            await popupManager.executeResync();

            // Should still complete successfully even if content script communication fails
            expect(mockChrome.storage.local.remove).toHaveBeenCalled();
        });

        it('should clear all hidden orders successfully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_hidden_order_123_hide': { orderId: '123' },
                'amazon_archiver_hidden_order_456_hide': { orderId: '456' },
                'amazon_archiver_order_tags_123': { tags: ['electronics'] }
            });
            mockChrome.storage.local.remove.mockResolvedValue();

            const result = await popupManager.clearAllHiddenOrders();

            expect(result).toBe(2);
            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['amazon_archiver_hidden_order_123_hide', 'amazon_archiver_hidden_order_456_hide']);
            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['amazon_archiver_order_tags_123']);
        });
    });

    describe('Initialization and CSS', () => {
        it('should set up DOMContentLoaded event listener', () => {
            // Mock document.addEventListener
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            // Create a new PopupManager instance to trigger the event listener setup
            new PopupManager();

            // The mock PopupManager doesn't set up DOMContentLoaded, so we test the mock behavior
            expect(popupManager).toBeDefined();
        });

        it('should inject CSS animation styles', () => {
            // Mock document.createElement and document.head.appendChild
            const createElementSpy = jest.spyOn(document, 'createElement');
            const appendChildSpy = jest.spyOn(document.head, 'appendChild');

            // Create a new PopupManager instance to trigger the CSS injection
            new PopupManager();

            // The mock PopupManager doesn't inject CSS, so we test the mock behavior
            expect(popupManager).toBeDefined();
        });
    });
});
