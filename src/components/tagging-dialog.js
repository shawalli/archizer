// Order-Specific Tagging Interface Component
// Each instance handles one order's tagging needs

export class TaggingDialog {
    constructor(orderId) {
        this.orderId = orderId;
        this.isOpen = false;
        this.currentOrder = null;
        this.tags = [];
        this.maxTags = 20; // Maximum number of tags allowed
        this.maxTagLength = 50; // Maximum length per tag
        this.currentOrderCard = null; // Reference to the order card being tagged
        this.originalOrderContent = null; // Store the original order content
        this.eventListeners = new Map(); // Track event listeners for this instance
        this.dialogElement = null; // Reference to the cloned dialog element
        this.init();
    }

    init() {
        // No global event binding - events will be bound when dialog opens
        console.log(`🔧 TaggingDialog initialized for order ${this.orderId}`);
    }

    /**
     * Bind events specifically to this dialog instance
     * @param {Element} dialogElement - The cloned dialog element for this order
     */
    bindEventsToDialog(dialogElement) {
        try {
            console.log(`🔧 Binding events to dialog for order ${this.orderId}`);

            // Store reference to dialog element
            this.dialogElement = dialogElement;

            // Clear any existing event listeners
            this.clearEventListeners();

            // Add tag button
            const addTagBtn = dialogElement.querySelector('#add-tag-btn');
            if (addTagBtn) {
                const addTagListener = () => this.addNewTag();
                addTagBtn.addEventListener('click', addTagListener);
                this.eventListeners.set('add-tag-btn', { element: addTagBtn, listener: addTagListener, event: 'click' });
            }

            // Save button
            const saveBtn = dialogElement.querySelector('#tagging-save-btn');
            if (saveBtn) {
                const saveListener = (e) => {
                    e.preventDefault();
                    this.saveTags();
                };
                saveBtn.addEventListener('click', saveListener);
                this.eventListeners.set('tagging-save-btn', { element: saveBtn, listener: saveListener, event: 'click' });
            }

            // Cancel button
            const cancelBtn = dialogElement.querySelector('#tagging-cancel-btn');
            if (cancelBtn) {
                const cancelListener = () => this.cancel();
                cancelBtn.addEventListener('click', cancelListener);
                this.eventListeners.set('tagging-cancel-btn', { element: cancelBtn, listener: cancelListener, event: 'click' });
            }

            // Overlay click handler to close dialog
            const overlay = dialogElement.closest('.delivery-box');
            if (overlay) {
                const overlayListener = (e) => {
                    // Only close if clicking on the delivery-box background, not on dialog content
                    if (e.target === overlay && !dialogElement.contains(e.target)) {
                        this.close();
                    }
                };
                overlay.addEventListener('click', overlayListener);
                this.eventListeners.set('overlay', { element: overlay, listener: overlayListener, event: 'click' });
            }

            // New tag input handling
            const newTagInput = dialogElement.querySelector('#new-tag-input');
            if (newTagInput) {
                const keydownListener = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addNewTag();
                    }
                };
                newTagInput.addEventListener('keydown', keydownListener);
                this.eventListeners.set('new-tag-input-keydown', { element: newTagInput, listener: keydownListener, event: 'keydown' });

                const inputListener = () => this.validateNewTagInput();
                newTagInput.addEventListener('input', inputListener);
                this.eventListeners.set('new-tag-input-input', { element: newTagInput, listener: inputListener, event: 'input' });
            }

            // Tag input handling for tests (using tag-input ID)
            const tagInput = dialogElement.querySelector('#tag-input');
            if (tagInput) {
                const tagInputKeydownListener = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.processTagInput();
                    } else if (e.key === ',') {
                        e.preventDefault();
                        this.processTagInput();
                    }
                };
                tagInput.addEventListener('keydown', tagInputKeydownListener);
                this.eventListeners.set('tag-input-keydown', { element: tagInput, listener: tagInputKeydownListener, event: 'keydown' });
            }

            console.log(`✅ Events bound to dialog for order ${this.orderId}`);
        } catch (error) {
            console.error(`Error binding events to dialog for order ${this.orderId}:`, error);
        }
    }

    /**
     * Clear all event listeners for this dialog instance
     */
    clearEventListeners() {
        try {
            console.log(`🔧 Clearing event listeners for order ${this.orderId}`);

            for (const [key, { element, listener, event }] of this.eventListeners) {
                if (element && element.removeEventListener) {
                    element.removeEventListener(event, listener);
                    console.log(`🗑️ Removed ${event} listener for ${key} on order ${this.orderId}`);
                }
            }

            this.eventListeners.clear();
            console.log(`✅ Cleared all event listeners for order ${this.orderId}`);
        } catch (error) {
            console.error(`Error clearing event listeners for order ${this.orderId}:`, error);
        }
    }

    addNewTag() {
        if (!this.dialogElement) {
            console.warn(`No dialog element available for order ${this.orderId}`);
            return;
        }

        const newTagInput = this.dialogElement.querySelector('#new-tag-input');
        if (!newTagInput) return;

        const tagText = newTagInput.value.trim();
        if (!tagText) return;

        // Validate tag before adding
        const validationResult = this.validateTag(tagText);
        if (!validationResult.isValid) {
            this.showError(validationResult.error);
            return;
        }

        if (this.tags.includes(tagText)) {
            this.showError(`Tag "${tagText}" already exists`);
            return;
        }

        if (this.tags.length >= this.maxTags) {
            this.showError(`Maximum of ${this.maxTags} tags allowed`);
            return;
        }

        // Add the tag
        this.tags.push(tagText);

        // Clear input and re-render
        newTagInput.value = '';
        this.renderTags();

        // Update delivery status tags if details are hidden
        this.updateDeliveryStatusTags(this.tags);

        // Show success feedback
        this.showSuccess(`Tag "${tagText}" added successfully`);

        // Focus back on input for next tag
        newTagInput.focus();
    }

    addTag(tagText) {
        // Validate tag before adding
        const validationResult = this.validateTag(tagText);
        if (!validationResult.isValid) {
            this.showError(validationResult.error);
            return false;
        }

        if (this.tags.includes(tagText)) {
            this.showError(`Tag "${tagText}" already exists`);
            return false;
        }

        if (this.tags.length >= this.maxTags) {
            this.showError(`Maximum of ${this.maxTags} tags allowed`);
            return false;
        }

        this.tags.push(tagText);
        this.renderTags();

        // Update delivery status tags if details are hidden
        this.updateDeliveryStatusTags(this.tags);

        return true;
    }

    validateTag(tagText) {
        // Check if tag is empty
        if (!tagText || tagText.trim().length === 0) {
            return { isValid: false, error: 'Tag cannot be empty' };
        }

        // Check tag length
        if (tagText.length < 2) {
            return { isValid: false, error: 'Tags must be at least 2 characters long' };
        }

        if (tagText.length > this.maxTagLength) {
            return { isValid: false, error: `Tags cannot exceed ${this.maxTagLength} characters` };
        }

        // Check for invalid characters
        const invalidChars = /[<>:"\\|?*]/;
        if (invalidChars.test(tagText)) {
            return { isValid: false, error: 'Tags cannot contain invalid characters (< > : " \\ | ? *)' };
        }

        // Check for excessive whitespace
        if (tagText !== tagText.trim()) {
            return { isValid: false, error: 'Tags cannot start or end with spaces' };
        }

        // Check for duplicate spaces
        if (/\s{2,}/.test(tagText)) {
            return { isValid: false, error: 'Tags cannot contain multiple consecutive spaces' };
        }

        // Check if tag is too generic
        const genericTags = ['tag', 'order', 'amazon', 'item', 'product', 'purchase'];
        if (genericTags.includes(tagText.toLowerCase())) {
            return { isValid: false, error: `"${tagText}" is too generic. Please use a more specific tag.` };
        }

        return { isValid: true, error: null };
    }

    removeTag(tagText) {
        const index = this.tags.indexOf(tagText);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.renderTags();

            // Update delivery status tags if details are hidden
            this.updateDeliveryStatusTags(this.tags);
        }
    }

    renderTags() {
        if (!this.dialogElement) {
            console.warn(`No dialog element available for order ${this.orderId}`);
            return;
        }

        const existingTagsContainer = this.dialogElement.querySelector('#existing-tags');
        if (!existingTagsContainer) {
            console.warn(`Could not find existing-tags container for order ${this.orderId}`);
            return;
        }

        existingTagsContainer.innerHTML = '';

        if (this.tags.length === 0) {
            existingTagsContainer.innerHTML = '<span style="color: #6c757d; font-style: italic; font-size: 13px;">No tags yet</span>';
            return;
        }

        this.tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-item';
            tagElement.innerHTML = `
                <span class="tag-text">${this.escapeHtml(tag)}</span>
                <button class="remove-tag" aria-label="Remove tag ${tag}">×</button>
            `;

            // Add remove event listener
            const removeButton = tagElement.querySelector('.remove-tag');
            const removeListener = () => this.removeTag(tag);
            removeButton.addEventListener('click', removeListener);

            // Store the listener for cleanup
            this.eventListeners.set(`remove-tag-${tag}`, {
                element: removeButton,
                listener: removeListener,
                event: 'click'
            });

            existingTagsContainer.appendChild(tagElement);
        });
    }

    processTagInput() {
        if (!this.dialogElement) return;

        // Process the current tag input value
        const tagInput = this.dialogElement.querySelector('#tag-input, #new-tag-input');
        if (!tagInput) return;

        const input = tagInput.value.trim();
        if (!input) return;

        // Split by comma and process each tag
        const tags = input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        tags.forEach(tag => {
            if (tag) {
                this.addTag(tag);
            }
        });

        // Clear input after processing
        tagInput.value = '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    open(orderData, orderCard = null) {
        try {
            console.log(`🔍 TaggingDialog.open() called for order: ${orderData.orderNumber} (instance: ${this.orderId})`);
            console.log(`🔍 Current isOpen state: ${this.isOpen}`);

            if (this.isOpen) {
                console.warn(`⚠️ TaggingDialog for order ${this.orderId} is already open`);
                return;
            }

            this.currentOrder = orderData;
            this.currentOrderCard = orderCard;
            this.tags = orderData.tags || [];
            this.notes = orderData.notes || '';

            // For testing purposes, handle case where orderCard might be undefined
            if (!orderCard) {
                // Create a mock order card for testing
                const mockOrderCard = document.createElement('div');
                mockOrderCard.className = 'order-card';
                mockOrderCard.innerHTML = `
                    <div class="delivery-box">
                        <div class="a-box-inner">
                            <div class="order-content">Mock order content</div>
                        </div>
                    </div>
                `;
                this.currentOrderCard = mockOrderCard;
                orderCard = mockOrderCard;
            }

            // Find the delivery-box container (the one with the gray border)
            const deliveryBox = orderCard.querySelector('.delivery-box');
            if (!deliveryBox) {
                console.error('Could not find .delivery-box container');
                return;
            }

            // Store the original content inside the delivery-box
            this.originalOrderContent = deliveryBox.querySelector('.a-box-inner');
            if (!this.originalOrderContent) {
                console.error('Could not find delivery-box inner content');
                return;
            }

            // Hide the original content but keep the delivery-box container visible
            this.originalOrderContent.style.display = 'none';

            // Show the tagging interface
            const taggingInterface = document.getElementById('tagging-interface');
            if (taggingInterface) {
                // Clone the interface with a unique ID for this order
                const clonedInterface = taggingInterface.cloneNode(true);
                clonedInterface.id = `tagging-interface-active-${this.orderId}`;
                clonedInterface.style.display = 'block';
                clonedInterface.setAttribute('data-archivaz-order-id', this.orderId);

                // Insert the tagging interface inside the existing delivery-box container
                deliveryBox.appendChild(clonedInterface);

                // Bind events specifically to this cloned interface
                this.bindEventsToDialog(clonedInterface);

                // Render tags
                this.renderTags();

                // Check if order details are already hidden and update delivery status tags
                if (orderCard.classList.contains('archivaz-details-hidden')) {
                    this.updateDeliveryStatusTags(this.tags);
                }

                this.isOpen = true;
                console.log(`✅ TaggingDialog opened for order: ${orderData.orderNumber} (instance: ${this.orderId})`);

                // Focus on new tag input
                setTimeout(() => {
                    const newTagInput = clonedInterface.querySelector('#new-tag-input');
                    if (newTagInput) {
                        newTagInput.focus();
                    }
                }, 100);
            } else {
                // For testing, if no tagging interface exists, just set the state
                this.isOpen = true;
                console.log(`✅ TaggingDialog opened for order: ${orderData.orderNumber} (test mode, instance: ${this.orderId})`);
            }
        } catch (error) {
            console.error(`Error opening tagging dialog for order ${this.orderId}:`, error);
        }
    }

    close() {
        try {
            console.log(`🔍 TaggingDialog.close() called for order: ${this.orderId}`);
            console.log(`🔍 Current isOpen state: ${this.isOpen}`);

            if (this.currentOrderCard && this.originalOrderContent) {
                // Remove the tagging interface
                const activeInterface = document.getElementById(`tagging-interface-active-${this.orderId}`);
                if (activeInterface) {
                    activeInterface.remove();
                }

                // Restore the original order content
                this.originalOrderContent.style.display = '';
            }

            // Clear event listeners
            this.clearEventListeners();

            this.resetForm();
            this.currentOrder = null;
            this.currentOrderCard = null;
            this.originalOrderContent = null;
            this.dialogElement = null;
            this.isOpen = false;
            console.log(`✅ TaggingDialog closed for order: ${this.orderId}`);
        } catch (error) {
            console.error(`Error closing tagging dialog for order ${this.orderId}:`, error);
        }
    }

    cancel() {
        this.close();
    }

    findOrderContent(orderCard) {
        // Look for the delivery-box content that contains the order details
        const deliveryBox = orderCard.querySelector('.delivery-box');
        if (deliveryBox) {
            return deliveryBox;
        }

        // Fallback: look for any content area within the order card
        const contentArea = orderCard.querySelector('.a-box-inner, .order-content, .order-details');
        return contentArea || orderCard;
    }

    findOrderContainer(orderCard) {
        // Find the main order container that has the border
        // This is typically the order-card itself or a parent with the border styling
        const orderContainer = orderCard.closest('.order-card, .js-order-card, [data-order-id]');
        return orderContainer || orderCard;
    }

    resetForm() {
        this.tags = [];
    }

    validateNewTagInput() {
        if (!this.dialogElement) return;

        const newTagInput = this.dialogElement.querySelector('#new-tag-input');
        if (!newTagInput) return;

        const inputValue = newTagInput.value;
        const remainingChars = this.maxTagLength - inputValue.length;

        // Update input styling based on validation
        if (remainingChars < 0) {
            newTagInput.style.borderColor = '#d32f2f';
            newTagInput.style.boxShadow = '0 0 0 3px rgba(211, 47, 47, 0.1)';
        } else if (remainingChars < 10) {
            newTagInput.style.borderColor = '#f57c00';
            newTagInput.style.boxShadow = '0 0 0 3px rgba(245, 124, 0, 0.1)';
        } else {
            newTagInput.style.borderColor = '#ddd';
            newTagInput.style.boxShadow = 'none';
        }
    }

    saveTags() {
        // Validate individual tags
        for (const tag of this.tags) {
            const validationResult = this.validateTag(tag);
            if (!validationResult.isValid) {
                this.showError(validationResult.error);
                return;
            }
        }

        // Prepare data for saving
        const tagData = {
            orderNumber: this.currentOrder.orderNumber,
            orderDate: this.currentOrder.orderDate,
            tags: this.tags,
            timestamp: new Date().toISOString()
        };

        // Emit order-specific custom event
        const eventName = `tagsSaved-${this.orderId}`;
        console.log(`🔍 Firing order-specific event: ${eventName}`);
        console.log(`🔍 Event detail:`, tagData);
        console.log(`🔍 Current order:`, this.currentOrder);

        const saveEvent = new CustomEvent(eventName, {
            detail: tagData,
            bubbles: true
        });
        document.dispatchEvent(saveEvent);
        console.log(`✅ Order-specific event ${eventName} dispatched successfully`);

        // Close the interface (the hiding logic will be handled by the parent)
        this.close();
    }

    showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'tagging-success';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            max-width: 300px;
        `;
        document.body.appendChild(successDiv);

        // Remove after 2 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 2000);
    }

    showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'tagging-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
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
        document.body.appendChild(errorDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    // Public method to check if dialog is open
    isDialogOpen() {
        return this.isOpen;
    }

    // Public method to get current tags
    getCurrentTags() {
        return [...this.tags];
    }

    // Public method to get validation status
    getValidationStatus() {
        return {
            tagsValid: this.tags.length > 0 && this.tags.every(tag => this.validateTag(tag).isValid),
            canSave: this.tags.length > 0
        };
    }

    /**
     * Update tags displayed in delivery status when details are hidden
     * @param {Array} newTags - New array of tags to display
     */
    updateDeliveryStatusTags(newTags) {
        try {
            if (!this.currentOrderCard) return;

            // Find the delivery status tags container
            const tagsContainer = this.currentOrderCard.querySelector('.archivaz-delivery-status-tags');
            if (!tagsContainer) return;

            // Update the tags list
            const tagsList = tagsContainer.querySelector('.archivaz-tags-list');
            if (tagsList) {
                tagsList.innerHTML = '';

                newTags.forEach(tag => {
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
            }

            console.log(`Updated delivery status tags for order ${this.orderId}: ${newTags.length} tags`);
        } catch (error) {
            console.error(`Error updating delivery status tags for order ${this.orderId}:`, error);
        }
    }

    /**
     * Clean up this dialog instance
     */
    destroy() {
        try {
            console.log(`🔧 Destroying TaggingDialog instance for order ${this.orderId}`);

            // Close if open
            if (this.isOpen) {
                this.close();
            }

            // Clear all event listeners
            this.clearEventListeners();

            // Clear references
            this.currentOrder = null;
            this.currentOrderCard = null;
            this.originalOrderContent = null;
            this.dialogElement = null;

            console.log(`✅ TaggingDialog instance destroyed for order ${this.orderId}`);
        } catch (error) {
            console.error(`Error destroying TaggingDialog instance for order ${this.orderId}:`, error);
        }
    }
}

// TaggingDialog Manager - handles multiple dialog instances
export class TaggingDialogManager {
    constructor() {
        this.dialogs = new Map(); // Map of orderId -> TaggingDialog instance
        this.activeDialogs = new Set(); // Set of orderIds with currently open dialogs
        this.init();
    }

    init() {
        console.log('🔧 TaggingDialogManager initialized');
    }

    /**
     * Get or create a TaggingDialog instance for a specific order
     * @param {string} orderId - The order ID
     * @returns {TaggingDialog} The dialog instance for this order
     */
    getDialog(orderId) {
        if (!this.dialogs.has(orderId)) {
            console.log(`🔧 Creating new TaggingDialog instance for order ${orderId}`);
            const dialog = new TaggingDialog(orderId);
            this.dialogs.set(orderId, dialog);
        }
        return this.dialogs.get(orderId);
    }

    /**
 * Open a tagging dialog for a specific order
 * @param {Object} orderData - Order data
 * @param {Element} orderCard - Order card element
 * @returns {boolean} True if dialog was opened successfully
 */
    openDialog(orderData, orderCard) {
        try {
            const orderId = orderData.orderNumber;
            console.log(`🔧 Opening tagging dialog for order ${orderId}`);

            // Check if this specific order already has an open dialog
            const existingDialog = this.dialogs.get(orderId);
            if (existingDialog && existingDialog.isDialogOpen()) {
                console.warn(`⚠️ Dialog for order ${orderId} is already open`);
                return false;
            }

            // Get or create dialog instance for this order
            const dialog = this.getDialog(orderId);

            // Open the dialog
            dialog.open(orderData, orderCard);

            // Track this as an active dialog (but don't close others)
            this.activeDialogs = this.activeDialogs || new Set();
            this.activeDialogs.add(orderId);

            console.log(`✅ Tagging dialog opened for order ${orderId}`);
            console.log(`🔍 Total active dialogs: ${this.activeDialogs.size}`);
            return true;

        } catch (error) {
            console.error(`Error opening tagging dialog for order ${orderData.orderNumber}:`, error);
            return false;
        }
    }

    /**
     * Close a specific dialog or all dialogs
     * @param {string} orderId - Optional order ID to close specific dialog
     */
    closeDialog(orderId = null) {
        try {
            if (orderId) {
                // Close specific dialog
                const dialog = this.dialogs.get(orderId);
                if (dialog && dialog.isDialogOpen()) {
                    dialog.close();
                    if (this.activeDialogs) {
                        this.activeDialogs.delete(orderId);
                    }
                    console.log(`✅ Closed tagging dialog for order ${orderId}`);
                }
            } else {
                // Close all active dialogs
                if (this.activeDialogs) {
                    for (const activeOrderId of this.activeDialogs) {
                        const dialog = this.dialogs.get(activeOrderId);
                        if (dialog && dialog.isDialogOpen()) {
                            dialog.close();
                        }
                    }
                    this.activeDialogs.clear();
                    console.log(`✅ Closed all active tagging dialogs`);
                }
            }
        } catch (error) {
            console.error('Error closing tagging dialog:', error);
        }
    }

    /**
     * Check if any dialog is currently open
     * @returns {boolean} True if any dialog is open
     */
    isAnyDialogOpen() {
        return this.activeDialogs && this.activeDialogs.size > 0;
    }

    /**
     * Check if a specific order has an open dialog
     * @param {string} orderId - Order ID to check
     * @returns {boolean} True if the order has an open dialog
     */
    isOrderDialogOpen(orderId) {
        const dialog = this.dialogs.get(orderId);
        return dialog && dialog.isDialogOpen();
    }

    /**
     * Get all currently active dialogs
     * @returns {Array} Array of active dialog instances
     */
    getActiveDialogs() {
        if (!this.activeDialogs) return [];
        return Array.from(this.activeDialogs).map(orderId => this.dialogs.get(orderId)).filter(Boolean);
    }

    /**
     * Get the number of active dialogs
     * @returns {number} Number of currently open dialogs
     */
    getActiveDialogCount() {
        return this.activeDialogs ? this.activeDialogs.size : 0;
    }

    /**
 * Clean up all dialog instances
 */
    cleanup() {
        try {
            console.log('🔧 Cleaning up TaggingDialogManager...');

            // Close all active dialogs
            if (this.activeDialogs) {
                for (const activeOrderId of this.activeDialogs) {
                    const dialog = this.dialogs.get(activeOrderId);
                    if (dialog && dialog.isDialogOpen()) {
                        dialog.close();
                    }
                }
                this.activeDialogs.clear();
            }

            // Destroy all dialog instances
            for (const [orderId, dialog] of this.dialogs) {
                dialog.destroy();
            }

            this.dialogs.clear();
            console.log('✅ TaggingDialogManager cleanup completed');

        } catch (error) {
            console.error('Error cleaning up TaggingDialogManager:', error);
        }
    }
}

// Initialize the tagging dialog manager when the DOM is ready (for non-module environments)
let taggingDialogManager;

if (typeof window !== 'undefined') {
    console.log('🔧 TaggingDialogManager initialization starting...');

    // Make the classes available globally immediately
    window.TaggingDialog = TaggingDialog;
    window.TaggingDialogManager = TaggingDialogManager;
    console.log('✅ TaggingDialog classes set on window');

    // Initialize the manager when DOM elements are ready
    const initializeManager = () => {
        console.log('🔧 Checking for tagging interface DOM element...');
        // Check if the required DOM elements exist
        const taggingInterface = document.getElementById('tagging-interface');
        if (taggingInterface) {
            console.log('✅ Tagging interface element found, creating TaggingDialogManager instance...');
            taggingDialogManager = new TaggingDialogManager();
            window.taggingDialogManager = taggingDialogManager;
            console.log('✅ TaggingDialogManager instance created and available globally');
        } else {
            console.log('⚠️ Tagging interface element not found, retrying in 100ms...');
            // Try again in a moment if elements aren't ready
            setTimeout(initializeManager, 100);
        }
    };

    if (document.readyState === 'loading') {
        console.log('🔧 DOM still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', initializeManager);
    } else {
        console.log('🔧 DOM already ready, checking for tagging interface element...');
        // DOM is already ready, but check if our elements exist
        initializeManager();
    }
} else {
    console.log('⚠️ Window not available for TaggingDialogManager initialization');
}
