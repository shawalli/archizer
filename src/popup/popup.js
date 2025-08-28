// Popup JavaScript for Amazon Order Archiver
// Handles popup interface logic, navigation, and settings management

console.log('Amazon Order Archiver popup script loaded');

// Simple storage manager for popup
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
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserSettings();
        await this.loadHiddenOrders();
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

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
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

