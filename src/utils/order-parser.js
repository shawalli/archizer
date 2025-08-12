/**
 * Order Parser Utility
 * Handles parsing of Amazon order data from different page formats
 */

export class OrderParser {
    constructor() {
        // Selectors for different page formats
        this.selectors = {
            // Modern "your-account" format
            yourAccount: {
                orderCards: '.order-card.js-order-card',
                orderList: '.order-card__list',
                orderInfo: '.csd-encrypted-sensitive',
                orderNumber: '[data-order-id]',
                orderDate: '.order-date',
                orderTotal: '.order-total',
                orderStatus: '.order-status',
                orderItems: '.order-item'
            },
            // CSS format (similar to your-account)
            css: {
                orderCards: '.order-card.js-order-card',
                orderList: '.order-card__list',
                orderInfo: '.csd-encrypted-sensitive',
                orderNumber: '[data-order-id]',
                orderDate: '.order-date',
                orderTotal: '.order-total',
                orderStatus: '.order-status',
                orderItems: '.order-item'
            },
            // Legacy format
            legacy: {
                orderCards: '.order-card.js-order-card',
                orderList: '.order-card__list',
                orderInfo: '.csd-encrypted-sensitive',
                orderNumber: '[data-order-id]',
                orderDate: '.order-date',
                orderTotal: '.order-total',
                orderStatus: '.order-status',
                orderItems: '.order-item'
            }
        };

        // Dynamic content detection
        this.observer = null;
        this.isObserving = false;
        this.processedOrders = new Set();
        this.onOrderDetected = null;
        this.onOrderRemoved = null;
    }

    /**
     * Detect the page format based on URL and DOM structure
     * @returns {string} The detected page format
     */
    detectPageFormat() {
        const url = window.location.href;

        if (url.includes('/gp/your-account/order-history')) {
            return 'yourAccount';
        } else if (url.includes('/gp/css/order-history')) {
            return 'css';
        } else if (url.includes('/gp/legacy/order-history')) {
            return 'legacy';
        }

        return 'unknown';
    }

    /**
     * Get the appropriate selectors for the current page format
     * @returns {Object} Selectors for the current page format
     */
    getSelectors() {
        const format = this.detectPageFormat();
        return this.selectors[format] || this.selectors.yourAccount;
    }

    /**
     * Find all order cards on the current page
     * @returns {NodeList} List of order card elements
     */
    findOrderCards() {
        const selectors = this.getSelectors();
        return document.querySelectorAll(selectors.orderCards);
    }

    /**
     * Start observing for dynamic content changes
     * @param {Function} onOrderDetected - Callback when new orders are detected
     * @param {Function} onOrderRemoved - Callback when orders are removed
     */
    startObserving(onOrderDetected = null, onOrderRemoved = null) {
        if (this.isObserving) {
            console.log('OrderParser: Already observing for dynamic content');
            return;
        }

        this.onOrderDetected = onOrderDetected;
        this.onOrderRemoved = onOrderRemoved;

        try {
            // Create a MutationObserver to watch for DOM changes
            this.observer = new MutationObserver((mutations) => {
                this.handleDOMChanges(mutations);
            });

            // Start observing the document body for changes
            this.observer.observe(document.body, {
                childList: true,      // Watch for added/removed child nodes
                subtree: true,        // Watch the entire subtree
                attributes: false,    // Don't watch attribute changes
                characterData: false  // Don't watch text content changes
            });

            this.isObserving = true;
            console.log('OrderParser: Started observing for dynamic content changes');
        } catch (error) {
            console.error('OrderParser: Failed to start observing:', error);
        }
    }

    /**
     * Stop observing for dynamic content changes
     */
    stopObserving() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.isObserving = false;
        console.log('OrderParser: Stopped observing for dynamic content changes');
    }

    /**
     * Handle DOM changes detected by the MutationObserver
     * @param {Array} mutations - Array of mutation records
     */
    handleDOMChanges(mutations) {
        mutations.forEach((mutation) => {
            // Handle added nodes (new orders)
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.checkForNewOrders(node);
                    }
                });

                // Handle removed nodes (orders being removed)
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.checkForRemovedOrders(node);
                    }
                });
            }
        });
    }

    /**
     * Check if a newly added element contains new orders
     * @param {Element} element - The element to check
     */
    checkForNewOrders(element) {
        const selectors = this.getSelectors();

        // Check if the element itself is an order card
        if (element.matches && element.matches(selectors.orderCards)) {
            this.processNewOrder(element);
            return;
        }

        // Check if the element contains order cards
        const orderCards = element.querySelectorAll ? element.querySelectorAll(selectors.orderCards) : [];
        orderCards.forEach((orderCard) => {
            this.processNewOrder(orderCard);
        });
    }

    /**
     * Process a newly detected order
     * @param {Element} orderCard - The order card element
     */
    processNewOrder(orderCard) {
        // Generate a unique identifier for this order card
        const orderId = this.generateOrderElementId(orderCard);

        // Skip if we've already processed this order
        if (this.processedOrders.has(orderId)) {
            return;
        }

        // Parse the order data
        const orderData = this.parseOrderCard(orderCard);
        if (orderData) {
            // Mark as processed
            this.processedOrders.add(orderId);

            // Store the order data with the element ID
            orderData.elementId = orderId;

            console.log('OrderParser: New order detected:', orderData.orderNumber);

            // Call the callback if provided
            if (this.onOrderDetected && typeof this.onOrderDetected === 'function') {
                this.onOrderDetected(orderData, orderCard);
            }
        }
    }

    /**
     * Check if a removed element contained orders
     * @param {Element} element - The removed element
     */
    checkForRemovedOrders(element) {
        const selectors = this.getSelectors();

        // Check if the element itself was an order card
        if (element.matches && element.matches(selectors.orderCards)) {
            this.processRemovedOrder(element);
            return;
        }

        // Check if the element contained order cards
        const orderCards = element.querySelectorAll ? element.querySelectorAll(selectors.orderCards) : [];
        orderCards.forEach((orderCard) => {
            this.processRemovedOrder(orderCard);
        });
    }

    /**
     * Process a removed order
     * @param {Element} orderCard - The removed order card element
     */
    processRemovedOrder(orderCard) {
        const orderId = this.generateOrderElementId(orderCard);

        if (this.processedOrders.has(orderId)) {
            this.processedOrders.delete(orderId);
            console.log('OrderParser: Order removed:', orderId);

            // Call the callback if provided
            if (this.onOrderRemoved && typeof this.onOrderRemoved === 'function') {
                this.onOrderRemoved(orderId, orderCard);
            }
        }
    }

    /**
     * Generate a unique identifier for an order element
     * @param {Element} orderCard - The order card element
     * @returns {string} Unique identifier
     */
    generateOrderElementId(orderCard) {
        // Try to use existing data attributes first
        if (orderCard.dataset && orderCard.dataset.orderId) {
            return orderCard.dataset.orderId;
        }

        // Fall back to generating a hash based on content and position
        const content = orderCard.textContent || '';
        const position = this.getElementPosition(orderCard);
        return `order_${this.hashString(content + position)}`;
    }

    /**
     * Get the position of an element in the DOM
     * @param {Element} element - The element to get position for
     * @returns {string} Position string
     */
    getElementPosition(element) {
        const path = [];
        let current = element;

        while (current && current !== document.body) {
            const index = Array.from(current.parentNode.children).indexOf(current);
            path.unshift(`${current.tagName.toLowerCase()}:${index}`);
            current = current.parentNode;
        }

        return path.join('>');
    }

    /**
     * Simple string hashing function
     * @param {string} str - String to hash
     * @returns {string} Hash string
     */
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }

    /**
     * Parse order data from an order card element
     * @param {Element} orderCard - The order card DOM element
     * @returns {Object} Parsed order data
     */
    parseOrderCard(orderCard) {
        const selectors = this.getSelectors();

        try {
            // Extract order number (this will need to be updated based on actual HTML structure)
            const orderNumber = this.extractOrderNumber(orderCard, selectors);

            // Extract order date
            const orderDate = this.extractOrderDate(orderCard, selectors);

            // Extract order total
            const orderTotal = this.extractOrderTotal(orderCard, selectors);

            // Extract order status
            const orderStatus = this.extractOrderStatus(orderCard, selectors);

            // Extract order items
            const orderItems = this.extractOrderItems(orderCard, selectors);

            return {
                orderNumber,
                orderDate,
                orderTotal,
                orderStatus,
                orderItems,
                element: orderCard,
                format: this.detectPageFormat()
            };
        } catch (error) {
            console.error('Error parsing order card:', error);
            return null;
        }
    }

    /**
     * Extract order number from order card
     * @param {Element} orderCard - The order card element
     * @param {Object} selectors - Selectors for the current format
     * @returns {string} Order number
     */
    extractOrderNumber(orderCard, selectors) {
        try {
            // Look for order number in data attributes first
            if (orderCard.dataset && orderCard.dataset.orderId) {
                return orderCard.dataset.orderId;
            }

            // Look for order number in the encrypted sensitive data
            const encryptedElement = orderCard.querySelector('.csd-encrypted-sensitive');
            if (encryptedElement) {
                // The order number might be in the decrypted content
                // For now, we'll need to wait for decryption or look for alternative sources
                const orderNumberMatch = encryptedElement.textContent.match(/\b\d{3}-\d{7}-\d{7}\b/);
                if (orderNumberMatch) {
                    return orderNumberMatch[0];
                }
            }

            // Look for order number in any text content
            const orderNumberMatch = orderCard.textContent.match(/\b\d{3}-\d{7}-\d{7}\b/);
            if (orderNumberMatch) {
                return orderNumberMatch[0];
            }

            // Fallback to mock data if no order number found
            console.warn('OrderParser: Could not extract order number, using mock data');
            return 'N/A'; // Changed from mockData.sampleOrder.orderNumber
        } catch (error) {
            console.error('OrderParser: Error extracting order number:', error);
            return 'N/A'; // Changed from mockData.sampleOrder.orderNumber
        }
    }

    /**
     * Extract order date from order card
     * @param {Element} orderCard - The order card element
     * @param {Object} selectors - Selectors for the current format
     * @returns {string} Order date
     */
    extractOrderDate(orderCard, selectors) {
        try {
            // Look for date patterns in the order card
            const datePatterns = [
                /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i,
                /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/i,
                /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
                /\b\d{4}-\d{2}-\d{2}\b/,
                /\b(?:Ordered|Delivered|Shipped)\s+on\s+([^,\n]+)/i
            ];

            for (const pattern of datePatterns) {
                const match = orderCard.textContent.match(pattern);
                if (match) {
                    let dateStr = match[0];

                    // Clean up the date string
                    if (match[1]) {
                        dateStr = match[1].trim();
                    }

                    // Handle month names more carefully
                    if (/[A-Za-z]+\s+\d{1,2},?\s+\d{4}/.test(dateStr)) {
                        // Convert month names to numbers for better parsing
                        const monthMap = {
                            'january': '01', 'february': '02', 'march': '03', 'april': '04',
                            'may': '05', 'june': '06', 'july': '07', 'august': '08',
                            'september': '09', 'october': '10', 'november': '11', 'december': '12'
                        };

                        const parts = dateStr.toLowerCase().replace(',', '').split(/\s+/);
                        if (parts.length === 3) {
                            const month = monthMap[parts[0]];
                            const day = parts[1].padStart(2, '0');
                            const year = parts[2];

                            if (month && day && year) {
                                return `${year}-${month}-${day}`;
                            }
                        }
                    }

                    // Try to parse and format the date
                    const parsedDate = new Date(dateStr);
                    if (!isNaN(parsedDate.getTime())) {
                        return parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                    }
                }
            }

            // Look for date in specific elements
            const dateElements = orderCard.querySelectorAll('[class*="date"], [class*="Date"]');
            for (const element of dateElements) {
                const dateMatch = element.textContent.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                if (dateMatch) {
                    const parsedDate = new Date(dateMatch[0]);
                    if (!isNaN(parsedDate.getTime())) {
                        return parsedDate.toISOString().split('T')[0];
                    }
                }
            }

            // Fallback to mock data
            console.warn('OrderParser: Could not extract order date, using mock data');
            return 'N/A'; // Changed from mockData.sampleOrder.orderDate
        } catch (error) {
            console.error('OrderParser: Error extracting order date:', error);
            return 'N/A'; // Changed from mockData.sampleOrder.orderDate
        }
    }

    /**
     * Extract order total from order card
     * @param {Element} orderCard - The order card element
     * @param {Object} selectors - Selectors for the current format
     * @returns {string} Order total
     */
    extractOrderTotal(orderCard, selectors) {
        try {
            // Look for currency patterns
            const currencyPatterns = [
                /\$\d+\.\d{2}/,  // $XX.XX format
                /\$\d+,\d{3}\.\d{2}/,  // $X,XXX.XX format
                /\$\d+/,  // $XX format
                /Total[:\s]*(\$[\d,]+\.?\d*)/i,
                /Order Total[:\s]*(\$[\d,]+\.?\d*)/i,
                /Subtotal[:\s]*(\$[\d,]+\.?\d*)/i
            ];

            for (const pattern of currencyPatterns) {
                const match = orderCard.textContent.match(pattern);
                if (match) {
                    let total = match[0];
                    if (match[1]) {
                        total = match[1];
                    }

                    // Clean up the total string
                    total = total.trim();

                    // Validate it's a proper currency format
                    if (/^\$[\d,]+\.?\d*$/.test(total)) {
                        return total;
                    }
                }
            }

            // Look for total in specific elements
            const totalElements = orderCard.querySelectorAll('[class*="total"], [class*="Total"], [class*="price"], [class*="Price"]');
            for (const element of totalElements) {
                const totalMatch = element.textContent.match(/\$[\d,]+\.?\d*/);
                if (totalMatch) {
                    return totalMatch[0];
                }
            }

            // Fallback to mock data
            console.warn('OrderParser: Could not extract order total, using mock data');
            return 'N/A'; // Changed from mockData.sampleOrder.orderTotal
        } catch (error) {
            console.error('OrderParser: Error extracting order total:', error);
            return 'N/A'; // Changed from mockData.sampleOrder.orderTotal
        }
    }

    /**
     * Extract order status from order card
     * @param {Element} orderCard - The order card element
     * @param {Object} selectors - Selectors for the current format
     * @returns {string} Order status
     */
    extractOrderStatus(orderCard, selectors) {
        try {
            // Common order status keywords
            const statusKeywords = [
                'Delivered', 'Shipped', 'Ordered', 'Processing', 'Preparing',
                'Out for Delivery', 'In Transit', 'Cancelled', 'Returned',
                'Refunded', 'Pending', 'Confirmed', 'On Hold'
            ];

            // Look for status in the text content
            const textContent = orderCard.textContent.toLowerCase();
            for (const status of statusKeywords) {
                if (textContent.includes(status.toLowerCase())) {
                    return status;
                }
            }

            // Look for status in specific elements
            const statusElements = orderCard.querySelectorAll('[class*="status"], [class*="Status"]');
            for (const element of statusElements) {
                const elementText = element.textContent.trim();
                if (elementText && elementText.length < 50) { // Reasonable length for status
                    // Check if it matches any known status
                    for (const status of statusKeywords) {
                        if (elementText.toLowerCase().includes(status.toLowerCase())) {
                            return status;
                        }
                    }
                    // If no match but looks like a status, return it
                    if (elementText.length > 0 && elementText.length < 30) {
                        return elementText;
                    }
                }
            }

            // Look for status in button text or links
            const statusButtons = orderCard.querySelectorAll('button, a, [role="button"]');
            for (const button of statusButtons) {
                const buttonText = button.textContent.trim();
                if (buttonText && buttonText.length < 30) {
                    for (const status of statusKeywords) {
                        if (buttonText.toLowerCase().includes(status.toLowerCase())) {
                            return status;
                        }
                    }
                }
            }

            // Fallback to mock data
            console.warn('OrderParser: Could not extract order status, using mock data');
            return 'N/A'; // Changed from mockData.sampleOrder.orderStatus
        } catch (error) {
            console.error('OrderParser: Error extracting order status:', error);
            return 'N/A'; // Changed from mockData.sampleOrder.orderStatus
        }
    }

    /**
     * Extract order items from order card
     * @param {Element} orderCard - The order card element
     * @param {Object} selectors - Selectors for the current format
     * @returns {Array} Array of order items
     */
    extractOrderItems(orderCard, selectors) {
        try {
            const items = [];

            // Look for item elements
            const itemElements = orderCard.querySelectorAll('[class*="item"], [class*="Item"], [class*="product"], [class*="Product"]');

            if (itemElements.length > 0) {
                for (const itemElement of itemElements) {
                    const item = this.extractItemDetails(itemElement);
                    if (item && item.name) {
                        items.push(item);
                    }
                }
            }

            // If no items found, try to extract from text content
            if (items.length === 0) {
                const textContent = orderCard.textContent;

                // Look for product names followed by prices using regex
                const productPriceRegex = /([A-Z][a-z]+(?:\s+[A-Za-z0-9]+)*)\s+(\$[\d,]+\.?\d*)/g;
                let match;

                while ((match = productPriceRegex.exec(textContent)) !== null) {
                    const productName = match[1].trim();
                    const price = match[2];

                    // Filter out common non-product words
                    const skipWords = ['Order', 'Total', 'Date', 'Status', 'Delivered', 'Shipped', 'Amazon', 'Prime', 'on', 'January', '2025'];
                    if (!skipWords.some(skipWord => productName.toLowerCase().includes(skipWord.toLowerCase())) &&
                        productName.length > 3 && productName.length < 50) {

                        items.push({
                            name: productName,
                            price: price,
                            quantity: 1
                        });

                        // Limit to reasonable number of items
                        if (items.length >= 10) break;
                    }
                }
            }

            // If still no items, return mock data
            if (items.length === 0) {
                console.warn('OrderParser: Could not extract order items, using mock data');
                return []; // Changed from mockData.sampleOrder.orderItems
            }

            return items;
        } catch (error) {
            console.error('OrderParser: Error extracting order items:', error);
            return []; // Changed from mockData.sampleOrder.orderItems
        }
    }

    /**
     * Extract details from an individual item element
     * @param {Element} itemElement - The item element
     * @returns {Object} Item details
     */
    extractItemDetails(itemElement) {
        try {
            const item = {};

            // Extract item name
            const nameElement = itemElement.querySelector('[class*="name"], [class*="title"], [class*="Name"], [class*="Title"]');
            if (nameElement) {
                item.name = nameElement.textContent.trim();
            } else {
                // Try to find name in the item element itself
                const textContent = itemElement.textContent;
                const nameMatch = textContent.match(/^([^$\n]+?)(?:\$|\n|$)/);
                if (nameMatch) {
                    item.name = nameMatch[1].trim();
                }
            }

            // Extract item price
            const priceElement = itemElement.querySelector('[class*="price"], [class*="Price"], [class*="cost"], [class*="Cost"]');
            if (priceElement) {
                const priceMatch = priceElement.textContent.match(/\$[\d,]+\.?\d*/);
                if (priceMatch) {
                    item.price = priceMatch[0];
                }
            } else {
                // Look for price in the item element
                const priceMatch = itemElement.textContent.match(/\$[\d,]+\.?\d*/);
                if (priceMatch) {
                    item.price = priceMatch[0];
                }
            }

            // Extract quantity (default to 1)
            const quantityElement = itemElement.querySelector('[class*="quantity"], [class*="Quantity"], [class*="qty"], [class*="Qty"]');
            if (quantityElement) {
                const qtyMatch = quantityElement.textContent.match(/\d+/);
                if (qtyMatch) {
                    item.quantity = parseInt(qtyMatch[0], 10);
                }
            }

            if (!item.quantity) {
                item.quantity = 1;
            }

            return item;
        } catch (error) {
            console.error('OrderParser: Error extracting item details:', error);
            return null;
        }
    }

    /**
     * Parse all orders on the current page
     * @returns {Array} Array of parsed order data
     */
    parseAllOrders() {
        const orderCards = this.findOrderCards();
        const orders = [];

        orderCards.forEach((card, index) => {
            const orderData = this.parseOrderCard(card);
            if (orderData) {
                orders.push(orderData);
            }
        });

        return orders;
    }

    /**
     * Validate if an order number matches the expected format
     * @param {string} orderNumber - Order number to validate
     * @returns {boolean} True if valid
     */
    validateOrderNumber(orderNumber) {
        // Amazon order numbers typically follow pattern: XXX-XXXXXXX-XXXXXXX
        const orderNumberPattern = /^\d{3}-\d{7}-\d{7}$/;
        return orderNumberPattern.test(orderNumber);
    }

    /**
     * Get the current observation status
     * @returns {boolean} True if currently observing
     */
    isObservingForChanges() {
        return this.isObserving;
    }

    /**
     * Get the number of processed orders
     * @returns {number} Count of processed orders
     */
    getProcessedOrderCount() {
        return this.processedOrders.size;
    }

    /**
     * Clear the processed orders cache
     */
    clearProcessedOrders() {
        this.processedOrders.clear();
        console.log('OrderParser: Cleared processed orders cache');
    }
}
