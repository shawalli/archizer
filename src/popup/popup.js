// Popup JavaScript for Amazon Order Archiver
// Handles popup interface logic, navigation, and settings management

console.log('Amazon Order Archiver popup script loaded');

import { configManager } from '../utils/config-manager.js';

// Simple storage manager for popup (for non-config data)
export class PopupStorageManager {
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

export class PopupManager {
    constructor() {
        this.storage = new PopupStorageManager();
        this.currentView = 'main';
        this.lastToastTime = 0; // Track last toast time to prevent duplicates
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupConfigCallbacks();
        await this.loadUserSettings();
        await this.loadHiddenOrders();
        this.showView('main');
    }

    setupConfigCallbacks() {
        console.log('🔧 Setting up config callbacks...');

        // Register callback for username changes
        configManager.onAutoSave('username', (value) => {
            console.log('📢 Username config changed:', value);
            // Username changes are silent (no toast)
        });

        // Register callback for Google Sheets changes
        configManager.onAutoSave('google_sheets', (value) => {
            console.log('📢 Google Sheets config changed:', value);
            console.log('📢 About to show toast...');

            // Prevent duplicate toasts within 1 second
            const now = Date.now();
            if (now - this.lastToastTime > 1000) {
                this.showMessage('Configuration saved automatically', 'success');
                this.lastToastTime = now;
                console.log('📢 Toast shown');
            } else {
                console.log('📢 Toast skipped (duplicate prevention)');
            }
        });

        console.log('✅ Config callbacks registered');
        console.log('📊 Total callbacks registered:', configManager.autoSaveCallbacks.size);
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

        // Settings button click
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            console.log('✅ Settings button found');
            settingsBtn.addEventListener('click', () => this.showView('settings'));
        } else {
            console.error('❌ Settings button not found');
        }

        // Back button click
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showView('main'));
        }

        // Resync button click
        const resyncBtn = document.getElementById('resync-btn');
        if (resyncBtn) {
            resyncBtn.addEventListener('click', () => this.showResyncDialog());
        }

        // Resync dialog buttons
        const resyncConfirmBtn = document.getElementById('resync-confirm');
        if (resyncConfirmBtn) {
            resyncConfirmBtn.addEventListener('click', () => this.executeResync());
        }

        const resyncCancelBtn = document.getElementById('resync-cancel');
        if (resyncCancelBtn) {
            resyncCancelBtn.addEventListener('click', () => this.hideResyncDialog());
        }

        // Google Sheets configuration
        const testConnectionBtn = document.getElementById('test-connection-btn');
        if (testConnectionBtn) {
            console.log('✅ Test connection button found');
            testConnectionBtn.addEventListener('click', () => this.testGoogleSheetsConnection());
        } else {
            console.error('❌ Test connection button not found');
        }

        // Set up sheet URL change detection for first-time setup
        const sheetUrlInput = document.getElementById('sheet-url');
        if (sheetUrlInput) {
            console.log('✅ Setting up sheet URL change listener');
            sheetUrlInput.addEventListener('input', () => {
                console.log('📝 Sheet URL input changed');
                this.handleSheetUrlChangeImmediate();
            });
            // Check initial state when page loads
            setTimeout(() => {
                console.log('🔄 Checking initial button state');
                this.handleSheetUrlChange();
            }, 100);
        } else {
            console.error('❌ Sheet URL input not found');
        }

        // Auto-save configuration with debounce
        this.setupAutoSave();

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
            // Load username from unified config
            const username = await configManager.get('username');
            const usernameInput = document.getElementById('username');
            if (usernameInput && username) {
                usernameInput.value = username;
            }

            // Load Google Sheets configuration from unified config
            await this.loadGoogleSheetsConfig();
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
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


    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;

        // Style the message with stacking support
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
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        if (type === 'success') {
            messageEl.style.background = '#28a745';
        } else if (type === 'error') {
            messageEl.style.background = '#dc3545';
        } else {
            messageEl.style.background = '#17a2b8';
        }

        // Push existing toasts down
        this.pushExistingToastsDown();

        // Add to body
        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
                // Adjust remaining toasts when this one is removed
                this.adjustRemainingToasts();
            }
        }, 3000);
    }

    pushExistingToastsDown() {
        const existingToasts = document.querySelectorAll('.message');
        existingToasts.forEach((toast, index) => {
            // Each toast gets pushed down by 60px (height + margin)
            toast.style.top = `${20 + (index + 1) * 60}px`;
        });
    }

    adjustRemainingToasts() {
        const existingToasts = document.querySelectorAll('.message');
        existingToasts.forEach((toast, index) => {
            // Recalculate positions after a toast is removed
            toast.style.top = `${20 + index * 60}px`;
        });
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
            console.log('🔄 Starting comprehensive resync process...');

            // Step 1: Clear all hidden order data from storage
            console.log('🔄 Step 1: Clearing browser storage...');
            await this.clearAllHiddenOrders();

            // Step 2: Send message to content script to restore all hidden orders (clear page state)
            console.log('🔄 Step 2: Clearing page hiding state...');
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

            // Step 3: Fetch hidden orders from Google Sheets
            console.log('🔄 Step 3: Fetching hidden orders from Google Sheets...');
            const hiddenOrdersData = await this.fetchHiddenOrdersFromSheets();

            if (hiddenOrdersData && hiddenOrdersData.length > 0) {
                console.log(`📥 Fetched ${hiddenOrdersData.length} hidden orders from Google Sheets`);

                // Step 4: Store fetched data in browser storage
                console.log('🔄 Step 4: Storing fetched data in browser storage...');
                await this.storeFetchedHiddenOrders(hiddenOrdersData);

                // Step 5: Apply hiding to current page
                console.log('🔄 Step 5: Applying hiding to current page...');
                if (tab && tab.url && tab.url.includes('amazon.com')) {
                    try {
                        const response = await chrome.tabs.sendMessage(tab.id, {
                            action: 'apply-hidden-orders',
                            hiddenOrders: hiddenOrdersData
                        });
                        if (response && response.success) {
                            console.log(`✅ Applied hiding to ${response.hiddenCount} orders on page`);
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not apply hiding to page:', error);
                    }
                }
            } else {
                console.log('📥 No hidden orders found in Google Sheets');
            }

            // Hide the dialog
            this.hideResyncDialog();

            // Show success message
            const message = hiddenOrdersData && hiddenOrdersData.length > 0
                ? `Orders resynced successfully! Loaded ${hiddenOrdersData.length} hidden orders from Google Sheets.`
                : 'Orders resynced successfully! No hidden orders found in Google Sheets.';
            this.showMessage(message, 'success');

            // Reload the hidden orders list
            await this.loadHiddenOrders();

            console.log('✅ Comprehensive resync completed successfully');
        } catch (error) {
            console.error('❌ Error during resync:', error);
            this.showMessage('Error during resync process: ' + error.message, 'error');
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

    /**
     * Fetch hidden orders from Google Sheets
     * @returns {Array} Array of hidden order data
     */
    async fetchHiddenOrdersFromSheets() {
        try {
            console.log('📥 Fetching hidden orders from Google Sheets...');

            const response = await chrome.runtime.sendMessage({
                type: 'FETCH_HIDDEN_ORDERS_FROM_SHEETS'
            });

            console.log('📊 Raw response from background script:', response);

            if (response && response.success) {
                console.log(`✅ Successfully fetched ${response.hiddenOrders.length} hidden orders from Google Sheets`);
                console.log('📊 Fetched hidden orders:', response.hiddenOrders);
                return response.hiddenOrders;
            } else {
                console.warn('⚠️ Failed to fetch hidden orders from Google Sheets:', response?.error);
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching hidden orders from Google Sheets:', error);
            return [];
        }
    }

    /**
     * Store fetched hidden orders in browser storage
     * @param {Array} hiddenOrdersData - Array of hidden order data from Google Sheets
     */
    async storeFetchedHiddenOrders(hiddenOrdersData) {
        try {
            console.log(`💾 Storing ${hiddenOrdersData.length} hidden orders in browser storage...`);
            console.log(`📊 Raw hidden orders data:`, hiddenOrdersData);

            for (const orderData of hiddenOrdersData) {
                console.log(`📊 Processing order data:`, orderData);
                // Convert Google Sheets data format to storage format
                const storageData = {
                    orderId: orderData.orderId,
                    type: orderData.type || 'details',
                    orderData: {
                        orderNumber: orderData.orderId,
                        orderDate: orderData.orderDate,
                        orderTotal: orderData.orderTotal,
                        orderStatus: orderData.orderStatus,
                        orderItems: orderData.orderItems || [],
                        tags: orderData.tags ? orderData.tags.split(',').map(tag => tag.trim()) : [],
                        notes: orderData.notes || ''
                    },
                    username: orderData.hiddenBy || 'Unknown User',
                    timestamp: orderData.hiddenAt || new Date().toISOString()
                };

                // Store in browser storage using the correct key format
                const key = `amazon_archiver_hidden_order_${orderData.orderId}_${storageData.type}`;

                // Check if this order already exists in storage
                const existingData = await chrome.storage.local.get(key);
                if (existingData[key]) {
                    console.log(`⚠️ Order ${orderData.orderId} already exists in storage, updating...`);
                } else {
                    console.log(`➕ Adding new order ${orderData.orderId} to storage`);
                }

                await chrome.storage.local.set({ [key]: storageData });
            }

            console.log(`✅ Successfully stored ${hiddenOrdersData.length} hidden orders in browser storage`);

            // Debug: Check what was actually stored
            console.log(`🔍 Debug: Checking stored data...`);
            const storedKeys = Object.keys(await chrome.storage.local.get(null))
                .filter(key => key.includes('hidden_order_'));
            console.log(`📊 Stored hidden order keys:`, storedKeys);

            for (const key of storedKeys) {
                const storedData = await chrome.storage.local.get(key);
                console.log(`📊 Stored data for ${key}:`, storedData[key]);
            }
        } catch (error) {
            console.error('❌ Error storing fetched hidden orders:', error);
            throw error;
        }
    }

    // Google Sheets Configuration Methods
    async loadGoogleSheetsConfig() {
        try {
            console.log('📥 Loading Google Sheets configuration...');

            // Load from unified config manager
            const config = await configManager.get('google_sheets');
            if (config) {
                this.populateConfigFields(config);
                console.log('✅ Config loaded from unified config manager');
            } else {
                console.log('ℹ️ No configuration found');
            }
        } catch (error) {
            console.error('❌ Error loading Google Sheets config:', error);
        }
    }

    populateConfigFields(config) {
        const oauthClientIdInput = document.getElementById('oauth-client-id');
        const oauthClientSecretInput = document.getElementById('oauth-client-secret');
        const sheetUrlInput = document.getElementById('sheet-url');

        if (oauthClientIdInput && config.oauthClientId) {
            oauthClientIdInput.value = config.oauthClientId;
        }
        if (oauthClientSecretInput && config.oauthClientSecret) {
            oauthClientSecretInput.value = config.oauthClientSecret;
        }
        if (sheetUrlInput && config.sheetUrl) {
            sheetUrlInput.value = config.sheetUrl;
        }
    }


    async testGoogleSheetsConnection() {
        try {
            console.log('🧪 Testing Google Sheets connection...');

            const oauthClientId = document.getElementById('oauth-client-id').value.trim();
            const oauthClientSecret = document.getElementById('oauth-client-secret').value.trim();
            const sheetUrl = document.getElementById('sheet-url').value.trim();

            if (!oauthClientId || !oauthClientSecret || !sheetUrl) {
                this.showMessage('Please enter OAuth Client ID, Client Secret, and Sheet URL first', 'error');
                return;
            }

            // Validate URL format
            try {
                configManager.extractSheetId(sheetUrl);
                console.log('📝 Testing with sheet ID:', configManager.extractSheetId(sheetUrl));
            } catch (error) {
                this.showMessage(error.message, 'error');
                return;
            }

            // Check if this is a setup operation (button class indicates setup)
            const testConnectionBtn = document.getElementById('test-connection-btn');
            const isSetupOperation = testConnectionBtn && testConnectionBtn.classList.contains('setup-btn');

            // Test connection (and optionally save)
            console.log('📤 Sending test connection request...');
            const response = await chrome.runtime.sendMessage({
                type: 'GOOGLE_SHEETS_TEST_CONNECTION',
                testConfig: { oauthClientId, oauthClientSecret, sheetUrl },
                saveConfig: isSetupOperation
            });

            console.log('📥 Test connection response:', response);

            if (response && response.success) {
                const successMsg = 'Connection successful! Connected to: ' + response.sheetInfo.title;
                console.log('✅', successMsg);

                // Show sheet setup results
                let setupDetails = '';
                if (response.sheetInfo.setupResult) {
                    const setup = response.sheetInfo.setupResult;
                    if (setup.sheetsCreated.length > 0) {
                        setupDetails += `\n\n📝 Created sheets: ${setup.sheetsCreated.join(', ')}`;
                    }
                    if (setup.sheetsSkipped.length > 0) {
                        setupDetails += `\n\n⏭️ Existing sheets: ${setup.sheetsSkipped.join(', ')}`;
                    }
                    if (setup.errors.length > 0) {
                        setupDetails += `\n\n❌ Errors: ${setup.errors.map(e => `${e.sheet}: ${e.error}`).join(', ')}`;
                    }
                }

                // Show write test results
                let testDetails = '';
                if (response.sheetInfo.testResult) {
                    const result = response.sheetInfo.testResult;
                    if (result.success) {
                        testDetails += `\n\n✅ ${result.message}`;
                    } else {
                        testDetails += `\n\n❌ ${result.message}`;
                    }
                }

                this.showMessage(successMsg + setupDetails + testDetails, 'success');

                // If this was a setup operation, reset button to normal state
                if (isSetupOperation) {
                    // Reset button to normal state
                    if (testConnectionBtn) {
                        testConnectionBtn.textContent = 'Test Connection';
                        testConnectionBtn.classList.add('test-btn');
                        testConnectionBtn.classList.remove('setup-btn');
                    }
                }
            } else {
                const errorMsg = 'Connection failed: ' + (response?.error || 'Unknown error');
                console.error('❌', errorMsg);
                this.showMessage(errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error testing Google Sheets connection:', error);
            this.showMessage('Error testing connection: ' + error.message, 'error');
        }
    }

    handleSheetUrlChangeImmediate() {
        try {
            const sheetUrlInput = document.getElementById('sheet-url');
            const testConnectionBtn = document.getElementById('test-connection-btn');

            if (!sheetUrlInput || !testConnectionBtn) {
                return;
            }

            const currentUrl = sheetUrlInput.value.trim();
            console.log('⚡ Immediate check - Current URL:', currentUrl);

            // For immediate response, if URL is not empty, show setup mode
            if (currentUrl) {
                console.log('⚡ Immediate change to setup mode');
                testConnectionBtn.textContent = 'Save and Complete Setup';
                testConnectionBtn.classList.add('setup-btn');
                testConnectionBtn.classList.remove('test-btn');
            } else {
                console.log('⚡ Immediate change to test mode');
                testConnectionBtn.textContent = 'Test Connection';
                testConnectionBtn.classList.add('test-btn');
                testConnectionBtn.classList.remove('setup-btn');
            }
        } catch (error) {
            console.error('Error in immediate sheet URL change:', error);
        }
    }

    async handleSheetUrlChange() {
        try {
            const sheetUrlInput = document.getElementById('sheet-url');
            const testConnectionBtn = document.getElementById('test-connection-btn');

            if (!sheetUrlInput || !testConnectionBtn) {
                console.log('❌ Missing elements:', { sheetUrlInput: !!sheetUrlInput, testConnectionBtn: !!testConnectionBtn });
                return;
            }

            const currentUrl = sheetUrlInput.value.trim();
            console.log('🔍 Current URL:', currentUrl);

            // For immediate response, check if URL is not empty
            if (currentUrl) {
                console.log('🔄 URL not empty, checking against saved config...');

                // Check if URL has changed from saved config
                const currentConfig = await this.storage.get('google_sheets');
                const savedUrl = currentConfig?.sheetUrl || '';
                console.log('💾 Saved URL:', savedUrl);

                // If URL is different from saved URL, show setup mode
                if (currentUrl !== savedUrl) {
                    console.log('🔄 Changing to setup mode (URL different from saved)');
                    testConnectionBtn.textContent = 'Save and Complete Setup';
                    testConnectionBtn.classList.add('setup-btn');
                    testConnectionBtn.classList.remove('test-btn');
                } else {
                    console.log('🔄 Changing to test mode (URL same as saved)');
                    testConnectionBtn.textContent = 'Test Connection';
                    testConnectionBtn.classList.add('test-btn');
                    testConnectionBtn.classList.remove('setup-btn');
                }
            } else {
                console.log('🔄 Changing to test mode (URL empty)');
                // URL is empty - show normal test mode
                testConnectionBtn.textContent = 'Test Connection';
                testConnectionBtn.classList.add('test-btn');
                testConnectionBtn.classList.remove('setup-btn');
            }
        } catch (error) {
            console.error('Error handling sheet URL change:', error);
        }
    }

    async setupGoogleSheets() {
        try {
            console.log('🔧 Setting up Google Sheets structure...');

            const oauthClientId = document.getElementById('oauth-client-id').value.trim();
            const oauthClientSecret = document.getElementById('oauth-client-secret').value.trim();
            const sheetUrl = document.getElementById('sheet-url').value.trim();

            if (!oauthClientId || !oauthClientSecret || !sheetUrl) {
                this.showMessage('Please enter OAuth Client ID, Client Secret, and Sheet URL first', 'error');
                return;
            }

            // Validate URL format
            try {
                configManager.extractSheetId(sheetUrl);
                console.log('📝 Setting up sheets with ID:', configManager.extractSheetId(sheetUrl));
            } catch (error) {
                this.showMessage(error.message, 'error');
                return;
            }

            // Send setup request to background script
            console.log('📤 Sending setup sheets request...');
            const response = await chrome.runtime.sendMessage({
                type: 'GOOGLE_SHEETS_SETUP',
                config: { oauthClientId, oauthClientSecret, sheetUrl }
            });

            console.log('📥 Setup sheets response:', response);

            if (response && response.success) {
                const successMsg = 'Google Sheets setup completed successfully!';
                console.log('✅', successMsg);

                let setupDetails = '';
                if (response.setupResult) {
                    const result = response.setupResult;
                    if (result.sheetsCreated && result.sheetsCreated.length > 0) {
                        setupDetails += `\n\n📝 Created sheets: ${result.sheetsCreated.join(', ')}`;
                    }
                    if (result.sheetsSkipped && result.sheetsSkipped.length > 0) {
                        setupDetails += `\n\n⏭️ Skipped existing sheets: ${result.sheetsSkipped.join(', ')}`;
                    }
                    if (result.errors && result.errors.length > 0) {
                        setupDetails += `\n\n❌ Errors: ${result.errors.map(e => e.sheet + ': ' + e.error).join(', ')}`;
                    }
                }

                this.showMessage(successMsg + setupDetails, 'success');
            } else {
                const errorMsg = 'Setup failed: ' + (response?.error || 'Unknown error');
                console.error('❌', errorMsg);
                this.showMessage(errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error setting up Google Sheets:', error);
            this.showMessage('Error setting up sheets: ' + error.message, 'error');
        }
    }

    showConnectionStatus(message, type) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `connection-status ${type}`;
            statusElement.classList.remove('hidden');
        }
    }

    clearConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.classList.add('hidden');
        }
    }

    setupAutoSave() {
        // Debounce timer for auto-save
        this.autoSaveTimer = null;
        this.lastSavedConfig = null; // Track last saved config to prevent duplicate saves

        // Configuration fields to watch
        const configFields = ['username', 'oauth-client-id', 'oauth-client-secret', 'sheet-url'];

        configFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Listen for input, paste, and change events
                field.addEventListener('input', () => this.scheduleAutoSave());
                field.addEventListener('paste', () => this.scheduleAutoSave());
                field.addEventListener('change', () => this.scheduleAutoSave());
            }
        });
    }

    scheduleAutoSave() {
        // Clear existing timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        // Set new timer for 700ms
        this.autoSaveTimer = setTimeout(() => {
            this.autoSaveConfig();
        }, 700);
    }

    async autoSaveConfig() {
        console.log('🔄 autoSaveConfig called');
        try {
            // Get current configuration values
            const username = document.getElementById('username').value.trim();
            const oauthClientId = document.getElementById('oauth-client-id').value.trim();
            const oauthClientSecret = document.getElementById('oauth-client-secret').value.trim();
            const sheetUrl = document.getElementById('sheet-url').value.trim();

            // Create current config object
            const currentConfig = {
                username,
                google_sheets: { oauthClientId, oauthClientSecret, sheetUrl }
            };

            // Check if configuration has actually changed
            if (this.lastSavedConfig && JSON.stringify(currentConfig) === JSON.stringify(this.lastSavedConfig)) {
                console.log('⏭️ Configuration unchanged, skipping save');
                return;
            }

            console.log('✅ Configuration changed, proceeding with save');

            // Handle username auto-save (silent, no toast)
            if (username) {
                console.log('💾 Saving username:', username);
                await configManager.setLenient('username', username);
                console.log('💾 Username auto-saved');
            }

            // Handle Google Sheets configuration auto-save
            console.log('📝 Google Sheets fields:', {
                oauthClientId: oauthClientId ? '***' : 'empty',
                oauthClientSecret: oauthClientSecret ? '***' : 'empty',
                sheetUrl: sheetUrl ? '***' : 'empty'
            });

            // Auto-save Google Sheets if we have at least one field filled
            if (oauthClientId || oauthClientSecret || sheetUrl) {
                console.log('✅ At least one Google Sheets field present, proceeding with save');

                const config = { oauthClientId, oauthClientSecret, sheetUrl };
                console.log('📤 About to call configManager.setLenient with config:', { ...config, oauthClientId: '***', oauthClientSecret: '***' });

                try {
                    await configManager.setLenient('google_sheets', config);
                    console.log('💾 Google Sheets configuration auto-saved');
                    // Toast will be shown via the config callback
                } catch (error) {
                    console.warn('⚠️ Error during auto-save:', error.message);
                    // Don't show error toast for auto-save failures
                }
            } else {
                console.log('⏭️ Skipping Google Sheets save - no fields filled');
            }

            // Update last saved config
            this.lastSavedConfig = currentConfig;
            console.log('💾 Last saved config updated');

        } catch (error) {
            console.error('❌ Error auto-saving configuration:', error);
        }
    }

    // Debug method - call this manually in console to test
    testDebug() {
        console.log('🧪 Debug test method called!');
        console.log('Current view:', this.currentView);
        console.log('Storage instance:', this.storage);
        console.log('Test button exists:', !!document.getElementById('test-connection-btn'));
        console.log('Username field exists:', !!document.getElementById('username'));
        console.log('Google Sheets fields exist:', {
            sheetUrl: !!document.getElementById('sheet-url')
        });

        // Test the toast system directly
        console.log('🧪 Testing toast system directly...');
        this.showMessage('Test toast - this should appear!', 'success');

        // Test the Google Sheets callback directly
        console.log('🧪 Testing Google Sheets callback directly...');
        const testConfig = {
            sheetUrl: 'https://docs.google.com/spreadsheets/d/1ABC123/edit'
        };

        // Trigger the callback manually
        if (configManager.autoSaveCallbacks && configManager.autoSaveCallbacks.has('google_sheets')) {
            const callback = configManager.autoSaveCallbacks.get('google_sheets');
            callback(testConfig);
            console.log('✅ Google Sheets callback triggered manually');
        } else {
            console.log('❌ Google Sheets callback not found');
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing PopupManager...');
    window.popupManager = new PopupManager();
    console.log('✅ PopupManager initialized:', window.popupManager);
});

// Add CSS animation for message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

