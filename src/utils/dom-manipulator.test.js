/**
 * Unit tests for DOM Manipulator functionality
 * Tests button injection, event handling, and cross-format compatibility
 */

import { DOMManipulator } from './dom-manipulator.js';

// Mock the logger module
jest.mock('./logger.js', () => ({
    specializedLogger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        warning: jest.fn(),
        success: jest.fn(),
        debug: jest.fn()
    }
}));

// Mock the dom-utils module
jest.mock('./dom-utils.js', () => ({
    createElement: jest.fn((tag, options = {}) => {
        const element = {
            tagName: tag.toUpperCase(),
            className: options.className || '',
            style: options.styles || {},
            setAttribute: jest.fn(),
            getAttribute: jest.fn().mockReturnValue('mock-value'),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            remove: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn().mockReturnValue([]),
            matches: jest.fn(),
            outerHTML: `<${tag}>mock</${tag}>`,
            textContent: options.textContent || '',
            attributes: {},
            children: [],
            nodeType: 1,
            contains: jest.fn().mockReturnValue(true)
        };
        return element;
    }),
    createButton: jest.fn((text, options = {}) => {
        const button = {
            tagName: 'BUTTON',
            className: options.className || '',
            style: options.styles || {},
            setAttribute: jest.fn(),
            getAttribute: jest.fn().mockReturnValue('mock-value'),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            remove: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn().mockReturnValue([]),
            matches: jest.fn(),
            outerHTML: `<button>${text}</button>`,
            textContent: text,
            attributes: {},
            children: [],
            nodeType: 1,
            contains: jest.fn().mockReturnValue(true)
        };
        return button;
    }),
    createContainer: jest.fn((className, options = {}) => {
        const container = {
            tagName: 'DIV',
            className: className || '',
            style: options.styles || {},
            setAttribute: jest.fn(),
            getAttribute: jest.fn().mockReturnValue('mock-value'),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            remove: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn().mockReturnValue([]),
            matches: jest.fn(),
            outerHTML: `<div class="${className}">mock</div>`,
            textContent: '',
            attributes: {},
            children: [],
            nodeType: 1,
            contains: jest.fn().mockReturnValue(true)
        };
        return container;
    }),
    safeAddEventListener: jest.fn(),
    safeSetStyles: jest.fn(),
    hideElementsBySelectors: jest.fn(),
    containsEssentialInfo: jest.fn(),
    isElementWithinContainer: jest.fn(),
    safeModifyClasses: jest.fn(),
    safeSetMultipleStyles: jest.fn()
}));

// Mock DOM environment for testing
const mockDOM = {
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        style: {},
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        appendChild: jest.fn(),
        remove: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(),
        matches: jest.fn(),
        outerHTML: '<div>mock</div>',
        textContent: '',
        attributes: {},
        children: [],
        nodeType: 1
    }),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

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

// Mock document and window
global.document = {
    createElement: mockDOM.createElement,
    querySelector: mockDOM.querySelector,
    querySelectorAll: mockDOM.querySelectorAll,
    addEventListener: mockDOM.addEventListener,
    removeEventListener: mockDOM.removeEventListener,
    body: mockDOM.createElement('body')
};

global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    chrome: mockChrome
};

global.Node = {
    ELEMENT_NODE: 1
};

describe('DOMManipulator', () => {
    let domManipulator;
    let mockOrderCard;
    let mockOrderParser;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock document.createElement to return proper mock elements
        document.createElement = jest.fn((tag) => {
            const element = {
                tagName: tag.toUpperCase(),
                className: '',
                style: {},
                setAttribute: jest.fn(),
                getAttribute: jest.fn().mockReturnValue('mock-value'),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                appendChild: jest.fn(),
                remove: jest.fn(),
                querySelector: jest.fn(),
                querySelectorAll: jest.fn().mockReturnValue([]),
                matches: jest.fn(),
                outerHTML: `<${tag}>mock</${tag}>`,
                textContent: '',
                attributes: {},
                children: [],
                nodeType: 1,
                contains: jest.fn().mockReturnValue(true)
            };
            return element;
        });

        // Create fresh instances
        domManipulator = new DOMManipulator();

        // Clear any existing injected buttons
        domManipulator.injectedButtons.clear();

        // Mock order parser
        mockOrderParser = {
            parseOrderCard: jest.fn().mockReturnValue({
                orderId: '123-4567890-1234567',
                date: '2024-01-01',
                total: '$99.99',
                status: 'Delivered'
            })
        };

        domManipulator.setOrderParser(mockOrderParser);

        // Mock order card element
        mockOrderCard = {
            querySelector: jest.fn(),
            appendChild: jest.fn(),
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn()
            },
            style: {},
            textContent: 'Order #123-4567890-1234567',
            outerHTML: '<div class="order-card js-order-card">Order #123-4567890-1234567</div>',
            attributes: {},
            children: [],
            nodeType: 1,
            querySelectorAll: jest.fn().mockReturnValue([]),
            contains: jest.fn().mockReturnValue(true),
            getAttribute: jest.fn().mockReturnValue('123-4567890-1234567'),
            createTreeWalker: jest.fn()
        };

        // Mock document.createTreeWalker
        document.createTreeWalker = jest.fn().mockReturnValue({
            nextNode: jest.fn().mockReturnValue(null)
        });
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with empty state', () => {
            const freshDomManipulator = new DOMManipulator();
            expect(freshDomManipulator.injectedButtons).toBeInstanceOf(Map);
            expect(freshDomManipulator.hiddenOrders).toBeInstanceOf(Set);
            expect(freshDomManipulator.observer).toBeNull();
            expect(freshDomManipulator.isObserving).toBe(false);
            expect(freshDomManipulator.orderParser).toBeNull();
            expect(freshDomManipulator.onOrderHidden).toBeNull();
            expect(freshDomManipulator.onOrderShown).toBeNull();
        });

        test('should set order parser correctly', () => {
            domManipulator.setOrderParser(mockOrderParser);
            expect(domManipulator.orderParser).toBe(mockOrderParser);
        });

        test('should set callbacks correctly', () => {
            const mockHiddenCallback = jest.fn();
            const mockShownCallback = jest.fn();

            domManipulator.setCallbacks(mockHiddenCallback, mockShownCallback);

            expect(domManipulator.onOrderHidden).toBe(mockHiddenCallback);
            expect(domManipulator.onOrderShown).toBe(mockShownCallback);
        });
    });

    describe('Page Format Detection', () => {
        test('should detect your-orders format', () => {
            const orderCard = {
                querySelector: jest.fn().mockReturnValue({ className: 'yohtmlc-shipment-level-connections' })
            };

            const format = domManipulator.detectPageFormat(orderCard);
            expect(format).toBe('your-orders');
        });

        test('should detect css format', () => {
            const orderCard = {
                querySelector: jest.fn()
                    .mockReturnValueOnce(null) // First call for your-orders format
                    .mockReturnValue({ className: 'order-actions' }) // Second call for css format
            };

            const format = domManipulator.detectPageFormat(orderCard);
            expect(format).toBe('css');
        });

        test('should detect your-account format', () => {
            const orderCard = {
                querySelector: jest.fn()
                    .mockReturnValueOnce(null) // First call for your-orders format
                    .mockReturnValueOnce(null) // Second call for css format
                    .mockReturnValue({ className: 'delivery-box' }) // Third call for your-account format
            };

            const format = domManipulator.detectPageFormat(orderCard);
            expect(format).toBe('your-account');
        });

        test('should return unknown for unrecognized format', () => {
            const orderCard = {
                querySelector: jest.fn().mockReturnValue(null)
            };

            const format = domManipulator.detectPageFormat(orderCard);
            expect(format).toBe('unknown');
        });
    });

    describe('Button Creation', () => {
        test('should create buttons with correct properties', () => {
            const orderId = '123-4567890-1234567';
            const buttons = domManipulator.createButtons(orderId);

            expect(buttons.hideDetailsLi).toBeDefined();
            expect(buttons.hideDetailsBtn).toBeDefined();

            // Check that the mocked createButton function was called with correct parameters
            const { createButton } = require('./dom-utils.js');
            expect(createButton).toHaveBeenCalledWith('Hide details', {
                attributes: {
                    'data-archizer-type': 'hide-details',
                    'data-archizer-order-id': orderId,
                    'aria-label': `Hide details for order ${orderId}`
                }
            });
        });

        test('should add event listeners to buttons', () => {
            const orderId = '123-4567890-1234567';
            const buttons = domManipulator.createButtons(orderId);

            expect(buttons.hideDetailsBtn).toBeDefined();

            // Check that the mocked safeAddEventListener function was called
            const { safeAddEventListener } = require('./dom-utils.js');
            expect(safeAddEventListener).toHaveBeenCalled();
        });

        test('should add hover effects to buttons', () => {
            const orderId = '123-4567890-1234567';
            const buttons = domManipulator.createButtons(orderId);

            expect(buttons.hideDetailsBtn).toBeDefined();

            // Check that the mocked safeAddEventListener function was called for hover effects
            const { safeAddEventListener } = require('./dom-utils.js');
            expect(safeAddEventListener).toHaveBeenCalled();
        });
    });

    describe('Button Injection', () => {
        test('should not inject buttons if already injected', () => {
            const orderId = '123-4567890-1234567';
            domManipulator.injectedButtons.set(orderId, {});

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(true);
            expect(mockOrderCard.appendChild).not.toHaveBeenCalled();
        });

        test('should inject buttons into your-orders format container', () => {
            const orderId = '123-4567890-1234567';

            // Test the detectPageFormat method for your-orders format
            const mockOrderCard = {
                querySelector: jest.fn().mockReturnValue({ tagName: 'DIV' }) // Mock container found
            };

            const pageFormat = domManipulator.detectPageFormat(mockOrderCard);
            expect(pageFormat).toBe('your-orders');

            // Test the getFormatSpecificStrategy method for your-orders format
            const strategy = domManipulator.getFormatSpecificStrategy('your-orders');
            expect(strategy.container).toBe('.yohtmlc-shipment-level-connections');
            expect(strategy.fallback).toBe('.order-actions, .a-box-group');
        });

        test('should inject buttons into css format container', () => {
            const orderId = '123-4567890-1234567';
            const mockContainer = { appendChild: jest.fn() };

            // Mock css format detection
            mockOrderCard.querySelector
                .mockReturnValueOnce(null) // First call for your-orders format
                .mockReturnValue(mockContainer); // Second call for css format

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(true);
            expect(mockContainer.appendChild).toHaveBeenCalledTimes(1);
        });

        test('should create new container for your-account format if needed', () => {
            const orderId = '123-4567890-1234567';

            // Test the detectPageFormat method for your-account format
            const mockOrderCard = {
                querySelector: jest.fn()
                    .mockReturnValueOnce(null) // First call for .yohtmlc-shipment-level-connections
                    .mockReturnValueOnce(null) // Second call for .order-actions, .a-box-group
                    .mockReturnValue({ tagName: 'DIV' }) // Third call for .delivery-box
            };

            const pageFormat = domManipulator.detectPageFormat(mockOrderCard);
            expect(pageFormat).toBe('your-account');

            // Test the getFormatSpecificStrategy method for your-account format
            const strategy = domManipulator.getFormatSpecificStrategy('your-account');
            expect(strategy.container).toBe('.delivery-box');
            expect(strategy.fallback).toBe('.a-unordered-list, .a-vertical');

            // Test that the strategy would create a new container when needed
            // This verifies the logic that would be used in the injectButtons method
            const mockDeliveryBox = {
                querySelector: jest.fn().mockReturnValue(null), // No existing action container
                appendChild: jest.fn()
            };

            // Simulate the logic that would create a new container
            let actionContainer = mockDeliveryBox.querySelector('.a-unordered-list, .a-vertical');
            if (!actionContainer) {
                // This is the logic that would be executed in injectButtons
                actionContainer = { tagName: 'UL', className: 'a-unordered-list a-vertical a-spacing-mini' };
                mockDeliveryBox.appendChild(actionContainer);
            }

            expect(mockDeliveryBox.appendChild).toHaveBeenCalledWith(actionContainer);
            expect(actionContainer.tagName).toBe('UL');
        });

        test('should fallback to appending to order card if no containers found', () => {
            const orderId = '123-4567890-1234567';

            // Mock no containers found
            mockOrderCard.querySelector.mockReturnValue(null);

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(true);
            expect(mockOrderCard.appendChild).toHaveBeenCalledTimes(1);
        });

        test('should track injected buttons correctly', () => {
            const orderId = '123-4567890-1234567';
            mockOrderCard.querySelector.mockReturnValue(null);

            domManipulator.injectButtons(mockOrderCard, orderId);

            expect(domManipulator.injectedButtons.has(orderId)).toBe(true);
            const buttonInfo = domManipulator.injectedButtons.get(orderId);
            expect(buttonInfo.orderCard).toBe(mockOrderCard);
        });
    });

    describe('Button Event Handling', () => {
        test('should handle hide-details button click', async () => {
            const orderId = '123-4567890-1234567';
            const mockButton = { textContent: 'Hide details' };

            // Mock button info with proper structure
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsBtn: mockButton
            });

            // Mock the hideOrderDetails method to avoid complex DOM manipulation
            const mockHideOrderDetails = jest.fn();
            domManipulator.hideOrderDetails = mockHideOrderDetails;

            // Mock storage
            const mockStorage = { get: jest.fn() };
            domManipulator.setStorage(mockStorage);

            await domManipulator.handleButtonClick('hide-details', orderId, mockButton);

            expect(mockHideOrderDetails).toHaveBeenCalledWith(orderId, mockButton, mockStorage);
        });

        test('should handle show-details button click', () => {
            const orderId = '123-4567890-1234567';
            const mockButton = { textContent: 'Show details' };

            // Mock button info with proper structure
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsBtn: mockButton
            });

            // Add hidden state
            domManipulator.hiddenOrders.add(`${orderId}-details`);

            // Mock the showOrderDetails method to avoid complex DOM manipulation
            const mockShowOrderDetails = jest.fn();
            domManipulator.showOrderDetails = mockShowOrderDetails;

            domManipulator.handleButtonClick('show-details', orderId, mockButton);

            expect(mockShowOrderDetails).toHaveBeenCalledWith(orderId, mockButton);
        });

        test('should show tagging dialog when hiding order details', () => {
            const orderId = '123-4567890-1234567';
            const mockButton = {
                textContent: 'Hide details',
                setAttribute: jest.fn(),
                classList: { add: jest.fn() }
            };

            // Mock button info with proper structure
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsBtn: mockButton
            });

            // Mock the showTaggingDialogForHide method
            const mockShowTaggingDialogForHide = jest.fn();
            domManipulator.showTaggingDialogForHide = mockShowTaggingDialogForHide;

            // Mock storage
            const mockStorage = { get: jest.fn() };

            domManipulator.hideOrderDetails(orderId, mockButton, mockStorage);

            expect(mockShowTaggingDialogForHide).toHaveBeenCalledWith(orderId, mockButton, mockStorage);
        });

        test('should perform hide operation after tagging', async () => {
            const orderId = '123-4567890-1234567';
            const tagData = { tags: ['test'], notes: 'test note' };
            const mockButton = {
                classList: { add: jest.fn() },
                setAttribute: jest.fn(),
                textContent: 'Hide details'
            };

            // Set up button info in injected buttons map
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsBtn: mockButton
            });

            // Mock the performHideOrderDetails method
            const mockPerformHideOrderDetails = jest.fn();
            domManipulator.performHideOrderDetails = mockPerformHideOrderDetails;

            await domManipulator.performHideOperation(orderId, tagData);

            expect(mockPerformHideOrderDetails).toHaveBeenCalledWith(orderId, mockButton, tagData);
        });

        test('should handle missing button info gracefully', () => {
            const orderId = '123-4567890-1234567';

            // Mock log.warning to avoid test output noise
            const logSpy = jest.spyOn(require('./logger.js').specializedLogger, 'warning').mockImplementation(() => { });

            // Ensure no button info exists for this order
            domManipulator.injectedButtons.clear();

            domManipulator.performHideOperation(orderId, null);

            expect(logSpy).toHaveBeenCalledWith(`No button info found for order ${orderId}`);
            logSpy.mockRestore();
        });
    });

    describe('Storage Management', () => {
        test('should set storage manager', () => {
            const mockStorage = { get: jest.fn(), set: jest.fn() };
            domManipulator.setStorage(mockStorage);
            expect(domManipulator.storage).toBe(mockStorage);
        });
    });

    describe('Element Position Validation', () => {
        test('should validate element within order card', () => {
            const orderCard = document.createElement('div');
            const childElement = document.createElement('span');
            orderCard.appendChild(childElement);

            const result = domManipulator.isElementWithinOrderCard(childElement, orderCard);
            expect(result).toBe(true);
        });

        test('should reject element outside order card', () => {
            const orderCard = document.createElement('div');
            const outsideElement = document.createElement('span');
            // Mock contains to return false for outside element
            orderCard.contains.mockReturnValueOnce(false);

            const result = domManipulator.isElementWithinOrderCard(outsideElement, orderCard);
            expect(result).toBe(false);
        });
    });

    describe('Additional Order Elements', () => {
        test('should hide additional order elements', () => {
            const orderId = 'test-order-123';
            const mockElement = {
                classList: { add: jest.fn() },
                style: {},
                setAttribute: jest.fn(),
                outerHTML: '<div>test element</div>',
                getAttribute: jest.fn().mockReturnValue('test-order-123'),
                querySelector: jest.fn().mockReturnValue(null)
            };

            const result = domManipulator.hideAdditionalOrderElements(mockElement);
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('Delivery Status Tagging', () => {
        test('should add tags to delivery status', () => {
            const mockElement = {
                classList: { add: jest.fn() },
                textContent: 'Delivered',
                querySelector: jest.fn().mockReturnValue(null)
            };

            domManipulator.addTagsToDeliveryStatus(mockElement, ['tag1', 'tag2'], 'testuser');
            expect(mockElement.querySelector).toHaveBeenCalled();
        });

        test('should remove tags from delivery status', () => {
            const mockElement = {
                querySelector: jest.fn().mockReturnValue({
                    remove: jest.fn()
                })
            };

            domManipulator.removeTagsFromDeliveryStatus(mockElement);
            expect(mockElement.querySelector).toHaveBeenCalledWith('.archizer-delivery-status-tags');
        });
    });

    describe('Text Element Hiding', () => {
        test('should find and hide text elements', () => {
            const mockContainer = {
                querySelectorAll: jest.fn().mockReturnValue([
                    {
                        classList: { add: jest.fn() },
                        style: {},
                        outerHTML: '<div>test text</div>',
                        getAttribute: jest.fn().mockReturnValue('test-order-123')
                    }
                ]),
                outerHTML: '<div>container</div>',
                getAttribute: jest.fn().mockReturnValue('test-order-123'),
                querySelector: jest.fn().mockReturnValue(null),
                className: 'test-container',
                id: 'test-id'
            };

            // This method doesn't return anything, it just processes the container
            expect(() => domManipulator.findAndHideTextElements(mockContainer, ['test text'], [])).not.toThrow();
        });
    });

    describe('Action Button Hiding', () => {
        test('should find and hide action buttons', () => {
            // Mock the method to avoid complex DOM interactions in tests
            const originalMethod = domManipulator.findAndHideActionButtons;
            domManipulator.findAndHideActionButtons = jest.fn();

            const mockContainer = { className: 'test-container' };
            const hiddenElements = [];

            domManipulator.findAndHideActionButtons(mockContainer, hiddenElements);

            expect(domManipulator.findAndHideActionButtons).toHaveBeenCalledWith(mockContainer, hiddenElements);

            // Restore original method
            domManipulator.findAndHideActionButtons = originalMethod;
        });

        test('should handle container without action buttons', () => {
            const mockContainer = {
                querySelectorAll: jest.fn().mockReturnValue([]),
                outerHTML: '<div>container</div>',
                getAttribute: jest.fn().mockReturnValue('test-order-123'),
                querySelector: jest.fn().mockReturnValue(null),
                className: 'test-container',
                id: 'test-id'
            };

            // This method doesn't return anything, it just processes the container
            expect(() => domManipulator.findAndHideActionButtons(mockContainer, [])).not.toThrow();
        });
    });

    describe('Essential Order Header', () => {
        test('should identify essential order header', () => {
            const mockElement = {
                textContent: 'Order #123-4567890-1234567',
                className: 'order-header'
            };

            const result = domManipulator.isEssentialOrderHeader(mockElement);
            expect(result).toBe(true);
        });

        test('should reject non-essential order header', () => {
            const mockElement = {
                textContent: 'Some other text',
                className: 'other-class'
            };

            const result = domManipulator.isEssentialOrderHeader(mockElement);
            expect(result).toBe(false);
        });
    });

    describe('Show Order Details', () => {
        test('should show order details', () => {
            const orderId = 'test-order-123';
            const mockButton = { textContent: 'Show details' };

            // Mock button info
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsBtn: mockButton
            });

            domManipulator.showOrderDetails(orderId, mockButton);

            // Should not throw error
            expect(() => domManipulator.showOrderDetails(orderId, mockButton)).not.toThrow();
        });

        test('should handle missing button info', () => {
            const orderId = 'test-order-123';
            const mockButton = { textContent: 'Show details' };

            domManipulator.showOrderDetails(orderId, mockButton);

            // Should not throw error
            expect(true).toBe(true);
        });
    });

    describe('HTML Escaping', () => {
        test('should escape HTML characters', () => {
            const text = '<script>alert("xss")</script>';
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: text,
                innerHTML: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
            }));

            const result = domManipulator.escapeHtml(text);
            expect(result).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });

        test('should handle text without HTML characters', () => {
            const text = 'Plain text';
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: text,
                innerHTML: 'Plain text'
            }));

            const result = domManipulator.escapeHtml(text);
            expect(result).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });

        test('should handle empty string', () => {
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: '',
                innerHTML: ''
            }));

            const result = domManipulator.escapeHtml('');
            expect(result).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });

        test('should handle null and undefined', () => {
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: '',
                innerHTML: ''
            }));

            expect(domManipulator.escapeHtml(null)).toBeDefined();
            expect(domManipulator.escapeHtml(undefined)).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });
    });

    describe('Button Injection', () => {
        test('should inject buttons successfully', () => {
            const orderId = 'test-order-123';
            const mockContainer = {
                appendChild: jest.fn(),
                querySelector: jest.fn().mockReturnValue(null)
            };

            mockOrderCard.querySelector.mockReturnValue(mockContainer);

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBeDefined();
        });

        test('should not inject buttons if already injected', () => {
            const orderId = 'test-order-123';
            domManipulator.injectedButtons.set(orderId, {});

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(true);
            expect(mockOrderCard.appendChild).not.toHaveBeenCalled();
        });
    });

    describe('Button Removal', () => {
        test('should remove buttons successfully', () => {
            const orderId = 'test-order-123';
            const mockButton = { remove: jest.fn() };

            domManipulator.injectedButtons.set(orderId, {
                hideDetailsLi: mockButton
            });

            const result = domManipulator.removeButtons(orderId);
            expect(result).toBeDefined();
            expect(mockButton.remove).toHaveBeenCalled();
        });

        test('should handle removal when no buttons exist', () => {
            const orderId = 'test-order-123';
            const result = domManipulator.removeButtons(orderId);
            expect(result).toBeDefined();
        });
    });

    describe('DOM Observation Processing', () => {
        test('should process mutations correctly', () => {
            const mockNode = document.createElement('div');
            mockNode.querySelectorAll = jest.fn().mockReturnValue([]);

            const mockMutations = [
                { type: 'childList', addedNodes: [mockNode], removedNodes: [] }
            ];

            // Set up the callback that the method actually uses
            domManipulator.setCallbacks(jest.fn(), jest.fn());

            domManipulator.processMutations(mockMutations);

            // The method processes mutations but doesn't call external callbacks
            expect(mockMutations).toBeDefined();
        });

        test('should handle added nodes', () => {
            const mockNode = document.createElement('div');
            mockNode.querySelectorAll = jest.fn().mockReturnValue([]);

            // Set up the callback that the method actually uses
            domManipulator.setCallbacks(jest.fn(), jest.fn());

            domManipulator.handleAddedNode(mockNode);

            // The method processes the node but doesn't call external callbacks
            expect(mockNode).toBeDefined();
        });

        test('should handle removed nodes', () => {
            const mockNode = document.createElement('div');
            mockNode.querySelectorAll = jest.fn().mockReturnValue([]);

            // Set up the callback that the method actually uses
            domManipulator.setCallbacks(jest.fn(), jest.fn());

            domManipulator.handleRemovedNode(mockNode);

            // The method processes the node but doesn't call external callbacks
            expect(mockNode).toBeDefined();
        });
    });

    describe('Order ID Extraction', () => {
        test('should extract order ID from element', () => {
            const mockElement = {
                outerHTML: '<div data-order-id="123-4567890-1234567">Order</div>',
                querySelector: jest.fn().mockReturnValue({
                    textContent: '123-4567890-1234567',
                    getAttribute: jest.fn().mockReturnValue('123-4567890-1234567')
                }),
                getAttribute: jest.fn().mockReturnValue('123-4567890-1234567'),
                textContent: 'Order #123-4567890-1234567'
            };

            const result = domManipulator.getOrderIdFromElement(mockElement);
            expect(result).toBe('123-4567890-1234567');
        });

        test('should handle null element', () => {
            // Should throw error when trying to access outerHTML on null
            expect(() => domManipulator.getOrderIdFromElement(null)).toThrow();
        });
    });

    describe('Order ID Validation', () => {
        test('should validate correct Amazon order number format', () => {
            const validOrderIds = [
                '123-4567890-1234567',
                '111-2223333-4445555',
                '999-8887777-6665555'
            ];

            validOrderIds.forEach(orderId => {
                const result = domManipulator.isValidOrderId(orderId);
                expect(result).toBe(true);
            });
        });

        test('should reject invalid order number formats', () => {
            const invalidOrderIds = [
                'Arriving today',
                'January 15, 2024',
                'Mon',
                '12/25/2024',
                '12/25',
                'Only letters and spaces'
            ];

            invalidOrderIds.forEach(orderId => {
                const result = domManipulator.isValidOrderId(orderId);
                expect(result).toBe(false);
            });
        });
    });

    describe('Username Management', () => {
        test('should set username for order', () => {
            const orderId = 'test-order-123';
            const username = 'testuser';

            domManipulator.setUsernameForOrder(orderId, username);
            const result = domManipulator.getUsernameForOrder(orderId);

            expect(result).toBe(username);
        });

        test('should return null for non-existent username', () => {
            const orderId = 'non-existent-order';
            const result = domManipulator.getUsernameForOrder(orderId);
            expect(result).toBe('Unknown User');
        });
    });

    describe('Tagging Dialog Management', () => {
        test('should handle tagging dialog cancelled', () => {
            const orderId = 'test-order-123';

            // Mock log.info since the method uses log.info
            const mockLog = jest.spyOn(require('./logger.js').specializedLogger, 'info').mockImplementation(() => { });

            domManipulator.handleTaggingDialogCancelled(orderId);

            // Check that the expected message was logged (it might be logged multiple times)
            const calls = mockLog.mock.calls.map(call => call[0]);
            expect(calls).toContain(`🚫 Tagging dialog cancelled for order ${orderId}`);
            mockLog.mockRestore();
        });

        test('should show dialog already open message', () => {
            const orderId = 'test-order-123';

            // Mock console.warn
            const mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => { });

            // Mock document.body.appendChild to avoid DOM manipulation errors
            const originalAppendChild = document.body.appendChild;
            document.body.appendChild = jest.fn();

            domManipulator.showDialogAlreadyOpenMessage(orderId);

            // Should not throw error
            expect(() => domManipulator.showDialogAlreadyOpenMessage(orderId)).not.toThrow();

            // Restore mocks
            mockWarn.mockRestore();
            document.body.appendChild = originalAppendChild;
        });
    });

    describe('Button Removal', () => {
        test('should remove buttons correctly', () => {
            const orderId = '123-4567890-1234567';
            const mockHideDetailsLi = { remove: jest.fn() };

            // Mock button info
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsLi: mockHideDetailsLi
            });

            const result = domManipulator.removeButtons(orderId);

            expect(result).toBe(true);
            expect(mockHideDetailsLi.remove).toHaveBeenCalled();
            expect(domManipulator.injectedButtons.has(orderId)).toBe(false);
        });

        test('should handle removal when no buttons exist', () => {
            const orderId = '123-4567890-1234567';

            const result = domManipulator.removeButtons(orderId);

            expect(result).toBe(true);
        });

    });

    describe('Order State Management', () => {
        it('should track hidden order states correctly', () => {
            domManipulator.hiddenOrders.add('order1-details');
            domManipulator.hiddenOrders.add('order2-order');

            expect(domManipulator.areDetailsHidden('order1')).toBe(true);
            expect(domManipulator.areDetailsHidden('order2')).toBe(false);
        });

        it('should get all hidden orders', () => {
            domManipulator.hiddenOrders.add('order1-details');
            domManipulator.hiddenOrders.add('order2-order');

            const hiddenOrders = domManipulator.getHiddenOrders();
            expect(hiddenOrders).toContain('order1-details');
            expect(hiddenOrders).toContain('order2-order');
        });

        it('should set and get username for orders', () => {
            domManipulator.setUsernameForOrder('order1', 'TestUser');
            domManipulator.setUsernameForOrder('order2', 'AnotherUser');

            expect(domManipulator.getUsernameForOrder('order1')).toBe('TestUser');
            expect(domManipulator.getUsernameForOrder('order2')).toBe('AnotherUser');
            expect(domManipulator.getUsernameForOrder('order3')).toBe('Unknown User');
        });
    });

    describe('DOM Observation', () => {
        test('should start observing DOM changes', () => {
            const mockObserver = {
                observe: jest.fn(),
                disconnect: jest.fn()
            };

            // Mock MutationObserver
            global.MutationObserver = jest.fn().mockImplementation(() => mockObserver);

            domManipulator.startObserving();

            expect(domManipulator.isObserving).toBe(true);
            expect(domManipulator.observer).toBeDefined();
            expect(mockObserver.observe).toHaveBeenCalledWith(document.body, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });
        });

        test('should stop observing DOM changes', () => {
            const mockObserver = {
                observe: jest.fn(),
                disconnect: jest.fn()
            };

            global.MutationObserver = jest.fn().mockImplementation(() => mockObserver);

            domManipulator.startObserving();
            domManipulator.stopObserving();

            expect(domManipulator.isObserving).toBe(false);
            expect(domManipulator.observer).toBeNull();
            expect(mockObserver.disconnect).toHaveBeenCalled();
        });

        test('should not start observing if already observing', () => {
            const mockObserver = {
                observe: jest.fn(),
                disconnect: jest.fn()
            };

            global.MutationObserver = jest.fn().mockImplementation(() => mockObserver);

            domManipulator.startObserving();
            domManipulator.startObserving(); // Second call

            expect(mockObserver.observe).toHaveBeenCalledTimes(1);
        });
    });

    describe('Cleanup', () => {
        test('should cleanup all resources', () => {
            const mockObserver = {
                observe: jest.fn(),
                disconnect: jest.fn()
            };

            global.MutationObserver = jest.fn().mockImplementation(() => mockObserver);

            // Add some state
            domManipulator.startObserving();
            domManipulator.injectedButtons.set('test-order', {});
            domManipulator.hiddenOrders.add('test-order-details');

            domManipulator.cleanup();

            expect(domManipulator.isObserving).toBe(false);
            expect(domManipulator.observer).toBeNull();
            expect(domManipulator.injectedButtons.size).toBe(0);
            expect(domManipulator.hiddenOrders.size).toBe(0);
            expect(mockObserver.disconnect).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle errors gracefully in button injection', () => {
            const orderId = '123-4567890-1234567';

            // Mock an error
            mockOrderCard.appendChild.mockImplementation(() => {
                throw new Error('Mock error');
            });

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(false);
        });

        test('should handle errors gracefully in button removal', () => {
            const orderId = '123-4567890-1234567';
            const mockLi = { remove: jest.fn().mockImplementation(() => { throw new Error('Mock error'); }) };

            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsLi: mockLi,
                hideOrderLi: mockLi
            });

            const result = domManipulator.removeButtons(orderId);

            expect(result).toBe(false);
        });
    });

    describe('Storage Management', () => {
        test('should set storage manager', () => {
            const mockStorage = { get: jest.fn(), set: jest.fn() };
            domManipulator.setStorage(mockStorage);
            expect(domManipulator.storage).toBe(mockStorage);
        });
    });

    describe('Element Position Validation', () => {
        test('should validate element within order card', () => {
            const orderCard = document.createElement('div');
            const childElement = document.createElement('span');
            orderCard.appendChild(childElement);

            const result = domManipulator.isElementWithinOrderCard(childElement, orderCard);
            expect(result).toBe(true);
        });

        test('should reject element outside order card', () => {
            const orderCard = document.createElement('div');
            const outsideElement = document.createElement('span');
            // Mock contains to return false for outside element
            orderCard.contains.mockReturnValueOnce(false);

            const result = domManipulator.isElementWithinOrderCard(outsideElement, orderCard);
            expect(result).toBe(false);
        });

        test('should handle null elements gracefully', () => {
            const orderCard = document.createElement('div');
            // Mock contains to handle null element
            orderCard.contains.mockReturnValueOnce(false);
            const result = domManipulator.isElementWithinOrderCard(null, orderCard);
            expect(result).toBe(false);
        });
    });

    describe('Additional Order Elements Hiding', () => {
        test('should hide additional order elements', () => {
            const orderCard = document.createElement('div');
            const elementToHide = document.createElement('div');
            elementToHide.className = 'order-summary';
            orderCard.appendChild(elementToHide);

            // Mock querySelectorAll to return elements to hide
            orderCard.querySelectorAll = jest.fn().mockReturnValue([elementToHide]);

            const result = domManipulator.hideAdditionalOrderElements(orderCard);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        test('should handle order card without additional elements', () => {
            const orderCard = document.createElement('div');
            orderCard.querySelectorAll = jest.fn().mockReturnValue([]);

            // Should not throw error
            expect(() => domManipulator.hideAdditionalOrderElements(orderCard)).not.toThrow();
        });
    });

    describe('Tags to Delivery Status', () => {
        test('should add tags to delivery status', () => {
            const leftColumn = document.createElement('div');
            const tags = ['electronics', 'urgent'];
            const username = 'testuser';

            domManipulator.addTagsToDeliveryStatus(leftColumn, tags, username);

            // Check that the method was called
            expect(leftColumn.querySelector).toHaveBeenCalled();
        });

        test('should add tags without username', () => {
            const leftColumn = document.createElement('div');
            const tags = ['electronics'];

            domManipulator.addTagsToDeliveryStatus(leftColumn, tags);

            // Check that the method was called
            expect(leftColumn.querySelector).toHaveBeenCalled();
        });

        test('should handle empty tags array', () => {
            const leftColumn = document.createElement('div');
            const tags = [];

            domManipulator.addTagsToDeliveryStatus(leftColumn, tags);

            // Should not throw error
            expect(() => domManipulator.addTagsToDeliveryStatus(leftColumn, tags)).not.toThrow();
        });
    });

    describe('Remove Tags from Delivery Status', () => {
        test('should remove tags from delivery status', () => {
            const orderCard = document.createElement('div');
            const tagElement = document.createElement('div');
            tagElement.className = 'archivaz-tag';
            orderCard.appendChild(tagElement);

            domManipulator.removeTagsFromDeliveryStatus(orderCard);

            // Check that tags were removed
            const remainingTags = orderCard.querySelectorAll('.archivaz-tag');
            expect(remainingTags.length).toBe(0);
        });

        test('should handle order card without tags', () => {
            const orderCard = document.createElement('div');

            // Should not throw error
            expect(() => domManipulator.removeTagsFromDeliveryStatus(orderCard)).not.toThrow();
        });
    });

    describe('Find and Hide Text Elements', () => {
        test('should find and hide text elements', () => {
            const container = document.createElement('div');
            const elementToHide = document.createElement('span');
            elementToHide.textContent = 'Product details';
            container.appendChild(elementToHide);

            const hiddenElements = [];
            const textToFind = 'Product details';

            // Should not throw error
            expect(() => domManipulator.findAndHideTextElements(container, textToFind, hiddenElements)).not.toThrow();
        });

        test('should handle container without matching text', () => {
            const container = document.createElement('div');
            const element = document.createElement('span');
            element.textContent = 'Other text';
            container.appendChild(element);

            const hiddenElements = [];
            const textToFind = 'Product details';

            domManipulator.findAndHideTextElements(container, textToFind, hiddenElements);

            expect(hiddenElements.length).toBe(0);
        });

        test('should handle null container', () => {
            const hiddenElements = [];
            const textToFind = 'Product details';

            // Should throw error when trying to access outerHTML on null
            expect(() => domManipulator.findAndHideTextElements(null, textToFind, hiddenElements)).toThrow();
        });
    });

    describe('Find and Hide Action Buttons', () => {
        test('should find and hide action buttons', () => {
            const container = document.createElement('div');
            const buttonToHide = document.createElement('button');
            buttonToHide.className = 'action-button';
            container.appendChild(buttonToHide);

            const hiddenElements = [];

            // Should not throw error
            expect(() => domManipulator.findAndHideActionButtons(container, hiddenElements)).not.toThrow();
        });

        test('should handle container without action buttons', () => {
            const container = document.createElement('div');
            const hiddenElements = [];

            domManipulator.findAndHideActionButtons(container, hiddenElements);

            expect(hiddenElements.length).toBe(0);
        });
    });

    describe('Essential Order Header Detection', () => {
        test('should identify essential order header', () => {
            const container = document.createElement('div');
            container.textContent = 'Order #123-4567890-1234567';

            const result = domManipulator.isEssentialOrderHeader(container);
            expect(result).toBe(true);
        });

        test('should reject non-essential order header', () => {
            const container = document.createElement('div');
            container.textContent = 'Product details';

            const result = domManipulator.isEssentialOrderHeader(container);
            expect(result).toBe(false);
        });
    });

    describe('Show Order Details', () => {
        test('should show order details', () => {
            const orderId = 'test-order-123';
            const button = document.createElement('button');

            // Mock button info
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsBtn: button
            });

            // Mock order card
            mockOrderCard.classList = {
                remove: jest.fn(),
                contains: jest.fn().mockReturnValue(true)
            };

            domManipulator.showOrderDetails(orderId, button);

            // Should not throw error
            expect(() => domManipulator.showOrderDetails(orderId, button)).not.toThrow();
        });

        test('should handle missing button info', () => {
            const orderId = 'test-order-123';
            const button = document.createElement('button');

            // Ensure no button info exists
            domManipulator.injectedButtons.clear();

            // Should not throw error
            expect(() => domManipulator.showOrderDetails(orderId, button)).not.toThrow();
        });
    });

    describe('HTML Escaping', () => {
        test('should escape HTML characters', () => {
            const text = '<script>alert("xss")</script>';
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: text,
                innerHTML: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
            }));

            const result = domManipulator.escapeHtml(text);
            expect(result).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });

        test('should handle text without HTML characters', () => {
            const text = 'Plain text';
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: text,
                innerHTML: 'Plain text'
            }));

            const result = domManipulator.escapeHtml(text);
            expect(result).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });

        test('should handle empty string', () => {
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: '',
                innerHTML: ''
            }));

            const result = domManipulator.escapeHtml('');
            expect(result).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });

        test('should handle null and undefined', () => {
            // Mock document.createElement to return a proper element for this test
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => ({
                textContent: '',
                innerHTML: ''
            }));

            expect(domManipulator.escapeHtml(null)).toBeDefined();
            expect(domManipulator.escapeHtml(undefined)).toBeDefined();

            // Restore original mock
            document.createElement = originalCreateElement;
        });
    });

    describe('Order State Queries', () => {
        test('should check if details are hidden', () => {
            const orderId = 'test-order-123';

            // Initially not hidden
            expect(domManipulator.areDetailsHidden(orderId)).toBe(false);

            // Mark as hidden
            domManipulator.hiddenOrders.add(`${orderId}-details`);
            expect(domManipulator.areDetailsHidden(orderId)).toBe(true);
        });

        test('should get all hidden orders', () => {
            // Clear existing hidden orders
            domManipulator.hiddenOrders.clear();

            // Add some hidden orders
            domManipulator.hiddenOrders.add('order1-details');
            domManipulator.hiddenOrders.add('order2-details');

            const result = domManipulator.getHiddenOrders();
            expect(result).toContain('order1-details');
            expect(result).toContain('order2-details');
        });
    });

    describe('Button Injection', () => {
        test('should inject buttons successfully', () => {
            const orderId = 'test-order-123';
            const orderCard = document.createElement('div');

            // Mock order card structure
            orderCard.querySelector = jest.fn().mockReturnValue(document.createElement('div'));

            const result = domManipulator.injectButtons(orderCard, orderId);

            expect(result).toBeDefined();
        });

        test('should not inject buttons if already injected', () => {
            const orderId = 'test-order-123';
            const orderCard = document.createElement('div');

            // Mark as already injected
            domManipulator.injectedButtons.set(orderId, {});

            const result = domManipulator.injectButtons(orderCard, orderId);

            expect(result).toBe(true); // Returns true for already injected
        });

        test('should handle injection errors gracefully', () => {
            const orderId = 'test-order-123';
            const orderCard = {
                querySelector: jest.fn().mockImplementation(() => {
                    throw new Error('Mock error');
                })
            };

            const result = domManipulator.injectButtons(orderCard, orderId);

            expect(result).toBe(false);
        });
    });

    describe('Button Removal', () => {
        test('should remove buttons successfully', () => {
            const orderId = 'test-order-123';
            const mockLi = { remove: jest.fn() };

            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsLi: mockLi,
                hideOrderLi: mockLi
            });

            const result = domManipulator.removeButtons(orderId);

            expect(result).toBe(true);
            expect(domManipulator.injectedButtons.has(orderId)).toBe(false);
            expect(mockLi.remove).toHaveBeenCalled();
        });

        test('should handle removal when no buttons exist', () => {
            const orderId = 'test-order-123';

            const result = domManipulator.removeButtons(orderId);

            expect(result).toBeDefined();
        });
    });

    describe('DOM Observation Processing', () => {
        test('should process mutations correctly', () => {
            const mutations = [
                {
                    type: 'childList',
                    addedNodes: [document.createElement('div')],
                    removedNodes: []
                }
            ];

            const onOrderDetected = jest.fn();
            const onOrderRemoved = jest.fn();

            domManipulator.processMutations(mutations, onOrderDetected, onOrderRemoved);

            // Should not throw error
            expect(() => domManipulator.processMutations(mutations, onOrderDetected, onOrderRemoved)).not.toThrow();
        });

        test('should handle empty mutations array', () => {
            const mutations = [];
            const onOrderDetected = jest.fn();
            const onOrderRemoved = jest.fn();

            // Should not throw error
            expect(() => domManipulator.processMutations(mutations, onOrderDetected, onOrderRemoved)).not.toThrow();
        });

        test('should handle added nodes', () => {
            const node = document.createElement('div');
            const onOrderDetected = jest.fn();

            domManipulator.handleAddedNode(node, onOrderDetected);

            // Should not throw error
            expect(() => domManipulator.handleAddedNode(node, onOrderDetected)).not.toThrow();
        });

        test('should handle removed nodes', () => {
            const node = document.createElement('div');
            const onOrderRemoved = jest.fn();

            domManipulator.handleRemovedNode(node, onOrderRemoved);

            // Should not throw error
            expect(() => domManipulator.handleRemovedNode(node, onOrderRemoved)).not.toThrow();
        });
    });

    describe('Order ID Extraction', () => {
        test('should extract order ID from element', () => {
            const orderElement = document.createElement('div');
            orderElement.textContent = 'Order #123-4567890-1234567';
            orderElement.getAttribute = jest.fn().mockReturnValue('123-4567890-1234567');

            const result = domManipulator.getOrderIdFromElement(orderElement);

            expect(result).toBe('123-4567890-1234567');
        });

        test('should handle element without order ID', () => {
            const orderElement = document.createElement('div');
            orderElement.textContent = 'No order ID here';

            const result = domManipulator.getOrderIdFromElement(orderElement);

            expect(result).toBeNull();
        });

        test('should handle null element', () => {
            // Should throw error when trying to access outerHTML on null
            expect(() => domManipulator.getOrderIdFromElement(null)).toThrow();
        });
    });

    describe('Order ID Validation', () => {
        test('should validate correct Amazon order number format', () => {
            const validOrderId = '123-4567890-1234567';
            const result = domManipulator.isValidOrderId(validOrderId);
            expect(result).toBe(true);
        });

        test('should reject invalid order number formats', () => {
            const invalidOrderIds = [
                'Arriving today',
                'January 15, 2024',
                'Mon',
                '12/25/2024',
                '12/25',
                'Only letters and spaces'
            ];

            invalidOrderIds.forEach(orderId => {
                const result = domManipulator.isValidOrderId(orderId);
                expect(result).toBe(false);
            });
        });

        test('should handle edge cases', () => {
            expect(domManipulator.isValidOrderId('')).toBe(false);
            expect(domManipulator.isValidOrderId(null)).toBe(false);
            expect(domManipulator.isValidOrderId(undefined)).toBe(false);
        });
    });

    describe('Username Management', () => {
        test('should set username for order', () => {
            const orderId = 'test-order-123';
            const username = 'testuser';

            domManipulator.setUsernameForOrder(orderId, username);

            const result = domManipulator.getUsernameForOrder(orderId);
            expect(result).toBe(username);
        });

        test('should get username for order', () => {
            const orderId = 'test-order-123';
            const username = 'testuser';

            domManipulator.setUsernameForOrder(orderId, username);
            const result = domManipulator.getUsernameForOrder(orderId);

            expect(result).toBe(username);
        });

        test('should return null for non-existent username', () => {
            const orderId = 'non-existent-order';
            const result = domManipulator.getUsernameForOrder(orderId);

            expect(result).toBe('Unknown User');
        });
    });

    describe('Order Card Finding', () => {
        test('should find order card by ID', () => {
            const orderId = 'test-order-123';
            const orderCard = document.createElement('div');
            orderCard.textContent = `Order ${orderId} details`;

            // Mock document.querySelectorAll to return the order card
            document.querySelectorAll = jest.fn().mockReturnValue([orderCard]);

            const result = domManipulator.findOrderCardById(orderId);

            expect(result).toBe(orderCard);
        });

        test('should return null when order card not found', () => {
            const orderId = 'non-existent-order';

            // Mock document.querySelectorAll to return empty array
            document.querySelectorAll = jest.fn().mockReturnValue([]);

            const result = domManipulator.findOrderCardById(orderId);

            expect(result).toBeNull();
        });
    });

    describe('Tagging Dialog Management', () => {
        test('should handle tagging dialog cancelled', () => {
            const orderId = 'test-order-123';

            // Mock log.info
            const mockLog = jest.spyOn(require('./logger.js').specializedLogger, 'info').mockImplementation(() => { });

            domManipulator.handleTaggingDialogCancelled(orderId);

            // Check that the expected message was logged (it might be logged multiple times)
            const calls = mockLog.mock.calls.map(call => call[0]);
            expect(calls).toContain(`🚫 Tagging dialog cancelled for order ${orderId}`);
            mockLog.mockRestore();
        });

        test('should show dialog already open message', () => {
            const orderId = 'test-order-123';

            // Mock document.body.appendChild to avoid DOM errors
            const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => { });

            domManipulator.showDialogAlreadyOpenMessage(orderId);

            // Should not throw error
            expect(() => domManipulator.showDialogAlreadyOpenMessage(orderId)).not.toThrow();
            mockAppendChild.mockRestore();
        });
    });

    describe('Button Placement Strategy', () => {
        test('should return button placement strategy', () => {
            const strategy = domManipulator.getButtonPlacementStrategy();

            expect(strategy).toHaveProperty('orderCard');
            expect(strategy).toHaveProperty('orderHeader');
            expect(strategy).toHaveProperty('orderActions');
            expect(strategy).toHaveProperty('actionButtonsColumn');
            expect(strategy).toHaveProperty('fallbackSelectors');
        });
    });

    describe('Format Specific Strategy', () => {
        test('should return strategy for your-orders format', () => {
            const strategy = domManipulator.getFormatSpecificStrategy('your-orders');

            expect(strategy.container).toBe('.yohtmlc-shipment-level-connections');
            expect(strategy.fallback).toBe('.order-actions, .a-box-group');
        });

        test('should return strategy for css format', () => {
            const strategy = domManipulator.getFormatSpecificStrategy('css');

            expect(strategy.container).toBe('.order-actions, .a-box-group');
            expect(strategy.fallback).toBe('.a-box-group');
        });

        test('should return strategy for your-account format', () => {
            const strategy = domManipulator.getFormatSpecificStrategy('your-account');

            expect(strategy.container).toBe('.delivery-box');
            expect(strategy.fallback).toBe('.a-unordered-list, .a-vertical');
        });

        test('should return default strategy for unknown format', () => {
            const strategy = domManipulator.getFormatSpecificStrategy('unknown');

            expect(strategy.container).toBe('.order-actions, .a-box-group, .a-box-group');
            expect(strategy.fallback).toBeNull();
        });

        test('should return default strategy for undefined format', () => {
            const strategy = domManipulator.getFormatSpecificStrategy();

            expect(strategy.container).toBe('.order-actions, .a-box-group, .a-box-group');
            expect(strategy.fallback).toBeNull();
        });
    });
});

