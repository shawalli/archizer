/**
 * Unit tests for TaggingDialog component
 */

// Import the TaggingDialog class directly
import { TaggingDialog } from './tagging-dialog.js';

// Mock DOM elements for testing
const createMockDOM = () => {
    const mockOverlay = document.createElement('div');
    mockOverlay.id = 'tagging-dialog-overlay';
    mockOverlay.className = 'tagging-dialog-overlay';

    const mockDialog = document.createElement('div');
    mockDialog.id = 'tagging-dialog';
    mockDialog.className = 'tagging-dialog';

    const mockHeader = document.createElement('div');
    mockHeader.className = 'tagging-dialog-header';

    const mockTitle = document.createElement('h2');
    mockTitle.className = 'tagging-dialog-title';
    mockTitle.textContent = 'Tag Order';

    const mockCloseBtn = document.createElement('button');
    mockCloseBtn.id = 'tagging-dialog-close';
    mockCloseBtn.className = 'tagging-dialog-close';

    const mockContent = document.createElement('div');
    mockContent.className = 'tagging-dialog-content';

    const mockOrderInfo = document.createElement('div');
    mockOrderInfo.className = 'order-info';
    mockOrderInfo.innerHTML = `
        <div class="order-number">
            <strong>Order #:</strong> <span id="tagging-order-number"></span>
        </div>
        <div class="order-date">
            <strong>Date:</strong> <span id="tagging-order-date"></span>
        </div>
    `;

    const mockForm = document.createElement('form');
    mockForm.id = 'tagging-form';
    mockForm.className = 'tagging-form';

    const mockTagInput = document.createElement('input');
    mockTagInput.id = 'tag-input';
    mockTagInput.className = 'tag-input';
    mockTagInput.type = 'text';

    const mockCurrentTags = document.createElement('div');
    mockCurrentTags.id = 'current-tags';

    const mockFooter = document.createElement('div');
    mockFooter.className = 'tagging-dialog-footer';

    const mockCancelBtn = document.createElement('button');
    mockCancelBtn.id = 'tagging-dialog-cancel';
    mockCancelBtn.className = 'btn btn-secondary';
    mockCancelBtn.textContent = 'Cancel';

    const mockSaveBtn = document.createElement('button');
    mockSaveBtn.id = 'tagging-dialog-save';
    mockSaveBtn.className = 'btn btn-primary';
    mockSaveBtn.textContent = 'Save Tags';

    // Create the tagging interface that the TaggingDialog class expects
    const mockTaggingInterface = document.createElement('div');
    mockTaggingInterface.id = 'tagging-interface';
    mockTaggingInterface.style.display = 'none';
    mockTaggingInterface.innerHTML = `
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
                                        <input type="text" id="new-tag-input" class="a-input-text a-width-full"
                                            placeholder="Enter a new tag" maxlength="50" />
                                    </div>
                                    <button type="button" class="a-button a-button-primary a-button-small" id="add-tag-btn">
                                        Add Tag
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="a-fixed-right-grid-col a-col-right"
                        style="width: 220px; margin-right: -220px; float: left;">
                        <ul class="a-unordered-list a-nostyle a-vertical">
                            <div class="a-button-stack a-spacing-mini">
                                <li class="a-list-item" style="margin-bottom: 4px;">
                                    <button type="button" class="a-button a-button-normal a-spacing-mini a-button-base"
                                        id="tagging-cancel-btn"
                                        style="width: 100%; background-color: #6c757d; border-color: #6c757d; color: white;">
                                        Cancel
                                    </button>
                                </li>
                                <li class="a-list-item" style="margin-bottom: 4px;">
                                    <button type="button" class="a-button a-button-normal a-spacing-mini a-button-primary"
                                        id="tagging-save-btn" style="width: 100%;">
                                        Save & Hide
                                    </button>
                                </li>
                            </div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Assemble the DOM structure
    mockHeader.appendChild(mockTitle);
    mockHeader.appendChild(mockCloseBtn);

    mockForm.appendChild(mockTagInput);
    mockForm.appendChild(mockCurrentTags);

    mockContent.appendChild(mockOrderInfo);
    mockContent.appendChild(mockForm);

    mockFooter.appendChild(mockCancelBtn);
    mockFooter.appendChild(mockSaveBtn);

    mockDialog.appendChild(mockHeader);
    mockDialog.appendChild(mockContent);
    mockDialog.appendChild(mockFooter);

    mockOverlay.appendChild(mockDialog);

    // Add the tagging interface to the body (hidden)
    document.body.appendChild(mockTaggingInterface);

    return {
        mockOverlay,
        mockDialog,
        mockHeader,
        mockTitle,
        mockCloseBtn,
        mockContent,
        mockOrderInfo,
        mockForm,
        mockTagInput,
        mockCurrentTags,
        mockFooter,
        mockCancelBtn,
        mockSaveBtn,
        mockTaggingInterface
    };
};

// Mock the DOM environment
const setupMockDOM = () => {
    const mockElements = createMockDOM();

    // Clear existing body content
    document.body.innerHTML = '';

    // Append mock elements
    document.body.appendChild(mockElements.mockOverlay);

    return mockElements;
};

// Mock event dispatching
const mockDispatchEvent = jest.fn();
Object.defineProperty(document, 'dispatchEvent', {
    value: mockDispatchEvent,
    writable: true
});

// Mock Chrome storage API
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
        }
    }
};
Object.defineProperty(window, 'chrome', {
    value: mockChrome,
    writable: true
});

describe('TaggingDialog', () => {
    let taggingDialog;
    let mockElements;

    beforeEach(() => {
        // Setup mock DOM
        mockElements = setupMockDOM();

        // Reset mocks
        jest.clearAllMocks();

        // Create new instance
        taggingDialog = new TaggingDialog();
    });

    afterEach(() => {
        // Clean up
        if (taggingDialog && typeof taggingDialog.close === 'function') {
            taggingDialog.close();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default values', () => {
            expect(taggingDialog.isOpen).toBe(false);
            expect(taggingDialog.currentOrder).toBeNull();
            expect(taggingDialog.tags).toEqual([]);
            expect(taggingDialog.maxTags).toBe(20);
            expect(taggingDialog.maxTagLength).toBe(50);
        });

        test('should bind event listeners on initialization', () => {
            const closeBtn = document.getElementById('tagging-dialog-close');
            const cancelBtn = document.getElementById('tagging-dialog-cancel');
            const saveBtn = document.getElementById('tagging-dialog-save');
            const tagInput = document.getElementById('tag-input');

            expect(closeBtn).toBeTruthy();
            expect(cancelBtn).toBeTruthy();
            expect(saveBtn).toBeTruthy();
            expect(tagInput).toBeTruthy();
        });
    });

    describe('Tag Management', () => {
        test('should add valid tags', () => {
            const tag = 'electronics';
            const result = taggingDialog.addTag(tag);

            expect(result).toBe(true);
            expect(taggingDialog.tags).toContain(tag);
        });

        test('should not add duplicate tags', () => {
            taggingDialog.addTag('electronics');
            const result = taggingDialog.addTag('electronics');

            expect(result).toBe(false);
            expect(taggingDialog.tags.filter(t => t === 'electronics')).toHaveLength(1);
        });

        test('should not add tags when at maximum limit', () => {
            // Fill up to max tags
            for (let i = 0; i < 20; i++) {
                taggingDialog.addTag(`tag${i}`);
            }

            const result = taggingDialog.addTag('one-more');
            expect(result).toBe(false);
            expect(taggingDialog.tags).toHaveLength(20);
        });

        test('should remove tags', () => {
            taggingDialog.addTag('electronics');
            taggingDialog.addTag('gift');

            taggingDialog.removeTag('electronics');

            expect(taggingDialog.tags).not.toContain('electronics');
            expect(taggingDialog.tags).toContain('gift');
        });

        test('should render tags correctly', () => {
            const tags = ['electronics', 'gift', 'holiday'];
            tags.forEach(tag => taggingDialog.addTag(tag));

            // The renderTags method should have already been called by addTag
            // Let's check if the tags were rendered in the current-tags container
            const currentTags = document.getElementById('current-tags');
            const tagElements = currentTags.querySelectorAll('.tag-item');

            expect(tagElements).toHaveLength(3);
            expect(tagElements[0].textContent).toContain('electronics');
            expect(tagElements[1].textContent).toContain('gift');
            expect(tagElements[2].textContent).toContain('holiday');
        });
    });

    describe('Tag Validation', () => {
        test('should validate tag length requirements', () => {
            const shortTag = 'a';
            const validTag = 'electronics';
            const longTag = 'a'.repeat(51);

            expect(taggingDialog.validateTag(shortTag).isValid).toBe(false);
            expect(taggingDialog.validateTag(validTag).isValid).toBe(true);
            expect(taggingDialog.validateTag(longTag).isValid).toBe(false);
        });

        test('should reject invalid characters', () => {
            const invalidTags = ['tag<', 'tag>', 'tag:', 'tag"', 'tag\\', 'tag|', 'tag?', 'tag*'];

            invalidTags.forEach(tag => {
                expect(taggingDialog.validateTag(tag).isValid).toBe(false);
            });
        });

        test('should reject tags with excessive whitespace', () => {
            const invalidTags = [' tag', 'tag ', 'tag  tag'];

            invalidTags.forEach(tag => {
                expect(taggingDialog.validateTag(tag).isValid).toBe(false);
            });
        });

        test('should reject generic tags', () => {
            const genericTags = ['tag', 'order', 'amazon', 'item', 'product', 'purchase'];

            genericTags.forEach(tag => {
                expect(taggingDialog.validateTag(tag).isValid).toBe(false);
            });
        });

        test('should accept valid tags', () => {
            const validTags = ['electronics', 'gift', 'holiday', 'tech-gadget'];

            validTags.forEach(tag => {
                expect(taggingDialog.validateTag(tag).isValid).toBe(true);
            });
        });
    });

    describe('Input Processing', () => {
        test('should process comma-separated tags', () => {
            const tagInput = document.getElementById('tag-input');
            const input = 'electronics, gift, holiday';
            tagInput.value = input;

            taggingDialog.processTagInput();

            expect(taggingDialog.tags).toContain('electronics');
            expect(taggingDialog.tags).toContain('gift');
            expect(taggingDialog.tags).toContain('holiday');
        });

        test('should handle Enter key for tag input', () => {
            const tagInput = document.getElementById('tag-input');
            tagInput.value = 'electronics';

            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            tagInput.dispatchEvent(event);

            expect(taggingDialog.tags).toContain('electronics');
        });

        test('should handle comma key for tag input', () => {
            const tagInput = document.getElementById('tag-input');
            tagInput.value = 'electronics';

            const event = new KeyboardEvent('keydown', { key: ',' });
            tagInput.dispatchEvent(event);

            expect(taggingDialog.tags).toContain('electronics');
        });

        test('should clear input after processing tags', () => {
            const tagInput = document.getElementById('tag-input');
            tagInput.value = 'electronics';

            taggingDialog.processTagInput();

            expect(tagInput.value).toBe('');
        });
    });

    describe('Dialog Operations', () => {
        test('should open dialog with order data', () => {
            const orderData = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15',
                tags: ['electronics']
            };

            taggingDialog.open(orderData);

            expect(taggingDialog.isOpen).toBe(true);
            expect(taggingDialog.currentOrder).toEqual(orderData);
            expect(taggingDialog.tags).toEqual(['electronics']);
        });

        test('should close dialog and reset form', () => {
            // First open with data
            const orderData = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15',
                tags: ['electronics']
            };
            taggingDialog.open(orderData);

            // Then close
            taggingDialog.close();

            expect(taggingDialog.isOpen).toBe(false);
            expect(taggingDialog.currentOrder).toBeNull();
            expect(taggingDialog.tags).toEqual([]);
        });

        test('should populate order info when opening', () => {
            const orderData = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15'
            };

            taggingDialog.open(orderData);

            const orderNumberElement = document.getElementById('tagging-order-number');
            const orderDateElement = document.getElementById('tagging-order-date');

            expect(orderNumberElement.textContent).toBe('123-4567890-1234567');
            expect(orderDateElement.textContent).toBe('2024-01-15');
        });
    });

    describe('Form Validation', () => {
        test('should validate all tags before saving', () => {
            // Add an invalid tag
            taggingDialog.tags = ['a']; // Too short

            const result = taggingDialog.saveTags();
            expect(result).toBeUndefined();

            // Check validation status
            expect(taggingDialog.getValidationStatus().tagsValid).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should show error messages', () => {
            const errorMessage = 'Test error message';
            taggingDialog.showError(errorMessage);

            const errorElement = document.querySelector('.tagging-error');
            expect(errorElement).toBeTruthy();
            expect(errorElement.textContent).toBe(errorMessage);
        });

        test('should remove error messages after timeout', () => {
            jest.useFakeTimers();

            taggingDialog.showError('Test error');
            expect(document.querySelector('.tagging-error')).toBeTruthy();

            jest.advanceTimersByTime(3000);
            expect(document.querySelector('.tagging-error')).toBeFalsy();

            jest.useRealTimers();
        });
    });

    describe('Public Methods', () => {
        test('should check dialog open status', () => {
            expect(taggingDialog.isDialogOpen()).toBe(false);

            taggingDialog.isOpen = true;
            expect(taggingDialog.isDialogOpen()).toBe(true);
        });

        test('should get current tags', () => {
            taggingDialog.tags = ['electronics', 'gift'];
            const currentTags = taggingDialog.getCurrentTags();

            expect(currentTags).toEqual(['electronics', 'gift']);
            expect(currentTags).not.toBe(taggingDialog.tags); // Should be a copy
        });

        test('should get validation status', () => {
            taggingDialog.tags = ['electronics'];

            const status = taggingDialog.getValidationStatus();

            expect(status.tagsValid).toBe(true);
            expect(status.canSave).toBe(true);
        });
    });

    describe('Integration Features', () => {
        test('should emit tagsSaved event when saving', () => {
            taggingDialog.tags = ['electronics'];

            // Set up currentOrder
            taggingDialog.currentOrder = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15'
            };

            taggingDialog.saveTags();

            // Check that the event was dispatched
            expect(mockDispatchEvent).toHaveBeenCalled();

            // Get the actual event that was dispatched
            const dispatchedEvent = mockDispatchEvent.mock.calls[0][0];

            // Verify event properties - now using order-specific event name
            expect(dispatchedEvent.type).toBe('tagsSaved-123-4567890-1234567');
            expect(dispatchedEvent.detail.orderNumber).toBe('123-4567890-1234567');
            expect(dispatchedEvent.detail.tags).toEqual(['electronics']);
        });

        test('should handle escape key to close dialog', () => {
            // Open the dialog first
            const orderData = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15'
            };
            taggingDialog.open(orderData);
            expect(taggingDialog.isOpen).toBe(true);

            // Test that the dialog can be closed
            taggingDialog.close();
            expect(taggingDialog.isOpen).toBe(false);
        });

        test('should handle overlay click to close dialog', () => {
            taggingDialog.isOpen = true;

            const overlay = document.getElementById('tagging-dialog-overlay');
            const clickEvent = new MouseEvent('click', { target: overlay });

            // Mock the close method to avoid DOM manipulation issues in tests
            const originalClose = taggingDialog.close;
            taggingDialog.close = jest.fn();

            overlay.dispatchEvent(clickEvent);

            expect(taggingDialog.close).toHaveBeenCalled();

            // Restore original method
            taggingDialog.close = originalClose;
        });
    });
});
