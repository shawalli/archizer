/**
 * DOM Utility Functions
 * Consolidates common DOM manipulation patterns to reduce code duplication
 */

/**
 * Create a DOM element with common attributes and styling
 * @param {string} tagName - HTML tag name
 * @param {Object} options - Element configuration options
 * @param {string} options.className - CSS class names
 * @param {string} options.textContent - Text content
 * @param {string} options.innerHTML - HTML content
 * @param {Object} options.attributes - HTML attributes
 * @param {Object} options.styles - CSS styles
 * @param {string} options.id - Element ID
 * @returns {HTMLElement} The created element
 */
export function createElement(tagName, options = {}) {
    const element = document.createElement(tagName);

    if (options.className) {
        element.className = options.className;
    }

    if (options.textContent) {
        element.textContent = options.textContent;
    }

    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }

    if (options.id) {
        element.id = options.id;
    }

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    if (options.styles) {
        Object.entries(options.styles).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }

    return element;
}

/**
 * Create a button element with common button styling and attributes
 * @param {string} text - Button text content
 * @param {Object} options - Button configuration options
 * @returns {HTMLButtonElement} The created button
 */
export function createButton(text, options = {}) {
    const button = createElement('button', {
        className: options.className || 'a-button a-button-normal a-spacing-mini a-button-base',
        textContent: text,
        attributes: {
            type: 'button',
            ...options.attributes
        },
        styles: {
            width: '100%',
            backgroundColor: '#7759b9',
            borderColor: '#888c8c',
            color: 'white',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...options.styles
        }
    });

    return button;
}

/**
 * Create a container element with common styling
 * @param {string} className - CSS class names
 * @param {Object} options - Container configuration options
 * @returns {HTMLElement} The created container
 */
export function createContainer(className, options = {}) {
    return createElement('div', {
        className,
        styles: {
            marginTop: '8px',
            padding: '8px 0',
            borderTop: '1px solid #e7e7e7',
            ...options.styles
        },
        ...options
    });
}

/**
 * Safe DOM query with error handling
 * @param {Element} parent - Parent element to search within
 * @param {string} selector - CSS selector
 * @param {boolean} all - Whether to use querySelectorAll
 * @returns {Element|NodeList|Element[]} Query result or empty array on error
 */
export function safeQuery(parent, selector, all = false) {
    try {
        if (all) {
            return parent.querySelectorAll(selector);
        } else {
            return parent.querySelector(selector);
        }
    } catch (error) {
        console.warn(`DOM query failed for selector "${selector}":`, error);
        return all ? [] : null;
    }
}

/**
 * Safe DOM query all with error handling
 * @param {Element} parent - Parent element to search within
 * @param {string} selector - CSS selector
 * @returns {Element[]} Array of elements or empty array on error
 */
export function safeQueryAll(parent, selector) {
    const result = safeQuery(parent, selector, true);
    return Array.from(result || []);
}

/**
 * Add event listeners with error handling
 * @param {Element} element - Element to add listeners to
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler function
 * @param {Object} options - Event listener options
 * @returns {boolean} Success status
 */
export function safeAddEventListener(element, eventType, handler, options = {}) {
    try {
        element.addEventListener(eventType, handler, options);
        return true;
    } catch (error) {
        console.warn(`Failed to add ${eventType} event listener:`, error);
        return false;
    }
}

/**
 * Remove event listeners with error handling
 * @param {Element} element - Element to remove listeners from
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler function
 * @param {Object} options - Event listener options
 * @returns {boolean} Success status
 */
export function safeRemoveEventListener(element, eventType, handler, options = {}) {
    try {
        element.removeEventListener(eventType, handler, options);
        return true;
    } catch (error) {
        console.warn(`Failed to remove ${eventType} event listener:`, error);
        return false;
    }
}

/**
 * Set element styles with error handling
 * @param {Element} element - Element to style
 * @param {Object} styles - CSS styles object
 * @returns {boolean} Success status
 */
export function safeSetStyles(element, styles) {
    try {
        Object.entries(styles).forEach(([property, value]) => {
            element.style[property] = value;
        });
        return true;
    } catch (error) {
        console.warn('Failed to set element styles:', error);
        return false;
    }
}

/**
 * Add CSS classes with error handling
 * @param {Element} element - Element to modify
 * @param {string|string[]} classes - CSS classes to add
 * @returns {boolean} Success status
 */
export function safeAddClasses(element, classes) {
    try {
        const classArray = Array.isArray(classes) ? classes : [classes];
        element.classList.add(...classArray);
        return true;
    } catch (error) {
        console.warn('Failed to add CSS classes:', error);
        return false;
    }
}

/**
 * Remove CSS classes with error handling
 * @param {Element} element - Element to modify
 * @param {string|string[]} classes - CSS classes to remove
 * @returns {boolean} Success status
 */
export function safeRemoveClasses(element, classes) {
    try {
        const classArray = Array.isArray(classes) ? classes : [classes];
        element.classList.remove(...classArray);
        return true;
    } catch (error) {
        console.warn('Failed to remove CSS classes:', error);
        return false;
    }
}

/**
 * Check if element has specific classes
 * @param {Element} element - Element to check
 * @param {string|string[]} classes - CSS classes to check for
 * @returns {boolean} Whether element has all specified classes
 */
export function hasClasses(element, classes) {
    try {
        const classArray = Array.isArray(classes) ? classes : [classes];
        return classArray.every(className => element.classList.contains(className));
    } catch (error) {
        console.warn('Failed to check CSS classes:', error);
        return false;
    }
}

/**
 * Get computed style value safely
 * @param {Element} element - Element to get style from
 * @param {string} property - CSS property name
 * @returns {string|null} Computed style value or null on error
 */
export function safeGetComputedStyle(element, property) {
    try {
        return window.getComputedStyle(element)[property];
    } catch (error) {
        console.warn(`Failed to get computed style for ${property}:`, error);
        return null;
    }
}

/**
 * Hide an element and store its original display value for restoration
 * @param {Element} element - Element to hide
 * @param {string} orderId - Order ID for logging
 * @param {string} elementType - Type of element for logging
 * @returns {Object} Object containing the hidden element and success status
 */
export function hideElement(element, orderId, elementType = 'element') {
    try {
        // Skip if already hidden
        if (element.classList.contains('archivaz-hidden-details')) {
            return { element, success: false, reason: 'already hidden' };
        }

        // Store original display value for restoration
        const originalDisplay = safeGetComputedStyle(element, 'display');
        if (originalDisplay) {
            element.setAttribute('data-archivaz-original-display', originalDisplay);
        }

        // Hide the element
        element.classList.add('archivaz-hidden-details');
        element.style.display = 'none';

        console.log(`🔍 Hidden ${elementType} in order ${orderId}:`, element);
        return { element, success: true, originalDisplay };
    } catch (error) {
        console.warn(`⚠️ Error hiding ${elementType} in order ${orderId}:`, error);
        return { element, success: false, reason: 'error', error };
    }
}

/**
 * Hide multiple elements using selectors and return hidden elements array
 * @param {Element} container - Container to search within
 * @param {string[]} selectors - Array of CSS selectors to hide
 * @param {string} orderId - Order ID for logging
 * @param {Function} skipCondition - Optional function to determine if element should be skipped
 * @returns {Array} Array of successfully hidden elements
 */
export function hideElementsBySelectors(container, selectors, orderId, skipCondition = null) {
    const hiddenElements = [];
    let totalHidden = 0;

    selectors.forEach(selector => {
        try {
            const elements = container.querySelectorAll(selector);
            elements.forEach(element => {
                // Apply skip condition if provided
                if (skipCondition && skipCondition(element)) {
                    return;
                }

                const result = hideElement(element, orderId, `element with selector "${selector}"`);
                if (result.success) {
                    hiddenElements.push(result.element);
                    totalHidden++;
                }
            });
        } catch (error) {
            console.warn(`⚠️ Error processing selector "${selector}":`, error);
        }
    });

    console.log(`🔍 Total elements hidden with selectors in order ${orderId}: ${totalHidden}`);
    return hiddenElements;
}

/**
 * Check if an element should be preserved (not hidden)
 * @param {Element} element - Element to check
 * @param {string[]} preservePatterns - Array of text patterns that indicate preservation
 * @returns {boolean} True if element should be preserved
 */
export function shouldPreserveElement(element, preservePatterns = []) {
    try {
        const textContent = element.textContent.toLowerCase();
        return preservePatterns.some(pattern => textContent.includes(pattern));
    } catch (error) {
        console.debug('Error checking if element should be preserved:', error);
        return false;
    }
}

/**
 * Check if an element contains essential information that should be preserved
 * @param {Element} element - Element to check
 * @returns {boolean} True if element contains essential information
 */
export function containsEssentialInfo(element) {
    const essentialPatterns = [
        'order placed',
        'total',
        'ship to',
        'order #',
        'view order details',
        'view invoice',
        'return complete',
        'delivered',
        'shipped'
    ];

    return shouldPreserveElement(element, essentialPatterns);
}

/**
 * Safely add or remove CSS classes from an element
 * @param {Element} element - Element to modify
 * @param {string[]} classesToAdd - Classes to add
 * @param {string[]} classesToRemove - Classes to remove
 * @returns {boolean} Success status
 */
export function safeModifyClasses(element, classesToAdd = [], classesToRemove = []) {
    try {
        if (classesToAdd.length > 0) {
            element.classList.add(...classesToAdd);
        }
        if (classesToRemove.length > 0) {
            element.classList.remove(...classesToRemove);
        }
        return true;
    } catch (error) {
        console.warn('Failed to modify CSS classes:', error);
        return false;
    }
}

/**
 * Safely set multiple CSS properties on an element
 * @param {Element} element - Element to style
 * @param {Object} styles - Object with CSS property-value pairs
 * @returns {boolean} Success status
 */
export function safeSetMultipleStyles(element, styles) {
    try {
        Object.entries(styles).forEach(([property, value]) => {
            element.style[property] = value;
        });
        return true;
    } catch (error) {
        console.warn('Failed to set multiple styles:', error);
        return false;
    }
}

/**
 * Check if an element is within the boundaries of a container
 * @param {Element} element - Element to check
 * @param {Element} container - Container to check within
 * @returns {boolean} True if element is within container boundaries
 */
export function isElementWithinContainer(element, container) {
    try {
        return container.contains(element) || container === element;
    } catch (error) {
        console.warn('Error checking element containment:', error);
        return false;
    }
}

/**
 * Create a standardized element hiding result object
 * @param {Element} element - The element that was processed
 * @param {boolean} success - Whether the operation was successful
 * @param {string} reason - Reason for success/failure
 * @param {*} additionalData - Any additional data
 * @returns {Object} Standardized result object
 */
export function createHidingResult(element, success, reason = '', additionalData = {}) {
    return {
        element,
        success,
        reason,
        timestamp: new Date().toISOString(),
        ...additionalData
    };
}
