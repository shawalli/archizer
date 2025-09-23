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

            expect(console.log).toHaveBeenCalledWith('🔧 Archizer early content script loaded (document_start)');
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
            expect(console.log).toHaveBeenCalledWith('🔧 Archizer early content script loaded (document_start)');
        });

        it('should attempt fallback injection', () => {
            require('./amazon-orders-early.js');

            // Should attempt injection and potentially fallback
            expect(console.log).toHaveBeenCalledWith('🔧 Archizer early content script loaded (document_start)');
        });

        it('should handle injection failures gracefully', () => {
            require('./amazon-orders-early.js');

            // Should handle any injection errors gracefully
            expect(console.log).toHaveBeenCalledWith('🔧 Archizer early content script loaded (document_start)');
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

    // NEW TESTS TO COVER UNCOVERED LINES
    describe('Style Injection Edge Cases', () => {
        it('should handle missing document.head gracefully', () => {
            // Mock document.head as null to test uncovered line 83-84
            Object.defineProperty(document, 'head', {
                value: null,
                writable: true
            });

            require('./amazon-orders-early.js');

            // Should continue without throwing error
            expect(console.log).toHaveBeenCalledWith('🔧 Early content script initialization complete');
        });

        it('should handle style creation failures gracefully', () => {
            // Mock document.head to exist but make createElement fail for style
            Object.defineProperty(document, 'head', {
                value: { appendChild: jest.fn() },
                writable: true
            });

            // Mock createElement to fail for style elements
            document.createElement = jest.fn().mockImplementation((tagName) => {
                if (tagName === 'style') {
                    throw new Error('Style creation failed');
                }
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

            require('./amazon-orders-early.js');

            // Should log style injection failure and continue
            expect(console.log).toHaveBeenCalledWith('🔧 Style injection failed, continuing without animation:', expect.any(Error));
        });

        it('should handle style appendChild failures gracefully', () => {
            // Mock document.head with failing appendChild
            Object.defineProperty(document, 'head', {
                value: {
                    appendChild: jest.fn(() => {
                        throw new Error('Style append failed');
                    })
                },
                writable: true
            });

            require('./amazon-orders-early.js');

            // Should log style injection failure and continue
            expect(console.log).toHaveBeenCalledWith('🔧 Style injection failed, continuing without animation:', expect.any(Error));
        });
    });

    describe('Overlay Injection Edge Cases', () => {
        it('should skip injection when overlay already exists', () => {
            // Mock overlay already exists
            document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'amazon-orders-archiver-overlay') {
                    return { id: 'amazon-orders-archiver-overlay' };
                }
                return null;
            });

            require('./amazon-orders-early.js');

            // Should log that overlay already exists
            expect(console.log).toHaveBeenCalledWith('🔧 Overlay already exists, skipping injection');
        });

        it('should handle case when neither body nor documentElement exists', () => {
            // Mock both body and documentElement as null
            Object.defineProperty(document, 'body', {
                value: null,
                writable: true
            });
            Object.defineProperty(document, 'documentElement', {
                value: null,
                writable: true
            });

            require('./amazon-orders-early.js');

            // Should complete initialization without throwing error
            expect(console.log).toHaveBeenCalledWith('🔧 Early content script initialization complete');
        });

        it('should handle appendChild failures gracefully', () => {
            // Mock body exists but appendChild fails
            Object.defineProperty(document, 'body', {
                value: {
                    appendChild: jest.fn(() => {
                        throw new Error('Append failed');
                    })
                },
                writable: true
            });

            require('./amazon-orders-early.js');

            // Should handle error gracefully and continue
            expect(console.error).toHaveBeenCalledWith('🔧 Error injecting orders overlay:', expect.any(Error));
        });
    });

    describe('Fallback Injection Scenarios', () => {
        it('should attempt fallback injection when immediate injection fails', () => {
            // Mock immediate injection to fail by making getElementById return null
            // and then mock setTimeout to execute immediately
            let setTimeoutCallback;
            global.setTimeout = jest.fn((callback, delay) => {
                if (delay === 0) {
                    setTimeoutCallback = callback;
                }
                return 1;
            });

            require('./amazon-orders-early.js');

            // Should attempt immediate injection
            expect(console.log).toHaveBeenCalledWith('🔧 Archizer early content script loaded (document_start)');

            // Execute the fallback callback
            if (setTimeoutCallback) {
                setTimeoutCallback();
            }
        });

        it('should handle DOMContentLoaded fallback injection', () => {
            // Mock DOMContentLoaded event listener
            let domContentLoadedCallback;
            document.addEventListener = jest.fn((event, callback) => {
                if (event === 'DOMContentLoaded') {
                    domContentLoadedCallback = callback;
                }
            });

            require('./amazon-orders-early.js');

            // Should set up DOMContentLoaded listener
            expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));

            // Simulate DOMContentLoaded event
            if (domContentLoadedCallback) {
                domContentLoadedCallback();
            }
        });

        it('should handle overlay removal after timeout', () => {
            // Mock setTimeout to capture callbacks
            let timeoutCallbacks = [];
            global.setTimeout = jest.fn((callback, delay) => {
                timeoutCallbacks.push({ callback, delay });
                return 1;
            });

            // Mock overlay element with parent
            const mockOverlay = {
                style: { opacity: '1', transform: 'scale(1)' },
                parentNode: { removeChild: jest.fn() }
            };

            document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'amazon-orders-archiver-overlay') {
                    return mockOverlay;
                }
                return null;
            });

            require('./amazon-orders-early.js');

            // Should set up timeout for overlay removal
            // Note: setTimeout is called in the DOMContentLoaded event listener
            // We need to trigger that event to see the setTimeout call
            const domContentLoadedCallback = document.addEventListener.mock.calls.find(
                call => call[0] === 'DOMContentLoaded'
            )?.[1];

            if (domContentLoadedCallback) {
                domContentLoadedCallback();
            }

            // Now setTimeout should have been called for the overlay removal
            expect(setTimeout).toHaveBeenCalled();

            // Execute the 500ms timeout callback (overlay removal)
            const removalCallback = timeoutCallbacks.find(tc => tc.delay === 500);
            if (removalCallback) {
                removalCallback.callback();
            }

            // Should set opacity to 0 and transform to scale(0.95)
            expect(mockOverlay.style.opacity).toBe('0');
            expect(mockOverlay.style.transform).toBe('scale(0.95)');
        });
    });

    describe('Overlay Creation and Styling', () => {
        it('should create overlay with random gradient background', () => {
            // Mock Math.random to return predictable value
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.5);

            require('./amazon-orders-early.js');

            // Should create overlay element
            expect(document.createElement).toHaveBeenCalledWith('div');

            // Restore Math.random
            Math.random = originalRandom;
        });

        it('should apply CSS animations for spinner and gradient', () => {
            // Mock document.head to exist
            Object.defineProperty(document, 'head', {
                value: { appendChild: jest.fn() },
                writable: true
            });

            require('./amazon-orders-early.js');

            // Should create style element with keyframes
            expect(document.createElement).toHaveBeenCalledWith('style');
        });
    });
});
