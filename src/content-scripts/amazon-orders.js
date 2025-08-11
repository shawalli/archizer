// Amazon Orders Content Script
// Handles order detection, parsing, and button injection on Amazon order history page

import { globalExtensionLoader } from '../utils/extension-loader.js';
import { globalErrorHandler } from '../utils/error-handler.js';
import { StorageManager } from '../utils/storage.js';
import { OrderParser } from '../utils/order-parser.js';
import { DOMManipulator } from '../utils/dom-manipulator.js';

console.log('Amazon Order Archiver content script loaded');

// Initialize the extension when the content script loads
(async () => {
    try {
        await globalExtensionLoader.initialize();

        if (globalExtensionLoader.isInitialized) {
            console.log('✅ Content script initialized successfully');

            // Add initialization hook for content script specific functionality
            globalExtensionLoader.addInitializationHook(async (dependencies) => {
                await initializeContentScript(dependencies);
            });

        } else {
            console.log('⚠️ Content script initialization skipped - page not supported');
        }

    } catch (error) {
        globalErrorHandler.handleError(error, 'content-script', 'error');
        console.error('❌ Content script initialization failed:', error);
    }
})();

// Initialize content script specific functionality
async function initializeContentScript(dependencies) {
    try {
        console.log('🔧 Initializing content script functionality...');

        // Initialize dependencies directly since we imported them
        const storage = new StorageManager();
        const orderParser = new OrderParser();
        const domManipulator = new DOMManipulator();

        console.log('✅ Dependencies initialized:', { storage, orderParser, domManipulator });

        // TODO: Implement order detection and parsing
        // TODO: Implement button injection system
        // TODO: Implement order hiding functionality

        console.log('✅ Content script functionality initialized');

    } catch (error) {
        globalErrorHandler.handleError(error, 'content-script-init', 'error');
        throw error;
    }
}
