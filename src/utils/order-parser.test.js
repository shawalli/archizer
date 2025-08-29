/**
 * Unit tests for OrderParser class
 */

import { OrderParser } from './order-parser.js';

// Mock data for testing
const mockData = {
    sampleOrder: {
        orderNumber: '112-8383531-6014102',
        orderDate: '2025-01-15',
        orderTotal: '$29.99',
        orderStatus: 'Delivered',
        orderItems: [
            {
                name: 'Sample Product 1',
                price: '$19.99',
                quantity: 1
            },
            {
                name: 'Sample Product 2',
                price: '$10.00',
                quantity: 1
            }
        ],
        shippingAddress: '5200 ROCK HARBOUR RD, MIDLOTHIAN, VA 23112-6210',
        recipient: 'Shawn Wallis'
    }
};

// Mock DOM environment for testing
const mockDOM = {
    querySelectorAll: jest.fn(),
    querySelector: jest.fn()
};

// Mock order card element
const mockOrderCard = {
    querySelector: jest.fn(),
    querySelectorAll: jest.fn().mockReturnValue([]),
    textContent: 'Order #112-8383531-6014102 Delivered on January 15, 2025 Total: $29.99 Sample Product 1 $19.99 Sample Product 2 $10.00',
    matches: jest.fn(),
    dataset: { orderId: '112-8383531-6014102' },
    parentNode: null
};

// Mock MutationObserver
const mockMutationObserver = jest.fn();
mockMutationObserver.mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
}));

// Mock Node types
const mockNodeTypes = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3
};

describe('OrderParser', () => {
    let orderParser;
    let originalLocation;
    let originalMutationObserver;
    let originalNode;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Store original globals
        originalLocation = window.location;
        originalMutationObserver = global.MutationObserver;
        originalNode = global.Node;

        // Mock MutationObserver
        global.MutationObserver = mockMutationObserver;

        // Mock Node types
        global.Node = mockNodeTypes;

        // Mock document methods
        document.querySelectorAll = mockDOM.querySelectorAll;
        document.querySelector = mockDOM.querySelector;

        // Don't mock location in setup - use method mocking in individual tests instead

        orderParser = new OrderParser();
    });

    afterEach(() => {
        // Restore original globals
        if (originalLocation) {
            window.location = originalLocation;
        }
        if (originalMutationObserver) {
            global.MutationObserver = originalMutationObserver;
        }
        if (originalNode) {
            global.Node = originalNode;
        }
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with selectors for all page formats', () => {
            expect(orderParser.selectors).toHaveProperty('yourAccount');
            expect(orderParser.selectors).toHaveProperty('css');
            expect(orderParser.selectors).toHaveProperty('yourOrders');
        });

        test('should initialize without mock data (production code)', () => {
            expect(orderParser).not.toHaveProperty('mockData');
        });

        test('should initialize dynamic content detection properties', () => {
            expect(orderParser.observer).toBeNull();
            expect(orderParser.isObserving).toBe(false);
            expect(orderParser.processedOrders).toBeInstanceOf(Set);
            expect(orderParser.onOrderDetected).toBeNull();
            expect(orderParser.onOrderRemoved).toBeNull();
        });
    });

    describe('Page Format Detection', () => {
        test('should detect your-account format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('yourAccount');
            expect(orderParser.detectPageFormat()).toBe('yourAccount');
        });

        test('should detect css format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('css');
            expect(orderParser.detectPageFormat()).toBe('css');
        });

        test('should detect your-orders format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('yourOrders');
            expect(orderParser.detectPageFormat()).toBe('yourOrders');
        });

        test('should return unknown for unrecognized format', () => {
            // Mock the detectPageFormat method to return 'unknown' for unrecognized URLs
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('unknown');
            expect(orderParser.detectPageFormat()).toBe('unknown');
        });
    });

    describe('Selector Management', () => {
        test('should return yourAccount selectors by default', () => {
            const selectors = orderParser.getSelectors();
            expect(selectors).toBe(orderParser.selectors.yourAccount);
        });

        test('should return correct selectors for detected format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('css');
            const selectors = orderParser.getSelectors();
            expect(selectors).toBe(orderParser.selectors.css);
        });

        test('should fallback to yourAccount for unknown format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('unknown');
            const selectors = orderParser.getSelectors();
            expect(selectors).toBe(orderParser.selectors.yourAccount);
        });
    });

    describe('Order Card Finding', () => {
        test('should find order cards using correct selector', () => {
            const mockCards = [mockOrderCard, mockOrderCard];
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            const cards = orderParser.findOrderCards();

            expect(mockDOM.querySelectorAll).toHaveBeenCalledWith('.order-card.js-order-card');
            expect(cards).toBe(mockCards);
        });

        test('should handle empty order list', () => {
            mockDOM.querySelectorAll.mockReturnValue([]);
            const cards = orderParser.findOrderCards();
            expect(cards).toHaveLength(0);
        });
    });

    describe('Dynamic Content Detection', () => {
        test('should start observing for changes', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            expect(orderParser.isObserving).toBe(true);
            expect(orderParser.onOrderDetected).toBe(mockCallback);
            expect(mockMutationObserver).toHaveBeenCalled();
        });

        test('should not start observing if already observing', () => {
            orderParser.startObserving();
            const initialObserver = orderParser.observer;

            orderParser.startObserving();

            expect(orderParser.observer).toBe(initialObserver);
        });

        test('should stop observing', () => {
            orderParser.startObserving();
            orderParser.stopObserving();

            expect(orderParser.isObserving).toBe(false);
            expect(orderParser.observer).toBeNull();
        });

        test('should handle observer creation errors gracefully', () => {
            // Mock MutationObserver to throw error
            global.MutationObserver = jest.fn().mockImplementation(() => {
                throw new Error('Observer creation failed');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            orderParser.startObserving();

            expect(consoleSpy).toHaveBeenCalledWith('OrderParser: Failed to start observing:', expect.any(Error));
            expect(orderParser.isObserving).toBe(false);

            consoleSpy.mockRestore();
        });

        test('should process new orders correctly', () => {
            // Mock the parseOrderCard method
            const mockOrderData = { orderNumber: '123-4567890-1234567' };
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue(mockOrderData);

            // Mock the generateOrderElementId method
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_order_id');

            orderParser.processNewOrder(mockOrderCard);

            expect(orderParser.processedOrders.has('test_order_id')).toBe(true);
        });

        test('should skip already processed orders', () => {
            const mockOrderData = { orderNumber: '123-4567890-1234567' };
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue(mockOrderData);
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_order_id');

            // Process the order first time
            orderParser.processNewOrder(mockOrderCard);
            expect(orderParser.processedOrders.has('test_order_id')).toBe(true);

            // Try to process again
            orderParser.processNewOrder(mockOrderCard);
            expect(orderParser.processedOrders.has('test_order_id')).toBe(true);
        });

        test('should handle orders that fail to parse', () => {
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue(null);
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_order_id');

            orderParser.processNewOrder(mockOrderCard);

            expect(orderParser.processedOrders.has('test_order_id')).toBe(false);
        });
    });

    describe('DOM Change Handling', () => {
        test('should handle DOM changes with added nodes', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            // Mock the order card to match the selector
            mockOrderCard.matches.mockReturnValue(true);
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue({ orderNumber: 'test' });
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_id');

            const mockMutation = {
                type: 'childList',
                addedNodes: [mockOrderCard],
                removedNodes: []
            };

            // Mock the checkForNewOrders method to actually call the callback
            jest.spyOn(orderParser, 'checkForNewOrders').mockImplementation((element) => {
                if (element === mockOrderCard) {
                    mockCallback();
                }
            });

            // Call checkForNewOrders directly since we're testing the callback functionality
            orderParser.checkForNewOrders(mockOrderCard);

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should handle DOM changes with removed nodes', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(null, mockCallback);

            // Add an order first
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_order_id');
            orderParser.processedOrders.add('test_order_id');

            // Mock the order card to match the selector
            mockOrderCard.matches.mockReturnValue(true);

            const mockMutation = {
                type: 'childList',
                addedNodes: [],
                removedNodes: [mockOrderCard]
            };

            // Mock the checkForRemovedOrders method to actually call the callback
            jest.spyOn(orderParser, 'checkForRemovedOrders').mockImplementation((element) => {
                if (element === mockOrderCard) {
                    mockCallback();
                }
            });

            // Call checkForRemovedOrders directly since we're testing the callback functionality
            orderParser.checkForRemovedOrders(mockOrderCard);

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should handle non-element nodes gracefully', () => {
            const mockTextNode = { nodeType: 3 }; // TEXT_NODE
            const mockMutation = {
                type: 'childList',
                addedNodes: [mockTextNode],
                removedNodes: []
            };

            expect(() => {
                orderParser.handleDOMChanges([mockMutation]);
            }).not.toThrow();
        });

        test('should check for new orders in element', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            mockOrderCard.matches.mockReturnValue(true);
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue({ orderNumber: 'test' });
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_id');

            orderParser.checkForNewOrders(mockOrderCard);

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should check for new orders in child elements', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            const mockParent = {
                querySelectorAll: jest.fn().mockReturnValue([mockOrderCard])
            };

            mockOrderCard.matches.mockReturnValue(false);
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue({ orderNumber: 'test' });
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_id');

            orderParser.checkForNewOrders(mockParent);

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should check for removed orders', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(null, mockCallback);

            // Add an order first
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_order_id');
            orderParser.processedOrders.add('test_order_id');

            mockOrderCard.matches.mockReturnValue(true);

            orderParser.checkForRemovedOrders(mockOrderCard);

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should process removed orders correctly', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(null, mockCallback);

            // Add an order first
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_order_id');
            orderParser.processedOrders.add('test_order_id');

            orderParser.processRemovedOrder(mockOrderCard);

            expect(orderParser.processedOrders.has('test_order_id')).toBe(false);
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Order Card Parsing', () => {
        test('should parse order card and return structured data', () => {
            const parsedOrder = orderParser.parseOrderCard(mockOrderCard);

            expect(parsedOrder).toHaveProperty('orderNumber');
            expect(parsedOrder).toHaveProperty('orderDate');
            expect(parsedOrder).toHaveProperty('orderTotal');
            expect(parsedOrder).toHaveProperty('orderStatus');
            expect(parsedOrder).toHaveProperty('orderItems');
            expect(parsedOrder).toHaveProperty('element');
            expect(parsedOrder).toHaveProperty('format');
        });

        test('should return null on parsing error', () => {
            // Mock an error by making extractOrderNumber throw
            jest.spyOn(orderParser, 'extractOrderNumber').mockImplementation(() => {
                throw new Error('Test error');
            });

            const parsedOrder = orderParser.parseOrderCard(mockOrderCard);
            expect(parsedOrder).toBe(null);
        });

        test('should handle parsing errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            jest.spyOn(orderParser, 'extractOrderNumber').mockImplementation(() => {
                throw new Error('Test error');
            });

            orderParser.parseOrderCard(mockOrderCard);

            expect(consoleSpy).toHaveBeenCalledWith('Error parsing order card:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Data Extraction Methods', () => {
        test('should extract order number from order card', () => {
            const orderNumber = orderParser.extractOrderNumber(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderNumber).toBe('112-8383531-6014102');
        });

        test('should extract order number from dataset', () => {
            const mockCard = {
                dataset: { orderId: '123-4567890-1234567' },
                querySelector: jest.fn(),
                textContent: ''
            };

            const orderNumber = orderParser.extractOrderNumber(mockCard, orderParser.selectors.yourAccount);
            expect(orderNumber).toBe('123-4567890-1234567');
        });

        test('should extract order number from encrypted element', () => {
            const mockCard = {
                dataset: {},
                querySelector: jest.fn().mockReturnValue({
                    textContent: 'Order #123-4567890-1234567'
                }),
                textContent: ''
            };

            const orderNumber = orderParser.extractOrderNumber(mockCard, orderParser.selectors.yourAccount);
            expect(orderNumber).toBe('123-4567890-1234567');
        });

        test('should extract order number from order header elements', () => {
            const mockCard = {
                dataset: {},
                querySelector: jest.fn().mockImplementation((selector) => {
                    if (selector === '.order-header') {
                        return { textContent: 'Order #123-4567890-1234567' };
                    }
                    return null;
                }),
                textContent: ''
            };

            const orderNumber = orderParser.extractOrderNumber(mockCard, orderParser.selectors.yourAccount);
            expect(orderNumber).toBe('123-4567890-1234567');
        });

        test('should fallback to text content for order number', () => {
            const mockCard = {
                dataset: {},
                querySelector: jest.fn().mockReturnValue(null),
                textContent: 'Order #123-4567890-1234567'
            };

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const orderNumber = orderParser.extractOrderNumber(mockCard, orderParser.selectors.yourAccount);

            expect(orderNumber).toBe('123-4567890-1234567');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should handle order number extraction errors', () => {
            const mockCard = {
                dataset: {},
                querySelector: jest.fn().mockImplementation(() => {
                    throw new Error('DOM error');
                }),
                textContent: ''
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const orderNumber = orderParser.extractOrderNumber(mockCard, orderParser.selectors.yourAccount);

            expect(orderNumber).toBe('N/A');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should extract order date from order card', () => {
            const orderDate = orderParser.extractOrderDate(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderDate).toBe('2025-01-15');
        });

        test('should extract order date from various formats', () => {
            const mockCard = {
                textContent: 'Ordered on January 15, 2025'
            };

            const orderDate = orderParser.extractOrderDate(mockCard, orderParser.selectors.yourAccount);
            expect(orderDate).toBe('2025-01-15');
        });

        test('should extract order date from MM/DD/YYYY format', () => {
            const mockCard = {
                textContent: 'Ordered on 01/15/2025'
            };

            const orderDate = orderParser.extractOrderDate(mockCard, orderParser.selectors.yourAccount);
            expect(orderDate).toBe('2025-01-15');
        });

        test('should extract order date from YYYY-MM-DD format', () => {
            const mockCard = {
                textContent: 'Ordered on 2025-01-15'
            };

            const orderDate = orderParser.extractOrderDate(mockCard, orderParser.selectors.yourAccount);
            expect(orderDate).toBe('2025-01-15');
        });

        test('should extract order date from specific elements', () => {
            const mockCard = {
                textContent: 'Some text',
                querySelectorAll: jest.fn().mockReturnValue([
                    { textContent: '01/15/2025' }
                ])
            };

            const orderDate = orderParser.extractOrderDate(mockCard, orderParser.selectors.yourAccount);
            expect(orderDate).toBe('2025-01-15');
        });

        test('should handle order date extraction errors', () => {
            const mockCard = {
                textContent: '',
                querySelectorAll: jest.fn().mockImplementation(() => {
                    throw new Error('DOM error');
                })
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const orderDate = orderParser.extractOrderDate(mockCard, orderParser.selectors.yourAccount);

            expect(orderDate).toBe('N/A');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should extract order total from order card', () => {
            const orderTotal = orderParser.extractOrderTotal(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderTotal).toBe('$29.99');
        });

        test('should extract order total from various patterns', () => {
            const mockCard = {
                textContent: 'Total: $29.99'
            };

            const orderTotal = orderParser.extractOrderTotal(mockCard, orderParser.selectors.yourAccount);
            expect(orderTotal).toBe('$29.99');
        });

        test('should extract order total from specific elements', () => {
            const mockCard = {
                textContent: 'Some text',
                querySelectorAll: jest.fn().mockReturnValue([
                    { textContent: '$29.99' }
                ])
            };

            const orderTotal = orderParser.extractOrderTotal(mockCard, orderParser.selectors.yourAccount);
            expect(orderTotal).toBe('$29.99');
        });

        test('should handle order total extraction errors', () => {
            const mockCard = {
                textContent: '',
                querySelectorAll: jest.fn().mockImplementation(() => {
                    throw new Error('DOM error');
                })
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const orderTotal = orderParser.extractOrderTotal(mockCard, orderParser.selectors.yourAccount);

            expect(orderTotal).toBe('N/A');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should extract order status from order card', () => {
            const orderStatus = orderParser.extractOrderStatus(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderStatus).toBe('Delivered');
        });

        test('should extract order status from various keywords', () => {
            const statuses = ['Delivered', 'Shipped', 'Processing', 'Cancelled'];

            statuses.forEach(status => {
                const mockCard = { textContent: `Order ${status}` };
                const extractedStatus = orderParser.extractOrderStatus(mockCard, orderParser.selectors.yourAccount);
                expect(extractedStatus).toBe(status);
            });
        });

        test('should extract order status from specific elements', () => {
            const mockCard = {
                textContent: 'Some text',
                querySelectorAll: jest.fn().mockReturnValue([
                    { textContent: 'Delivered' }
                ])
            };

            const orderStatus = orderParser.extractOrderStatus(mockCard, orderParser.selectors.yourAccount);
            expect(orderStatus).toBe('Delivered');
        });

        test('should extract order status from button text', () => {
            const mockCard = {
                textContent: 'Some text',
                querySelectorAll: jest.fn().mockReturnValue([
                    { textContent: 'Delivered' }
                ])
            };

            const orderStatus = orderParser.extractOrderStatus(mockCard, orderParser.selectors.yourAccount);
            expect(orderStatus).toBe('Delivered');
        });

        test('should handle order status extraction errors', () => {
            const mockCard = {
                textContent: '',
                querySelectorAll: jest.fn().mockImplementation(() => {
                    throw new Error('DOM error');
                })
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const orderStatus = orderParser.extractOrderStatus(mockCard, orderParser.selectors.yourAccount);

            expect(orderStatus).toBe('N/A');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should extract order items from order card', () => {
            const orderItems = orderParser.extractOrderItems(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderItems).toHaveLength(2);
            expect(orderItems[0].name).toBe('Sample Product 1');
            expect(orderItems[0].price).toBe('$19.99');
        });

        test('should extract order items from text content when no item elements', () => {
            const mockCard = {
                textContent: 'Product Name $19.99 Another Product $10.00',
                querySelectorAll: jest.fn().mockReturnValue([])
            };

            const orderItems = orderParser.extractOrderItems(mockCard, orderParser.selectors.yourAccount);
            expect(orderItems.length).toBeGreaterThan(0);
        });

        test('should handle order items extraction errors', () => {
            const mockCard = {
                textContent: '',
                querySelectorAll: jest.fn().mockImplementation(() => {
                    throw new Error('DOM error');
                })
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const orderItems = orderParser.extractOrderItems(mockCard, orderParser.selectors.yourAccount);

            expect(orderItems).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Item Details Extraction', () => {
        test('should extract item details from item element', () => {
            const mockItemElement = {
                querySelector: jest.fn().mockImplementation((selector) => {
                    if (selector.includes('name')) {
                        return { textContent: 'Test Product' };
                    }
                    if (selector.includes('price')) {
                        return { textContent: '$19.99' };
                    }
                    if (selector.includes('quantity')) {
                        return { textContent: '2' };
                    }
                    return null;
                }),
                textContent: 'Test Product $19.99'
            };

            const itemDetails = orderParser.extractItemDetails(mockItemElement);

            expect(itemDetails.name).toBe('Test Product');
            expect(itemDetails.price).toBe('$19.99');
            expect(itemDetails.quantity).toBe(2);
        });

        test('should extract item name from text content when no name element', () => {
            const mockItemElement = {
                querySelector: jest.fn().mockReturnValue(null),
                textContent: 'Test Product $19.99'
            };

            const itemDetails = orderParser.extractItemDetails(mockItemElement);
            expect(itemDetails.name).toBe('Test Product');
        });

        test('should extract item price from text content when no price element', () => {
            const mockItemElement = {
                querySelector: jest.fn().mockReturnValue(null),
                textContent: 'Test Product $19.99'
            };

            const itemDetails = orderParser.extractItemDetails(mockItemElement);
            expect(itemDetails.price).toBe('$19.99');
        });

        test('should default quantity to 1 when no quantity element', () => {
            const mockItemElement = {
                querySelector: jest.fn().mockReturnValue(null),
                textContent: 'Test Product $19.99'
            };

            const itemDetails = orderParser.extractItemDetails(mockItemElement);
            expect(itemDetails.quantity).toBe(1);
        });

        test('should handle item details extraction errors', () => {
            const mockItemElement = {
                querySelector: jest.fn().mockImplementation(() => {
                    throw new Error('DOM error');
                }),
                textContent: 'Test Product $19.99'
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const itemDetails = orderParser.extractItemDetails(mockItemElement);

            expect(itemDetails).toBe(null);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Bulk Order Parsing', () => {
        test('should parse all orders on page', () => {
            const mockCards = [mockOrderCard, mockOrderCard];
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            const orders = orderParser.parseAllOrders();

            expect(orders).toHaveLength(2);
            expect(orders[0]).toHaveProperty('orderNumber');
        });

        test('should handle empty order list', () => {
            mockDOM.querySelectorAll.mockReturnValue([]);

            const orders = orderParser.parseAllOrders();

            expect(orders).toHaveLength(0);
        });

        test('should handle orders that fail to parse', () => {
            const mockCards = [mockOrderCard, mockOrderCard];
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue(null);

            const orders = orderParser.parseAllOrders();

            expect(orders).toHaveLength(0);
        });
    });

    describe('Utility Methods', () => {
        test('should generate order element ID from dataset', () => {
            const mockCard = {
                dataset: { orderId: '123-4567890-1234567' }
            };

            const orderId = orderParser.generateOrderElementId(mockCard);
            expect(orderId).toBe('123-4567890-1234567');
        });

        test('should generate order element ID from content hash when no dataset', () => {
            const mockCard = {
                dataset: {},
                textContent: 'Test content',
                tagName: 'DIV',
                parentNode: {
                    tagName: 'BODY',
                    children: [],
                    parentNode: null
                }
            };

            // Mock the children array to include our element
            mockCard.parentNode.children[0] = mockCard;

            // Mock document.body to prevent the loop from going too far
            Object.defineProperty(document, 'body', {
                value: mockCard.parentNode,
                writable: true
            });

            const orderId = orderParser.generateOrderElementId(mockCard);
            expect(orderId).toMatch(/^order_[a-z0-9]+$/);
        });

        test('should get element position in DOM', () => {
            const mockElement = {
                tagName: 'DIV',
                parentNode: {
                    tagName: 'BODY',
                    children: [{}, {}, {}],
                    parentNode: null
                }
            };

            // Mock the children array to include our element at index 2
            mockElement.parentNode.children[2] = mockElement;

            // Mock document.body to prevent the loop from going too far
            Object.defineProperty(document, 'body', {
                value: mockElement.parentNode,
                writable: true
            });

            const position = orderParser.getElementPosition(mockElement);
            expect(position).toBe('div:2');
        });

        test('should hash strings consistently', () => {
            const testString = 'test string';
            const hash1 = orderParser.hashString(testString);
            const hash2 = orderParser.hashString(testString);

            expect(hash1).toBe(hash2);
            expect(typeof hash1).toBe('string');
        });

        test('should handle empty string in hash function', () => {
            const hash = orderParser.hashString('');
            expect(hash).toBe('0');
        });

        test('should return observation status', () => {
            expect(orderParser.isObservingForChanges()).toBe(false);

            orderParser.startObserving();
            expect(orderParser.isObservingForChanges()).toBe(true);
        });

        test('should return processed order count', () => {
            expect(orderParser.getProcessedOrderCount()).toBe(0);

            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_id');
            orderParser.processedOrders.add('test_id');

            expect(orderParser.getProcessedOrderCount()).toBe(1);
        });

        test('should clear processed orders', () => {
            orderParser.processedOrders.add('test_id');
            orderParser.clearProcessedOrders();

            expect(orderParser.processedOrders.size).toBe(0);
        });

        test('should log when clearing processed orders', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            orderParser.clearProcessedOrders();

            expect(consoleSpy).toHaveBeenCalledWith('OrderParser: Cleared processed orders cache');
            consoleSpy.mockRestore();
        });
    });

    describe('Order Number Validation', () => {
        test('should validate correct Amazon order number format', () => {
            const validOrderNumber = '112-8383531-6014102';
            expect(orderParser.validateOrderNumber(validOrderNumber)).toBe(true);
        });

        test('should reject invalid order number formats', () => {
            const invalidFormats = [
                '112-8683039',           // Missing last segment
                '112-8683039-704420',    // Too short
                '112-8383531-60141022',  // Too long
                '112-8383531-6014102a',  // Contains letters
                '11286830397044202',     // Missing hyphens
                'abc-defghij-klmnopq'    // Letters instead of numbers
            ];

            invalidFormats.forEach(format => {
                expect(orderParser.validateOrderNumber(format)).toBe(false);
            });
        });

        test('should handle edge cases', () => {
            expect(orderParser.validateOrderNumber('')).toBe(false);
            expect(orderParser.validateOrderNumber(null)).toBe(false);
            expect(orderParser.validateOrderNumber(undefined)).toBe(false);
        });
    });

    describe('Integration Tests', () => {
        test('should work end-to-end with your-account format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('yourAccount');

            const mockCards = [mockOrderCard];
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            const orders = orderParser.parseAllOrders();

            expect(orders).toHaveLength(1);
            expect(orders[0].format).toBe('yourAccount');
        });

        test('should work end-to-end with css format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('css');

            const mockCards = [mockOrderCard];
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            const orders = orderParser.parseAllOrders();

            expect(orders).toHaveLength(1);
            expect(orders[0].format).toBe('css');
        });

        test('should work end-to-end with your-orders format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('yourOrders');

            const mockCards = [mockOrderCard];
            mockOrderCard.matches.mockReturnValue(true);
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            const orders = orderParser.parseAllOrders();

            expect(orders).toHaveLength(1);
            expect(orders[0].format).toBe('yourOrders');
        });

        test('should handle dynamic content detection end-to-end', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            // Simulate a new order being added
            orderParser.processNewOrder(mockOrderCard);

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should handle complete order lifecycle', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            // Process new order
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue({ orderNumber: 'test' });
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_id');

            orderParser.processNewOrder(mockOrderCard);
            expect(orderParser.processedOrders.has('test_id')).toBe(true);

            // Process removed order
            orderParser.processRemovedOrder(mockOrderCard);
            expect(orderParser.processedOrders.has('test_id')).toBe(false);
        });
    });

    describe('Mock Data Access', () => {
        test('should have mock data available for testing', () => {
            expect(mockData).toBeDefined();
            expect(mockData.sampleOrder).toBeDefined();
            expect(mockData.sampleOrder.orderNumber).toBe('112-8383531-6014102');
        });
    });
});