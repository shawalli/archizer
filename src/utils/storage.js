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
}

// TODO: Implement user preferences storage
// TODO: Implement caching system
