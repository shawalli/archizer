// Storage Management Utilities
// Local storage for user preferences and caching

import { specializedLogger as log } from '../../utils/logger.js';

log.info('Storage utilities loaded');

export class StorageManager {
    constructor() {
        this.prefix = 'amazon_archiver_';
    }

    /**
     * Generate a storage key with the standard prefix
     * @param {string} key - The key suffix
     * @returns {string} The full storage key
     */
    _makeKey(key) {
        return this.prefix + key;
    }

    /**
     * Generate a hidden order key suffix
     * @param {string} orderId - Order ID
     * @param {string} type - Type of hiding
     * @returns {string} The key suffix
     */
    _makeHiddenOrderKey(orderId, type) {
        return `hidden_order_${orderId}_${type}`;
    }

    /**
     * Generate an order tags key suffix
     * @param {string} orderId - Order ID
     * @returns {string} The key suffix
     */
    _makeOrderTagsKey(orderId) {
        return `order_tags_${orderId}`;
    }

    /**
     * Check if the extension context is still valid
     * @returns {boolean} True if context is valid
     */
    _isContextValid() {
        try {
            // Try to access chrome.runtime to check if context is valid
            return chrome.runtime && chrome.runtime.id;
        } catch (error) {
            log.warn('⚠️ Extension context invalidated:', error.message);
            return false;
        }
    }

    /**
     * Get a value from storage with context validation
     * @param {string} key - Storage key
     * @returns {*} Stored value or null
     */
    async get(key) {
        if (!this._isContextValid()) {
            log.warn('⚠️ Extension context invalidated, cannot access storage');
            return null;
        }

        try {
            const fullKey = this._makeKey(key);
            const result = await chrome.storage.local.get(fullKey);
            return result[fullKey] || null;
        } catch (error) {
            log.error('❌ Error getting from storage:', error);
            return null;
        }
    }

    /**
     * Set a value in storage with context validation
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    async set(key, value) {
        if (!this._isContextValid()) {
            log.warn('⚠️ Extension context invalidated, cannot access storage');
            return;
        }

        try {
            const fullKey = this._makeKey(key);
            await chrome.storage.local.set({ [fullKey]: value });
        } catch (error) {
            console.error('❌ Error setting storage:', error);
        }
    }

    /**
     * Remove a value from storage with context validation
     * @param {string} key - Storage key
     */
    async remove(key) {
        if (!this._isContextValid()) {
            log.warn('⚠️ Extension context invalidated, cannot access storage');
            return;
        }

        try {
            const fullKey = this._makeKey(key);
            await chrome.storage.local.remove(fullKey);
        } catch (error) {
            console.error('❌ Error removing from storage:', error);
        }
    }

    async clear() {
        if (!this._isContextValid()) {
            log.warn('⚠️ Extension context invalidated, cannot access storage');
            return;
        }

        try {
            await chrome.storage.local.clear();
        } catch (error) {
            console.error('❌ Error clearing storage:', error);
        }
    }

    /**
     * Store hidden order data
     * @param {string} orderId - Order ID
     * @param {string} type - Type of hiding (e.g., 'details', 'order')
     * @param {Object} orderData - Order data to store
     */
    async storeHiddenOrder(orderId, type, orderData) {
        try {
            // Get username from storage
            const username = await this.get('username') || 'Unknown User';

            const key = this._makeHiddenOrderKey(orderId, type);
            const hiddenOrderData = {
                orderId,
                type,
                orderData,
                username,
                timestamp: new Date().toISOString()
            };

            await this.set(key, hiddenOrderData);
            log.info(`Stored hidden order ${orderId} (${type}):`, orderData);

            // Sync to Google Sheets
            await this.syncHiddenOrderToGoogleSheets(hiddenOrderData);

            // Add audit log entry for hide action
            await this.addAuditLogEntry('hide', orderId, type, username, orderData);
        } catch (error) {
            log.error(`Error storing hidden order ${orderId}:`, error);
        }
    }

    /**
     * Remove hidden order data
     * @param {string} orderId - Order ID
     * @param {string} type - Type of hiding (e.g., 'details', 'order')
     */
    async removeHiddenOrder(orderId, type) {
        try {
            console.log(`🔧 removeHiddenOrder called for order ${orderId} (${type})`);
            const key = this._makeHiddenOrderKey(orderId, type);

            // Get the hidden order data before removing it (for audit logging)
            const hiddenOrderData = await this.get(key);
            console.log(`🔧 Retrieved hidden order data:`, hiddenOrderData);

            await this.remove(key);
            log.info(`Removed hidden order ${orderId} (${type})`);

            // Sync unhide operation to Google Sheets and add audit log
            if (hiddenOrderData) {
                console.log(`🔧 Syncing unhide operation to Google Sheets...`);
                await this.syncUnhideOrderToGoogleSheets(hiddenOrderData);
                await this.addAuditLogEntry('unhide', orderId, type, hiddenOrderData.username, hiddenOrderData.orderData);
            } else {
                console.warn(`⚠️ No hidden order data found for order ${orderId}`);
            }
        } catch (error) {
            log.error(`Error removing hidden order ${orderId}:`, error);
        }
    }

    /**
     * Store order tags data
     * @param {string} orderId - Order ID
     * @param {Object} tagData - Tag data to store
     */
    async storeOrderTags(orderId, tagData) {
        try {
            const key = this._makeOrderTagsKey(orderId);
            await this.set(key, {
                orderId,
                tagData,
                timestamp: new Date().toISOString()
            });
            log.info(`Stored tags for order ${orderId}:`, tagData);
        } catch (error) {
            log.error(`Error storing tags for order ${orderId}:`, error);
        }
    }

    /**
     * Get order tags data
     * @param {string} orderId - Order ID
     * @returns {Object|null} Tag data or null if not found
     */
    async getOrderTags(orderId) {
        try {
            const key = this._makeOrderTagsKey(orderId);
            const data = await this.get(key);
            return data ? data.tagData : null;
        } catch (error) {
            log.error(`Error getting tags for order ${orderId}:`, error);
            return null;
        }
    }

    /**
     * Remove order tags data
     * @param {string} orderId - Order ID
     */
    async removeOrderTags(orderId) {
        try {
            const key = this._makeOrderTagsKey(orderId);
            await this.remove(key);
            log.info(`Removed tags for order ${orderId}`);
        } catch (error) {
            log.error(`Error removing tags for order ${orderId}:`, error);
        }
    }

    /**
     * Get all order tags from storage
     * @returns {Array} Array of all order tag data
     */
    async getAllOrderTags() {
        try {
            const allData = await chrome.storage.local.get(null);
            const orderTags = [];

            for (const [key, value] of Object.entries(allData)) {
                if (key.startsWith(this._makeKey('order_tags_')) && value) {
                    orderTags.push(value);
                }
            }

            return orderTags;
        } catch (error) {
            log.error('Error getting all order tags:', error);
            return [];
        }
    }

    /**
     * Clear all storage data for a specific order
     * This is more thorough than removeHiddenOrder and clears any related data
     * @param {string} orderId - Order ID to clear all data for
     */
    async clearAllOrderData(orderId) {
        try {
            log.info(`Clearing all storage data for order ${orderId}...`);

            // Get all storage data
            const allData = await chrome.storage.local.get(null);
            const keysToRemove = [];

            // Find all keys that contain this order ID
            for (const key of Object.keys(allData)) {
                if (key.includes(orderId) && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                    log.debug(`Found Chrome storage key to remove: ${key}`);
                }
            }

            // Remove all found Chrome storage keys
            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                log.success(`Cleared ${keysToRemove.length} Chrome storage keys for order ${orderId}`);
            } else {
                log.info(`No Chrome storage keys found for order ${orderId}`);
            }

            return keysToRemove.length;
        } catch (error) {
            log.error(`Error clearing order data for ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Get hidden order data
     * @param {string} orderId - Order ID
     * @param {string} type - Type of hiding (e.g., 'details', 'order')
     * @returns {Object|null} Hidden order data or null if not found
     */
    async getHiddenOrder(orderId, type) {
        try {
            const key = this._makeHiddenOrderKey(orderId, type);
            const data = await this.get(key);
            return data;
        } catch (error) {
            log.error(`Error getting hidden order ${orderId}:`, error);
            return null;
        }
    }

    /**
     * Get all hidden orders from storage
     * @returns {Array} Array of all hidden order data
     */
    async getAllHiddenOrders() {
        try {
            const allData = await chrome.storage.local.get(null);
            const hiddenOrders = [];

            for (const [key, value] of Object.entries(allData)) {
                if (key.startsWith(this._makeKey('hidden_order_')) && value) {
                    hiddenOrders.push(value);
                }
            }

            return hiddenOrders;
        } catch (error) {
            log.error('Error getting all hidden orders:', error);
            return [];
        }
    }

    /**
     * Store action log entry
     * @param {Object} actionData - Action log data to store
     */
    async storeActionLog(actionData) {
        try {
            const key = this._makeKey(`action_log_${actionData.orderId}_${Date.now()}`);
            await this.set(key, {
                ...actionData,
                timestamp: new Date().toISOString()
            });
            log.info(`Stored action log entry for order ${actionData.orderId}`);
        } catch (error) {
            log.error(`Error storing action log for order ${actionData.orderId}:`, error);
        }
    }

    /**
     * Get all action log entries from storage
     * @returns {Array} Array of all action log entries
     */
    async getAllActionLog() {
        try {
            const allData = await chrome.storage.local.get(null);
            const actionLog = [];

            for (const [key, value] of Object.entries(allData)) {
                if (key.startsWith(this._makeKey('action_log_')) && value) {
                    actionLog.push(value);
                }
            }

            return actionLog;
        } catch (error) {
            log.error('Error getting all action log entries:', error);
            return [];
        }
    }

    /**
     * Store user settings
     * @param {Object} userData - User settings data to store
     */
    async storeUserSettings(userData) {
        try {
            const key = this._makeKey(`user_settings_${userData.username}`);
            await this.set(key, {
                ...userData,
                timestamp: new Date().toISOString()
            });
            log.info(`Stored user settings for ${userData.username}`);
        } catch (error) {
            log.error(`Error storing user settings for ${userData.username}:`, error);
        }
    }

    /**
     * Get all user settings from storage
     * @returns {Array} Array of all user settings
     */
    async getAllUserSettings() {
        try {
            const allData = await chrome.storage.local.get(null);
            const userSettings = [];

            for (const [key, value] of Object.entries(allData)) {
                if (key.startsWith(this._makeKey('user_settings_')) && value) {
                    userSettings.push(value);
                }
            }

            return userSettings;
        } catch (error) {
            log.error('Error getting all user settings:', error);
            return [];
        }
    }

    /**
     * Sync hidden order to Google Sheets
     * @param {Object} hiddenOrderData - Hidden order data to sync
     */
    async syncHiddenOrderToGoogleSheets(hiddenOrderData) {
        try {
            if (!this._isContextValid()) {
                console.warn('⚠️ Extension context invalidated, cannot sync to Google Sheets');
                return;
            }

            log.info(`📤 Syncing hidden order ${hiddenOrderData.orderId} to Google Sheets...`);

            // Send message to background script to sync to Google Sheets
            const response = await chrome.runtime.sendMessage({
                type: 'SYNC_HIDDEN_ORDER_TO_SHEETS',
                hiddenOrderData: hiddenOrderData
            });

            if (response && response.success) {
                log.info(`✅ Successfully synced hidden order ${hiddenOrderData.orderId} to Google Sheets`);
            } else {
                log.warning(`⚠️ Failed to sync hidden order ${hiddenOrderData.orderId} to Google Sheets:`, response?.error);
            }
        } catch (error) {
            log.error(`❌ Error syncing hidden order ${hiddenOrderData.orderId} to Google Sheets:`, error);
            // Don't throw error - sync failure shouldn't break the hide operation
        }
    }

    /**
     * Sync unhide order to Google Sheets
     * @param {Object} hiddenOrderData - Hidden order data to remove from sheets
     */
    async syncUnhideOrderToGoogleSheets(hiddenOrderData) {
        try {
            if (!this._isContextValid()) {
                console.warn('⚠️ Extension context invalidated, cannot sync unhide to Google Sheets');
                return;
            }

            log.info(`📤 Syncing unhide operation for order ${hiddenOrderData.orderId} to Google Sheets...`);

            // Send message to background script to remove from Google Sheets
            const response = await chrome.runtime.sendMessage({
                type: 'REMOVE_HIDDEN_ORDER_FROM_SHEETS',
                hiddenOrderData: hiddenOrderData
            });

            if (response && response.success) {
                log.info(`✅ Successfully removed hidden order ${hiddenOrderData.orderId} from Google Sheets`);
            } else {
                log.warning(`⚠️ Failed to remove hidden order ${hiddenOrderData.orderId} from Google Sheets:`, response?.error);
            }
        } catch (error) {
            log.error(`❌ Error syncing unhide operation for order ${hiddenOrderData.orderId} to Google Sheets:`, error);
            // Don't throw error - sync failure shouldn't break the unhide operation
        }
    }

    /**
     * Add audit log entry to Google Sheets
     * @param {string} action - Action performed ('hide' or 'unhide')
     * @param {string} orderId - Order ID
     * @param {string} actionType - Type of action ('details')
     * @param {string} performedBy - Username who performed the action
     * @param {Object} orderData - Order data containing tags and notes (optional)
     */
    async addAuditLogEntry(action, orderId, actionType, performedBy, orderData = null) {
        try {
            if (!this._isContextValid()) {
                console.warn('⚠️ Extension context invalidated, cannot add audit log');
                return;
            }

            log.info(`📝 Adding audit log entry: ${action} for order ${orderId} by ${performedBy}`);

            // Get browser info
            const browserInfo = this._getBrowserInfo();

            // Extract tags and notes from orderData
            const tags = orderData && orderData.tags ? orderData.tags.join(', ') : '';
            const notes = orderData && orderData.notes ? orderData.notes : '';

            const auditLogData = {
                timestamp: new Date().toISOString(),
                orderId: orderId,
                action: action,
                actionType: actionType,
                performedBy: performedBy,
                tags: tags,
                notes: notes,
                browserInfo: browserInfo
            };

            // Send message to background script to add audit log entry
            const response = await chrome.runtime.sendMessage({
                type: 'ADD_AUDIT_LOG_ENTRY',
                auditLogData: auditLogData
            });

            if (response && response.success) {
                log.info(`✅ Successfully added audit log entry for ${action} operation on order ${orderId}`);
            } else {
                log.warning(`⚠️ Failed to add audit log entry for ${action} operation on order ${orderId}:`, response?.error);
            }
        } catch (error) {
            log.error(`❌ Error adding audit log entry for ${action} operation on order ${orderId}:`, error);
            // Don't throw error - audit logging failure shouldn't break the operation
        }
    }

    /**
     * Get browser information for audit logging
     * @returns {string} Browser info string
     */
    _getBrowserInfo() {
        try {
            const userAgent = navigator.userAgent;
            // Extract browser name and version from user agent
            if (userAgent.includes('Chrome/')) {
                const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
                return match ? `Chrome ${match[1]}` : 'Chrome';
            } else if (userAgent.includes('Firefox/')) {
                const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
                return match ? `Firefox ${match[1]}` : 'Firefox';
            } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
                const match = userAgent.match(/Version\/(\d+\.\d+)/);
                return match ? `Safari ${match[1]}` : 'Safari';
            } else if (userAgent.includes('Edge/')) {
                const match = userAgent.match(/Edge\/(\d+\.\d+\.\d+)/);
                return match ? `Edge ${match[1]}` : 'Edge';
            } else {
                return 'Unknown Browser';
            }
        } catch (error) {
            return 'Unknown Browser';
        }
    }
}


