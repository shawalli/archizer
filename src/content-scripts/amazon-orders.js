// Amazon Orders Content Script
// Handles order detection, parsing, and button injection on Amazon order history page

import { globalExtensionLoader } from '../utils/extension-loader.js';
import { globalErrorHandler } from '../utils/error-handler.js';
import { StorageManager } from '../backends/local-storage/storage.js';
import { OrderParser } from '../utils/order-parser.js';
import { DOMManipulator } from '../utils/dom-manipulator.js';
import { TaggingDialog } from '../components/tagging-dialog.js';
import { specializedLogger as log } from '../utils/logger.js';

log.info('🔧 Amazon Order Archiver content script loaded');

// Initialize the extension when the content script loads
(async () => {
    try {
        log.info('🔧 Starting content script initialization...');
        log.info('🔧 Current URL:', window.location.href);
        log.info('🔧 Page title:', document.title);

        // Wait for the extension loader to initialize
        await globalExtensionLoader.initialize();

        if (globalExtensionLoader.isInitialized) {
            log.success('✅ Content script initialized successfully');

            // Initialize content script functionality directly
            await initializeContentScript();
        } else {
            log.warn('⚠️ Content script initialization skipped - page not supported');
        }

    } catch (error) {
        globalErrorHandler.handleError(error, 'content-script', 'error');
        log.error('❌ Content script initialization failed:', error);
    }
})();

// Initialize content script specific functionality
async function initializeContentScript() {
    try {
        log.info('🔧 Initializing content script functionality...');

        // Initialize dependencies directly since we imported them
        const storage = new StorageManager();
        const orderParser = new OrderParser();
        const domManipulator = new DOMManipulator();

        // Set up integration between DOM manipulator and OrderParser
        domManipulator.setOrderParser(orderParser);

        // Set up storage instance for DOM manipulator
        domManipulator.setStorage(storage);

        // Set up callbacks for order state changes
        domManipulator.setCallbacks(
            async (orderId, type, orderData) => {
                console.log(`🔧 CALLBACK: Order ${orderId} ${type} hidden:`, orderData);

                // Store hidden order data in storage
                console.log(`🔧 CALLBACK: About to store hidden order data for order ${orderId}`);
                await storage.storeHiddenOrder(orderId, type, orderData);
                console.log(`🔧 CALLBACK: Hidden order data stored for order ${orderId}`);
            },
            (orderId, type, orderData) => {
                console.log(`Order ${orderId} ${type} shown:`, orderData);
                // Remove hidden order data from storage
                storage.removeHiddenOrder(orderId, type);
            }
        );

        // Initialize tagging dialog manager and wait for it to be fully ready
        await initializeTaggingDialog();

        // Debug: Check if TaggingDialogManager is now available
        console.log('🔍 After initialization - TaggingDialogManager imported:', typeof TaggingDialogManager !== 'undefined');

        console.log('✅ Dependencies initialized:', { storage, orderParser, domManipulator });

        // Start the order detection and button injection system
        await startOrderArchivingSystem(orderParser, domManipulator, storage);

        console.log('✅ Content script functionality initialized');

        // Set up message listener for popup communication
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'resync-orders') {
                console.log('🔄 Received resync request from popup');
                try {
                    const restoredCount = domManipulator.restoreAllHiddenOrders();
                    sendResponse({ success: true, restoredCount });
                    console.log(`✅ Resync completed, restored ${restoredCount} orders`);
                } catch (error) {
                    console.error('❌ Error during resync:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true; // Keep message channel open for async response
            } else if (message.action === 'apply-hidden-orders') {
                console.log('🔄 Received apply hidden orders request from popup');
                try {
                    const hiddenCount = domManipulator.applyHiddenOrdersFromData(message.hiddenOrders);
                    sendResponse({ success: true, hiddenCount });
                    console.log(`✅ Applied hiding to ${hiddenCount} orders`);
                } catch (error) {
                    console.error('❌ Error applying hidden orders:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true; // Keep message channel open for async response
            }
        });

    } catch (error) {
        globalErrorHandler.handleError(error, 'content-script-init', 'error');
        throw error;
    }
}

/**
 * Initialize the tagging dialog component
 */
async function initializeTaggingDialog() {
    try {
        console.log('🔧 Initializing tagging dialog...');

        // Check if tagging interface HTML is already in the DOM
        let taggingInterfaceElement = document.getElementById('tagging-interface');

        if (!taggingInterfaceElement) {
            // Load tagging interface HTML
            console.log('🔍 Tagging interface not found, attempting to load HTML...');
            const htmlUrl = chrome.runtime.getURL('components/tagging-dialog.html');
            console.log('🔍 HTML URL:', htmlUrl);

            try {
                const response = await fetch(htmlUrl);
                console.log('🔍 Fetch response status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                console.log('🔍 HTML content length:', html.length);
                console.log('🔍 HTML preview:', html.substring(0, 200) + '...');

                // Create a temporary container to parse the HTML
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = html;

                // Extract the tagging interface element
                taggingInterfaceElement = tempContainer.querySelector('#tagging-interface');
                console.log('🔍 Found tagging interface element:', taggingInterfaceElement);

                if (taggingInterfaceElement) {
                    // Append to the document body
                    document.body.appendChild(taggingInterfaceElement);
                    console.log('✅ Tagging interface HTML loaded and appended to DOM');
                } else {
                    console.warn('⚠️ Could not find tagging interface element in HTML');
                    console.warn('⚠️ Available elements in temp container:', tempContainer.children);

                    // FALLBACK: Create a basic tagging interface if HTML loading fails
                    console.log('🔧 Creating fallback tagging interface...');
                    const fallbackInterface = document.createElement('div');
                    fallbackInterface.id = 'tagging-interface';
                    fallbackInterface.style.display = 'none';
                    fallbackInterface.innerHTML = `
                        <div class="a-box-inner">
                            <div class="a-fixed-right-grid a-spacing-small">
                                <div class="a-fixed-right-grid-inner" style="padding-right: 220px;">
                                    <div class="a-fixed-right-grid-col a-col-left" style="padding-right: 3.2%; float: left;">
                                        <div class="a-row a-spacing-top-base">
                                            <div id="existing-tags" class="a-spacing-top-micro">
                                                <span style="color: #6c757d; font-style: italic; font-size: 13px;">No tags yet</span>
                                            </div>
                                        </div>
                                        <div class="a-row a-spacing-top-small">
                                            <div class="a-spacing-top-micro">
                                                <div class="yohtmlc-item-level-connections">
                                                    <div class="a-input-text-wrapper" style="display: inline-block; margin-right: 10px;">
                                                        <input type="text" id="new-tag-input" class="a-input-text a-width-full" placeholder="Enter a new tag" maxlength="50" />
                                                    </div>
                                                    <button type="button" class="a-button a-button-primary a-button-small" id="add-tag-btn">Add Tag</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="a-fixed-right-grid-col a-col-right" style="width: 220px; margin-right: -220px; float: left;">
                                        <ul class="a-unordered-list a-nostyle a-vertical">
                                            <div class="a-button-stack a-spacing-mini">
                                                <li class="a-list-item" style="margin-bottom: 4px;">
                                                    <button type="button" class="a-button a-button-normal a-spacing-mini a-button-base" id="tagging-cancel-btn" style="width: 100%; background-color: #6c757d; border-color: #6c757d; color: white;">Cancel</button>
                                                </li>
                                                <li class="a-list-item" style="margin-bottom: 4px;">
                                                    <button type="button" class="a-button a-button-normal a-spacing-mini a-button-primary" id="tagging-save-btn" style="width: 100%;">Save & Hide</button>
                                                </li>
                                            </div>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    document.body.appendChild(fallbackInterface);
                    taggingInterfaceElement = fallbackInterface;
                    console.log('✅ Fallback tagging interface created and appended to DOM');
                }
            } catch (fetchError) {
                console.error('❌ Error fetching tagging interface HTML:', fetchError);
                return;
            }
        }

        // Load tagging interface CSS
        if (!document.querySelector('link[href*="tagging-dialog.css"]')) {
            try {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = chrome.runtime.getURL('components/tagging-dialog.css');
                document.head.appendChild(link);
                console.log('✅ Tagging interface CSS loaded');
            } catch (cssError) {
                console.warn('⚠️ Could not load external CSS, using inline styles');
                // CSS loading failed, but we can continue with inline styles
            }
        }

        // Create TaggingDialogManager instance using imported class
        console.log('🔧 Creating TaggingDialogManager instance...');
        const taggingDialogManager = new TaggingDialogManager();
        window.taggingDialogManager = taggingDialogManager;
        console.log('✅ TaggingDialogManager instance created and available globally');

        console.log('✅ Tagging dialog manager initialization completed');

    } catch (error) {
        console.error('❌ Error initializing tagging dialog:', error);
        // Don't throw error - tagging dialog is optional
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
                console.log('🆕 New order detected:', orderParser);

                // Check if this order card has already been processed
                if (orderCard.hasAttribute('data-archivaz-processed')) {
                    console.log('⚠️ New order already processed, skipping');
                    return;
                }

                // Check if this order card already has buttons
                if (orderCard.querySelector('.archivaz-button-container')) {
                    console.log('⚠️ New order already has buttons, skipping');
                    return;
                }

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

                // Check if this order card has already been processed
                if (orderCard.hasAttribute('data-archivaz-processed')) {
                    console.log('⚠️ DOM: New order already processed, skipping');
                    return;
                }

                // Check if this order card already has buttons
                if (orderCard.querySelector('.archivaz-button-container')) {
                    console.log('⚠️ DOM: New order already has buttons, skipping');
                    return;
                }

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

        // Restore hidden orders from storage
        await domManipulator.restoreHiddenOrdersFromStorage(storage);

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

        // Check if this order card has already been processed
        if (orderCard.hasAttribute('data-archivaz-processed')) {
            console.log(`⚠️ Order card already processed, skipping`);
            return;
        }

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

        // Mark this order card as processed BEFORE injecting buttons
        orderCard.setAttribute('data-archivaz-processed', 'true');
        console.log(`✅ Marked order card as processed for order ${orderId}`);

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

        // Track processed order IDs to avoid duplicates
        const processedOrderIds = new Set();
        const processedOrderCards = new Set();

        // Process each order card
        orderCards.forEach((orderCard, index) => {
            console.log(`Processing existing order ${index + 1}/${orderCards.length}`);

            // Check if this order card has already been processed
            if (processedOrderCards.has(orderCard)) {
                console.log(`⚠️ Order card already processed, skipping`);
                return;
            }

            // Extract order ID first to check for duplicates
            const orderId = domManipulator.getOrderIdFromElement(orderCard);

            if (orderId && processedOrderIds.has(orderId)) {
                console.log(`⚠️ Skipping duplicate order ${orderId} (already processed)`);
                return;
            }

            if (orderId) {
                processedOrderIds.add(orderId);
            }

            processedOrderCards.add(orderCard);
            processOrderCard(orderCard, orderParser, domManipulator);
        });

        console.log(`✅ Processed ${orderCards.length} existing orders (${processedOrderIds.size} unique order IDs, ${processedOrderCards.size} unique order cards)`);

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
