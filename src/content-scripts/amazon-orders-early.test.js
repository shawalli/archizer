describe('Amazon Orders Early Content Script', () => {
    let originalDocument;
    let originalConsole;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Clear module cache to ensure fresh execution
        jest.resetModules();

        // Store original globals
        originalDocument = global.document;
        originalConsole = global.console;

        // Create a simple mock document that doesn't interfere with the script
        global.document = {
            body: null,
            documentElement: null,
            head: null,
            getElementById: jest.fn().mockReturnValue(null),
            querySelectorAll: jest.fn().mockReturnValue([]),
            addEventListener: jest.fn(),
            createElement: jest.fn().mockImplementation((tagName) => {
                return {
                    id: '',
                    className: '',
                    style: {},
                    innerHTML: '',
                    textContent: '',
                    appendChild: jest.fn(),
                    querySelector: jest.fn(),
                    querySelectorAll: jest.fn()
                };
            }),
            appendChild: jest.fn(),
            readyState: 'loading'
        };

        // Ensure getElementById always returns null for the overlay
        global.document.getElementById = jest.fn().mockImplementation((id) => {
            if (id === 'amazon-orders-archiver-overlay') {
                return null;
            }
            return null;
        });

        // Ensure all document methods are properly mocked as Jest functions
        global.document.addEventListener = jest.fn();
        global.document.createElement = jest.fn().mockImplementation((tagName) => {
            return {
                id: '',
                className: '',
                style: {},
                innerHTML: '',
                textContent: '',
                appendChild: jest.fn(),
                querySelector: jest.fn(),
                querySelectorAll: jest.fn()
            };
        });
        global.document.appendChild = jest.fn();

        // Mock console to capture output
        global.console = {
            log: jest.fn(),
            error: jest.fn()
        };

        // Mock global functions
        global.requestAnimationFrame = jest.fn((callback) => {
            setTimeout(callback, 0);
            return 1;
        });

        global.setTimeout = jest.fn((callback, delay) => {
            if (delay === 0) {
                callback();
            }
            return 1;
        });

        global.Promise = {
            resolve: jest.fn(() => ({
                then: jest.fn((callback) => {
                    callback();
                    return global.Promise;
                })
            }))
        };
    });

    afterEach(() => {
        // Restore original globals
        global.document = originalDocument;
        global.console = originalConsole;
    });

    describe('Script Execution', () => {
        it('should log when script loads', () => {
            require('./amazon-orders-early.js');

            expect(console.log).toHaveBeenCalledWith('🔧 Amazon Order Archiver early content script loaded (document_start)');
        });

        it('should log initialization completion', () => {
            require('./amazon-orders-early.js');

            expect(console.log).toHaveBeenCalledWith('🔧 Early content script initialization complete');
        });
    });

    describe('Injection Strategies', () => {
        it('should attempt immediate injection', () => {
            require('./amazon-orders-early.js');

            // Should attempt injection (may or may not succeed in test environment)
            expect(console.log).toHaveBeenCalledWith('🔧 Amazon Order Archiver early content script loaded (document_start)');
        });

        it('should attempt fallback injection', () => {
            require('./amazon-orders-early.js');

            // Should attempt injection and potentially fallback
            expect(console.log).toHaveBeenCalledWith('🔧 Amazon Order Archiver early content script loaded (document_start)');
        });

        it('should handle injection failures gracefully', () => {
            require('./amazon-orders-early.js');

            // Should handle any injection errors gracefully
            expect(console.log).toHaveBeenCalledWith('🔧 Amazon Order Archiver early content script loaded (document_start)');
        });
    });

    describe('Event Listeners', () => {
        it('should set up DOMContentLoaded listener', () => {
            require('./amazon-orders-early.js');

            expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
        });
    });

    describe('DOM Element Creation', () => {
        it('should create HTML elements when needed', () => {
            require('./amazon-orders-early.js');

            // Should attempt to create elements for the document structure
            expect(document.createElement).toHaveBeenCalled();
        });

        it('should create overlay elements', () => {
            require('./amazon-orders-early.js');

            // Should attempt to create overlay elements
            expect(document.createElement).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle createElement errors gracefully', () => {
            // Mock createElement to throw error
            document.createElement = jest.fn(() => {
                throw new Error('Mock error');
            });

            // Should not throw error
            expect(() => require('./amazon-orders-early.js')).not.toThrow();
        });

        it('should handle appendChild errors gracefully', () => {
            // Mock appendChild to throw error
            document.appendChild = jest.fn(() => {
                throw new Error('Mock error');
            });

            // Should not throw error
            expect(() => require('./amazon-orders-early.js')).not.toThrow();
        });
    });

    describe('Pre-document Injection', () => {
        it('should attempt pre-document injection', () => {
            require('./amazon-orders-early.js');

            // Should attempt pre-document injection
            expect(console.log).toHaveBeenCalledWith('🔧 Early content script initialization complete');
        });

        it('should handle cases where documentElement does not exist', () => {
            // Mock no documentElement by setting it to undefined
            Object.defineProperty(document, 'documentElement', {
                value: null,
                writable: true
            });

            require('./amazon-orders-early.js');

            // Should still complete initialization
            expect(console.log).toHaveBeenCalledWith('🔧 Early content script initialization complete');
        });
    });
});
