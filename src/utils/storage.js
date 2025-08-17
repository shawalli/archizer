// Storage Management Utilities
// Local storage for user preferences and caching

console.log('Storage utilities loaded');

export class StorageManager {
    constructor() {
        this.prefix = 'amazon_archiver_';
    }

    async get(key) {
        const result = await chrome.storage.local.get(this.prefix + key);
        return result[this.prefix + key] || null;
    }

    async set(key, value) {
        await chrome.storage.local.set({ [this.prefix + key]: value });
    }

    async remove(key) {
        await chrome.storage.local.remove(this.prefix + key);
    }

    async clear() {
        await chrome.storage.local.clear();
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

            const key = `hidden_order_${orderId}_${type}`;
            await this.set(key, {
                orderId,
                type,
                orderData,
                username,
                timestamp: new Date().toISOString()
            });
            console.log(`Stored hidden order ${orderId} (${type}):`, orderData);
        } catch (error) {
            console.error(`Error storing hidden order ${orderId}:`, error);
        }
    }

    /**
     * Remove hidden order data
     * @param {string} orderId - Order ID
     * @param {string} type - Type of hiding (e.g., 'details', 'order')
     */
    async removeHiddenOrder(orderId, type) {
        try {
            const key = `hidden_order_${orderId}_${type}`;
            await this.remove(key);
            console.log(`Removed hidden order ${orderId} (${type})`);
        } catch (error) {
            console.error(`Error removing hidden order ${orderId}:`, error);
        }
    }

    /**
     * Clear all storage data for a specific order
     * This is more thorough than removeHiddenOrder and clears any related data
     * @param {string} orderId - Order ID to clear all data for
     */
    async clearAllOrderData(orderId) {
        try {
            console.log(`🗑️ Clearing all storage data for order ${orderId}...`);

            // Get all storage data
            const allData = await chrome.storage.local.get(null);
            const keysToRemove = [];

            // Find all keys that contain this order ID
            for (const key of Object.keys(allData)) {
                if (key.includes(orderId) && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                    console.log(`🔍 Found Chrome storage key to remove: ${key}`);
                }
            }

            // Remove all found Chrome storage keys
            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                console.log(`✅ Cleared ${keysToRemove.length} Chrome storage keys for order ${orderId}`);
            } else {
                console.log(`ℹ️ No Chrome storage keys found for order ${orderId}`);
            }

            // Also clear localStorage tags for this order
            try {
                const localStorageKey = `archivaz_order_tags_${orderId}`;
                if (localStorage.getItem(localStorageKey)) {
                    localStorage.removeItem(localStorageKey);
                    console.log(`🗑️ Cleared localStorage key: ${localStorageKey}`);
                } else {
                    console.log(`ℹ️ No localStorage key found: ${localStorageKey}`);
                }
            } catch (error) {
                console.warn(`⚠️ Could not clear localStorage for order ${orderId}:`, error);
            }

            return keysToRemove.length;
        } catch (error) {
            console.error(`❌ Error clearing order data for ${orderId}:`, error);
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
            const key = `hidden_order_${orderId}_${type}`;
            const data = await this.get(key);
            return data;
        } catch (error) {
            console.error(`Error getting hidden order ${orderId}:`, error);
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
                if (key.startsWith(this.prefix + 'hidden_order_') && value) {
                    hiddenOrders.push(value);
                }
            }

            return hiddenOrders;
        } catch (error) {
            console.error('Error getting all hidden orders:', error);
            return [];
        }
    }
}

// TODO: Implement user preferences storage
// TODO: Implement caching system
