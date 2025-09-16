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

        const setupSheetsBtn = document.getElementById('setup-sheets-btn');
        if (setupSheetsBtn) {
            console.log('✅ Setup sheets button found');
            setupSheetsBtn.addEventListener('click', () => this.setupGoogleSheets());
        } else {
            console.error('❌ Setup sheets button not found');
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
        const sheetNameInput = document.getElementById('sheet-name');

        if (oauthClientIdInput && config.oauthClientId) {
            oauthClientIdInput.value = config.oauthClientId;
        }
        if (oauthClientSecretInput && config.oauthClientSecret) {
            oauthClientSecretInput.value = config.oauthClientSecret;
        }
        if (sheetUrlInput && config.sheetUrl) {
            sheetUrlInput.value = config.sheetUrl;
        }
        if (sheetNameInput && config.sheetName) {
            sheetNameInput.value = config.sheetName;
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

            // Test connection (without saving)
            console.log('📤 Sending test connection request...');
            const response = await chrome.runtime.sendMessage({
                type: 'GOOGLE_SHEETS_TEST_CONNECTION',
                testConfig: { oauthClientId, oauthClientSecret, sheetUrl }
            });

            console.log('📥 Test connection response:', response);

            if (response && response.success) {
                const successMsg = 'Connection successful! Connected to: ' + response.sheetInfo.title;
                console.log('✅', successMsg);

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

                this.showMessage(successMsg + testDetails, 'success');
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
        const configFields = ['username', 'oauth-client-id', 'oauth-client-secret', 'sheet-url', 'sheet-name'];

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
            const sheetName = document.getElementById('sheet-name').value.trim() || 'Orders';

            // Create current config object
            const currentConfig = {
                username,
                google_sheets: { oauthClientId, oauthClientSecret, sheetUrl, sheetName }
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
                sheetUrl: sheetUrl ? '***' : 'empty',
                sheetName
            });

            // Auto-save Google Sheets if we have at least one field filled
            if (oauthClientId || oauthClientSecret || sheetUrl) {
                console.log('✅ At least one Google Sheets field present, proceeding with save');

                const config = { oauthClientId, oauthClientSecret, sheetUrl, sheetName };
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
            sheetUrl: !!document.getElementById('sheet-url'),
            sheetName: !!document.getElementById('sheet-name')
        });

        // Test the toast system directly
        console.log('🧪 Testing toast system directly...');
        this.showMessage('Test toast - this should appear!', 'success');

        // Test the Google Sheets callback directly
        console.log('🧪 Testing Google Sheets callback directly...');
        const testConfig = {
            sheetUrl: 'https://docs.google.com/spreadsheets/d/1ABC123/edit',
            apiKey: 'test-key',
            sheetName: 'TestOrders'
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

