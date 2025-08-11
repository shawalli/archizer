// Order Parser Utilities
// Functions to parse Amazon order data and extract required information

console.log('Order parser utilities loaded');

export class OrderParser {
    constructor() {
        this.selectors = {
            orderId: '.order-id, [data-order-id]',
            orderDate: '.order-date, [data-order-date]',
            orderTotal: '.order-total, [data-order-total]',
            orderStatus: '.order-status, [data-order-status]'
        };
    }

    parseOrderElement(orderElement) {
        if (!orderElement) {
            return this.getDefaultOrderData();
        }

        return {
            orderId: this.extractOrderId(this.getTextContent(orderElement, this.selectors.orderId)),
            orderDate: this.extractDate(this.getTextContent(orderElement, this.selectors.orderDate)),
            orderTotal: this.extractPrice(this.getTextContent(orderElement, this.selectors.orderTotal)),
            status: this.getTextContent(orderElement, this.selectors.orderStatus) || 'unknown'
        };
    }

    extractOrderId(text) {
        if (!text) return 'unknown';

        const orderIdMatch = text.match(/(\d{3}-\d{7}-\d{7})/);
        return orderIdMatch ? orderIdMatch[1] : 'unknown';
    }

    extractPrice(text) {
        if (!text) return 'unknown';

        const priceMatch = text.match(/\$?(\d+\.?\d*)/);
        return priceMatch ? `$${priceMatch[1]}` : 'unknown';
    }

    extractDate(text) {
        if (!text) return 'unknown';

        // Try to extract date from various formats
        const dateMatch = text.match(/(?:ordered\s+on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
        return dateMatch ? dateMatch[1] : text;
    }

    getTextContent(element, selector) {
        const foundElement = element.querySelector(selector);
        return foundElement ? foundElement.textContent.trim() : null;
    }

    getDefaultOrderData() {
        return {
            orderId: 'unknown',
            orderDate: 'unknown',
            orderTotal: 'unknown',
            status: 'unknown'
        };
    }
}

// TODO: Implement data validation and sanitization
// TODO: Handle various Amazon order formats
