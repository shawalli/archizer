// Storage Management Utilities
// Local storage for user preferences and caching

import { specializedLogger as log } from './logger.js';

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

    async get(key) {
        const fullKey = this._makeKey(key);
        const result = await chrome.storage.local.get(fullKey);
        return result[fullKey] || null;
    }

    async set(key, value) {
        const fullKey = this._makeKey(key);
        await chrome.storage.local.set({ [fullKey]: value });
    }

    async remove(key) {
        const fullKey = this._makeKey(key);
        await chrome.storage.local.remove(fullKey);
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

            const key = this._makeHiddenOrderKey(orderId, type);
            await this.set(key, {
                orderId,
                type,
                orderData,
                username,
                timestamp: new Date().toISOString()
            });
            log.info(`Stored hidden order ${orderId} (${type}):`, orderData);
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
            const key = this._makeHiddenOrderKey(orderId, type);
            await this.remove(key);
            log.info(`Removed hidden order ${orderId} (${type})`);
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
}


