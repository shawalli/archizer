// Storage Migration Utility
// Handles migration from localStorage to Chrome storage for existing users

console.log('Storage migration utility loaded');

export class StorageMigrationManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.migrationPrefix = 'archivaz_order_tags_';
    }

    /**
     * Check if there's any localStorage data that needs migration
     * @returns {boolean} True if migration is needed
     */
    async needsMigration() {
        try {
            // Check if localStorage has any of our old keys
            const hasOldData = Object.keys(localStorage).some(key => 
                key.startsWith(this.migrationPrefix)
            );
            
            if (!hasOldData) {
                return false;
            }

            // Check if we've already migrated this data
            const migrationFlag = await this.storageManager.get('migration_completed');
            return !migrationFlag;
        } catch (error) {
            console.warn('Error checking migration status:', error);
            return false;
        }
    }

    /**
     * Migrate localStorage data to Chrome storage
     * @returns {Object} Migration results
     */
    async migrateData() {
        try {
            console.log('🔄 Starting storage migration...');
            
            const migrationResults = {
                totalItems: 0,
                migratedItems: 0,
                errors: [],
                migratedData: []
            };

            // Get all localStorage keys that match our pattern
            const localStorageKeys = Object.keys(localStorage).filter(key => 
                key.startsWith(this.migrationPrefix)
            );

            migrationResults.totalItems = localStorageKeys.length;

            if (localStorageKeys.length === 0) {
                console.log('ℹ️ No data to migrate');
                return migrationResults;
            }

            // Migrate each item
            for (const key of localStorageKeys) {
                try {
                    const orderId = key.replace(this.migrationPrefix, '');
                    const rawData = localStorage.getItem(key);
                    
                    if (rawData) {
                        const tagData = JSON.parse(rawData);
                        
                        // Store in Chrome storage using the new format
                        await this.storageManager.storeOrderTags(orderId, tagData);
                        
                        // Remove from localStorage
                        localStorage.removeItem(key);
                        
                        migrationResults.migratedItems++;
                        migrationResults.migratedData.push({
                            orderId,
                            originalKey: key,
                            data: tagData
                        });
                        
                        console.log(`✅ Migrated order tags for ${orderId}`);
                    }
                } catch (error) {
                    console.error(`❌ Error migrating key ${key}:`, error);
                    migrationResults.errors.push({
                        key,
                        error: error.message
                    });
                }
            }

            // Mark migration as completed
            await this.storageManager.set('migration_completed', {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                itemsMigrated: migrationResults.migratedItems
            });

            console.log(`✅ Migration completed: ${migrationResults.migratedItems}/${migrationResults.totalItems} items migrated`);
            
            return migrationResults;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    /**
     * Clean up any remaining localStorage data after migration
     * @returns {number} Number of items cleaned up
     */
    cleanupLocalStorage() {
        try {
            let cleanedCount = 0;
            
            // Remove any remaining migration-related keys
            const keysToRemove = Object.keys(localStorage).filter(key => 
                key.startsWith(this.migrationPrefix)
            );
            
            for (const key of keysToRemove) {
                localStorage.removeItem(key);
                cleanedCount++;
            }
            
            if (cleanedCount > 0) {
                console.log(`🧹 Cleaned up ${cleanedCount} remaining localStorage keys`);
            }
            
            return cleanedCount;
        } catch (error) {
            console.warn('⚠️ Error during localStorage cleanup:', error);
            return 0;
        }
    }

    /**
     * Get migration status and statistics
     * @returns {Object} Migration status information
     */
    async getMigrationStatus() {
        try {
            const migrationFlag = await this.storageManager.get('migration_completed');
            
            return {
                isCompleted: !!migrationFlag,
                completedAt: migrationFlag?.timestamp || null,
                version: migrationFlag?.version || null,
                itemsMigrated: migrationFlag?.itemsMigrated || 0
            };
        } catch (error) {
            console.warn('Error getting migration status:', error);
            return {
                isCompleted: false,
                completedAt: null,
                version: null,
                itemsMigrated: 0
            };
        }
    }
}
