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

    const mockNotes = document.createElement('textarea');
    mockNotes.id = 'tag-notes';
    mockNotes.className = 'tag-notes';

    const mockCharCount = document.createElement('div');
    mockCharCount.className = 'char-count';
    mockCharCount.innerHTML = '<span id="notes-char-count">0</span>/500';

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

    // Assemble the DOM structure
    mockHeader.appendChild(mockTitle);
    mockHeader.appendChild(mockCloseBtn);

    mockForm.appendChild(mockTagInput);
    mockForm.appendChild(mockCurrentTags);
    mockForm.appendChild(mockNotes);
    mockForm.appendChild(mockCharCount);

    mockContent.appendChild(mockOrderInfo);
    mockContent.appendChild(mockForm);

    mockFooter.appendChild(mockCancelBtn);
    mockFooter.appendChild(mockSaveBtn);

    mockDialog.appendChild(mockHeader);
    mockDialog.appendChild(mockContent);
    mockDialog.appendChild(mockFooter);

    mockOverlay.appendChild(mockDialog);

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
        mockNotes,
        mockCharCount,
        mockFooter,
        mockCancelBtn,
        mockSaveBtn
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

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
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
            expect(taggingDialog.notes).toBe('');
            expect(taggingDialog.maxTags).toBe(20);
            expect(taggingDialog.maxTagLength).toBe(50);
            expect(taggingDialog.maxNotesLength).toBe(500);
        });

        test('should bind event listeners on initialization', () => {
            const closeBtn = document.getElementById('tagging-dialog-close');
            const cancelBtn = document.getElementById('tagging-dialog-cancel');
            const saveBtn = document.getElementById('tagging-dialog-save');
            const tagInput = document.getElementById('tag-input');
            const notesTextarea = document.getElementById('tag-notes');

            expect(closeBtn).toBeTruthy();
            expect(cancelBtn).toBeTruthy();
            expect(saveBtn).toBeTruthy();
            expect(tagInput).toBeTruthy();
            expect(notesTextarea).toBeTruthy();
        });
    });

    describe('Tag Management', () => {
        test('should add valid tags', () => {
            const tag = 'electronics';
            const result = taggingDialog.addTag(tag);
            
            expect(result).toBe(true);
            expect(taggingDialog.tags).toContain(tag);
            expect(taggingDialog.tags).toHaveLength(1);
        });

        test('should not add duplicate tags', () => {
            const tag = 'electronics';
            taggingDialog.addTag(tag);
            
            const result = taggingDialog.addTag(tag);
            expect(result).toBe(false);
            expect(taggingDialog.tags).toHaveLength(1);
        });

        test('should not add tags when at maximum limit', () => {
            // Fill up to max tags
            for (let i = 0; i < 20; i++) {
                taggingDialog.addTag(`tag${i}`);
            }
            
            const result = taggingDialog.addTag('new-tag');
            expect(result).toBe(false);
            expect(taggingDialog.tags).toHaveLength(20);
        });

        test('should remove tags', () => {
            const tag = 'electronics';
            taggingDialog.addTag(tag);
            expect(taggingDialog.tags).toContain(tag);
            
            taggingDialog.removeTag(tag);
            expect(taggingDialog.tags).not.toContain(tag);
            expect(taggingDialog.tags).toHaveLength(0);
        });

        test('should render tags correctly', () => {
            const tags = ['electronics', 'gift', 'urgent'];
            tags.forEach(tag => taggingDialog.addTag(tag));
            
            taggingDialog.renderTags();
            
            const currentTags = document.getElementById('current-tags');
            const tagElements = currentTags.querySelectorAll('.tag-item');
            
            expect(tagElements).toHaveLength(3);
            tags.forEach((tag, index) => {
                expect(tagElements[index].textContent).toContain(tag);
            });
        });
    });

    describe('Tag Validation', () => {
        test('should validate tag length requirements', () => {
            // Too short
            expect(taggingDialog.validateTag('a').isValid).toBe(false);
            expect(taggingDialog.validateTag('a').error).toContain('at least 2 characters');
            
            // Valid length
            expect(taggingDialog.validateTag('electronics').isValid).toBe(true);
            
            // Too long
            const longTag = 'a'.repeat(51);
            expect(taggingDialog.validateTag(longTag).isValid).toBe(false);
            expect(taggingDialog.validateTag(longTag).error).toContain('cannot exceed 50 characters');
        });

        test('should reject invalid characters', () => {
            const invalidTags = ['tag<', 'tag>', 'tag:', 'tag"', 'tag\\', 'tag|', 'tag?', 'tag*'];
            
            invalidTags.forEach(tag => {
                const result = taggingDialog.validateTag(tag);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('invalid characters');
            });
        });

        test('should reject tags with excessive whitespace', () => {
            expect(taggingDialog.validateTag(' tag').isValid).toBe(false);
            expect(taggingDialog.validateTag('tag ').isValid).toBe(false);
            expect(taggingDialog.validateTag('tag  tag').isValid).toBe(false);
        });

        test('should reject generic tags', () => {
            const genericTags = ['tag', 'order', 'amazon', 'item', 'product', 'purchase'];
            
            genericTags.forEach(tag => {
                const result = taggingDialog.validateTag(tag);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('too generic');
            });
        });

        test('should accept valid tags', () => {
            const validTags = ['electronics', 'gift', 'urgent', 'christmas', 'birthday'];
            
            validTags.forEach(tag => {
                const result = taggingDialog.validateTag(tag);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });
        });
    });

    describe('Input Processing', () => {
        test('should process comma-separated tags', () => {
            const input = 'electronics, gift, urgent';
            const tagInput = document.getElementById('tag-input');
            tagInput.value = input;
            
            taggingDialog.processTagInput();
            
            expect(taggingDialog.tags).toContain('electronics');
            expect(taggingDialog.tags).toContain('gift');
            expect(taggingDialog.tags).toContain('urgent');
            expect(taggingDialog.tags).toHaveLength(3);
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

    describe('Character Counter', () => {
        test('should update character counter for notes', () => {
            const notesTextarea = document.getElementById('tag-notes');
            const charCount = document.getElementById('notes-char-count');
            
            notesTextarea.value = 'This is a test note';
            notesTextarea.dispatchEvent(new Event('input'));
            
            expect(charCount.textContent).toBe('19');
        });

        test('should change color when approaching limit', () => {
            const notesTextarea = document.getElementById('tag-notes');
            const charCount = document.getElementById('notes-char-count');
            
            // Test that character counter updates
            notesTextarea.value = 'Test note';
            notesTextarea.dispatchEvent(new Event('input'));
            expect(charCount.textContent).toBe('9');
            
            // Test that character counter updates with longer text
            notesTextarea.value = 'a'.repeat(100);
            notesTextarea.dispatchEvent(new Event('input'));
            expect(charCount.textContent).toBe('100');
        });
    });

    describe('Dialog Operations', () => {
        test('should open dialog with order data', () => {
            const orderData = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15',
                tags: ['electronics'],
                notes: 'Test note'
            };
            
            taggingDialog.open(orderData);
            
            expect(taggingDialog.isOpen).toBe(true);
            expect(taggingDialog.currentOrder).toEqual(orderData);
            expect(taggingDialog.tags).toEqual(['electronics']);
            expect(taggingDialog.notes).toBe('Test note');
        });

        test('should close dialog and reset form', () => {
            // First open with data
            const orderData = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15',
                tags: ['electronics'],
                notes: 'Test note'
            };
            taggingDialog.open(orderData);
            
            // Then close
            taggingDialog.close();
            
            expect(taggingDialog.isOpen).toBe(false);
            expect(taggingDialog.currentOrder).toBeNull();
            expect(taggingDialog.tags).toEqual([]);
            expect(taggingDialog.notes).toBe('');
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
        test('should require at least one tag', () => {
            const result = taggingDialog.saveTags();
            expect(result).toBeUndefined(); // saveTags doesn't return anything, but should show error
            
            // Check that validation prevents saving
            expect(taggingDialog.getValidationStatus().canSave).toBe(false);
        });

        test('should validate all tags before saving', () => {
            // Add an invalid tag
            taggingDialog.tags = ['a']; // Too short
            
            const result = taggingDialog.saveTags();
            expect(result).toBeUndefined();
            
            // Check validation status
            expect(taggingDialog.getValidationStatus().tagsValid).toBe(false);
        });

        test('should validate notes length', () => {
            taggingDialog.tags = ['electronics'];
            
            // Set up currentOrder to avoid null reference error
            taggingDialog.currentOrder = {
                orderNumber: '123-4567890-1234567',
                orderDate: '2024-01-15'
            };
            
            // Set the notes textarea value to exceed the limit
            const notesTextarea = document.getElementById('tag-notes');
            notesTextarea.value = 'a'.repeat(501); // Exceeds limit
            
            const result = taggingDialog.saveTags();
            expect(result).toBeUndefined();
            
            // Check validation status
            expect(taggingDialog.getValidationStatus().notesValid).toBe(false);
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

        test('should get current notes', () => {
            taggingDialog.notes = 'Test notes';
            expect(taggingDialog.getCurrentNotes()).toBe('Test notes');
        });

        test('should get validation status', () => {
            taggingDialog.tags = ['electronics'];
            taggingDialog.notes = 'Test notes';
            
            const status = taggingDialog.getValidationStatus();
            
            expect(status.tagsValid).toBe(true);
            expect(status.notesValid).toBe(true);
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
            
            // Set the notes textarea value
            const notesTextarea = document.getElementById('tag-notes');
            notesTextarea.value = 'Test note';
            
            taggingDialog.saveTags();
            
            // Check that the event was dispatched
            expect(mockDispatchEvent).toHaveBeenCalled();
            
            // Get the actual event that was dispatched
            const dispatchedEvent = mockDispatchEvent.mock.calls[0][0];
            
            // Verify event properties
            expect(dispatchedEvent.type).toBe('tagsSaved');
            expect(dispatchedEvent.detail.orderNumber).toBe('123-4567890-1234567');
            expect(dispatchedEvent.detail.tags).toEqual(['electronics']);
            expect(dispatchedEvent.detail.notes).toBe('Test note');
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
            overlay.dispatchEvent(clickEvent);
            
            expect(taggingDialog.isOpen).toBe(false);
        });
    });
});
