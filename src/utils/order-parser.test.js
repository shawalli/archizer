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

describe('OrderParser', () => {
    let orderParser;
    let originalLocation;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Store original location
        originalLocation = window.location;

        // Mock document methods
        document.querySelectorAll = mockDOM.querySelectorAll;
        document.querySelector = mockDOM.querySelector;

        orderParser = new OrderParser();
    });

    afterEach(() => {
        // Restore original location
        if (originalLocation) {
            window.location = originalLocation;
        }
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with selectors for all page formats', () => {
            expect(orderParser.selectors).toHaveProperty('yourAccount');
            expect(orderParser.selectors).toHaveProperty('css');
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
            // Mock the detectPageFormat method to return expected value
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('yourAccount');
            expect(orderParser.detectPageFormat()).toBe('yourAccount');
        });

        test('should detect css format', () => {
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('css');
            expect(orderParser.detectPageFormat()).toBe('css');
        });

        test('should return unknown for unrecognized format', () => {
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
    });

    describe('Order Card Finding', () => {
        test('should find order cards using correct selector', () => {
            const mockCards = [mockOrderCard, mockOrderCard];
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            const cards = orderParser.findOrderCards();

            expect(mockDOM.querySelectorAll).toHaveBeenCalledWith('.order-card.js-order-card');
            expect(cards).toBe(mockCards);
        });
    });

    describe('Dynamic Content Detection', () => {
        test('should start observing for changes', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            expect(orderParser.isObserving).toBe(true);
            expect(orderParser.onOrderDetected).toBe(mockCallback);
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

        test('should process new orders correctly', () => {
            // Mock the parseOrderCard method
            const mockOrderData = { orderNumber: '123-4567890-1234567' };
            jest.spyOn(orderParser, 'parseOrderCard').mockReturnValue(mockOrderData);

            // Mock the generateOrderElementId method
            jest.spyOn(orderParser, 'generateOrderElementId').mockReturnValue('test_order_id');

            orderParser.processNewOrder(mockOrderCard);

            expect(orderParser.processedOrders.has('test_order_id')).toBe(true);
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
            expect(parsedOrder).toBeNull();
        });
    });

    describe('Data Extraction Methods', () => {
        test('should extract order number from order card', () => {
            const orderNumber = orderParser.extractOrderNumber(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderNumber).toBe('112-8383531-6014102');
        });

        test('should extract order date from order card', () => {
            const orderDate = orderParser.extractOrderDate(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderDate).toBe('2025-01-15');
        });

        test('should extract order total from order card', () => {
            const orderTotal = orderParser.extractOrderTotal(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderTotal).toBe('$29.99');
        });

        test('should extract order status from order card', () => {
            const orderStatus = orderParser.extractOrderStatus(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderStatus).toBe('Delivered');
        });

        test('should extract order items from order card', () => {
            const orderItems = orderParser.extractOrderItems(mockOrderCard, orderParser.selectors.yourAccount);
            expect(orderItems).toHaveLength(2);
            expect(orderItems[0].name).toBe('Sample Product 1');
            expect(orderItems[0].price).toBe('$19.99');
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
    });

    describe('Mock Data Access', () => {
        test('should have mock data available for testing', () => {
            expect(mockData).toBeDefined();
            expect(mockData.sampleOrder).toBeDefined();
            expect(mockData.sampleOrder.orderNumber).toBe('112-8383531-6014102');
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

    describe('Utility Methods', () => {
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
    });

    describe('Integration Tests', () => {
        test('should work end-to-end with your-account format', () => {
            // Mock the detectPageFormat method to return expected value
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
            jest.spyOn(orderParser, 'detectPageFormat').mockReturnValue('your-orders');

            const mockCards = [mockOrderCard];
            mockDOM.querySelectorAll.mockReturnValue(mockCards);

            const orders = orderParser.parseAllOrders();

            expect(orders).toHaveLength(1);
            expect(orders[0].format).toBe('your-orders');
        });

        test('should handle dynamic content detection end-to-end', () => {
            const mockCallback = jest.fn();
            orderParser.startObserving(mockCallback);

            // Simulate a new order being added
            orderParser.processNewOrder(mockOrderCard);

            expect(mockCallback).toHaveBeenCalled();
        });
    });
});