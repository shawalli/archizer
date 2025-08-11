// Extension Loader Utility
// Manages extension initialization, lifecycle, and state management

import { globalErrorHandler } from './error-handler.js';

export class ExtensionLoader {
    constructor() {
        this.isLoaded = false;
        this.isInitialized = false;
        this.loadingPromise = null;
        this.dependencies = new Map();
        this.initializationHooks = [];
    }

    // Initialize the extension
    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        try {
            console.log('🚀 Initializing Amazon Order Archiver extension...');

            // Check if we're on a supported page
            if (!this.isSupportedPage()) {
                console.log('⚠️ Current page is not supported by the extension');
                return false;
            }

            // Load dependencies
            await this.loadDependencies();

            // Run initialization hooks
            await this.runInitializationHooks();

            // Mark as initialized
            this.isInitialized = true;

            console.log('✅ Extension initialized successfully');
            return true;

        } catch (error) {
            globalErrorHandler.handleError(error, 'extension-loader', 'error');
            console.error('❌ Failed to initialize extension:', error);
            return false;
        }
    }

    // Check if current page is supported
    isSupportedPage() {
        const currentUrl = window.location.href;
        const supportedPatterns = [
            /amazon\.com\/gp\/your-account\/order-history/,
            /amazon\.com\/gp\/css\/order-history/,
            /amazon\.com\/gp\/legacy\/order-history/,

        ];

        return supportedPatterns.some(pattern => pattern.test(currentUrl));
    }

    // Load required dependencies
    async loadDependencies() {
        // Dependencies are now imported directly in the content script
        // This method is kept for future extensibility but doesn't need to load anything
        console.log('📦 Dependencies loaded via static imports');
        return true;
    }

    // Add initialization hook
    addInitializationHook(hook) {
        if (typeof hook === 'function') {
            this.initializationHooks.push(hook);
        }
    }

    // Run all initialization hooks
    async runInitializationHooks() {
        for (const hook of this.initializationHooks) {
            try {
                await hook(this.dependencies);
            } catch (error) {
                globalErrorHandler.handleError(error, 'initialization-hook', 'error');
                console.warn('⚠️ Initialization hook failed:', error);
            }
        }
    }

    // Get loaded dependency
    getDependency(name) {
        return this.dependencies.get(name);
    }

    // Check if dependency is loaded
    hasDependency(name) {
        return this.dependencies.has(name);
    }

    // Reload the extension
    async reload() {
        console.log('🔄 Reloading extension...');

        this.isInitialized = false;
        this.dependencies.clear();

        // Clear any existing state
        await this.cleanup();

        // Re-initialize
        return await this.initialize();
    }

    // Cleanup extension resources
    async cleanup() {
        try {
            // Remove event listeners
            this.removeEventListeners();

            // Clear timers
            this.clearTimers();

            // Reset state
            this.isLoaded = false;

            console.log('🧹 Extension cleanup completed');
        } catch (error) {
            globalErrorHandler.handleError(error, 'extension-loader-cleanup', 'error');
        }
    }

    // Remove event listeners
    removeEventListeners() {
        // This will be implemented when we add specific event listeners
        console.log('🗑️ Event listeners removed');
    }

    // Clear timers
    clearTimers() {
        // This will be implemented when we add specific timers
        console.log('⏰ Timers cleared');
    }

    // Get extension status
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            isInitialized: this.isInitialized,
            supportedPage: this.isSupportedPage(),
            dependencies: Array.from(this.dependencies.keys()),
            url: window.location.href
        };
    }

    // Handle page navigation
    handleNavigation() {
        if (this.isSupportedPage()) {
            if (!this.isInitialized) {
                this.initialize();
            }
        } else {
            if (this.isInitialized) {
                this.cleanup();
            }
        }
    }
}

// Global extension loader instance
export const globalExtensionLoader = new ExtensionLoader();

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        globalExtensionLoader.initialize();
    });
} else {
    globalExtensionLoader.initialize();
}

// Handle page navigation
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        globalExtensionLoader.handleNavigation();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Export for use in other modules
export default globalExtensionLoader;
