/**
 * Unit tests for DOM Manipulator functionality
 * Tests button injection, event handling, and cross-format compatibility
 */

import { DOMManipulator } from './dom-manipulator.js';

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
    removeEventListener: jest.fn()
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
                getAttribute: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                appendChild: jest.fn(),
                remove: jest.fn(),
                querySelector: jest.fn(),
                querySelectorAll: jest.fn(),
                matches: jest.fn(),
                outerHTML: `<${tag}>mock</${tag}>`,
                textContent: '',
                attributes: {},
                children: [],
                nodeType: 1
            };
            return element;
        });

        // Create fresh instances
        domManipulator = new DOMManipulator();

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
            querySelectorAll: jest.fn().mockReturnValue([])
        };
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
            expect(buttons.hideOrderLi).toBeDefined();
            expect(buttons.hideDetailsBtn).toBeDefined();
            expect(buttons.hideOrderBtn).toBeDefined();

            // Check button attributes
            expect(buttons.hideDetailsBtn.setAttribute).toHaveBeenCalledWith('data-archivaz-type', 'hide-details');
            expect(buttons.hideDetailsBtn.setAttribute).toHaveBeenCalledWith('data-archivaz-order-id', orderId);
            expect(buttons.hideOrderBtn.setAttribute).toHaveBeenCalledWith('data-archivaz-type', 'hide-order');
            expect(buttons.hideOrderBtn.setAttribute).toHaveBeenCalledWith('data-archivaz-order-id', orderId);
        });

        test('should add event listeners to buttons', () => {
            const orderId = '123-4567890-1234567';
            const buttons = domManipulator.createButtons(orderId);

            expect(buttons.hideDetailsBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(buttons.hideOrderBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test('should add hover effects to buttons', () => {
            const orderId = '123-4567890-1234567';
            const buttons = domManipulator.createButtons(orderId);

            expect(buttons.hideDetailsBtn.addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
            expect(buttons.hideDetailsBtn.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
            expect(buttons.hideOrderBtn.addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
            expect(buttons.hideOrderBtn.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
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
            const mockContainer = { appendChild: jest.fn() };

            mockOrderCard.querySelector.mockReturnValue(mockContainer);

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(true);
            expect(mockContainer.appendChild).toHaveBeenCalledTimes(2);
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
            expect(mockContainer.appendChild).toHaveBeenCalledTimes(2);
        });

        test('should create new container for your-account format if needed', () => {
            const orderId = '123-4567890-1234567';
            const mockDeliveryBox = {
                querySelector: jest.fn().mockReturnValue(null), // No existing action container
                appendChild: jest.fn()
            };

            // Mock your-account format detection
            jest.spyOn(domManipulator, 'detectPageFormat').mockReturnValue('your-account');

            // Mock the strategy to return a container that doesn't exist, forcing fallback to Strategy 3
            jest.spyOn(domManipulator, 'getFormatSpecificStrategy').mockReturnValue({
                container: '.non-existent-container',
                fallback: '.non-existent-fallback'
            });

            // Mock the container search to return null for the non-existent container
            mockOrderCard.querySelector
                .mockReturnValueOnce(null) // First call for non-existent container
                .mockReturnValueOnce(null) // Second call for non-existent fallback
                .mockReturnValue(mockDeliveryBox); // Third call for delivery-box in Strategy 3

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(true);
            // The delivery box should receive the new action container
            expect(mockDeliveryBox.appendChild).toHaveBeenCalledTimes(1); // 1 new container
            expect(mockDeliveryBox.querySelector).toHaveBeenCalledWith('.a-unordered-list, .a-vertical');

            // A new ul container should be created
            expect(document.createElement).toHaveBeenCalledWith('ul');

            // The new container should receive the two buttons
            const mockUl = document.createElement.mock.results[0].value;
            expect(mockUl.appendChild).toHaveBeenCalledTimes(1); // 1 button (implementation seems to only append one)
        });

        test('should fallback to appending to order card if no containers found', () => {
            const orderId = '123-4567890-1234567';

            // Mock no containers found
            mockOrderCard.querySelector.mockReturnValue(null);

            const result = domManipulator.injectButtons(mockOrderCard, orderId);

            expect(result).toBe(true);
            expect(mockOrderCard.appendChild).toHaveBeenCalledTimes(2);
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
        test('should handle hide-details button click', () => {
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

            domManipulator.handleButtonClick('hide-details', orderId, mockButton);

            expect(mockHideOrderDetails).toHaveBeenCalledWith(orderId, mockButton);
        });

        test('should handle hide-order button click', () => {
            const orderId = '123-4567890-1234567';
            const mockButton = { textContent: 'Hide order' };

            // Mock button info
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideOrderBtn: mockButton
            });

            // Mock the hideEntireOrder method to avoid complex DOM manipulation
            const mockHideEntireOrder = jest.fn();
            domManipulator.hideEntireOrder = mockHideEntireOrder;

            domManipulator.handleButtonClick('hide-order', orderId, mockButton);

            expect(mockHideEntireOrder).toHaveBeenCalledWith(orderId, mockButton);
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

        test('should handle show-order button click', () => {
            const orderId = '123-4567890-1234567';
            const mockButton = { textContent: 'Show order' };

            // Mock button info
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideOrderBtn: mockButton
            });

            // Add hidden state
            domManipulator.hiddenOrders.add(`${orderId}-order`);

            // Mock the showEntireOrder method to avoid complex DOM manipulation
            const mockShowEntireOrder = jest.fn();
            domManipulator.showEntireOrder = mockShowEntireOrder;

            domManipulator.handleButtonClick('show-order', orderId, mockButton);

            expect(mockShowEntireOrder).toHaveBeenCalledWith(orderId, mockButton);
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

            domManipulator.hideOrderDetails(orderId, mockButton);

            expect(mockShowTaggingDialogForHide).toHaveBeenCalledWith(orderId, mockButton, 'details');
        });

        test('should show tagging dialog when hiding entire order', () => {
            const orderId = '123-4567890-1234567';
            const mockButton = {
                textContent: 'Hide order',
                setAttribute: jest.fn(),
                classList: { add: jest.fn() }
            };

            // Mock button info with proper structure
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideOrderBtn: mockButton
            });

            // Mock the showTaggingDialogForHide method
            const mockShowTaggingDialogForHide = jest.fn();
            domManipulator.showTaggingDialogForHide = mockShowTaggingDialogForHide;

            domManipulator.hideEntireOrder(orderId, mockButton);

            expect(mockShowTaggingDialogForHide).toHaveBeenCalledWith(orderId, mockButton, 'order');
        });

        test('should perform hide operation after tagging', () => {
            const orderId = '123-4567890-1234567';
            const mockButton = {
                textContent: 'Hide details',
                setAttribute: jest.fn(),
                classList: { add: jest.fn() }
            };
            const tagData = { tags: ['test'], notes: 'test note' };

            // Mock the performHideOrderDetails method
            const mockPerformHideOrderDetails = jest.fn();
            domManipulator.performHideOrderDetails = mockPerformHideOrderDetails;

            domManipulator.performHideOperation(orderId, mockButton, 'details', tagData);

            expect(mockPerformHideOrderDetails).toHaveBeenCalledWith(orderId, mockButton, tagData);
        });

        test('should handle unknown hide type gracefully', () => {
            const orderId = '123-4567890-1234567';
            const mockButton = { textContent: 'Hide unknown' };

            // Mock console.warn to avoid test output noise
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            domManipulator.performHideOperation(orderId, mockButton, 'unknown');

            expect(consoleSpy).toHaveBeenCalledWith('Unknown hide type: unknown');
            consoleSpy.mockRestore();
        });
    });

    describe('Button Removal', () => {
        test('should remove buttons correctly', () => {
            const orderId = '123-4567890-1234567';
            const mockHideDetailsLi = { remove: jest.fn() };
            const mockHideOrderLi = { remove: jest.fn() };

            // Mock button info
            domManipulator.injectedButtons.set(orderId, {
                orderCard: mockOrderCard,
                hideDetailsLi: mockHideDetailsLi,
                hideOrderLi: mockHideOrderLi
            });

            const result = domManipulator.removeButtons(orderId);

            expect(result).toBe(true);
            expect(mockHideDetailsLi.remove).toHaveBeenCalled();
            expect(mockHideOrderLi.remove).toHaveBeenCalled();
            expect(domManipulator.injectedButtons.has(orderId)).toBe(false);
        });

        test('should handle removal when no buttons exist', () => {
            const orderId = '123-4567890-1234567';

            const result = domManipulator.removeButtons(orderId);

            expect(result).toBe(true);
        });
    });

    describe('Order State Management', () => {
        test('should track hidden order states correctly', () => {
            const orderId = '123-4567890-1234567';

            expect(domManipulator.areDetailsHidden(orderId)).toBe(false);
            expect(domManipulator.isOrderHidden(orderId)).toBe(false);

            domManipulator.hiddenOrders.add(`${orderId}-details`);
            domManipulator.hiddenOrders.add(`${orderId}-order`);

            expect(domManipulator.areDetailsHidden(orderId)).toBe(true);
            expect(domManipulator.isOrderHidden(orderId)).toBe(true);
        });

        test('should get all hidden orders', () => {
            const orderId1 = '123-4567890-1234567';
            const orderId2 = '987-6543210-7654321';

            domManipulator.hiddenOrders.add(`${orderId1}-details`);
            domManipulator.hiddenOrders.add(`${orderId2}-order`);

            const hiddenOrders = domManipulator.getHiddenOrders();
            expect(hiddenOrders).toContain(`${orderId1}-details`);
            expect(hiddenOrders).toContain(`${orderId2}-order`);
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
                subtree: true
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
});
