/**
 * DOM Manipulation Utilities
 * Handles button injection, order hiding/showing, and dynamic content management
 */

export class DOMManipulator {
    constructor() {
        this.injectedButtons = new Map(); // Track injected buttons by order ID
        this.hiddenOrders = new Set(); // Track hidden order IDs
        this.observer = null;
        this.isObserving = false;
        this.orderParser = null; // Reference to OrderParser for data extraction
        this.onOrderHidden = null; // Callback when orders are hidden
        this.onOrderShown = null; // Callback when orders are shown
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
            // Create container for the buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'archivaz-button-container';
            buttonContainer.style.cssText = `
                margin-top: 8px;
                padding: 8px 0;
                border-top: 1px solid #e7e7e7;
            `;

            // Create unordered list for button layout
            const buttonList = document.createElement('ul');
            buttonList.className = 'a-unordered-list a-vertical a-spacing-mini';
            buttonList.style.cssText = `
                margin: 0;
                padding: 0;
                list-style: none;
            `;

            // Create "Hide details" button
            const hideDetailsLi = document.createElement('li');
            hideDetailsLi.className = 'a-list-item';
            hideDetailsLi.style.cssText = 'margin-bottom: 4px;';

            const hideDetailsBtn = document.createElement('button');
            hideDetailsBtn.className = 'a-button a-button-normal a-spacing-mini a-button-base';
            hideDetailsBtn.type = 'button'; // Prevent form submission
            hideDetailsBtn.setAttribute('data-archivaz-type', 'hide-details');
            hideDetailsBtn.setAttribute('data-archivaz-order-id', orderId);
            hideDetailsBtn.setAttribute('aria-label', `Hide details for order ${orderId}`);
            hideDetailsBtn.style.cssText = `
                width: 100%;
                background-color: #7759b9;
                border-color: #888c8c;
                color: white;
                font-size: 12px;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            hideDetailsBtn.textContent = 'Hide details';

            // Add hover effects for hide details button
            hideDetailsBtn.addEventListener('mouseenter', () => {
                hideDetailsBtn.style.backgroundColor = '#8a6bb9';
                hideDetailsBtn.style.borderColor = '#7759b9';
            });
            hideDetailsBtn.addEventListener('mouseleave', () => {
                hideDetailsBtn.style.backgroundColor = '#7759b9';
                hideDetailsBtn.style.borderColor = '#888c8c';
            });

            hideDetailsLi.appendChild(hideDetailsBtn);

            // Create "Hide order" button with tagging option
            const hideOrderLi = document.createElement('li');
            hideOrderLi.className = 'a-list-item';
            hideOrderLi.style.cssText = 'margin-bottom: 4px;';

            const hideOrderBtn = document.createElement('button');
            hideOrderBtn.className = 'a-button a-button-normal a-spacing-mini a-button-base';
            hideOrderBtn.type = 'button'; // Prevent form submission
            hideOrderBtn.setAttribute('data-archivaz-type', 'hide-order');
            hideOrderBtn.setAttribute('data-archivaz-order-id', orderId);
            hideOrderBtn.setAttribute('aria-label', `Hide entire order ${orderId}`);
            hideOrderBtn.style.cssText = `
                width: 100%;
                background-color: #3665c3;
                border-color: #888c8c;
                color: white;
                font-size: 12px;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            hideOrderBtn.textContent = 'Hide order';

            // Add hover effects for hide order button
            hideOrderBtn.addEventListener('mouseenter', () => {
                hideOrderBtn.style.backgroundColor = '#4a7bc3';
                hideOrderBtn.style.borderColor = '#3665c3';
            });
            hideOrderBtn.addEventListener('mouseleave', () => {
                hideOrderBtn.style.backgroundColor = '#3665c3';
                hideOrderBtn.style.borderColor = '#888c8c';
            });

            hideOrderLi.appendChild(hideOrderBtn);



            // Add all buttons to the list
            buttonList.appendChild(hideDetailsLi);
            buttonList.appendChild(hideOrderLi);

            // Add the list to the container
            buttonContainer.appendChild(buttonList);

            // Add click event listeners
            hideDetailsBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const buttonType = hideDetailsBtn.getAttribute('data-archivaz-type');
                this.handleButtonClick(buttonType, orderId, hideDetailsBtn);
            });

            hideOrderBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const buttonType = hideOrderBtn.getAttribute('data-archivaz-type');
                this.handleButtonClick(buttonType, orderId, hideOrderBtn);
            });



            return {
                buttonContainer,
                hideDetailsLi,
                hideOrderLi,
                hideDetailsBtn,
                hideOrderBtn
            };
        } catch (error) {
            console.error(`Error creating buttons for order ${orderId}:`, error);
            return null;
        }
    }

    /**
     * Handle button click events for different button types
     * @param {string} buttonType - Type of button clicked
     * @param {string} orderId - Order ID associated with the button
     * @param {Element} button - The button element that was clicked
     */
    handleButtonClick(buttonType, orderId, button) {
        try {
            console.log(`Button clicked: ${buttonType} for order ${orderId}`);

            switch (buttonType) {
                case 'hide-details':
                    this.hideOrderDetails(orderId, button);
                    break;
                case 'hide-order':
                    this.hideEntireOrder(orderId, button);
                    break;

                case 'show-details':
                    this.showOrderDetails(orderId, button);
                    break;
                case 'show-order':
                    this.showEntireOrder(orderId, button);
                    break;
                default:
                    console.warn(`Unknown button type: ${buttonType}`);
            }
        } catch (error) {
            console.error(`Error handling button click for ${buttonType} on order ${orderId}:`, error);
        }
    }

    /**
     * Show the tagging dialog for an order
     * @param {string} orderId - Order ID to tag
     * @param {Element} button - The button that was clicked
     */
    showTaggingDialog(orderId, button) {
        try {
            // Get order data from the OrderParser
            const orderData = this.getOrderData(orderId);
            if (!orderData) {
                console.warn(`No order data found for order ${orderId}`);
                return;
            }

            // Check if tagging dialog exists and is available
            if (typeof window.TaggingDialog === 'undefined') {
                console.warn('TaggingDialog not available, falling back to regular hide');
                this.hideEntireOrder(orderId, button);
                return;
            }

            // Get the global tagging dialog instance
            const taggingDialog = window.taggingDialog;
            if (!taggingDialog) {
                console.warn('TaggingDialog instance not available, falling back to regular hide');
                this.hideEntireOrder(orderId, button);
                return;
            }

            // Prepare order data for the dialog
            const dialogData = {
                orderNumber: orderId,
                orderDate: orderData.orderDate || 'Unknown',
                tags: orderData.tags || [],
                notes: orderData.notes || ''
            };

            // Open the tagging dialog
            taggingDialog.open(dialogData);

            // Listen for tags saved event
            const handleTagsSaved = (event) => {
                const tagData = event.detail;
                console.log('Tags saved for order:', tagData);

                // Store the tag data
                this.storeOrderTags(orderId, tagData);

                // Now hide the order with the tags
                this.hideEntireOrder(orderId, button, tagData);

                // Remove the event listener
                document.removeEventListener('tagsSaved', handleTagsSaved);
            };

            document.addEventListener('tagsSaved', handleTagsSaved);

        } catch (error) {
            console.error(`Error showing tagging dialog for order ${orderId}:`, error);
            // Fallback to regular hide
            this.hideEntireOrder(orderId, button);
        }
    }

    /**
     * Show tagging dialog for hiding operations (details or entire order)
     * @param {string} orderId - Order ID to hide
     * @param {Element} button - The button that was clicked
     * @param {string} hideType - Type of hiding operation ('details' or 'order')
     */
    showTaggingDialogForHide(orderId, button, hideType) {
        try {
            console.log(`🔍 showTaggingDialogForHide called for order ${orderId}, hideType: ${hideType}`);

            // Get order data from the OrderParser
            const orderData = this.getOrderData(orderId);
            if (!orderData) {
                console.warn(`No order data found for order ${orderId}`);
                return;
            }

            // Get the global tagging dialog instance
            const taggingDialog = window.taggingDialog;
            if (!taggingDialog) {
                console.warn('TaggingDialog instance not available - popup cannot be shown');
                return;
            }

            // Prepare order data for the dialog
            const dialogData = {
                orderNumber: orderId,
                orderDate: orderData.orderDate || 'Unknown',
                tags: orderData.tags || [],
                notes: orderData.notes || ''
            };

            // Find the order card that contains this button
            const orderCard = button.closest('.order-card, .js-order-card, [data-order-id]');
            if (!orderCard) {
                console.warn('Could not find order card for button');
                return;
            }

            // Open the tagging dialog with order card reference
            taggingDialog.open(dialogData, orderCard);

            // Listen for tags saved event
            const handleTagsSaved = (event) => {
                const tagData = event.detail;
                console.log('Tags saved for order:', tagData);

                // Store the tag data
                this.storeOrderTags(orderId, tagData);

                // Now perform the hide operation with the tags
                this.performHideOperation(orderId, button, hideType, tagData);

                // Remove the event listener
                document.removeEventListener('tagsSaved', handleTagsSaved);
            };

            document.addEventListener('tagsSaved', handleTagsSaved);

        } catch (error) {
            console.error(`Error showing tagging dialog for order ${orderId}:`, error);
            // Don't fallback to hiding - just log the error
        }
    }

    /**
     * Perform the actual hide operation after tagging
     * @param {string} orderId - Order ID to hide
     * @param {Element} button - The button that was clicked
     * @param {string} hideType - Type of hiding operation ('details' or 'order')
     * @param {Object} tagData - Optional tag data if order was tagged before hiding
     */
    performHideOperation(orderId, button, hideType, tagData = null) {
        try {
            switch (hideType) {
                case 'details':
                    this.performHideOrderDetails(orderId, button, tagData);
                    break;
                case 'order':
                    this.performHideEntireOrder(orderId, button, tagData);
                    break;
                default:
                    console.warn(`Unknown hide type: ${hideType}`);
            }
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

            for (const orderCard of orderCards) {
                console.log(`🔍 Processing order card:`, orderCard);
                const extractedData = this.orderParser.parseOrderCard(orderCard);
                console.log(`🔍 Extracted data:`, extractedData);

                if (extractedData && extractedData.orderNumber === orderId) {
                    console.log(`✅ Found matching order data for ${orderId}`);
                    return extractedData;
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
     */
    storeOrderTags(orderId, tagData) {
        try {
            // Store in localStorage for now (will be replaced with proper storage manager)
            const storageKey = `archivaz_order_tags_${orderId}`;
            localStorage.setItem(storageKey, JSON.stringify(tagData));
            console.log(`Stored tags for order ${orderId}:`, tagData);
        } catch (error) {
            console.error(`Error storing tags for order ${orderId}:`, error);
        }
    }

    /**
     * Show tagging dialog for hiding order details
     * @param {string} orderId - Order ID to hide details for
     * @param {Element} button - The button that was clicked
     */
    hideOrderDetails(orderId, button) {
        try {
            // Show tagging dialog first, then hide details after tags are saved
            this.showTaggingDialogForHide(orderId, button, 'details');
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
        try {
            const buttonInfo = this.injectedButtons.get(orderId);
            if (!buttonInfo) {
                console.warn(`No button info found for order ${orderId}`);
                return;
            }

            const orderCard = buttonInfo.orderCard;

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
                    elements.forEach(element => {
                        // Skip if already hidden or if it's our injected buttons
                        if (element.classList.contains('archivaz-hidden-details') ||
                            element.closest('.archivaz-button-container')) {
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

            orderItemElements.forEach((element) => {
                // Skip if already hidden or if it's our injected buttons
                if (element.classList.contains('archivaz-hidden-details') ||
                    element.closest('.archivaz-button-container')) {
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
                }
            });

            // Special handling: Preserve the delivery status column (left column) in the delivery-box
            const deliveryBox = orderCard.querySelector('.delivery-box');
            if (deliveryBox) {
                const leftColumn = deliveryBox.querySelector('.a-fixed-right-grid-col.a-col-left');
                if (leftColumn && leftColumn.classList.contains('archivaz-hidden-details')) {
                    // Restore the left column if it was hidden - it contains essential delivery status
                    leftColumn.classList.remove('archivaz-hidden-details');
                    leftColumn.style.display = leftColumn.getAttribute('data-archivaz-original-display') || 'block';

                    // Remove from hidden elements array
                    const index = hiddenElements.indexOf(leftColumn);
                    if (index > -1) {
                        hiddenElements.splice(index, 1);
                        totalHidden--;
                    }

                    // Add tags below the delivery status if available
                    if (tagData && tagData.tags && tagData.tags.length > 0) {
                        this.addTagsToDeliveryStatus(leftColumn, tagData.tags);
                    }
                }
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

            console.log(`Hidden ${totalHidden} detail elements for order ${orderId}`);

        } catch (error) {
            console.error(`Error hiding details for order ${orderId}:`, error);
        }
    }

    /**
     * Hide additional order elements that aren't easily targeted by CSS selectors
     * @param {Element} orderCard - The order card element
     * @returns {Array} Array of hidden elements for restoration
     */
    hideAdditionalOrderElements(orderCard) {
        const hiddenElements = [];

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

        return hiddenElements;
    }

    /**
     * Add tags below the delivery status in the preserved left column
     * @param {Element} leftColumn - The left column element containing delivery status
     * @param {Array} tags - Array of tag strings to display
     */
    addTagsToDeliveryStatus(leftColumn, tags) {
        try {
            // Check if tags are already displayed
            if (leftColumn.querySelector('.archivaz-delivery-status-tags')) {
                return;
            }

            // Create tags container
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'archivaz-delivery-status-tags';
            tagsContainer.style.cssText = `
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #e7e7e7;
            `;

            // Create tags label
            const tagsLabel = document.createElement('span');
            tagsLabel.className = 'archivaz-tags-label';
            tagsLabel.textContent = 'Tags: ';
            tagsLabel.style.cssText = `
                font-size: 12px;
                color: #666;
                font-weight: 500;
                margin-right: 6px;
            `;

            tagsContainer.appendChild(tagsLabel);

            // Create tags list
            const tagsList = document.createElement('div');
            tagsList.className = 'archivaz-tags-list';
            tagsList.style.cssText = `
                display: inline-block;
                margin-top: 4px;
            `;

            // Add each tag
            tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'archivaz-delivery-status-tag';
                tagElement.textContent = tag;
                tagElement.style.cssText = `
                    display: inline-block;
                    background: #e7f3ff;
                    color: #0066cc;
                    padding: 2px 6px;
                    margin: 2px 4px 2px 0;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 500;
                `;
                tagsList.appendChild(tagElement);
            });

            tagsContainer.appendChild(tagsList);

            // Insert tags after the last row in the left column
            const lastRow = leftColumn.querySelector('.a-row:last-child');
            if (lastRow) {
                lastRow.parentNode.insertBefore(tagsContainer, lastRow.nextSibling);
            } else {
                // Fallback: append to the end of the left column
                leftColumn.appendChild(tagsContainer);
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

        textNodes.forEach(textNode => {
            const text = textNode.textContent.trim();
            if (text && textToFind.some(searchText => text.includes(searchText))) {
                const parentElement = textNode.parentElement;
                if (parentElement && !parentElement.classList.contains('archivaz-hidden-details')) {
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

        allButtons.forEach(button => {
            // Skip if it's our extension button
            if (button.hasAttribute('data-archivaz-type')) {
                return;
            }

            // Skip if already hidden
            if (button.classList.contains('archivaz-hidden-details')) {
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
                console.log(`Hidden button: "${buttonText}" with classes: ${button.className}`);
            }
        });

        // Also look for button containers that might contain action buttons
        const buttonContainers = container.querySelectorAll('.a-box-group, .order-actions, .a-unordered-list, .a-fixed-right-grid-col');
        buttonContainers.forEach(container => {
            // Skip containers that contain essential order header information
            if (this.isEssentialOrderHeader(container)) {
                return;
            }

            // Only hide containers that don't contain our extension buttons
            if (!container.querySelector('[data-archivaz-type]')) {
                const buttonsInContainer = container.querySelectorAll('button, .a-button, .a-button-normal, .a-link-normal');
                let hasVisibleButtons = false;

                buttonsInContainer.forEach(btn => {
                    if (!btn.classList.contains('archivaz-hidden-details')) {
                        hasVisibleButtons = true;
                    }
                });

                // If the container only has action buttons (no extension buttons), hide it
                if (hasVisibleButtons) {
                    const originalDisplay = window.getComputedStyle(container).display;
                    container.setAttribute('data-archivaz-original-display', originalDisplay);

                    container.classList.add('archivaz-hidden-details');
                    container.style.display = 'none';

                    hiddenElements.push(container);
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
     * Show tagging dialog for hiding entire order
     * @param {string} orderId - Order ID to hide
     * @param {Element} button - The button that was clicked
     */
    hideEntireOrder(orderId, button, tagData = null) {
        try {
            // Show tagging dialog first, then hide order after tags are saved
            this.showTaggingDialogForHide(orderId, button, 'order');
        } catch (error) {
            console.error(`Error showing tagging dialog for order ${orderId}:`, error);
        }
    }

    /**
     * Actually hide entire order - called after tagging
     * @param {string} orderId - Order ID to hide
     * @param {Element} button - The button that was clicked
     * @param {Object} tagData - Optional tag data if order was tagged before hiding
     */
    performHideEntireOrder(orderId, button, tagData = null) {
        try {
            const buttonInfo = this.injectedButtons.get(orderId);
            if (!buttonInfo) {
                console.warn(`No button info found for order ${orderId}`);
                return;
            }

            const orderCard = buttonInfo.orderCard;

            // Store original display value for restoration
            const originalDisplay = window.getComputedStyle(orderCard).display;
            orderCard.setAttribute('data-archivaz-original-display', originalDisplay);

            // Store tag data if provided
            if (tagData) {
                orderCard.setAttribute('data-archivaz-tags', JSON.stringify(tagData));
                console.log(`Stored tag data for order ${orderId}:`, tagData);
            }

            // Hide the entire order card with smooth transition
            orderCard.classList.add('archivaz-order-hidden');
            orderCard.style.display = 'none';

            // Add a placeholder or indicator that an order was hidden
            this.addHiddenOrderIndicator(orderCard, orderId, tagData);

            // Update button text and type
            button.textContent = 'Show order';
            button.setAttribute('data-archivaz-type', 'show-order');
            button.classList.add('archivaz-order-hidden');

            // Track hidden state
            this.hiddenOrders.add(`${orderId}-order`);

            // Notify callback
            if (this.onOrderHidden) {
                const orderData = this.extractOrderData(orderCard, orderId);
                // Include tag data in the callback
                if (tagData) {
                    orderData.tags = tagData.tags;
                    orderData.notes = tagData.notes;
                }
                this.onOrderHidden(orderId, 'order', orderData);
            }

            console.log(`Hidden entire order ${orderId}${tagData ? ' with tags' : ''}`);

        } catch (error) {
            console.error(`Error hiding order ${orderId}:`, error);
        }
    }

    /**
     * Add a visual indicator that an order was hidden
     * @param {Element} orderCard - The order card element
     * @param {string} orderId - The order ID
     * @param {Object} tagData - Optional tag data to display
     */
    addHiddenOrderIndicator(orderCard, orderId, tagData = null) {
        try {
            // Create a hidden order indicator
            const indicator = document.createElement('div');
            indicator.className = 'archivaz-hidden-order-indicator';
            indicator.setAttribute('data-archivaz-order-id', orderId);

            // Create indicator content with optional tag display
            let indicatorContent = `
                <div class="archivaz-hidden-order-content">
                    <span class="archivaz-hidden-order-icon">📦</span>
                    <span class="archivaz-hidden-order-text">Order ${orderId} is hidden</span>
            `;

            // Add tag information if available
            if (tagData && tagData.tags && tagData.tags.length > 0) {
                indicatorContent += `
                    <div class="archivaz-hidden-order-tags">
                        <span class="archivaz-tags-label">Tags:</span>
                        <div class="archivaz-tags-list">
                `;

                tagData.tags.forEach(tag => {
                    indicatorContent += `<span class="archivaz-tag">${this.escapeHtml(tag)}</span>`;
                });

                indicatorContent += `
                        </div>
                    </div>
                `;
            }

            // Add notes if available
            if (tagData && tagData.notes && tagData.notes.trim()) {
                indicatorContent += `
                    <div class="archivaz-hidden-order-notes">
                        <span class="archivaz-notes-label">Notes:</span>
                        <span class="archivaz-notes-text">${this.escapeHtml(tagData.notes)}</span>
                    </div>
                `;
            }

            indicatorContent += `
                    <button class="archivaz-show-order-btn" data-archivaz-order-id="${orderId}">
                        Show Order
                    </button>
                </div>
            `;

            indicator.innerHTML = indicatorContent;

            // Add click handler to the show order button
            const showOrderBtn = indicator.querySelector('.archivaz-show-order-btn');
            showOrderBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.showEntireOrder(orderId, showOrderBtn);
            });

            // Insert the indicator after the order card
            orderCard.parentNode.insertBefore(indicator, orderCard.nextSibling);

            // Store reference to the indicator
            const buttonInfo = this.injectedButtons.get(orderId);
            if (buttonInfo) {
                buttonInfo.hiddenOrderIndicator = indicator;
            }

        } catch (error) {
            console.error(`Error adding hidden order indicator for ${orderId}:`, error);
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
     * Show entire order that was previously hidden
     * @param {string} orderId - Order ID to show
     * @param {Element} button - The button that was clicked
     */
    showEntireOrder(orderId, button) {
        try {
            const buttonInfo = this.injectedButtons.get(orderId);
            if (!buttonInfo) {
                console.warn(`No button info found for order ${orderId}`);
                return;
            }

            const orderCard = buttonInfo.orderCard;

            // Restore original display value
            const originalDisplay = orderCard.getAttribute('data-archivaz-original-display');
            orderCard.style.display = originalDisplay || '';

            // Show the order card
            orderCard.classList.remove('archivaz-order-hidden');
            orderCard.removeAttribute('data-archivaz-original-display');

            // Remove the hidden order indicator if it exists
            if (buttonInfo.hiddenOrderIndicator) {
                buttonInfo.hiddenOrderIndicator.remove();
                buttonInfo.hiddenOrderIndicator = null;
            }

            // Restore the original hide order button (not the indicator button)
            if (buttonInfo.hideOrderBtn) {
                buttonInfo.hideOrderBtn.textContent = 'Hide order';
                buttonInfo.hideOrderBtn.setAttribute('data-archivaz-type', 'hide-order');
                buttonInfo.hideOrderBtn.classList.remove('archivaz-order-hidden');
            }

            // Remove from hidden state tracking
            this.hiddenOrders.delete(`${orderId}-order`);

            // Notify callback
            if (this.onOrderShown) {
                const orderData = this.extractOrderData(orderCard, orderId);
                this.onOrderShown(orderId, 'order', orderData);
            }

            console.log(`Showed order ${orderId}`);

        } catch (error) {
            console.error(`Error showing order ${orderId}:`, error);
        }
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
     * Check if entire order is hidden
     * @param {string} orderId - Order ID to check
     * @returns {boolean} True if order is hidden
     */
    isOrderHidden(orderId) {
        return this.hiddenOrders.has(`${orderId}-order`);
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

            // Create buttons
            const { hideDetailsLi, hideOrderLi, hideDetailsBtn, hideOrderBtn } = this.createButtons(orderId);

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
                    container.appendChild(hideOrderLi);
                    console.log(`✅ Successfully injected buttons for order ${orderId} into ${strategy.container}`);
                    injectionSuccess = true;
                }
            }

            // Try fallback container if primary failed
            if (!injectionSuccess && strategy.fallback) {
                const fallbackContainer = orderCard.querySelector(strategy.fallback);
                if (fallbackContainer) {
                    fallbackContainer.appendChild(hideDetailsLi);
                    fallbackContainer.appendChild(hideOrderLi);
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
                    actionContainer.appendChild(hideOrderLi);
                    console.log(`✅ Successfully injected buttons for order ${orderId} into .delivery-box actions`);
                    injectionSuccess = true;
                }
            }

            // Strategy 4: Fallback - append to the end of the order card
            if (!injectionSuccess) {
                orderCard.appendChild(hideDetailsLi);
                orderCard.appendChild(hideOrderLi);
                console.log(`🔍 Fallback: injected buttons for order ${orderId} to end of order card`);
                injectionSuccess = true;
            }

            if (!injectionSuccess) {
                console.error(`❌ Failed to inject buttons for order ${orderId} with any strategy`);
                return false;
            }

            // Track the injected buttons
            this.injectedButtons.set(orderId, {
                hideDetailsLi: hideDetailsLi,
                hideOrderLi: hideOrderLi,
                hideDetailsBtn: hideDetailsBtn,
                hideOrderBtn: hideOrderBtn,
                orderCard: orderCard
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
            buttonInfo.hideOrderLi.remove();

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
            console.log('DOMManipulator: Already observing for dynamic content');
            return;
        }

        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.handleAddedNode(node, onOrderDetected);
                        }
                    });

                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.handleRemovedNode(node, onOrderRemoved);
                        }
                    });
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.isObserving = true;
        console.log('DOMManipulator: Started observing DOM changes');
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

        this.injectedButtons.clear();
        this.hiddenOrders.clear();

        console.log('DOMManipulator: Cleanup completed');
    }
}
