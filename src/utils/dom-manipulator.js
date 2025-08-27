/**
 * DOM Manipulation Utilities
 * Handles button injection, order hiding/showing, and dynamic content management
 */

import { createElement, createButton, createContainer, safeAddEventListener, safeSetStyles, hideElementsBySelectors, containsEssentialInfo, isElementWithinContainer, safeModifyClasses, safeSetMultipleStyles } from './dom-utils.js';


export class DOMManipulator {
    constructor() {
        this.injectedButtons = new Map(); // Track injected buttons by order ID
        this.hiddenOrders = new Set(); // Track hidden order IDs
        this.orderUsernames = new Map(); // Track usernames for hidden orders
        this.observer = null;
        this.isObserving = false;
        this.orderParser = null; // Reference to OrderParser for data extraction
        this.onOrderHidden = null; // Callback when orders are hidden
        this.onOrderShown = null; // Callback when orders are shown
        this.storage = null; // Storage manager instance
    }

    /**
     * Set the OrderParser instance for data extraction
     * @param {OrderParser} orderParser - The OrderParser instance
     */
    setOrderParser(orderParser) {
        this.orderParser = orderParser;
    }

    /**
     * Set callbacks for order state changes
     * @param {Function} onOrderHidden - Callback when orders are hidden
     * @param {Function} onOrderShown - Callback when orders are shown
     */
    setCallbacks(onOrderHidden = null, onOrderShown = null) {
        this.onOrderHidden = onOrderHidden;
        this.onOrderShown = onOrderShown;
    }

    /**
     * Button placement strategy for different order formats
     * All formats use the same structure: .order-card.js-order-card
     */
    getButtonPlacementStrategy() {
        return {
            // Common selectors for all formats
            orderCard: '.order-card.js-order-card',
            orderHeader: '.order-card__header, .a-box-group',
            orderActions: '.order-actions, .a-box-group',
            // Target the right-hand action button column specifically within the delivery-box
            actionButtonsColumn: '.delivery-box .a-fixed-right-grid-col.a-col-right',
            // Fallback selectors if the specific column isn't found
            fallbackSelectors: [
                '.delivery-box .a-fixed-right-grid-col.a-col-right',
                '.delivery-box .a-text-right.a-fixed-right-grid-col.a-col-right',
                '.delivery-box .a-fixed-right-grid .a-col-right',
                '.delivery-box .a-unordered-list.a-vertical',
                '.order-actions'
            ]
        };
    }

    /**
     * Detect the page format to determine the best button placement strategy
     * @param {Element} orderCard - The order card element
     * @returns {string} The detected page format ('your-orders', 'css', 'your-account', or 'unknown')
     */
    detectPageFormat(orderCard) {
        try {
            // Check for your-orders format (newest format)
            if (orderCard.querySelector('.yohtmlc-shipment-level-connections')) {
                return 'your-orders';
            }

            // Check for css format (legacy format)
            if (orderCard.querySelector('.order-actions, .a-box-group')) {
                return 'css';
            }

            // Check for your-account format (oldest format)
            if (orderCard.querySelector('.delivery-box')) {
                return 'your-account';
            }

            // Check for alternative selectors
            if (orderCard.querySelector('[data-testid*="order"]')) {
                return 'your-orders'; // Likely newer format
            }

            return 'unknown';
        } catch (error) {
            console.error('Error detecting page format:', error);
            return 'unknown';
        }
    }

    /**
     * Get the optimal button placement strategy for a specific page format
     * @param {string} pageFormat - The detected page format
     * @returns {Object} Button placement strategy object
     */
    getFormatSpecificStrategy(pageFormat) {
        const strategies = {
            'your-orders': {
                container: '.yohtmlc-shipment-level-connections',
                fallback: '.order-actions, .a-box-group'
            },
            'css': {
                container: '.order-actions, .a-box-group',
                fallback: '.a-box-group'
            },
            'your-account': {
                container: '.delivery-box',
                fallback: '.a-unordered-list, .a-vertical'
            },
            'unknown': {
                container: '.order-actions, .a-box-group, .a-box-group',
                fallback: null
            }
        };

        return strategies[pageFormat] || strategies.unknown;
    }

    /**
     * Create buttons for order actions (hide details, hide order)
     * @param {string} orderId - Order ID to create buttons for
     * @returns {Object} Object containing the created button elements
     */
    createButtons(orderId) {
        try {
            console.log(`🔧 Creating buttons for order ${orderId}`);

            // Check if buttons already exist for this order
            if (this.injectedButtons.has(orderId)) {
                console.warn(`⚠️ Buttons already exist for order ${orderId}, skipping creation`);
                return null;
            }

            // Create container for the buttons using utility function
            const buttonContainer = createContainer('archivaz-button-container', {
                attributes: {
                    'data-archivaz-order-id': orderId
                }
            });

            // Create unordered list for button layout
            const buttonList = createElement('ul', {
                className: 'a-unordered-list a-vertical a-spacing-mini',
                styles: {
                    margin: '0',
                    padding: '0',
                    listStyle: 'none'
                }
            });

            // Create "Hide details" button using utility function
            const hideDetailsLi = createElement('li', {
                className: 'a-list-item',
                styles: {
                    marginBottom: '4px'
                }
            });

            const hideDetailsBtn = createButton('Hide details', {
                attributes: {
                    'data-archivaz-type': 'hide-details',
                    'data-archivaz-order-id': orderId,
                    'aria-label': `Hide details for order ${orderId}`
                }
            });

            // Add hover effects for hide details button
            safeAddEventListener(hideDetailsBtn, 'mouseenter', () => {
                safeSetStyles(hideDetailsBtn, {
                    backgroundColor: '#8a6bb9',
                    borderColor: '#7759b9'
                });
            });

            safeAddEventListener(hideDetailsBtn, 'mouseleave', () => {
                safeSetStyles(hideDetailsBtn, {
                    backgroundColor: '#7759b9',
                    borderColor: '#888c8c'
                });
            });

            hideDetailsLi.appendChild(hideDetailsBtn);

            // Add all buttons to the list
            buttonList.appendChild(hideDetailsLi);

            // Add the list to the container
            buttonContainer.appendChild(buttonList);

            // Add click event listeners
            safeAddEventListener(hideDetailsBtn, 'click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                // CRITICAL: Ensure this button click only affects the specific order
                const clickedOrderId = hideDetailsBtn.getAttribute('data-archivaz-order-id');
                if (clickedOrderId !== orderId) {
                    console.error(`❌ Button click order ID mismatch: expected ${orderId}, got ${clickedOrderId}`);
                    return;
                }

                // CRITICAL: Verify the button is in the correct order card
                const orderCard = hideDetailsBtn.closest('.order-card');
                if (!orderCard) {
                    console.error(`❌ Button not found within an order card`);
                    return;
                }

                const orderCardOrderId = orderCard.querySelector('.yohtmlc-order-id span.a-color-secondary[dir="ltr"]')?.textContent;
                if (orderCardOrderId !== orderId) {
                    console.error(`❌ Order card order ID mismatch: expected ${orderId}, got ${orderCardOrderId}`);
                    return;
                }

                // Add debugging to track button clicks
                console.log(`🔍 Button clicked:`, {
                    button: hideDetailsBtn,
                    orderId: orderId,
                    buttonType: hideDetailsBtn.getAttribute('data-archivaz-type'),
                    buttonClasses: hideDetailsBtn.className,
                    buttonText: hideDetailsBtn.textContent,
                    buttonParent: hideDetailsBtn.parentElement,
                    orderCard: orderCard,
                    orderCardOrderId: orderCardOrderId
                });

                const buttonType = hideDetailsBtn.getAttribute('data-archivaz-type');
                this.handleButtonClick(buttonType, orderId, hideDetailsBtn);
            });

            console.log(`✅ Buttons created successfully for order ${orderId}`);

            return {
                buttonContainer,
                hideDetailsLi,
                hideDetailsBtn,
            };
        } catch (error) {
            console.error(`Error creating buttons for order ${orderId}:`, error);
            return null;
        }
    }

    /**
     * Set storage manager instance
     * @param {StorageManager} storage - Storage manager instance
     */
    setStorage(storage) {
        this.storage = storage;
        console.log('🔧 Storage manager set for DOM manipulator');
    }

    /**
     * Handle button click events for different button types
     * @param {string} buttonType - Type of button clicked
     * @param {string} orderId - Order ID associated with the button
     * @param {Element} button - The button element that was clicked
     */
    async handleButtonClick(buttonType, orderId, button) {
        try {
            console.log(`Button clicked: ${buttonType} for order ${orderId}`);

            switch (buttonType) {
                case 'hide-details':
                    if (this.storage) {
                        await this.hideOrderDetails(orderId, button, this.storage);
                    } else {
                        console.error('No storage manager available');
                    }
                    break;
                case 'show-details':
                    this.showOrderDetails(orderId, button);
                    break;
                default:
                    console.warn(`Unknown button type: ${buttonType}`);
            }
        } catch (error) {
            console.error(`Error handling button click for ${buttonType} on order ${orderId}:`, error);
        }
    }

    /**
     * Show tagging dialog for hiding operations
     * @param {string} orderId - Order ID to hide
     * @param {Element} button - The button that was clicked
     * @param {StorageManager} storage - Storage manager instance
     */
    async showTaggingDialogForHide(orderId, button, storage) {
        try {
            console.log(`🔍 showTaggingDialogForHide called for order ${orderId}`);
            console.log(`🔍 Current time: ${new Date().toISOString()}`);
            console.log(`🔍 Button clicked:`, button);
            console.log(`🔍 Button text: "${button.textContent}"`);
            console.log(`🔍 Button classes: "${button.className}"`);

            // Get order data from the OrderParser
            const orderData = this.getOrderData(orderId);
            if (!orderData) {
                console.warn(`No order data found for order ${orderId}`);
                return;
            }

            // Get the global tagging dialog manager instance
            const taggingDialogManager = window.taggingDialogManager;
            if (!taggingDialogManager) {
                console.warn('TaggingDialogManager instance not available - popup cannot be shown');
                return;
            }

            // Get stored tags if available
            let storedTags = null;
            if (this.storage) {
                storedTags = await this.getOrderTags(orderId, this.storage);
            }

            // Prepare order data for the dialog
            const dialogData = {
                orderNumber: orderId,
                orderDate: orderData.orderDate || 'Unknown',
                tags: storedTags ? storedTags.tags || [] : (orderData.tags || []),
                notes: storedTags ? storedTags.notes || '' : (orderData.notes || '')
            };

            // Find the order card that contains this button
            const orderCard = button.closest('.order-card, .js-order-card, [data-order-id]');
            if (!orderCard) {
                console.warn('Could not find order card for button');
                return;
            }

            // Open the tagging dialog using the manager
            const dialogOpened = taggingDialogManager.openDialog(dialogData, orderCard);
            if (!dialogOpened) {
                console.warn(`Failed to open tagging dialog for order ${orderId}`);
                return;
            }

            console.log(`🔍 Tagging dialog opened for order ${orderId}`);
            console.log(`🔍 Dialog data:`, dialogData);

            // Create a unique event listener for this order
            const handleTagsSaved = async (event) => {
                console.log(`🔍 EVENT RECEIVED: ${event.type} for order ${orderId}`);
                console.log(`🔍 Event detail:`, event.detail);
                console.log(`🔍 Event target:`, event.target);
                console.log(`🔍 Event currentTarget:`, event.currentTarget);

                const tagData = event.detail;
                console.log(`🔍 Tags saved event received for order ${orderId}:`, tagData);

                // CRITICAL: Verify this event is for the correct order
                if (tagData.orderNumber !== orderId) {
                    console.warn(`⚠️ Tags saved event for wrong order: expected ${orderId}, got ${tagData.orderNumber}`);
                    return;
                }

                console.log(`✅ Tags saved for order ${orderId}:`, tagData);

                // Store the tag data
                if (this.storage) {
                    await this.storeOrderTags(orderId, tagData, this.storage);
                } else {
                    console.warn('No storage manager available for storing order tags');
                }

                // Get username from storage and pass it to performHideOperation
                try {
                    const username = await storage.get('username') || 'Unknown User';
                    console.log(`🔧 Retrieved username from storage: "${username}" for order ${orderId}`);

                    // Now perform the hide operation with the username
                    await this.performHideOperation(orderId, tagData, username);
                } catch (error) {
                    console.error(`Error getting username for order ${orderId}:`, error);
                    // Fallback to hiding without username
                    await this.performHideOperation(orderId, tagData, 'Unknown User');
                }

                // Remove the event listener
                this.removeExistingTagsSavedListener(orderId);
            };

            // Store the event listener reference for this order
            this.tagsSavedListeners = this.tagsSavedListeners || new Map();
            this.tagsSavedListeners.set(orderId, handleTagsSaved);

            // Add the event listener for the order-specific event
            const eventName = `tagsSaved-${orderId}`;
            document.addEventListener(eventName, handleTagsSaved);
            console.log(`✅ Added ${eventName} event listener for order ${orderId}`);

            // DEBUG: Log all current event listeners
            console.log(`🔍 Current tagsSavedListeners map:`, Array.from(this.tagsSavedListeners.keys()));
            console.log(`🔍 Total event listeners registered: ${this.tagsSavedListeners.size}`);
            console.log(`🔍 Event listener function:`, handleTagsSaved.toString().substring(0, 100) + '...');

        } catch (error) {
            console.error(`Error showing tagging dialog for order ${orderId}:`, error);
            // Don't fallback to hiding - just log the error
        }
    }

    /**
     * Remove existing tagsSaved event listener for a specific order
     * @param {string} orderId - Order ID to remove listener for
     */
    removeExistingTagsSavedListener(orderId) {
        if (this.tagsSavedListeners && this.tagsSavedListeners.has(orderId)) {
            const existingListener = this.tagsSavedListeners.get(orderId);
            const eventName = `tagsSaved-${orderId}`;
            document.removeEventListener(eventName, existingListener);
            this.tagsSavedListeners.delete(orderId);
            console.log(`🗑️ Removed existing ${eventName} event listener for order ${orderId}`);
            console.log(`🔍 Remaining event listeners:`, Array.from(this.tagsSavedListeners.keys()));
        } else {
            console.log(`🔍 No existing event listener found for order ${orderId}`);
        }
    }

    /**
     * Perform the actual hide operation after tagging
     * @param {string} orderId - Order ID to hide
     * @param {Object} tagData - Optional tag data if order was tagged before hiding
     * @param {string} username - Username for the order (optional, will use stored if not provided)
     */
    async performHideOperation(orderId, tagData = null, username = null) {
        try {
            console.log(`🔍 performHideOperation called with:`, { orderId, tagData, username });

            // IMPORTANT: This function should ONLY be called when the user explicitly clicks "Save & Hide"
            // in the tagging dialog, NOT automatically when the dialog opens

            // DEBUG: Check if this order is already hidden
            if (this.hiddenOrders.has(`${orderId}-details`)) {
                console.warn(`⚠️ Order ${orderId} is already hidden - this indicates incorrect flow!`);
                console.warn(`⚠️ Current hidden orders:`, Array.from(this.hiddenOrders));
                return;
            }

            // Get the button from the injected buttons map
            const buttonInfo = this.injectedButtons.get(orderId);
            if (!buttonInfo || !buttonInfo.hideDetailsBtn) {
                console.warn(`No button info found for order ${orderId}`);
                return;
            }

            // Set username if provided, otherwise use stored username
            if (username) {
                console.log(`🔧 Setting provided username: "${username}" for order ${orderId}`);
                this.setUsernameForOrder(orderId, username);
            } else {
                console.log(`🔧 No username provided, using stored username for order ${orderId}`);
                const storedUsername = this.getUsernameForOrder(orderId);
                console.log(`🔧 Stored username for order ${orderId}: "${storedUsername}"`);
            }

            // If no tag data provided, try to retrieve stored tags
            if (!tagData) {
                console.log('🔍 No tagData provided, retrieving from storage...');
                if (this.storage) {
                    tagData = await this.getOrderTags(orderId, this.storage);
                }
                console.log('🔍 Retrieved tagData from storage:', tagData);
            }

            // Verify username is set before proceeding
            const finalUsername = this.getUsernameForOrder(orderId);
            console.log(`🔧 Final username verification for order ${orderId}: "${finalUsername}"`);

            console.log('🔍 Calling performHideOrderDetails with:', { orderId, button: buttonInfo.hideDetailsBtn, tagData, username: finalUsername });
            this.performHideOrderDetails(orderId, buttonInfo.hideDetailsBtn, tagData);
        } catch (error) {
            console.error(`Error performing hide operation for order ${orderId}:`, error);
        }
    }

    /**
     * Get order data from the OrderParser
     * @param {string} orderId - Order ID to get data for
     * @returns {Object|null} Order data or null if not found
     */
    getOrderData(orderId) {
        try {
            console.log(`🔍 Getting order data for order ID: ${orderId}`);

            if (!this.orderParser) {
                console.warn('OrderParser not available');
                return null;
            }

            // Find the order card for this order ID
            const orderCards = this.orderParser.findOrderCards();
            console.log(`🔍 Found ${orderCards.length} order cards`);

            // First, try to find the order card that actually contains this order ID
            // This is more reliable than parsing all cards
            let targetOrderCard = null;

            for (const orderCard of orderCards) {
                // Check if this order card actually contains the target order ID
                const cardText = orderCard.textContent;
                if (cardText.includes(orderId)) {
                    targetOrderCard = orderCard;
                    console.log(`✅ Found order card containing order ID ${orderId}`);
                    break;
                }
            }

            if (!targetOrderCard) {
                console.warn(`⚠️ Could not find order card containing order ID ${orderId}`);
                // Fall back to the old method
                for (const orderCard of orderCards) {
                    console.log(`🔍 Processing order card:`, orderCard);
                    const extractedData = this.orderParser.parseOrderCard(orderCard);
                    console.log(`🔍 Extracted data:`, extractedData);

                    if (extractedData && extractedData.orderNumber === orderId) {
                        console.log(`✅ Found matching order data for ${orderId}`);
                        return extractedData;
                    }
                }
            } else {
                // Parse only the target order card
                console.log(`🔍 Parsing target order card for order ID ${orderId}:`, targetOrderCard);
                const extractedData = this.orderParser.parseOrderCard(targetOrderCard);
                console.log(`🔍 Extracted data from target card:`, extractedData);

                if (extractedData && extractedData.orderNumber === orderId) {
                    console.log(`✅ Found matching order data for ${orderId}`);
                    return extractedData;
                } else {
                    console.warn(`⚠️ Order number mismatch: expected ${orderId}, got ${extractedData?.orderNumber}`);
                }
            }

            console.log(`❌ No matching order data found for ${orderId}`);
            return null;
        } catch (error) {
            console.error(`Error getting order data for ${orderId}:`, error);
            return null;
        }
    }

    /**
     * Store order tags in storage
     * @param {string} orderId - Order ID
     * @param {Object} tagData - Tag data to store
     * @param {StorageManager} storage - Storage manager instance
     */
    async storeOrderTags(orderId, tagData, storage) {
        try {
            if (!storage) {
                console.warn('No storage manager provided for storeOrderTags');
                return;
            }
            await storage.storeOrderTags(orderId, tagData);
        } catch (error) {
            console.error(`Error storing tags for order ${orderId}:`, error);
        }
    }

    /**
     * Retrieve order tags from storage
     * @param {string} orderId - Order ID
     * @param {StorageManager} storage - Storage manager instance
     * @returns {Object|null} Tag data or null if not found
     */
    async getOrderTags(orderId, storage) {
        try {
            if (!storage) {
                console.warn('No storage manager provided for getOrderTags');
                return null;
            }
            const tagData = await storage.getOrderTags(orderId);
            if (tagData) {
                console.log(`Retrieved tags for order ${orderId}:`, tagData);
            }
            return tagData;
        } catch (error) {
            console.error(`Error retrieving tags for order ${orderId}:`, error);
            return null;
        }
    }

    /**
     * Show tagging dialog for hiding order details
     * @param {string} orderId - Order ID to hide details for
     * @param {Element} button - The button that was clicked
     * @param {StorageManager} storage - Storage manager instance
     */
    async hideOrderDetails(orderId, button, storage) {
        try {
            console.log(`🔍 hideOrderDetails called for order ${orderId} - opening tagging dialog only`);

            // IMPORTANT: Do NOT hide the order yet - just show the tagging dialog
            // The order will only be hidden when the user clicks "Save & Hide" in the dialog

            // Show tagging dialog first, then hide details after tags are saved
            this.showTaggingDialogForHide(orderId, button, storage);
        } catch (error) {
            console.error(`Error showing tagging dialog for order ${orderId}:`, error);
        }
    }

    /**
     * Actually hide order details (product info, images, links) - called after tagging
     * @param {string} orderId - Order ID to hide details for
     * @param {Element} button - The button that was clicked
     * @param {Object} tagData - Optional tag data if order was tagged before hiding
     */
    performHideOrderDetails(orderId, button, tagData = null) {
        let orderCard = null;
        try {
            console.log('🔍 performHideOrderDetails called with:', { orderId, button, tagData });

            const buttonInfo = this.injectedButtons.get(orderId);
            if (!buttonInfo) {
                console.warn(`No button info found for order ${orderId}`);
                return;
            }

            orderCard = buttonInfo.orderCard;
            console.log('🔍 Order card found:', orderCard);
            console.log('🔍 Order card outerHTML preview:', orderCard.outerHTML.substring(0, 200) + '...');
            console.log('🔍 Order card classes:', orderCard.className);
            console.log('🔍 Order card ID:', orderCard.id);

            // CRITICAL CHECK: Prevent hiding if order is already hidden
            if (orderCard.classList.contains('archivaz-details-hidden')) {
                console.warn(`⚠️ Order ${orderId} is already hidden - this indicates a duplicate operation or incorrect flow`);
                console.warn(`⚠️ The order should NOT be hidden until the user clicks "Save & Hide" in the tagging dialog`);
                return;
            }

            // Clear any processing flags that might be leftover from previous operations
            orderCard.removeAttribute('data-archivaz-processed');
            orderCard.removeAttribute('data-archivaz-hiding');

            // Check if this order is already being processed
            if (orderCard.hasAttribute('data-archivaz-hiding')) {
                console.warn(`⚠️ Order ${orderId} is already being hidden, skipping duplicate operation`);
                return;
            }

            // Mark this order as being hidden to prevent duplicate operations
            orderCard.setAttribute('data-archivaz-hiding', 'true');

            // Enhanced selectors for different page formats to hide product details
            const selectorsToHide = [
                // Product images and thumbnails
                'img[src*="images"], img[src*="product"], .product-image, .item-image',

                // Product links and titles
                'a[href*="product"], a[href*="dp/"], .product-title, .item-title, .product-link',

                // Product pricing and quantity
                '.product-price, .item-price, .product-quantity, .item-quantity',

                // Product metadata
                '.product-meta, .item-meta, .product-info, .item-info',

                // Amazon-specific selectors
                '[data-testid*="product"], [data-testid*="item"]',

                // Legacy selectors
                '.a-link-normal[href*="product"], .a-text-normal[href*="product"]'
            ];



            let totalHidden = 0;
            const hiddenElements = [];

            // Try each selector and hide matching elements
            selectorsToHide.forEach(selector => {
                try {
                    const elements = orderCard.querySelectorAll(selector);
                    console.log(`🔍 Selector "${selector}" found ${elements.length} elements in order ${orderId}`);
                    elements.forEach(element => {
                        // Skip if already hidden or if it's our injected buttons
                        if (element.classList.contains('archivaz-hidden-details') ||
                            element.closest('.archivaz-button-container')) {
                            return;
                        }

                        // Verify the element is within the order card boundaries
                        if (!this.isElementWithinOrderCard(element, orderCard)) {
                            console.warn(`⚠️ Element outside order card boundaries in order ${orderId}:`, element);
                            return;
                        }

                        // Store original display value for restoration
                        const originalDisplay = window.getComputedStyle(element).display;
                        element.setAttribute('data-archivaz-original-display', originalDisplay);

                        // Hide the element
                        element.classList.add('archivaz-hidden-details');
                        element.style.display = 'none';

                        hiddenElements.push(element);
                        totalHidden++;
                        console.log(`🔍 Hidden element with selector "${selector}" in order ${orderId}:`, element);
                    });
                } catch (selectorError) {
                    // Continue with next selector if one fails
                    console.debug(`Selector "${selector}" failed:`, selectorError);
                }
            });

            // Store hidden elements for restoration
            if (hiddenElements.length > 0) {
                buttonInfo.hiddenElements = hiddenElements;
            }

            // Now hide additional specific elements using custom logic
            const additionalHiddenElements = this.hideAdditionalOrderElements(orderCard);
            if (additionalHiddenElements.length > 0) {
                // Merge with existing hidden elements
                buttonInfo.hiddenElements = [...(buttonInfo.hiddenElements || []), ...additionalHiddenElements];
                totalHidden += additionalHiddenElements.length;
            }

            // Handle order-item containers intelligently to preserve essential status
            const orderItemElements = orderCard.querySelectorAll('.order-item');
            console.log(`🔍 Found ${orderItemElements.length} order-item elements in order ${orderId}`);

            orderItemElements.forEach((element) => {
                // Skip if already hidden or if it's our injected buttons
                if (element.classList.contains('archivaz-hidden-details') ||
                    element.closest('.archivaz-button-container')) {
                    return;
                }

                // Verify the element is within the order card boundaries
                if (!this.isElementWithinOrderCard(element, orderCard)) {
                    console.warn(`⚠️ Order-item element outside order card boundaries in order ${orderId}:`, element);
                    return;
                }

                // Check if this order-item contains essential delivery status information
                const hasEssentialStatus = element.querySelector('.delivery-box, [class*="shipment-status"], [class*="delivery-box"]') ||
                    element.textContent.includes('Return complete') ||
                    element.textContent.includes('Delivered') ||
                    element.textContent.includes('Shipped');

                if (!hasEssentialStatus) {
                    // Store original display value for restoration
                    const originalDisplay = window.getComputedStyle(element).display;
                    element.setAttribute('data-archivaz-original-display', originalDisplay);

                    // Hide the element
                    element.classList.add('archivaz-hidden-details');
                    element.style.display = 'none';

                    hiddenElements.push(element);
                    totalHidden++;
                    console.log(`🔍 Hidden order-item element in order ${orderId}:`, element);
                }
            });

            // Special handling: Preserve the delivery status column (left column) in the delivery-box
            const deliveryBox = orderCard.querySelector('.delivery-box');
            console.log('🔍 Looking for delivery-box:', deliveryBox);

            if (deliveryBox) {
                const leftColumn = deliveryBox.querySelector('.a-fixed-right-grid-col.a-col-left');
                console.log('🔍 Looking for left column:', leftColumn);

                if (leftColumn) {
                    // Check if left column was hidden and needs restoration
                    if (leftColumn.classList.contains('archivaz-hidden-details')) {
                        console.log('🔍 Left column was hidden, restoring it...');
                        // Restore the left column if it was hidden - it contains essential delivery status
                        leftColumn.classList.remove('archivaz-hidden-details');
                        leftColumn.style.display = leftColumn.getAttribute('data-archivaz-original-display') || 'block';

                        // Remove from hidden elements array
                        const index = hiddenElements.indexOf(leftColumn);
                        if (index > -1) {
                            hiddenElements.splice(index, 1);
                            totalHidden--;
                        }
                    } else {
                        console.log('🔍 Left column is already visible, no restoration needed');
                    }

                    // Always add tags and username below the delivery status if available
                    console.log('🔍 Checking if tags/username should be added:', { tagData, hasTags: tagData && tagData.tags && tagData.tags.length > 0 });

                    // Get username from stored data and pass it to the method
                    const username = this.getUsernameForOrder(orderId);
                    console.log(`🔍 Username for order ${orderId}: "${username}" (from stored data)`);
                    console.log(`🔍 Current orderUsernames map:`, Array.from(this.orderUsernames.entries()));

                    const tags = tagData && tagData.tags ? tagData.tags : [];
                    console.log(`🔍 About to call addTagsToDeliveryStatus with username: "${username}"`);
                    this.addTagsToDeliveryStatus(leftColumn, tags, username);
                } else {
                    console.log('⚠️ Left column not found');
                }
            } else {
                console.log('⚠️ No delivery-box found in order card');
            }

            // Update button text and type
            button.textContent = 'Show details';
            button.setAttribute('data-archivaz-type', 'show-details');
            button.classList.add('archivaz-details-hidden');

            // Add visual indicator to order card
            orderCard.classList.add('archivaz-details-hidden');
            orderCard.style.opacity = '0.8';

            // Track hidden state
            this.hiddenOrders.add(`${orderId}-details`);

            // Notify callback
            if (this.onOrderHidden) {
                const orderData = this.extractOrderData(orderCard, orderId);
                this.onOrderHidden(orderId, 'details', orderData);
            }

            // Clean up processing flag
            orderCard.removeAttribute('data-archivaz-hiding');

            console.log(`Hidden ${totalHidden} detail elements for order ${orderId}`);

        } catch (error) {
            console.error(`Error hiding details for order ${orderId}:`, error);
            // Clean up processing flag on error
            if (orderCard) {
                orderCard.removeAttribute('data-archivaz-hiding');
            }
        }
    }

    /**
     * Verify that an element is properly contained within the order card boundaries
     * @param {Element} element - The element to check
     * @param {Element} orderCard - The order card that should contain the element
     * @returns {boolean} True if the element is properly contained within the order card
     */
    isElementWithinOrderCard(element, orderCard) {
        // Check if the element is the order card itself
        if (element === orderCard) {
            return true;
        }

        // Check if the element is a descendant of the order card
        return orderCard.contains(element);
    }

    /**
     * Hide additional order elements that aren't easily targeted by CSS selectors
     * @param {Element} orderCard - The order card element
     * @returns {Array} Array of hidden elements for restoration
     */
    hideAdditionalOrderElements(orderCard) {
        const hiddenElements = [];
        const orderId = this.getOrderIdFromElement(orderCard) || 'unknown';

        console.log(`🔍 hideAdditionalOrderElements called for order ${orderId}`);

        try {
            // Find and hide return/replace text
            this.findAndHideTextElements(orderCard, [
                'Return or replace items: Eligible',
                'Return window closed on',
                'Auto-delivered: Every',
                'auto-delivered: Every',
                'When will I get my refund?'
            ], hiddenElements);

            // Find and hide Amazon action buttons (excluding our extension buttons)
            this.findAndHideActionButtons(orderCard, hiddenElements);

        } catch (error) {
            console.error('Error hiding additional order elements:', error);
        }

        console.log(`🔍 hideAdditionalOrderElements completed for order ${orderId}, hidden ${hiddenElements.length} elements`);
        return hiddenElements;
    }

    /**
     * Add tags and username below the delivery status in the preserved left column
     * @param {Element} leftColumn - The left column element containing delivery status
     * @param {Array} tags - Array of tag strings to display
     * @param {string} username - Username to display
     */
    addTagsToDeliveryStatus(leftColumn, tags, username = null) {
        try {
            console.log('🔍 addTagsToDeliveryStatus called with:', { leftColumn, tags, username });
            console.log(`🔍 Username parameter received: "${username}"`);

            // Check if tags container already exists
            if (leftColumn.querySelector('.archivaz-delivery-status-tags')) {
                console.log('⚠️ Tags container already displayed, skipping');
                return;
            }

            // Only create container if we have tags or username to show
            if ((!tags || tags.length === 0) && !username) {
                console.log('⚠️ No tags or username to display, skipping');
                return;
            }

            console.log(`🔍 Creating tags container with username: "${username}"`);

            // Create tags container
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'archivaz-delivery-status-tags';
            tagsContainer.style.cssText = `
                margin-top: 4px;
                padding-top: 0;
            `;

            // Create hidden by section if username is available
            if (username) {
                // Add empty row for spacing
                const emptyRow = document.createElement('div');
                emptyRow.className = 'a-row a-spacing-top-mini';
                emptyRow.style.cssText = `
                    height: 36px;
                `;
                tagsContainer.appendChild(emptyRow);

                const hiddenBySection = document.createElement('div');
                hiddenBySection.style.cssText = `
                    margin-bottom: 4px;
                `;

                const hiddenByLabel = document.createElement('span');
                hiddenByLabel.textContent = 'Hidden by: ';
                hiddenByLabel.style.cssText = `
                    font-size: 14px;
                    color: #666;
                    font-weight: 500;
                    margin-right: 6px;
                `;

                const usernameElement = document.createElement('span');
                usernameElement.textContent = `@${username}`;
                usernameElement.style.cssText = `
                    font-size: 14px;
                    color: #0066cc;
                    font-weight: 600;
                `;

                hiddenBySection.appendChild(hiddenByLabel);
                hiddenBySection.appendChild(usernameElement);
                tagsContainer.appendChild(hiddenBySection);
            }

            // Create tags label (only if we have tags)
            if (tags && tags.length > 0) {
                const tagsLabel = document.createElement('span');
                tagsLabel.textContent = '';
                tagsLabel.style.cssText = `
                    font-size: 14px;
                    color: #666;
                    font-weight: 500;
                    margin-right: 6px;
                `;
                tagsContainer.appendChild(tagsLabel);
            }

            // Create tags list
            const tagsList = document.createElement('div');
            tagsList.className = 'archivaz-tags-list';
            tagsList.style.cssText = `
                display: inline-block;
                margin-top: 0;
            `;

            // Add each tag
            if (tags && tags.length > 0) {
                tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'archivaz-delivery-status-tag';
                    tagElement.textContent = tag;
                    tagElement.style.cssText = `
                        display: inline-block;
                        background: #e7f3ff;
                        color: #0066cc;
                        padding: 3px 8px;
                        margin: 2px 4px 2px 0;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 500;
                        border: 1px solid #cce7ff;
                    `;
                    tagsList.appendChild(tagElement);
                });
            }

            tagsContainer.appendChild(tagsList);

            // Insert tags directly below the delivery status text
            const deliveryStatusText = leftColumn.querySelector('.yohtmlc-shipment-status-secondaryText');
            console.log('🔍 Looking for delivery status text:', deliveryStatusText);

            if (deliveryStatusText) {
                // Insert tags right after the delivery status text
                deliveryStatusText.parentNode.insertBefore(tagsContainer, deliveryStatusText.nextSibling);
                console.log('✅ Tags inserted after delivery status text');
            } else {
                console.log('⚠️ Delivery status text not found, using fallback positioning');
                // Fallback: insert after the last row in the left column
                const lastRow = leftColumn.querySelector('.a-row:last-child');
                if (lastRow) {
                    lastRow.parentNode.insertBefore(tagsContainer, lastRow.nextSibling);
                    console.log('✅ Tags inserted after last row (fallback)');
                } else {
                    // Final fallback: append to the end of the left column
                    leftColumn.appendChild(tagsContainer);
                    console.log('✅ Tags appended to end of left column (final fallback)');
                }
            }

            console.log(`Added ${tags.length} tags to delivery status for order`);

        } catch (error) {
            console.error('Error adding tags to delivery status:', error);
        }
    }

    /**
     * Remove tags from the delivery status when showing details
     * @param {Element} orderCard - The order card element
     */
    removeTagsFromDeliveryStatus(orderCard) {
        try {
            const tagsContainer = orderCard.querySelector('.archivaz-delivery-status-tags');
            if (tagsContainer) {
                tagsContainer.remove();
                console.log('Removed tags from delivery status');
            }
        } catch (error) {
            console.error('Error removing tags from delivery status:', error);
        }
    }

    /**
     * Find and hide text elements containing specific text
     * @param {Element} container - Container to search within
     * @param {Array} textToFind - Array of text strings to search for
     * @param {Array} hiddenElements - Array to store hidden elements
     */
    findAndHideTextElements(container, textToFind, hiddenElements) {
        const orderId = this.getOrderIdFromElement(container) || 'unknown';
        console.log(`🔍 findAndHideTextElements called for order ${orderId}, container:`, container);
        console.log(`🔍 Container classes:`, container.className);
        console.log(`🔍 Container ID:`, container.id);

        // Walk through all text nodes and their parent elements
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        console.log(`🔍 TreeWalker found ${textNodes.length} text nodes in order ${orderId}`);

        textNodes.forEach(textNode => {
            const text = textNode.textContent.trim();
            if (text && textToFind.some(searchText => text.includes(searchText))) {
                const parentElement = textNode.parentElement;
                if (parentElement && !parentElement.classList.contains('archivaz-hidden-details')) {
                    // Verify the element is within the order card boundaries
                    if (!this.isElementWithinOrderCard(parentElement, container)) {
                        console.warn(`⚠️ Element outside order card boundaries in order ${orderId}:`, parentElement);
                        return;
                    }

                    // Also check if this element has specific classes that indicate essential status
                    // Check the parent element and all its ancestors for essential classes
                    let hasEssentialClass = false;
                    let currentElement = parentElement;

                    while (currentElement && !hasEssentialClass) {
                        hasEssentialClass = currentElement.classList.contains('yohtmlc-shipment-status-primaryText') ||
                            currentElement.classList.contains('yohtmlc-shipment-status-secondaryText') ||
                            currentElement.classList.contains('delivery-box__primary-text') ||
                            currentElement.classList.contains('delivery-box__secondary-text');
                        currentElement = currentElement.parentElement;
                    }

                    if (hasEssentialClass) {
                        return; // Skip hiding essential delivery status
                    }

                    // Store original display value
                    const originalDisplay = window.getComputedStyle(parentElement).display;
                    parentElement.setAttribute('data-archivaz-original-display', originalDisplay);

                    // Hide the element
                    parentElement.classList.add('archivaz-hidden-details');
                    parentElement.style.display = 'none';

                    hiddenElements.push(parentElement);
                    console.log(`🔍 Hidden text element in order ${orderId}: "${text}"`, parentElement);
                }
            }
        });
    }

    /**
 * Find and hide Amazon action buttons (excluding our extension buttons)
 * @param {Element} container - Container to search within
 * @param {Array} hiddenElements - Array to store hidden elements
 */
    findAndHideActionButtons(container, hiddenElements) {
        const orderId = this.getOrderIdFromElement(container) || 'unknown';
        console.log(`🔍 findAndHideActionButtons called for order ${orderId}, container:`, container);

        // Common Amazon action button text patterns - expanded list
        // Excluding essential order header links that should remain visible
        const buttonTexts = [
            'Track package',
            'Return or replace items',
            'Share gift receipt',
            'View your Subscribe & Save',
            'Write a product review',
            'Ask Product Question',
            'Leave seller feedback',
            'Buy it again',
            'View your item',
            'Get product support',
            'Problem with order',
            'View return/refund status'
            // Note: 'View order details' and 'View invoice' are intentionally excluded
            // to preserve essential order header information
        ];

        // More comprehensive button selectors
        const buttonSelectors = [
            'button',
            '.a-button',
            '.a-button-normal',
            '.a-button-text',
            '.a-button-base',
            '.a-button-primary',
            '.a-button-secondary',
            '.a-link-normal',
            '.a-text-normal',
            '[role="button"]',
            '[type="button"]',
            '.a-box-group button',
            '.order-actions button'
        ];

        // Find all buttons in the container using multiple selectors
        const allButtons = new Set();
        buttonSelectors.forEach(selector => {
            try {
                const buttons = container.querySelectorAll(selector);
                buttons.forEach(button => allButtons.add(button));
            } catch (e) {
                // Skip invalid selectors
            }
        });

        console.log(`🔍 Found ${allButtons.size} total buttons in order ${orderId}`);

        allButtons.forEach(button => {
            // Skip if it's our extension button
            if (button.hasAttribute('data-archivaz-type')) {
                return;
            }

            // Skip if already hidden
            if (button.classList.contains('archivaz-hidden-details')) {
                return;
            }

            // Verify the button is within the order card boundaries
            if (!this.isElementWithinOrderCard(button, container)) {
                console.warn(`⚠️ Button outside order card boundaries in order ${orderId}:`, button);
                return;
            }

            const buttonText = button.textContent.trim();

            // Check if button text matches any of our patterns
            if (buttonText && buttonTexts.some(text => buttonText.includes(text))) {
                // Store original display value
                const originalDisplay = window.getComputedStyle(button).display;
                button.setAttribute('data-archivaz-original-display', originalDisplay);

                // Hide the button
                button.classList.add('archivaz-hidden-details');
                button.style.display = 'none';

                hiddenElements.push(button);
                console.log(`🔍 Hidden button in order ${orderId}: "${buttonText}" with classes: ${button.className}`);
            }
        });

        // Also look for button containers that might contain action buttons
        const buttonContainers = container.querySelectorAll('.a-box-group, .order-actions, .a-unordered-list, .a-fixed-right-grid-col');
        console.log(`🔍 Found ${buttonContainers.length} button containers in order ${orderId}`);

        buttonContainers.forEach(buttonContainer => {
            // Skip containers that contain essential order header information
            if (this.isEssentialOrderHeader(buttonContainer)) {
                return;
            }

            // Verify the container is within the order card boundaries
            if (!this.isElementWithinOrderCard(buttonContainer, container)) {
                console.warn(`⚠️ Button container outside order card boundaries in order ${orderId}:`, buttonContainer);
                return;
            }

            // Only hide containers that don't contain our extension buttons
            if (!buttonContainer.querySelector('[data-archivaz-type]')) {
                const buttonsInContainer = buttonContainer.querySelectorAll('button, .a-button, .a-button-normal, .a-link-normal');
                let hasVisibleButtons = false;

                buttonsInContainer.forEach(btn => {
                    if (!btn.classList.contains('archivaz-hidden-details')) {
                        hasVisibleButtons = true;
                    }
                });

                // If the container only has action buttons (no extension buttons), hide it
                if (hasVisibleButtons) {
                    const originalDisplay = window.getComputedStyle(buttonContainer).display;
                    buttonContainer.setAttribute('data-archivaz-original-display', originalDisplay);

                    buttonContainer.classList.add('archivaz-hidden-details');
                    buttonContainer.style.display = 'none';

                    hiddenElements.push(buttonContainer);
                    console.log(`🔍 Hidden button container in order ${orderId}:`, buttonContainer);
                }
            }
        });
    }

    /**
     * Check if a container contains essential order header information that should be preserved
     * @param {Element} container - The container to check
     * @returns {boolean} True if this is essential order header content
     */
    isEssentialOrderHeader(container) {
        try {
            // Look for text content that indicates this is essential order header info
            const textContent = container.textContent.toLowerCase();

            // Check if this container contains essential order information
            const essentialPatterns = [
                'order placed',
                'total',
                'ship to',
                'order #',
                'view order details',
                'view invoice'
            ];

            // If any essential pattern is found, preserve this container
            return essentialPatterns.some(pattern => textContent.includes(pattern));

        } catch (error) {
            console.debug('Error checking if container is essential order header:', error);
            return false;
        }
    }

    /**
     * Hide order details when restoring from storage (doesn't require button parameter)
     * @param {string} orderId - Order ID
     * @param {Element} orderCard - The order card element directly
     * @param {Object} tagData - Optional tag data to display
     * @param {string} username - Optional username for the order (used during restoration)
     */
    async performHideOrderDetailsWithCard(orderId, orderCard, tagData = null, username = null) {
        // UNIQUE IDENTIFIER: This is the performHideOrderDetailsWithCard method
        try {
            console.log('🔍 performHideOrderDetailsWithCard called with:', { orderId, orderCard, tagData });

            if (!orderCard) {
                console.warn(`No order card provided for order ${orderId}`);
                return;
            }

            // CRITICAL CHECK: Prevent hiding if order is already hidden
            if (orderCard.classList.contains('archivaz-details-hidden')) {
                console.warn(`⚠️ Order ${orderId} is already hidden - skipping restoration`);
                return;
            }

            // Check if this order is already being processed
            if (orderCard.hasAttribute('data-archivaz-hiding')) {
                console.warn(`⚠️ Order ${orderId} is already being hidden, skipping duplicate operation`);
                return;
            }

            // Mark this order as being hidden to prevent duplicate operations
            orderCard.setAttribute('data-archivaz-hiding', 'true');

            // Enhanced selectors for different page formats to hide product details
            const selectorsToHide = [
                // Product images and thumbnails
                'img[src*="images"]', 'img[src*="product"]', '.product-image', '.item-image',

                // Product links and titles
                'a[href*="product"]', 'a[href*="dp/"]', '.product-title', '.item-title', '.product-link',

                // Product descriptions and details
                '.product-description', '.item-description', '.product-details', '.item-details',

                // Price information (excluding order total)
                '.price', '.item-price', '.product-price', '.a-price',

                // Quantity and other product metadata
                '.quantity', '.item-quantity', '.product-quantity',

                // Product-specific containers
                '.product-container', '.item-container', '.product-wrapper', '.item-wrapper'
            ];

            // Hide elements using selectors with utility function
            const hiddenElements = hideElementsBySelectors(
                orderCard,
                selectorsToHide,
                orderId,
                (element) => {
                    // Skip if already hidden or if it's our injected buttons
                    return element.classList.contains('archivaz-hidden-details') ||
                        element.closest('.archivaz-button-container') ||
                        !isElementWithinContainer(element, orderCard);
                }
            );

            let totalHidden = hiddenElements.length;

            // Now hide additional specific elements using custom logic
            const additionalHiddenElements = this.hideAdditionalOrderElements(orderCard);
            if (additionalHiddenElements.length > 0) {
                // Merge with existing hidden elements
                hiddenElements.push(...additionalHiddenElements);
                totalHidden += additionalHiddenElements.length;
            }

            // Handle order-item containers intelligently to preserve essential status
            const orderItemElements = orderCard.querySelectorAll('.order-item');
            console.log(`🔍 Found ${orderItemElements.length} order-item elements in order ${orderId}`);

            orderItemElements.forEach((element) => {
                // Skip if already hidden or if it's our injected buttons
                if (element.classList.contains('archivaz-hidden-details') ||
                    element.closest('.archivaz-button-container')) {
                    return;
                }

                // Verify the element is within the order card boundaries
                if (!isElementWithinContainer(element, orderCard)) {
                    console.warn(`⚠️ Order-item element outside order card boundaries in order ${orderId}:`, element);
                    return;
                }

                // Check if this order-item contains essential delivery status information
                const hasEssentialStatus = element.querySelector('.delivery-box, [class*="shipment-status"], [class*="delivery-box"]') ||
                    containsEssentialInfo(element);

                if (!hasEssentialStatus) {
                    const result = hideElement(element, orderId, 'order-item element');
                    if (result.success) {
                        hiddenElements.push(element);
                        totalHidden++;
                    }
                }
            });

            // Special handling: Preserve the delivery status column (left column) in the delivery-box
            const deliveryBox = orderCard.querySelector('.delivery-box');
            console.log('🔍 Looking for delivery-box:', deliveryBox);

            if (deliveryBox) {
                const leftColumn = deliveryBox.querySelector('.a-fixed-right-grid-col.a-col-left');
                console.log('🔍 Looking for left column:', leftColumn);

                if (leftColumn) {
                    // Check if left column was hidden and needs restoration
                    if (leftColumn.classList.contains('archivaz-hidden-details')) {
                        console.log('🔍 Left column was hidden, restoring it...');
                        // Restore the left column if it was hidden - it contains essential delivery status
                        leftColumn.classList.remove('archivaz-hidden-details');
                        leftColumn.style.display = leftColumn.getAttribute('data-archivaz-original-display') || 'block';

                        // Remove from hidden elements array
                        const index = hiddenElements.indexOf(leftColumn);
                        if (index > -1) {
                            hiddenElements.splice(index, 1);
                            totalHidden--;
                        }
                    } else {
                        console.log('🔍 Left column is already visible, no restoration needed');
                    }

                    // Always add tags and username below the delivery status if available
                    console.log('🔍 Checking if tags/username should be added:', { tagData, hasTags: tagData && tagData.tags && tagData.tags.length > 0 });

                    // Use passed username or get from stored data
                    const finalUsername = username || this.getUsernameForOrder(orderId);
                    console.log(`🔍 Username for order ${orderId}: "${finalUsername}" (${username ? 'from parameter' : 'from stored data'})`);

                    const tags = tagData && tagData.tags ? tagData.tags : [];
                    console.log(`🔍 About to call addTagsToDeliveryStatus with username: "${finalUsername}"`);

                    // Add tags and username to the delivery status
                    this.addTagsToDeliveryStatus(leftColumn, tags, finalUsername);
                }
            }

            // Mark the order as hidden
            orderCard.classList.add('archivaz-details-hidden');
            orderCard.style.opacity = '0.8';

            // Add to hidden orders tracking
            this.hiddenOrders.add(`${orderId}-details`);

            // Store hidden elements for restoration
            if (hiddenElements.length > 0) {
                // Get existing button info to preserve important properties
                const existingButtonInfo = this.injectedButtons.get(orderId);

                // Create a proper buttonInfo structure for restoration that includes all required properties
                const tempButtonInfo = {
                    orderCard,
                    hiddenElements,
                    button: existingButtonInfo?.button || null,  // Preserve existing button reference if available
                    // Preserve other important properties from existing button info
                    ...(existingButtonInfo && {
                        orderId: existingButtonInfo.orderId,
                        username: existingButtonInfo.username,
                        // Don't overwrite hiddenElements if it already exists
                        hiddenElements: existingButtonInfo.hiddenElements ?
                            [...existingButtonInfo.hiddenElements, ...hiddenElements] :
                            hiddenElements
                    })
                };

                // Update the button info without completely overwriting it
                if (existingButtonInfo) {
                    // Merge the new data with existing data
                    Object.assign(existingButtonInfo, tempButtonInfo);
                } else {
                    // Create new entry if none exists
                    this.injectedButtons.set(orderId, tempButtonInfo);
                }
            }

            // Update button state to reflect hidden status
            // Look for any button with our extension attributes, regardless of current type
            const extensionButton = orderCard.querySelector('button[data-archivaz-type]');
            console.log(`🔍 Looking for extension button in order ${orderId}:`, {
                found: !!extensionButton,
                buttonType: extensionButton?.getAttribute('data-archivaz-type'),
                buttonText: extensionButton?.textContent,
                orderCardClasses: orderCard.className
            });

            if (extensionButton) {
                extensionButton.textContent = 'Show details';
                extensionButton.setAttribute('data-archivaz-type', 'show-details');
                extensionButton.classList.add('archivaz-details-hidden');
                console.log(`✅ Updated button state to "Show details" for order ${orderId}`);
            } else {
                console.warn(`⚠️ Could not find extension button to update for order ${orderId}`);
                // Debug: check what buttons exist in the order card
                const allButtons = orderCard.querySelectorAll('button');
                console.log(`🔍 All buttons in order card ${orderId}:`, Array.from(allButtons).map(btn => ({
                    text: btn.textContent,
                    type: btn.getAttribute('data-archivaz-type'),
                    classes: btn.className
                })));
            }

            // Clean up processing flag
            orderCard.removeAttribute('data-archivaz-hiding');

            console.log(`Hidden ${totalHidden} detail elements for order ${orderId} during restoration`);

        } catch (error) {
            console.error(`Error hiding details for order ${orderId} during restoration:`, error);
            // Clean up processing flag on error
            if (orderCard) {
                orderCard.removeAttribute('data-archivaz-hiding');
            }
        }
    }

    /**
     * Show order details that were previously hidden
     * @param {string} orderId - Order ID to show details for
     * @param {Element} button - The button that was clicked
     */
    showOrderDetails(orderId, button) {
        try {
            const buttonInfo = this.injectedButtons.get(orderId);
            if (!buttonInfo) {
                console.warn(`No button info found for order ${orderId}`);
                return;
            }

            const orderCard = buttonInfo.orderCard;

            let totalShown = 0;

            // First, try to restore elements from our stored list
            if (buttonInfo.hiddenElements && buttonInfo.hiddenElements.length > 0) {
                buttonInfo.hiddenElements.forEach(element => {
                    if (element && element.classList.contains('archivaz-hidden-details')) {
                        // Restore original display value
                        const originalDisplay = element.getAttribute('data-archivaz-original-display');
                        element.style.display = originalDisplay || '';

                        // Remove hidden class
                        element.classList.remove('archivaz-hidden-details');

                        // Clean up stored attributes
                        element.removeAttribute('data-archivaz-original-display');

                        totalShown++;
                    }
                });

                // Clear the stored hidden elements
                buttonInfo.hiddenElements = [];
            }

            // Fallback: also check for any remaining elements with the hidden class
            const remainingHiddenElements = orderCard.querySelectorAll('.archivaz-hidden-details');
            remainingHiddenElements.forEach(element => {
                // Restore original display value if available
                const originalDisplay = element.getAttribute('data-archivaz-original-display');
                element.style.display = originalDisplay || '';

                // Remove hidden class
                element.classList.remove('archivaz-hidden-details');

                // Clean up stored attributes
                element.removeAttribute('data-archivaz-original-display');

                totalShown++;
            });

            // Update button text and type
            button.textContent = 'Hide details';
            button.setAttribute('data-archivaz-type', 'hide-details');
            button.classList.remove('archivaz-details-hidden');

            // Remove visual indicator from order card
            orderCard.classList.remove('archivaz-details-hidden');
            orderCard.style.opacity = '';

            // Remove tags from delivery status if they were added
            this.removeTagsFromDeliveryStatus(orderCard);

            // Remove from hidden state tracking
            this.hiddenOrders.delete(`${orderId}-details`);

            // Reset the button info to ensure proper state for future hiding
            if (buttonInfo) {
                buttonInfo.hiddenElements = [];
                // Ensure the button info is properly updated
                this.injectedButtons.set(orderId, {
                    ...buttonInfo,
                    hiddenElements: []
                });

                console.log(`🔧 Reset button info for order ${orderId}:`, {
                    hasOrderCard: !!buttonInfo.orderCard,
                    hasButton: !!buttonInfo.button,
                    hiddenElementsCount: buttonInfo.hiddenElements?.length || 0
                });
            }

            // Notify callback
            if (this.onOrderShown) {
                const orderData = this.extractOrderData(orderCard, orderId);
                this.onOrderShown(orderId, 'details', orderData);
            }

            console.log(`Showed ${totalShown} detail elements for order ${orderId}`);

        } catch (error) {
            console.error(`Error showing details for order ${orderId}:`, error);
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Extract order data using OrderParser if available
     * @param {Element} orderCard - The order card element
     * @param {string} orderId - The order ID
     * @returns {Object|null} Order data or null if extraction fails
     */
    extractOrderData(orderCard, orderId) {
        try {
            if (!this.orderParser) {
                console.warn('OrderParser not available for data extraction');
                return { orderId };
            }

            // Use OrderParser to extract order data
            const orderData = this.orderParser.parseOrderCard(orderCard);
            return orderData || { orderId };

        } catch (error) {
            console.error(`Error extracting order data for ${orderId}:`, error);
            return { orderId };
        }
    }

    /**
     * Check if order details are hidden
     * @param {string} orderId - Order ID to check
     * @returns {boolean} True if details are hidden
     */
    areDetailsHidden(orderId) {
        return this.hiddenOrders.has(`${orderId}-details`);
    }

    /**
     * Get all hidden order IDs
     * @returns {Array} Array of hidden order IDs
     */
    getHiddenOrders() {
        return Array.from(this.hiddenOrders);
    }

    /**
     * Inject buttons into an order card
     * @param {Element} orderCard - The order card element
     * @param {string} orderId - The order ID
     * @returns {boolean} True if buttons were successfully injected
     */
    injectButtons(orderCard, orderId) {
        try {
            // Check if buttons are already injected for this order
            if (this.injectedButtons.has(orderId)) {
                console.log(`Buttons already injected for order ${orderId}`);
                return true;
            }

            // Check if this order card already has buttons
            if (orderCard.querySelector('.archivaz-button-container')) {
                console.warn(`⚠️ Order card already has buttons for order ${orderId}, skipping injection`);
                return true;
            }

            console.log(`🔧 Injecting buttons for order ${orderId}`);

            // Create buttons
            const { hideDetailsLi, hideDetailsBtn } = this.createButtons(orderId);

            // Detect page format and use optimal injection strategy
            const pageFormat = this.detectPageFormat(orderCard);
            console.log(`🔍 Detected page format: ${pageFormat} for order ${orderId}`);

            const strategy = this.getFormatSpecificStrategy(pageFormat);
            let injectionSuccess = false;

            // Try primary container first
            if (strategy.container) {
                const container = orderCard.querySelector(strategy.container);
                if (container) {
                    container.appendChild(hideDetailsLi);
                    console.log(`✅ Successfully injected buttons for order ${orderId} into ${strategy.container}`);
                    injectionSuccess = true;
                }
            }

            // Try fallback container if primary failed
            if (!injectionSuccess && strategy.fallback) {
                const fallbackContainer = orderCard.querySelector(strategy.fallback);
                if (fallbackContainer) {
                    fallbackContainer.appendChild(hideDetailsLi);
                    console.log(`✅ Successfully injected buttons for order ${orderId} into fallback container ${strategy.fallback}`);
                    injectionSuccess = true;
                }
            }

            // Strategy 3: Try to find delivery box actions (your-account format)
            if (!injectionSuccess) {
                const deliveryBox = orderCard.querySelector('.delivery-box');
                if (deliveryBox) {
                    // Look for existing action buttons or create a new container
                    let actionContainer = deliveryBox.querySelector('.a-unordered-list, .a-vertical');
                    if (!actionContainer) {
                        actionContainer = document.createElement('ul');
                        actionContainer.className = 'a-unordered-list a-vertical a-spacing-mini';
                        deliveryBox.appendChild(actionContainer);
                    }
                    actionContainer.appendChild(hideDetailsLi);
                    console.log(`✅ Successfully injected buttons for order ${orderId} into .delivery-box actions`);
                    injectionSuccess = true;
                }
            }

            // Strategy 4: Fallback - append to the end of the order card
            if (!injectionSuccess) {
                orderCard.appendChild(hideDetailsLi);
                console.log(`🔍 Fallback: injected buttons for order ${orderId} to end of order card`);
                injectionSuccess = true;
            }

            if (!injectionSuccess) {
                console.error(`❌ Failed to inject buttons for order ${orderId} with any strategy`);
                return false;
            }

            // Track the injected buttons
            const buttonInfo = {
                hideDetailsLi: hideDetailsLi,
                hideDetailsBtn: hideDetailsBtn,
                orderCard: orderCard
            };
            this.injectedButtons.set(orderId, buttonInfo);
            console.log(`🔧 Stored button info for order ${orderId}:`, {
                hasHideDetailsLi: !!buttonInfo.hideDetailsLi,
                hasHideDetailsBtn: !!buttonInfo.hideDetailsBtn,
                hasOrderCard: !!buttonInfo.orderCard,
                totalInjectedButtons: this.injectedButtons.size
            });

            console.log(`✅ Successfully injected buttons for order ${orderId}`);
            return true;

        } catch (error) {
            console.error(`Error injecting buttons for order ${orderId}:`, error);
            return false;
        }
    }

    /**
     * Remove buttons from an order card
     * @param {string} orderId - The order ID
     * @returns {boolean} Success status
     */
    removeButtons(orderId) {
        try {
            const buttonInfo = this.injectedButtons.get(orderId);
            if (!buttonInfo) {
                return true; // No buttons to remove
            }

            // Remove the buttons from wherever they were injected
            buttonInfo.hideDetailsLi.remove();

            // Clean up any empty containers we might have created
            const deliveryBox = buttonInfo.orderCard.querySelector('.delivery-box');
            if (deliveryBox) {
                const actionContainer = deliveryBox.querySelector('.a-unordered-list.a-vertical.a-spacing-mini');
                if (actionContainer && actionContainer.children.length === 0) {
                    actionContainer.remove();
                }
            }

            this.injectedButtons.delete(orderId);
            console.log(`✅ Removed buttons for order ${orderId}`);
            return true;

        } catch (error) {
            console.error(`Error removing buttons for order ${orderId}:`, error);
            return false;
        }
    }

    /**
     * Start observing DOM changes for dynamic content
     * @param {Function} onOrderDetected - Callback when new orders are detected
     * @param {Function} onOrderRemoved - Callback when orders are removed
     */
    startObserving(onOrderDetected = null, onOrderRemoved = null) {
        if (this.isObserving) {
            return; // Already observing, no need to log
        }

        // Batch mutations for better performance
        let pendingMutations = [];
        let mutationTimeout = null;

        this.observer = new MutationObserver((mutations) => {
            // Add mutations to pending queue
            pendingMutations.push(...mutations);

            // Debounce processing to avoid excessive calls
            if (mutationTimeout) {
                clearTimeout(mutationTimeout);
            }

            mutationTimeout = setTimeout(() => {
                this.processMutations(pendingMutations, onOrderDetected, onOrderRemoved);
                pendingMutations = [];
            }, 50); // 50ms debounce
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false, // Don't watch attribute changes
            characterData: false // Don't watch text changes
        });

        this.isObserving = true;
    }

    /**
     * Process batched mutations for better performance
     * @param {Array} mutations - Array of mutation records
     * @param {Function} onOrderDetected - Callback for detected orders
     * @param {Function} onOrderRemoved - Callback for removed orders
     */
    processMutations(mutations, onOrderDetected, onOrderRemoved) {
        const addedNodes = new Set();
        const removedNodes = new Set();

        // Collect all nodes from mutations
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        addedNodes.add(node);
                    }
                });

                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        removedNodes.add(node);
                    }
                });
            }
        });

        // Process added nodes
        addedNodes.forEach((node) => {
            this.handleAddedNode(node, onOrderDetected);
        });

        // Process removed nodes
        removedNodes.forEach((node) => {
            this.handleRemovedNode(node, onOrderRemoved);
        });
    }

    /**
     * Stop observing DOM changes
     */
    stopObserving() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            this.isObserving = false;
            console.log('DOMManipulator: Stopped observing DOM changes');
        }
    }

    /**
     * Handle newly added DOM nodes
     * @param {Element} node - The added node
     * @param {Function} onOrderDetected - Callback for detected orders
     */
    handleAddedNode(node, onOrderDetected) {
        // Check if the node itself is an order card
        if (node.matches && node.matches('.order-card.js-order-card')) {
            if (onOrderDetected) {
                onOrderDetected(node);
            }
        }

        // Check for order cards within the added node
        const orderCards = node.querySelectorAll ? node.querySelectorAll('.order-card.js-order-card') : [];
        orderCards.forEach((orderCard) => {
            if (onOrderDetected) {
                onOrderDetected(orderCard);
            }
        });
    }

    /**
     * Handle removed DOM nodes
     * @param {Element} node - The removed node
     * @param {Function} onOrderRemoved - Callback for removed orders
     */
    handleRemovedNode(node, onOrderRemoved) {
        // Check if the node itself is an order card
        if (node.matches && node.matches('.order-card.js-order-card')) {
            const orderId = this.getOrderIdFromElement(node);
            if (orderId && onOrderRemoved) {
                onOrderRemoved(orderId, node);
            }
        }

        // Check for order cards within the removed node
        const orderCards = node.querySelectorAll ? node.querySelectorAll('.order-card.js-order-card') : [];
        orderCards.forEach((orderCard) => {
            const orderId = this.getOrderIdFromElement(orderCard);
            if (orderId && onOrderRemoved) {
                onOrderRemoved(orderId, orderCard);
            }
        });
    }

    /**
     * Extract order ID from an order element
     * @param {Element} orderElement - The order element
     * @returns {string|null} Order ID or null if not found
     */
    getOrderIdFromElement(orderElement) {
        console.log('🔍 Extracting order ID from element:', orderElement);
        console.log('🔍 Element HTML:', orderElement.outerHTML.substring(0, 500) + '...');

        // Try multiple selectors for order ID - more targeted approach
        const selectors = [
            '[data-order-id]',
            '[data-order-number]',
            '[data-order-reference]',
            '.order-id',
            '.order-number',
            '.order-reference',
            // Add the specific Amazon selector we found - target the span with just the order ID
            '.yohtmlc-order-id span.a-color-secondary[dir="ltr"]',
            '.yohtmlc-order-id span.a-color-secondary:last-child',
            '.yohtmlc-order-id',
            '[data-testid*="order-id"]',
            '[data-testid*="order-number"]',
            '[data-testid*="order-reference"]',
            // Look for elements that might contain order numbers
            'span[class*="order"]',
            'div[class*="order"]',
            'span[class*="number"]',
            'div[class*="number"]'
        ];

        console.log('🔍 Trying selectors:', selectors);

        for (const selector of selectors) {
            const element = orderElement.querySelector(selector);
            if (element) {
                console.log(`🔍 Found element with selector "${selector}":`, element);
                console.log(`🔍 Element text: "${element.textContent?.trim()}"`);
                console.log(`🔍 Element attributes:`, element.attributes);

                // Special handling for .yohtmlc-order-id - find the span with the actual order ID
                if (selector === '.yohtmlc-order-id' && element.classList.contains('yohtmlc-order-id')) {
                    console.log('🔍 Found yohtmlc-order-id div, searching for order ID span...');
                    const spans = element.querySelectorAll('span.a-color-secondary');
                    console.log(`🔍 Found ${spans.length} spans with class a-color-secondary`);

                    for (const span of spans) {
                        const spanText = span.textContent?.trim();
                        console.log(`🔍 Span text: "${spanText}"`);

                        // Skip spans that contain "Order #" or other non-order ID text
                        if (spanText && !spanText.includes('Order #') && !spanText.includes('Ordered') && !spanText.includes('Delivered')) {
                            // Check if this looks like an order ID
                            if (this.isValidOrderId(spanText)) {
                                console.log(`✅ Found valid order ID in span: "${spanText}"`);
                                return spanText;
                            }
                        }
                    }
                }

                const orderId = element.getAttribute('data-order-id') ||
                    element.getAttribute('data-order-number') ||
                    element.getAttribute('data-order-reference') ||
                    element.textContent?.trim();

                if (orderId) {
                    // Validate that this looks like an actual order ID, not a date or other text
                    if (this.isValidOrderId(orderId)) {
                        console.log(`✅ Found valid order ID: "${orderId}"`);
                        return orderId;
                    } else {
                        console.log(`⚠️ Found text but not a valid order ID: "${orderId}"`);
                    }
                }
            }
        }

        // If no order ID found with selectors, try to find it in the text content
        const allText = orderElement.textContent || '';
        console.log('🔍 Searching all text content for order patterns...');

        // Look for various order ID patterns
        const orderPatterns = [
            /ORDER\s*#?\s*([A-Z0-9\-]+)/i,
            /Order\s*#?\s*([A-Z0-9\-]+)/i,
            /([A-Z0-9]{3}-[A-Z0-9]{7}-[A-Z0-9]{7})/, // Amazon format: XXX-XXXXXXX-XXXXXXX
            /([0-9]{3}-[0-9]{7}-[0-9]{7})/, // Numeric format
            /([A-Z0-9]{10,})/, // Any long alphanumeric string
        ];

        for (const pattern of orderPatterns) {
            const match = allText.match(pattern);
            if (match && match[1]) {
                const potentialOrderId = match[1];
                if (this.isValidOrderId(potentialOrderId)) {
                    console.log(`✅ Found order ID via text pattern "${pattern.source}": "${potentialOrderId}"`);
                    return potentialOrderId;
                }
            }
        }

        // Special handling for the specific format we're seeing
        // Look for "Order #" followed by the order ID, handling whitespace and newlines
        const orderHashMatch = allText.match(/Order\s*#\s*([0-9]{3}-[0-9]{7}-[0-9]{7})/i);
        if (orderHashMatch && orderHashMatch[1]) {
            const orderId = orderHashMatch[1];
            if (this.isValidOrderId(orderId)) {
                console.log(`✅ Found order ID via "Order #" pattern: "${orderId}"`);
                return orderId;
            }
        }

        // Also try to find any 3-7-7 pattern that looks like an Amazon order ID
        const amazonPattern = allText.match(/([0-9]{3}-[0-9]{7}-[0-9]{7})/);
        if (amazonPattern && amazonPattern[1]) {
            const orderId = amazonPattern[1];
            if (this.isValidOrderId(orderId)) {
                console.log(`✅ Found order ID via Amazon pattern: "${orderId}"`);
                return orderId;
            }
        }

        console.log('❌ No valid order ID found with any selector or pattern');
        return null;
    }

    /**
     * Validate if a string looks like a valid order ID
     * @param {string} text - The text to validate
     * @returns {boolean} True if it looks like a valid order ID
     */
    isValidOrderId(text) {
        console.log(`🔍 Validating order ID: "${text}"`);

        if (!text || typeof text !== 'string') {
            console.log('❌ Rejected: not a string or empty');
            return false;
        }

        const trimmed = text.trim();
        console.log(`🔍 Trimmed text: "${trimmed}"`);

        // Reject common non-order ID text
        const rejectPatterns = [
            /^(Arriving|Delivered|Shipped|Ordered|Cancelled)/i,
            /^(January|February|March|April|May|June|July|August|September|October|November|December)/i,
            /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i,
            /^\d{1,2}\/\d{1,2}\/\d{4}$/, // Date format MM/DD/YYYY
            /^\d{1,2}\/\d{1,2}$/, // Date format MM/DD
            /^[A-Za-z\s]+$/ // Only letters and spaces (likely a description)
        ];

        for (const pattern of rejectPatterns) {
            if (pattern.test(trimmed)) {
                console.log(`❌ Rejected by pattern "${pattern.source}": "${trimmed}"`);
                return false;
            }
        }

        // Accept patterns that look like order IDs
        const acceptPatterns = [
            /^[A-Z0-9]{3}-[A-Z0-9]{7}-[A-Z0-9]{7}$/, // Amazon format
            /^[0-9]{3}-[0-9]{7}-[0-9]{7}$/, // Numeric format
            /^[A-Z0-9]{10,}$/, // Any long alphanumeric
            /^[A-Z0-9\-]{8,}$/ // General format with hyphens
        ];

        for (const pattern of acceptPatterns) {
            if (pattern.test(trimmed)) {
                console.log(`✅ Accepted by pattern "${pattern.source}": "${trimmed}"`);
                return true;
            }
        }

        console.log(`❌ Rejected: no accept pattern matched`);
        return false;
    }

    /**
     * Clean up all injected buttons and observers
     */
    cleanup() {
        this.stopObserving();

        // Remove all injected buttons
        for (const [orderId] of this.injectedButtons) {
            this.removeButtons(orderId);
        }

        // Remove all tagsSaved event listeners
        if (this.tagsSavedListeners) {
            for (const [orderId, listener] of this.tagsSavedListeners) {
                const eventName = `tagsSaved-${orderId}`;
                document.removeEventListener(eventName, listener);
                console.log(`🗑️ Cleaned up ${eventName} event listener for order ${orderId}`);
            }
            this.tagsSavedListeners.clear();
        }

        // Clean up tagging dialog manager if available
        if (window.taggingDialogManager && typeof window.taggingDialogManager.cleanup === 'function') {
            try {
                window.taggingDialogManager.cleanup();
                console.log('✅ TaggingDialogManager cleanup completed');
            } catch (error) {
                console.warn('⚠️ Error cleaning up TaggingDialogManager:', error);
            }
        }

        this.injectedButtons.clear();
        this.hiddenOrders.clear();
        this.orderUsernames.clear();

        console.log('DOMManipulator: Cleanup completed');
    }

    /**
     * Set username for a specific order
     * @param {string} orderId - Order ID
     * @param {string} username - Username for the order
     */
    setUsernameForOrder(orderId, username) {
        console.log(`🔧 setUsernameForOrder called: orderId="${orderId}", username="${username}"`);
        console.log(`🔧 Before setting - orderUsernames map:`, Array.from(this.orderUsernames.entries()));

        this.orderUsernames.set(orderId, username);

        console.log(`🔧 After setting - orderUsernames map:`, Array.from(this.orderUsernames.entries()));
        console.log(`🔧 Set username for order ${orderId}: ${username}`);
    }

    /**
     * Get username for a specific order
     * @param {string} orderId - Order ID
     * @returns {string} Username for the order or 'Unknown User' if not found
     */
    getUsernameForOrder(orderId) {
        const username = this.orderUsernames.get(orderId) || 'Unknown User';
        console.log(`🔍 getUsernameForOrder called: orderId="${orderId}", returned username="${username}"`);
        console.log(`🔍 Current orderUsernames map:`, Array.from(this.orderUsernames.entries()));
        return username;
    }

    /**
     * Restore all hidden orders to their original state
     * This is called during resync to clear all hidden order data
     */
    async restoreAllHiddenOrders() {
        try {
            console.log('🔄 Restoring all hidden orders to original state...');

            // Find all order cards that are currently hidden
            const hiddenOrderCards = document.querySelectorAll('.order-card.archivaz-details-hidden');
            console.log(`🔍 Found ${hiddenOrderCards.length} hidden order cards to restore`);

            let restoredCount = 0;

            // First, restore any currently hidden orders
            for (const orderCard of hiddenOrderCards) {
                try {
                    // Get the order ID for this card
                    const orderId = orderCard.querySelector('[data-archivaz-order-id]')?.getAttribute('data-archivaz-order-id');

                    // Remove hidden state from order card
                    orderCard.classList.remove('archivaz-details-hidden');
                    orderCard.style.opacity = '';

                    // Find and update the hide/show button
                    const button = orderCard.querySelector('button[data-archivaz-type="show-details"]');
                    if (button) {
                        button.textContent = 'Hide details';
                        button.setAttribute('data-archivaz-type', 'hide-details');
                        button.classList.remove('archivaz-details-hidden');
                    }

                    // Remove tags container if it exists
                    this.removeTagsFromDeliveryStatus(orderCard);

                    // Show all hidden detail elements
                    const hiddenElements = orderCard.querySelectorAll('.archivaz-hidden-details');
                    hiddenElements.forEach(element => {
                        // Remove hidden class
                        element.classList.remove('archivaz-hidden-details');

                        // Restore original display
                        const originalDisplay = element.getAttribute('data-archivaz-original-display');
                        if (originalDisplay) {
                            element.style.display = originalDisplay;
                            element.removeAttribute('data-archivaz-original-display');
                        } else {
                            element.style.display = '';
                        }
                    });

                    // Remove from hidden state tracking
                    if (orderId) {
                        this.hiddenOrders.delete(`${orderId}-details`);

                        // Also clear any stored tag data for this order
                        if (this.storage) {
                            try {
                                // Use the more thorough method to clear all order data
                                const clearedKeys = await this.storage.clearAllOrderData(orderId);
                                console.log(`🗑️ Cleared ${clearedKeys} storage keys for order ${orderId}`);
                            } catch (error) {
                                console.warn(`⚠️ Could not clear stored data for order ${orderId}:`, error);
                            }
                        }
                    }

                    restoredCount++;

                } catch (error) {
                    console.error('Error restoring individual order card:', error);
                }
            }

            // Now clear ALL stored data for any orders that might have data from previous sessions
            if (this.storage) {
                try {
                    console.log('🔄 Clearing all stored order data from previous sessions...');

                    // Get all Chrome storage data
                    const allData = await chrome.storage.local.get(null);
                    const keysToRemove = [];

                    // Find all keys that contain order data
                    for (const key of Object.keys(allData)) {
                        if (key.startsWith('amazon_archiver_hidden_order_')) {
                            keysToRemove.push(key);
                        }
                    }

                    // Remove all found keys
                    if (keysToRemove.length > 0) {
                        await chrome.storage.local.remove(keysToRemove);
                        console.log(`🗑️ Cleared ${keysToRemove.length} Chrome storage keys from previous sessions`);
                    }

                    // Also clear all order tags data from Chrome storage
                    try {
                        const allData = await chrome.storage.local.get(null);
                        const tagKeysToRemove = [];

                        for (const key of Object.keys(allData)) {
                            if (key.includes('order_tags_') && key.startsWith('amazon_archiver_')) {
                                tagKeysToRemove.push(key);
                            }
                        }

                        if (tagKeysToRemove.length > 0) {
                            await chrome.storage.local.remove(tagKeysToRemove);
                            console.log(`🗑️ Cleared ${tagKeysToRemove.length} order tag entries from Chrome storage`);
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not clear order tags from Chrome storage:', error);
                    }

                } catch (error) {
                    console.warn('⚠️ Could not clear all stored data:', error);
                }
            }

            console.log(`✅ Successfully restored ${restoredCount} hidden order cards and cleared all stored data`);
            return restoredCount;

        } catch (error) {
            console.error('❌ Error restoring all hidden orders:', error);
            throw error;
        }
    }

    /**
     * Restore hidden orders from storage and hide them on the page
     * @param {StorageManager} storage - The storage manager instance
     * @returns {number} Number of orders successfully restored
     */
    async restoreHiddenOrdersFromStorage(storage) {
        try {
            console.log('🔄 Restoring hidden orders from storage...');

            if (!storage) {
                console.warn('No storage manager provided for restoration');
                return 0;
            }

            // Get all hidden orders from storage
            const hiddenOrders = await storage.getAllHiddenOrders();
            console.log(`Found ${hiddenOrders.length} hidden orders in storage`);

            if (hiddenOrders.length === 0) {
                console.log('ℹ️ No hidden orders to restore');
                return 0;
            }

            let restoredCount = 0;

            // Process each hidden order
            for (const hiddenOrder of hiddenOrders) {
                try {
                    const { orderId, type, orderData, username } = hiddenOrder;
                    console.log(`🔄 Restoring hidden order ${orderId} (${type}) for user ${username}`);

                    // Find the order card on the page
                    const orderCard = this.findOrderCardById(orderId);

                    if (!orderCard) {
                        console.log(`⚠️ Order card for ${orderId} not found on page, skipping restoration`);
                        continue;
                    }

                    // Check if order is already hidden
                    if (orderCard.classList.contains('archivaz-details-hidden')) {
                        console.log(`ℹ️ Order ${orderId} is already hidden, skipping restoration`);
                        continue;
                    }

                    // Ensure buttons are injected for this order (needed for performHideOrderDetails)
                    if (!this.injectedButtons.has(orderId)) {
                        console.log(`🔧 Injecting buttons for order ${orderId} during restoration`);
                        const success = this.injectButtons(orderCard, orderId);
                        if (!success) {
                            console.warn(`⚠️ Failed to inject buttons for order ${orderId}, skipping restoration`);
                            continue;
                        }
                        console.log(`✅ Buttons successfully injected for order ${orderId} during restoration`);
                    } else {
                        console.log(`ℹ️ Buttons already exist for order ${orderId} during restoration`);
                    }

                    // Mark the order card as processed to prevent duplicate processing
                    if (!orderCard.hasAttribute('data-archivaz-processed')) {
                        orderCard.setAttribute('data-archivaz-processed', 'true');
                        console.log(`🔧 Marked order card as processed for order ${orderId} during restoration`);
                    }

                    // Get stored tags for this order
                    let tagData = null;
                    try {
                        tagData = await storage.getOrderTags(orderId);
                    } catch (error) {
                        console.warn(`⚠️ Could not retrieve tags for order ${orderId}:`, error);
                    }

                    // Hide the order details - pass the order card directly and include username
                    await this.performHideOrderDetailsWithCard(orderId, orderCard, tagData, username);

                    restoredCount++;
                    console.log(`✅ Successfully restored hidden order ${orderId}`);

                } catch (error) {
                    console.error(`❌ Error restoring hidden order ${hiddenOrder.orderId}:`, error);
                }
            }

            console.log(`✅ Restored ${restoredCount} hidden orders from storage`);
            return restoredCount;

        } catch (error) {
            console.error('❌ Error restoring hidden orders from storage:', error);
            return 0;
        }
    }

    /**
     * Find an order card element by order ID
     * @param {string} orderId - The order ID to search for
     * @returns {Element|null} The order card element or null if not found
     */
    findOrderCardById(orderId) {
        try {
            // Try multiple selectors to find the order card
            const selectors = [
                `.order-card[data-order-id*="${orderId}"]`,
                `.js-order-card[data-order-id*="${orderId}"]`,
                `[data-order-id*="${orderId}"]`,
                `.a-box-group:has([data-order-id*="${orderId}"])`,
                `.a-section:has([data-order-id*="${orderId}"])`
            ];

            for (const selector of selectors) {
                try {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element;
                    }
                } catch (error) {
                    // Some selectors might not be supported in all browsers
                    continue;
                }
            }

            // Fallback: search by text content
            const allOrderCards = document.querySelectorAll('.order-card, .js-order-card, .a-box-group, .a-section');
            for (const card of allOrderCards) {
                if (card.textContent.includes(orderId)) {
                    return card;
                }
            }

            return null;
        } catch (error) {
            console.error(`Error finding order card for ${orderId}:`, error);
            return null;
        }
    }

    /**
     * Handle tagging dialog cancellation or closure
     * @param {string} orderId - Order ID that was cancelled
     */
    handleTaggingDialogCancelled(orderId) {
        console.log(`🚫 Tagging dialog cancelled for order ${orderId}`);

        // Remove the event listener
        this.removeExistingTagsSavedListener(orderId);

        // Close the dialog using the manager if available
        if (window.taggingDialogManager && typeof window.taggingDialogManager.closeDialog === 'function') {
            try {
                window.taggingDialogManager.closeDialog(orderId);
                console.log(`✅ Tagging dialog closed for order ${orderId}`);
            } catch (error) {
                console.warn(`⚠️ Error closing tagging dialog for order ${orderId}:`, error);
            }
        }
    }

    /**
     * Show a user-friendly message when trying to open a dialog while another is open
     * @param {string} orderId - Order ID that was attempted to be opened
     */
    showDialogAlreadyOpenMessage(orderId) {
        // Create a temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'archivaz-dialog-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            max-width: 300px;
        `;
        messageDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">⚠️</span>
                <span>Please close the existing tagging dialog before opening another one.</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(messageDiv);

        // Remove after 4 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 4000);

        console.log(`📢 Shown dialog already open message for order ${orderId}`);
    }

}