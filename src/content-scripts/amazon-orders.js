// Amazon Orders Content Script
// Handles order detection, parsing, and button injection on Amazon order history page

import { globalExtensionLoader } from '../utils/extension-loader.js';
import { globalErrorHandler } from '../utils/error-handler.js';
import { StorageManager } from '../utils/storage.js';
import { OrderParser } from '../utils/order-parser.js';
import { DOMManipulator } from '../utils/dom-manipulator.js';

console.log('🔧 Amazon Order Archiver content script loaded');

// Initialize the extension when the content script loads
(async () => {
    try {
        console.log('🔧 Starting content script initialization...');
        console.log('🔧 Current URL:', window.location.href);
        console.log('🔧 Page title:', document.title);

        // Wait for the extension loader to initialize
        await globalExtensionLoader.initialize();

        if (globalExtensionLoader.isInitialized) {
            console.log('✅ Content script initialized successfully');

            // Initialize content script functionality directly
            await initializeContentScript();
        } else {
            console.log('⚠️ Content script initialization skipped - page not supported');
        }

    } catch (error) {
        globalErrorHandler.handleError(error, 'content-script', 'error');
        console.error('❌ Content script initialization failed:', error);
    }
})();

// Initialize content script specific functionality
async function initializeContentScript() {
    try {
        console.log('🔧 Initializing content script functionality...');

        // Initialize dependencies directly since we imported them
        const storage = new StorageManager();
        const orderParser = new OrderParser();
        const domManipulator = new DOMManipulator();

        // Set up integration between DOM manipulator and OrderParser
        domManipulator.setOrderParser(orderParser);

        // Set up callbacks for order state changes
        domManipulator.setCallbacks(
            (orderId, type, orderData) => {
                console.log(`Order ${orderId} ${type} hidden:`, orderData);
                // TODO: Store hidden order data in storage
                storage.storeHiddenOrder(orderId, type, orderData);
            },
            (orderId, type, orderData) => {
                console.log(`Order ${orderId} ${type} shown:`, orderData);
                // TODO: Remove hidden order data from storage
                storage.removeHiddenOrder(orderId, type);
            }
        );

        console.log('✅ Dependencies initialized:', { storage, orderParser, domManipulator });

        // Start the order detection and button injection system
        await startOrderArchivingSystem(orderParser, domManipulator, storage);

        console.log('✅ Content script functionality initialized');

    } catch (error) {
        globalErrorHandler.handleError(error, 'content-script-init', 'error');
        throw error;
    }
}

/**
 * Start the order archiving system
 * @param {OrderParser} orderParser - The order parser instance
 * @param {DOMManipulator} domManipulator - The DOM manipulator instance
 * @param {StorageManager} storage - The storage manager instance
 */
async function startOrderArchivingSystem(orderParser, domManipulator, storage) {
    try {
        console.log('🚀 Starting order archiving system...');

        // Debug: Check what selectors we're looking for
        console.log('🔍 Looking for order cards with selector:', orderParser.getSelectors().orderCards);

        // Debug: Check if we can find any order cards
        const existingOrderCards = orderParser.findOrderCards();
        console.log('🔍 Found existing order cards:', existingOrderCards.length);

        if (existingOrderCards.length === 0) {
            console.log('⚠️ No order cards found with current selector');
            console.log('🔍 Let\'s try to find alternative order elements...');

            // Try alternative selectors
            const alternativeSelectors = [
                '[data-order-id]',
                '.order',
                '.order-item',
                '.a-box-group',
                '.a-section'
            ];

            alternativeSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                console.log(`🔍 Selector "${selector}": found ${elements.length} elements`);
                if (elements.length > 0) {
                    console.log('🔍 First element:', elements[0]);
                }
            });
        }

        // Start observing for dynamic content changes
        orderParser.startObserving(
            // onOrderDetected callback
            (orderCard) => {
                console.log('🆕 New order detected:', orderCard);
                processOrderCard(orderCard, orderParser, domManipulator);
            },
            // onOrderRemoved callback
            (orderCard) => {
                console.log('🗑️ Order removed:', orderCard);
                // Clean up any injected buttons for this order
                const orderId = domManipulator.getOrderIdFromElement(orderCard);
                if (orderId) {
                    domManipulator.removeButtons(orderId);
                }
            }
        );

        // Start DOM observation for dynamic content
        domManipulator.startObserving(
            // onOrderDetected callback
            (orderCard) => {
                console.log('🆕 DOM: New order detected:', orderCard);
                processOrderCard(orderCard, orderParser, domManipulator);
            },
            // onOrderRemoved callback
            (orderId, orderCard) => {
                console.log('🗑️ DOM: Order removed:', orderId);
                domManipulator.removeButtons(orderId);
            }
        );

        // Process existing orders on the page
        await processExistingOrders(orderParser, domManipulator);

        console.log('✅ Order archiving system started successfully');

    } catch (error) {
        console.error('❌ Error starting order archiving system:', error);
        throw error;
    }
}

/**
 * Process an individual order card
 * @param {Element} orderCard - The order card element
 * @param {OrderParser} orderParser - The order parser instance
 * @param {DOMManipulator} domManipulator - The DOM manipulator instance
 */
function processOrderCard(orderCard, orderParser, domManipulator) {
    try {
        console.log('🔧 Processing order card:', orderCard);

        // Extract order ID from the card
        const orderId = domManipulator.getOrderIdFromElement(orderCard);

        if (!orderId) {
            console.warn('Could not extract order ID from order card');
            return;
        }

        console.log(`Processing order card for order ${orderId}`);

        // Check if buttons are already injected
        if (domManipulator.injectedButtons.has(orderId)) {
            console.log(`Buttons already exist for order ${orderId}`);
            return;
        }

        // Inject buttons into the order card
        const success = domManipulator.injectButtons(orderCard, orderId);

        if (success) {
            console.log(`✅ Successfully injected buttons for order ${orderId}`);
        } else {
            console.error(`❌ Failed to inject buttons for order ${orderId}`);
        }

    } catch (error) {
        console.error('Error processing order card:', error);
    }
}

/**
 * Process all existing orders on the page
 * @param {OrderParser} orderParser - The order parser instance
 * @param {DOMManipulator} domManipulator - The DOM manipulator instance
 */
async function processExistingOrders(orderParser, domManipulator) {
    try {
        console.log('🔍 Processing existing orders on the page...');

        // Find all existing order cards
        const orderCards = orderParser.findOrderCards();
        console.log(`Found ${orderCards.length} existing order cards`);

        // Process each order card
        orderCards.forEach((orderCard, index) => {
            console.log(`Processing existing order ${index + 1}/${orderCards.length}`);
            processOrderCard(orderCard, orderParser, domManipulator);
        });

        console.log(`✅ Processed ${orderCards.length} existing orders`);

    } catch (error) {
        console.error('❌ Error processing existing orders:', error);
        throw error;
    }
}

// Cleanup function for when the content script is unloaded
window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up content script...');
    // Cleanup will be handled by the extension loader
});
