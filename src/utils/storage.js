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
