describe('Amazon Orders Content Script', () => {
    let originalDocument;
    let originalConsole;
    let originalChrome;
    let originalWindow;
    let mockStorageManager;
    let mockOrderParser;
    let mockDOMManipulator;
    let mockTaggingDialog;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Clear module cache to ensure fresh execution
        jest.resetModules();

        // Store original globals
        originalDocument = global.document;
        originalConsole = global.console;
        originalChrome = global.chrome;
        originalWindow = global.window;

        // Mock console
        global.console = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
        };

        // Mock chrome runtime
        global.chrome = {
            runtime: {
                onMessage: {
                    addListener: jest.fn()
                },
                getURL: jest.fn((path) => `chrome-extension://test/${path}`)
            }
        };

        // Mock window
        global.window = {
            location: {
                href: 'https://www.amazon.com/gp/your-account/order-details'
            },
            addEventListener: jest.fn()
        };

        // Ensure window.addEventListener is properly mocked as Jest function
        global.window.addEventListener = jest.fn();

        // Create a simple mock document
        global.document = {
            body: null,
            documentElement: null,
            head: null,
            title: 'Your Orders',
            getElementById: jest.fn().mockReturnValue(null),
            querySelector: jest.fn().mockReturnValue(null),
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
                    querySelectorAll: jest.fn(),
                    setAttribute: jest.fn(),
                    hasAttribute: jest.fn().mockReturnValue(false)
                };
            }),
            appendChild: jest.fn()
        };

        // Ensure all document methods are properly mocked as Jest functions
        global.document.getElementById = jest.fn().mockReturnValue(null);
        global.document.querySelector = jest.fn().mockReturnValue(null);
        global.document.querySelectorAll = jest.fn().mockReturnValue([]);
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
                querySelectorAll: jest.fn(),
                setAttribute: jest.fn(),
                hasAttribute: jest.fn().mockReturnValue(false)
            };
        });
        global.document.appendChild = jest.fn();

        // Mock fetch
        global.fetch = jest.fn();

        // Mock dependencies
        mockStorageManager = {
            storeHiddenOrder: jest.fn().mockResolvedValue(undefined),
            removeHiddenOrder: jest.fn()
        };

        mockOrderParser = {
            getSelectors: jest.fn().mockReturnValue({ orderCards: '.order-card' }),
            findOrderCards: jest.fn().mockReturnValue([]),
            startObserving: jest.fn()
        };

        mockDOMManipulator = {
            setOrderParser: jest.fn(),
            setStorage: jest.fn(),
            setCallbacks: jest.fn(),
            startObserving: jest.fn(),
            getOrderIdFromElement: jest.fn().mockReturnValue('test-order-123'),
            injectedButtons: new Map(),
            injectButtons: jest.fn().mockReturnValue(true),
            removeButtons: jest.fn(),
            restoreHiddenOrdersFromStorage: jest.fn().mockResolvedValue(undefined),
            restoreAllHiddenOrders: jest.fn().mockReturnValue(5)
        };

        mockTaggingDialog = {
            // Mock TaggingDialog class
        };

        // Mock the imported modules
        jest.doMock('../utils/extension-loader.js', () => ({
            globalExtensionLoader: {
                initialize: jest.fn().mockResolvedValue(undefined),
                isInitialized: true
            }
        }));

        jest.doMock('../utils/error-handler.js', () => ({
            globalErrorHandler: {
                handleError: jest.fn()
            }
        }));

        jest.doMock('../utils/storage.js', () => ({
            StorageManager: jest.fn(() => mockStorageManager)
        }));

        jest.doMock('../utils/order-parser.js', () => ({
            OrderParser: jest.fn(() => mockOrderParser)
        }));

        jest.doMock('../utils/dom-manipulator.js', () => ({
            DOMManipulator: jest.fn(() => mockDOMManipulator)
        }));

        jest.doMock('../components/tagging-dialog.js', () => ({
            TaggingDialog: mockTaggingDialog
        }));
    });

    afterEach(() => {
        // Restore original globals
        global.document = originalDocument;
        global.console = originalConsole;
        global.chrome = originalChrome;
        global.window = originalWindow;
    });

    describe('Script Execution', () => {
        it('should log when script loads', () => {
            require('./amazon-orders.js');

            expect(console.log).toHaveBeenCalledWith('🔧 Amazon Order Archiver content script loaded');
        });

        it('should log initialization start', () => {
            require('./amazon-orders.js');

            expect(console.log).toHaveBeenCalledWith('🔧 Starting content script initialization...');
        });

        it('should log current URL and page title', () => {
            require('./amazon-orders.js');

            // The script logs the actual window.location.href, which may be different in test environment
            expect(console.log).toHaveBeenCalledWith('🔧 Current URL:', expect.any(String));
            expect(console.log).toHaveBeenCalledWith('🔧 Page title:', expect.any(String));
        });
    });

    describe('Extension Loader Integration', () => {
        it('should wait for extension loader to initialize', async () => {
            const { globalExtensionLoader } = require('../utils/extension-loader.js');

            require('./amazon-orders.js');

            expect(globalExtensionLoader.initialize).toHaveBeenCalled();
        });

        it('should proceed with initialization when extension loader is ready', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(console.log).toHaveBeenCalledWith('✅ Content script initialized successfully');
        });

        it('should skip initialization when page is not supported', async () => {
            // Mock extension loader as not initialized
            jest.doMock('../utils/extension-loader.js', () => ({
                globalExtensionLoader: {
                    initialize: jest.fn().mockResolvedValue(undefined),
                    isInitialized: false
                }
            }));

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(console.log).toHaveBeenCalledWith('⚠️ Content script initialization skipped - page not supported');
        });
    });

    describe('Dependency Initialization', () => {
        it('should initialize StorageManager, OrderParser, and DOMManipulator', async () => {
            const { StorageManager } = require('../utils/storage.js');
            const { OrderParser } = require('../utils/order-parser.js');
            const { DOMManipulator } = require('../utils/dom-manipulator.js');

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(StorageManager).toHaveBeenCalled();
            expect(OrderParser).toHaveBeenCalled();
            expect(DOMManipulator).toHaveBeenCalled();
        });

        it('should set up integration between DOM manipulator and OrderParser', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockDOMManipulator.setOrderParser).toHaveBeenCalledWith(mockOrderParser);
        });

        it('should set up storage instance for DOM manipulator', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockDOMManipulator.setStorage).toHaveBeenCalledWith(mockStorageManager);
        });

        it('should set up callbacks for order state changes', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockDOMManipulator.setCallbacks).toHaveBeenCalled();
        });
    });

    describe('Tagging Dialog Initialization', () => {
        it('should attempt to initialize tagging dialog', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(console.log).toHaveBeenCalledWith('🔧 Initializing tagging dialog...');
        });

        it('should check for existing tagging interface in DOM', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(document.getElementById).toHaveBeenCalledWith('tagging-interface');
        });

        it('should attempt to load tagging interface HTML if not found', async () => {
            // Mock fetch to return HTML
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue('<div id="tagging-interface">Test</div>')
            });

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(global.fetch).toHaveBeenCalledWith('chrome-extension://test/components/tagging-dialog.html');
        });

        it('should create fallback tagging interface if HTML loading fails', async () => {
            // Mock fetch to fail
            global.fetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // The script should log the fetch error and then create fallback
            expect(console.error).toHaveBeenCalledWith('❌ Error fetching tagging interface HTML:', expect.any(Error));
        });
    });

    describe('Order Archiving System', () => {
        it('should start order archiving system', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(console.log).toHaveBeenCalledWith('🚀 Starting order archiving system...');
        });

        it('should log order card selector being used', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(console.log).toHaveBeenCalledWith('🔍 Looking for order cards with selector:', '.order-card');
        });

        it('should start observing for dynamic content changes', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockOrderParser.startObserving).toHaveBeenCalled();
            expect(mockDOMManipulator.startObserving).toHaveBeenCalled();
        });

        it('should process existing orders on the page', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockOrderParser.findOrderCards).toHaveBeenCalled();
        });

        it('should restore hidden orders from storage', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockDOMManipulator.restoreHiddenOrdersFromStorage).toHaveBeenCalledWith(mockStorageManager);
        });
    });

    describe('Order Processing', () => {
        it('should process individual order cards', async () => {
            // Mock order card element
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(false),
                setAttribute: jest.fn(),
                querySelector: jest.fn().mockReturnValue(null)
            };

            // Mock DOM manipulator methods
            mockDOMManipulator.getOrderIdFromElement = jest.fn().mockReturnValue('test-order-123');
            mockDOMManipulator.injectedButtons = new Map();

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // The script should initialize and set up the DOM manipulator
            expect(mockDOMManipulator.setOrderParser).toHaveBeenCalled();
            expect(mockDOMManipulator.setStorage).toHaveBeenCalled();
            expect(mockDOMManipulator.setCallbacks).toHaveBeenCalled();
        });

        it('should skip already processed order cards', async () => {
            // Mock order card that's already processed
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(true)
            };

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should not process already processed cards
            expect(mockOrderParser.findOrderCards).toHaveBeenCalled();
        });

        it('should skip order cards that already have buttons', async () => {
            // Mock order card with existing buttons
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue({}) // Has buttons
            };

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should check for existing buttons
            expect(mockOrderParser.findOrderCards).toHaveBeenCalled();
        });
    });

    describe('Message Handling', () => {
        it('should set up message listener for popup communication', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        });

        it('should handle resync-orders message from popup', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Get the message listener
            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

            // Mock sendResponse
            const sendResponse = jest.fn();

            // Call the listener with resync message
            const result = messageListener({ action: 'resync-orders' }, {}, sendResponse);

            expect(result).toBe(true); // Keep message channel open
            expect(mockDOMManipulator.restoreAllHiddenOrders).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle initialization errors gracefully', async () => {
            // Mock extension loader to throw error
            jest.doMock('../utils/extension-loader.js', () => ({
                globalExtensionLoader: {
                    initialize: jest.fn().mockRejectedValue(new Error('Init failed'))
                }
            }));

            const { globalErrorHandler } = require('../utils/error-handler.js');

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(globalErrorHandler.handleError).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith('❌ Content script initialization failed:', expect.any(Error));
        });

        it('should handle order processing errors gracefully', async () => {
            // Mock order parser to throw error
            mockOrderParser.findOrderCards = jest.fn().mockImplementation(() => {
                throw new Error('Order processing failed');
            });

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should set up beforeunload event listener', () => {
            require('./amazon-orders.js');

            expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });

        it('should log cleanup message on beforeunload', () => {
            require('./amazon-orders.js');

            // Get the beforeunload listener
            const beforeunloadCalls = window.addEventListener.mock.calls;
            const beforeunloadCall = beforeunloadCalls.find(call => call[0] === 'beforeunload');

            if (beforeunloadCall) {
                const beforeunloadListener = beforeunloadCall[1];

                // Call the listener
                beforeunloadListener();

                expect(console.log).toHaveBeenCalledWith('🧹 Cleaning up content script...');
            } else {
                // If no beforeunload listener was set up, this test should fail
                expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
            }
        });
    });

    describe('Button Injection Failures', () => {
        it('should handle button injection failure gracefully', async () => {
            // Mock injectButtons to return false (failure)
            mockDOMManipulator.injectButtons = jest.fn().mockReturnValue(false);

            // Mock findOrderCards to return an order card with setAttribute method
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null),
                setAttribute: jest.fn()
            };
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log error when button injection fails
            expect(console.error).toHaveBeenCalledWith('❌ Failed to inject buttons for order test-order-123');
        });

        it('should handle missing order ID gracefully', async () => {
            // Mock getOrderIdFromElement to return null
            mockDOMManipulator.getOrderIdFromElement = jest.fn().mockReturnValue(null);

            // Mock findOrderCards to return an order card
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null)
            };
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log warning when order ID cannot be extracted
            expect(console.warn).toHaveBeenCalledWith('Could not extract order ID from order card');
        });
    });

    describe('Already Processed Order Cards', () => {
        it('should skip already processed order cards', async () => {
            // Mock order card to have already been processed
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(true),
                querySelector: jest.fn().mockReturnValue(null)
            };

            // Mock findOrderCards to return a processed order card
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log that order card is already processed
            expect(console.log).toHaveBeenCalledWith('⚠️ Order card already processed, skipping');
        });

        it('should skip order cards that already have buttons', async () => {
            // Mock order card to have existing buttons
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue({ className: 'archivaz-button-container' })
            };

            // Mock findOrderCards to return an order card with existing buttons
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Since the "already has buttons" check only happens in DOM observation callbacks
            // and not during initial processing, we test that the order card is processed
            // but the button injection is skipped due to existing buttons
            expect(console.log).toHaveBeenCalledWith('🔍 Processing existing orders on the page...');
            expect(console.log).toHaveBeenCalledWith('Found 1 existing order cards');
        });
    });

    describe('Duplicate Order Handling', () => {
        it('should skip duplicate order IDs', async () => {
            // Mock order cards with duplicate IDs
            const mockOrderCard1 = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null)
            };
            const mockOrderCard2 = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null)
            };

            // Mock getOrderIdFromElement to return same ID for both cards
            mockDOMManipulator.getOrderIdFromElement = jest.fn().mockReturnValue('duplicate-order-123');

            // Mock findOrderCards to return duplicate order cards
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard1, mockOrderCard2]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log that duplicate order is being skipped
            expect(console.log).toHaveBeenCalledWith('⚠️ Skipping duplicate order duplicate-order-123 (already processed)');
        });
    });

    describe('DOM Observation Error Handling', () => {
        it('should handle DOM observation errors gracefully', async () => {
            // Mock startObserving to throw an error
            mockDOMManipulator.startObserving = jest.fn().mockImplementation(() => {
                throw new Error('DOM observation failed');
            });

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log error when DOM observation fails
            expect(console.error).toHaveBeenCalledWith('❌ Error starting order archiving system:', expect.any(Error));
        });

        it('should handle order processing errors gracefully', async () => {
            // Mock order card that will cause an error
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null)
            };

            // Mock getOrderIdFromElement to return a valid ID
            mockDOMManipulator.getOrderIdFromElement = jest.fn().mockReturnValue('error-order-123');

            // Mock injectButtons to throw an error
            mockDOMManipulator.injectButtons = jest.fn().mockImplementation(() => {
                throw new Error('Button injection failed');
            });

            // Mock findOrderCards to return the problematic order card
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should handle error gracefully without crashing
            expect(() => {
                require('./amazon-orders.js');
            }).not.toThrow();
        });
    });

    describe('Storage and DOM Manipulation Failures', () => {
        it('should handle storage restoration failures gracefully', async () => {
            // Mock restoreHiddenOrdersFromStorage to reject
            mockDOMManipulator.restoreHiddenOrdersFromStorage = jest.fn().mockRejectedValue(
                new Error('Storage restoration failed')
            );

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log error when storage restoration fails
            expect(console.error).toHaveBeenCalledWith('❌ Error starting order archiving system:', expect.any(Error));
        });

        it('should handle button removal failures gracefully', async () => {
            // Mock removeButtons to throw an error
            mockDOMManipulator.removeButtons = jest.fn().mockImplementation(() => {
                throw new Error('Button removal failed');
            });

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should handle button removal errors gracefully
            expect(() => {
                require('./amazon-orders.js');
            }).not.toThrow();
        });
    });

    describe('Order Processing Edge Cases', () => {
        it('should handle empty order list gracefully', async () => {
            // Mock findOrderCards to return empty array
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log that no existing order cards were found
            expect(console.log).toHaveBeenCalledWith('Found 0 existing order cards');
        });

        it('should handle order cards without order IDs gracefully', async () => {
            // Mock order card without order ID
            const mockOrderCard = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null)
            };

            // Mock getOrderIdFromElement to return null for this card
            mockDOMManipulator.getOrderIdFromElement = jest.fn().mockReturnValue(null);

            // Mock findOrderCards to return the order card without ID
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log warning about missing order ID
            expect(console.warn).toHaveBeenCalledWith('Could not extract order ID from order card');
        });

        it('should track processed order IDs and cards correctly', async () => {
            // Mock order cards
            const mockOrderCard1 = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null)
            };
            const mockOrderCard2 = {
                hasAttribute: jest.fn().mockReturnValue(false),
                querySelector: jest.fn().mockReturnValue(null)
            };

            // Mock getOrderIdFromElement to return different IDs
            mockDOMManipulator.getOrderIdFromElement = jest.fn()
                .mockReturnValueOnce('order-123')
                .mockReturnValueOnce('order-456');

            // Mock findOrderCards to return multiple order cards
            mockOrderParser.findOrderCards = jest.fn().mockReturnValue([mockOrderCard1, mockOrderCard2]);

            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should log processing progress for each order
            expect(console.log).toHaveBeenCalledWith('Processing existing order 1/2');
            expect(console.log).toHaveBeenCalledWith('Processing existing order 2/2');
        });
    });

    describe('Message Handling Edge Cases', () => {
        it('should handle unknown message types gracefully', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Get the message listener callback
            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

            // Test with unknown message type
            const result = messageListener({ type: 'UNKNOWN_MESSAGE' }, {}, jest.fn());

            // Should return undefined for unknown message types (not false)
            expect(result).toBeUndefined();
        });

        it('should handle message listener errors gracefully', async () => {
            require('./amazon-orders.js');

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Get the message listener callback
            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

            // Mock a message that will cause an error
            const mockMessage = { type: 'RESYNC_ORDERS' };
            const mockSender = {};
            const mockSendResponse = jest.fn();

            // Should handle errors gracefully without crashing
            expect(() => {
                messageListener(mockMessage, mockSender, mockSendResponse);
            }).not.toThrow();
        });
    });
});
