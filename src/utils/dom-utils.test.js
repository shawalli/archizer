/**
 * Tests for DOM utility functions
 * Covers all DOM manipulation utilities and edge cases
 */

import {
    createElement,
    createButton,
    createContainer,
    safeQuery,
    safeQueryAll,
    safeAddEventListener,
    safeRemoveEventListener,
    safeSetStyles,
    safeAddClasses,
    safeRemoveClasses,
    hasClasses,
    safeGetComputedStyle,
    hideElement,
    hideElementsBySelectors,
    shouldPreserveElement,
    containsEssentialInfo,
    safeModifyClasses,
    safeSetMultipleStyles,
    isElementWithinContainer,
    createHidingResult
} from './dom-utils.js';

describe('DOM Utility Functions', () => {
    let testContainer;

    beforeEach(() => {
        // Set up test container
        testContainer = document.createElement('div');
        testContainer.id = 'test-container';
        document.body.appendChild(testContainer);
    });

    afterEach(() => {
        // Clean up test container
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    describe('createElement', () => {
        test('should create basic element with tag name', () => {
            const element = createElement('div');
            expect(element.tagName).toBe('DIV');
        });

        test('should apply className', () => {
            const element = createElement('div', { className: 'test-class' });
            expect(element.className).toBe('test-class');
        });

        test('should apply textContent', () => {
            const element = createElement('div', { textContent: 'Test text' });
            expect(element.textContent).toBe('Test text');
        });

        test('should apply innerHTML', () => {
            const element = createElement('div', { innerHTML: '<span>Test</span>' });
            expect(element.innerHTML).toBe('<span>Test</span>');
        });

        test('should apply id', () => {
            const element = createElement('div', { id: 'test-id' });
            expect(element.id).toBe('test-id');
        });

        test('should apply attributes', () => {
            const element = createElement('div', {
                attributes: { 'data-test': 'value', 'aria-label': 'Test' }
            });
            expect(element.getAttribute('data-test')).toBe('value');
            expect(element.getAttribute('aria-label')).toBe('Test');
        });

        test('should apply styles', () => {
            const element = createElement('div', {
                styles: { backgroundColor: 'red', color: 'white' }
            });
            expect(element.style.backgroundColor).toBe('red');
            expect(element.style.color).toBe('white');
        });

        test('should handle empty options', () => {
            const element = createElement('span');
            expect(element.tagName).toBe('SPAN');
            expect(element.className).toBe('');
        });
    });

    describe('createButton', () => {
        test('should create button with text', () => {
            const button = createButton('Click me');
            expect(button.tagName).toBe('BUTTON');
            expect(button.type).toBe('button');

            // Check for nested structure
            const buttonInner = button.querySelector('.a-button-inner');
            expect(buttonInner).toBeTruthy();

            const buttonText = button.querySelector('.a-button-text');
            expect(buttonText).toBeTruthy();
            expect(buttonText.textContent).toBe('Click me');
        });

        test('should apply default styling', () => {
            const button = createButton('Test');
            expect(button.style.backgroundColor).toBe('rgb(119, 89, 185)');
            expect(button.style.color).toBe('white');
            expect(button.style.cursor).toBe('pointer');
            expect(button.style.borderRadius).toBe('6.25rem'); // Amazon pill style
        });

        test('should apply custom className', () => {
            const button = createButton('Test', { className: 'custom-button' });
            expect(button.className).toContain('custom-button');
        });

        test('should apply custom attributes', () => {
            const button = createButton('Test', {
                attributes: { 'data-action': 'submit', disabled: 'true' }
            });
            expect(button.getAttribute('data-action')).toBe('submit');
            expect(button.getAttribute('disabled')).toBe('true');
        });

        test('should apply custom styles', () => {
            const button = createButton('Test', {
                styles: { backgroundColor: 'green', fontSize: '16px' }
            });
            expect(button.style.backgroundColor).toBe('green');
            expect(button.style.fontSize).toBe('16px');
        });
    });

    describe('createContainer', () => {
        test('should create container with className', () => {
            const container = createContainer('test-container');
            expect(container.tagName).toBe('DIV');
            expect(container.className).toBe('test-container');
        });

        test('should apply default styling', () => {
            const container = createContainer('test');
            expect(container.style.marginTop).toBe('8px');
            expect(container.style.padding).toBe('8px 0px'); // JSDOM normalizes to 0px
            expect(container.style.borderTop).toBe('1px solid rgb(231, 231, 231)');
        });

        test('should apply custom options', () => {
            const container = createContainer('test', {
                textContent: 'Container content',
                styles: { backgroundColor: 'blue' }
            });
            expect(container.textContent).toBe('Container content');
            expect(container.style.backgroundColor).toBe('blue');
        });
    });

    describe('safeQuery', () => {
        beforeEach(() => {
            testContainer.innerHTML = `
                <div class="item">Item 1</div>
                <div class="item">Item 2</div>
                <span class="text">Text</span>
            `;
        });

        test('should find single element', () => {
            const element = safeQuery(testContainer, '.item');
            expect(element).toBeTruthy();
            expect(element.textContent).toBe('Item 1');
        });

        test('should find all elements when all=true', () => {
            const elements = safeQuery(testContainer, '.item', true);
            expect(elements).toHaveLength(2);
            expect(elements[0].textContent).toBe('Item 1');
            expect(elements[1].textContent).toBe('Item 2');
        });

        test('should return null when element not found', () => {
            const element = safeQuery(testContainer, '.nonexistent');
            expect(element).toBeNull();
        });

        test('should handle invalid parent', () => {
            const element = safeQuery(null, '.item');
            expect(element).toBeNull();
        });
    });

    describe('safeQueryAll', () => {
        beforeEach(() => {
            testContainer.innerHTML = `
                <div class="item">Item 1</div>
                <div class="item">Item 2</div>
                <span class="text">Text</span>
            `;
        });

        test('should find all matching elements', () => {
            const elements = safeQueryAll(testContainer, '.item');
            expect(elements).toHaveLength(2);
        });

        test('should return empty array when no matches', () => {
            const elements = safeQueryAll(testContainer, '.nonexistent');
            expect(elements).toHaveLength(0);
        });

        test('should handle invalid parent', () => {
            const elements = safeQueryAll(null, '.item');
            expect(elements).toHaveLength(0);
        });
    });

    describe('safeAddEventListener', () => {
        test('should add event listener', () => {
            const element = document.createElement('div');
            const handler = jest.fn();

            safeAddEventListener(element, 'click', handler);
            element.click();

            expect(handler).toHaveBeenCalled();
        });

        test('should handle invalid element', () => {
            expect(() => {
                safeAddEventListener(null, 'click', jest.fn());
            }).not.toThrow();
        });

        test('should handle invalid event type', () => {
            const element = document.createElement('div');
            expect(() => {
                safeAddEventListener(element, '', jest.fn());
            }).not.toThrow();
        });
    });

    describe('safeRemoveEventListener', () => {
        test('should remove event listener', () => {
            const element = document.createElement('div');
            const handler = jest.fn();

            safeAddEventListener(element, 'click', handler);
            safeRemoveEventListener(element, 'click', handler);
            element.click();

            expect(handler).not.toHaveBeenCalled();
        });

        test('should handle invalid element', () => {
            expect(() => {
                safeRemoveEventListener(null, 'click', jest.fn());
            }).not.toThrow();
        });
    });

    describe('safeSetStyles', () => {
        test('should set styles safely', () => {
            const element = document.createElement('div');
            const styles = { backgroundColor: 'red', color: 'white' };

            safeSetStyles(element, styles);

            expect(element.style.backgroundColor).toBe('red');
            expect(element.style.color).toBe('white');
        });

        test('should handle invalid element', () => {
            expect(() => {
                safeSetStyles(null, { backgroundColor: 'red' });
            }).not.toThrow();
        });

        test('should handle invalid styles object', () => {
            const element = document.createElement('div');
            expect(() => {
                safeSetStyles(element, null);
            }).not.toThrow();
        });
    });

    describe('safeAddClasses', () => {
        test('should add classes safely', () => {
            const element = document.createElement('div');
            const classes = ['class1', 'class2'];

            safeAddClasses(element, classes);

            expect(element.classList.contains('class1')).toBe(true);
            expect(element.classList.contains('class2')).toBe(true);
        });

        test('should handle single class string', () => {
            const element = document.createElement('div');
            safeAddClasses(element, 'single-class');
            expect(element.classList.contains('single-class')).toBe(true);
        });

        test('should handle invalid element', () => {
            expect(() => {
                safeAddClasses(null, ['class1']);
            }).not.toThrow();
        });
    });

    describe('safeRemoveClasses', () => {
        test('should remove classes safely', () => {
            const element = document.createElement('div');
            element.className = 'class1 class2 class3';

            safeRemoveClasses(element, ['class1', 'class2']);

            expect(element.classList.contains('class1')).toBe(false);
            expect(element.classList.contains('class2')).toBe(false);
            expect(element.classList.contains('class3')).toBe(true);
        });

        test('should handle single class string', () => {
            const element = document.createElement('div');
            element.className = 'class1 class2';

            safeRemoveClasses(element, 'class1');

            expect(element.classList.contains('class1')).toBe(false);
            expect(element.classList.contains('class2')).toBe(true);
        });
    });

    describe('hasClasses', () => {
        test('should check if element has all classes', () => {
            const element = document.createElement('div');
            element.className = 'class1 class2 class3';

            expect(hasClasses(element, ['class1', 'class2'])).toBe(true);
            expect(hasClasses(element, ['class1', 'class4'])).toBe(false);
        });

        test('should handle single class string', () => {
            const element = document.createElement('div');
            element.className = 'class1 class2';

            expect(hasClasses(element, 'class1')).toBe(true);
            expect(hasClasses(element, 'class3')).toBe(false);
        });
    });

    describe('safeGetComputedStyle', () => {
        test('should get computed style safely', () => {
            const element = document.createElement('div');
            element.style.backgroundColor = 'red';

            const bgColor = safeGetComputedStyle(element, 'backgroundColor');
            expect(bgColor).toBeTruthy();
        });

        test('should handle invalid element', () => {
            const result = safeGetComputedStyle(null, 'backgroundColor');
            expect(result).toBe(null); // Function returns null for invalid elements
        });
    });

    describe('hideElement', () => {
        test('should hide element with order ID', () => {
            const element = document.createElement('div');
            element.textContent = 'Test content';

            const result = hideElement(element, 'order-123', 'order-card');

            expect(result.success).toBe(true);
            expect(element.style.display).toBe('none');
            expect(element.classList.contains('archizer-hidden-details')).toBe(true);
            expect(result.element).toBe(element);
        });

        test('should handle element without text content', () => {
            const element = document.createElement('div');

            const result = hideElement(element, 'order-123');

            expect(result.success).toBe(true);
            expect(element.style.display).toBe('none');
        });
    });

    describe('hideElementsBySelectors', () => {
        beforeEach(() => {
            testContainer.innerHTML = `
                <div class="item">Item 1</div>
                <div class="item">Item 2</div>
                <span class="text">Text</span>
            `;
        });

        test('should hide elements matching selectors', () => {
            const selectors = ['.item', '.text'];

            const hiddenElements = hideElementsBySelectors(testContainer, selectors, 'order-123');

            expect(hiddenElements).toHaveLength(3);

            const items = testContainer.querySelectorAll('.item, .text');
            items.forEach(item => {
                expect(item.style.display).toBe('none');
            });
        });

        test('should respect skip condition', () => {
            const selectors = ['.item'];
            const skipCondition = (element) => element.textContent === 'Item 1';

            const hiddenElements = hideElementsBySelectors(testContainer, selectors, 'order-123', skipCondition);

            expect(hiddenElements).toHaveLength(1);

            const item1 = testContainer.querySelector('.item');
            expect(item1.style.display).not.toBe('none');
        });
    });

    describe('shouldPreserveElement', () => {
        test('should preserve element matching patterns', () => {
            const element = document.createElement('div');
            element.textContent = 'Important information';

            const patterns = ['important', 'critical'];

            expect(shouldPreserveElement(element, patterns)).toBe(true);
        });

        test('should not preserve element without patterns', () => {
            const element = document.createElement('div');
            element.textContent = 'Regular content';

            expect(shouldPreserveElement(element, [])).toBe(false);
        });
    });

    describe('containsEssentialInfo', () => {
        test('should detect essential information', () => {
            const element = document.createElement('div');
            element.textContent = 'Order #123-4567890-1234567';

            expect(containsEssentialInfo(element)).toBe(true);
        });

        test('should not detect non-essential information', () => {
            const element = document.createElement('div');
            element.textContent = 'Regular text content';

            expect(containsEssentialInfo(element)).toBe(false);
        });
    });

    describe('safeModifyClasses', () => {
        test('should add and remove classes safely', () => {
            const element = document.createElement('div');
            element.className = 'existing-class';

            safeModifyClasses(element, ['new-class'], ['existing-class']);

            expect(element.classList.contains('new-class')).toBe(true);
            expect(element.classList.contains('existing-class')).toBe(false);
        });

        test('should handle empty arrays', () => {
            const element = document.createElement('div');
            element.className = 'test-class';

            safeModifyClasses(element, [], []);

            expect(element.classList.contains('test-class')).toBe(true);
        });
    });

    describe('safeSetMultipleStyles', () => {
        test('should set multiple styles safely', () => {
            const element = document.createElement('div');
            const styles = {
                backgroundColor: 'red',
                color: 'white',
                fontSize: '16px'
            };

            safeSetMultipleStyles(element, styles);

            expect(element.style.backgroundColor).toBe('red');
            expect(element.style.color).toBe('white');
            expect(element.style.fontSize).toBe('16px');
        });
    });

    describe('isElementWithinContainer', () => {
        test('should detect element within container', () => {
            const container = document.createElement('div');
            const child = document.createElement('span');
            container.appendChild(child);

            expect(isElementWithinContainer(child, container)).toBe(true);
        });

        test('should detect element outside container', () => {
            const container1 = document.createElement('div');
            const container2 = document.createElement('div');
            const child = document.createElement('span');
            container1.appendChild(child);

            expect(isElementWithinContainer(child, container2)).toBe(false);
        });
    });

    describe('createHidingResult', () => {
        test('should create success result', () => {
            const element = document.createElement('div');
            const result = createHidingResult(element, true, 'Successfully hidden');

            expect(result.success).toBe(true);
            expect(result.reason).toBe('Successfully hidden');
            expect(result.element).toBe(element);
        });

        test('should create failure result', () => {
            const element = document.createElement('div');
            const result = createHidingResult(element, false, 'Failed to hide', { error: 'test' });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Failed to hide');
            expect(result.error).toBe('test'); // additionalData is spread into the result
        });
    });
});
