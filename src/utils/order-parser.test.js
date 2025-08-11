// Order parser utility tests
import { OrderParser } from './order-parser.js';

describe('OrderParser', () => {
    let orderParser;

    beforeEach(() => {
        orderParser = new OrderParser();
    });

    describe('parseOrderElement', () => {
        it('should parse order element and extract basic information', () => {
            const mockOrderElement = {
                querySelector: jest.fn((selector) => {
                    if (selector === '.order-id, [data-order-id]') {
                        return { textContent: 'Order #123-4567890-1234567' };
                    }
                    if (selector === '.order-date, [data-order-date]') {
                        return { textContent: 'Ordered on January 15, 2024' };
                    }
                    if (selector === '.order-total, [data-order-total]') {
                        return { textContent: '$29.99' };
                    }
                    return null;
                })
            };

            const result = orderParser.parseOrderElement(mockOrderElement);

            expect(result).toEqual({
                orderId: '123-4567890-1234567',
                orderDate: 'January 15, 2024',
                orderTotal: '$29.99',
                status: 'unknown'
            });
        });

        it('should handle missing order information gracefully', () => {
            const mockOrderElement = {
                querySelector: jest.fn(() => null)
            };

            const result = orderParser.parseOrderElement(mockOrderElement);

            expect(result).toEqual({
                orderId: 'unknown',
                orderDate: 'unknown',
                orderTotal: 'unknown',
                status: 'unknown'
            });
        });
    });

    describe('extractOrderId', () => {
        it('should extract order ID from various formats', () => {
            const testCases = [
                { input: 'Order #123-4567890-1234567', expected: '123-4567890-1234567' },
                { input: 'Order 123-4567890-1234567', expected: '123-4567890-1234567' },
                { input: '123-4567890-1234567', expected: '123-4567890-1234567' },
                { input: 'Invalid format', expected: 'unknown' }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = orderParser.extractOrderId(input);
                expect(result).toBe(expected);
            });
        });
    });

    describe('extractPrice', () => {
        it('should extract price from various formats', () => {
            const testCases = [
                { input: '$29.99', expected: '$29.99' },
                { input: '29.99', expected: '$29.99' },
                { input: 'Total: $29.99', expected: '$29.99' },
                { input: 'Invalid price', expected: 'unknown' }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = orderParser.extractPrice(input);
                expect(result).toBe(expected);
            });
        });
    });

    describe('extractDate', () => {
        it('should extract date from various formats', () => {
            const testCases = [
                { input: 'January 15, 2024', expected: 'January 15, 2024' },
                { input: 'Ordered on January 15, 2024', expected: 'January 15, 2024' },
                { input: 'Delivered on March 20, 2024', expected: 'March 20, 2024' },
                { input: 'Invalid date', expected: 'Invalid date' }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = orderParser.extractDate(input);
                expect(result).toBe(expected);
            });
        });
    });
});
