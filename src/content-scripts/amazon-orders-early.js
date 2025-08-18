// Amazon Orders Early Content Script
// Runs at document_start to inject UI elements before the page fully loads

console.log('🔧 Amazon Order Archiver early content script loaded (document_start)');

// Create and inject the orders overlay immediately
function createOrdersOverlay() {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'amazon-orders-archiver-overlay';
    overlay.className = 'amazon-orders-archiver-overlay';

    // Set content
    overlay.innerHTML = `
        <div class="overlay-content">
            <div class="overlay-header">
                <h3>Amazon Order Archiver</h3>
                <p>Orders are being processed...</p>
            </div>
            <div class="overlay-status">
                <div class="loading-spinner"></div>
                <span>Loading order data...</span>
            </div>
        </div>
    `;

    // Apply styles inline for immediate effect
    overlay.style.cssText = `
        position: fixed;
        top: 280px;
        left: 150px;
        width: calc(100vw - 300px);
        height: calc(100vh - 280px);
        background: rgba(255, 255, 255, 0.98);
        border: 2px solid #e7e7e7;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(5px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 1;
        transform: scale(1);
    `;

    // Apply styles to child elements
    const content = overlay.querySelector('.overlay-content');
    content.style.cssText = `
        text-align: center;
        padding: 40px;
        max-width: 400px;
    `;

    const header = overlay.querySelector('.overlay-header h3');
    header.style.cssText = `
        margin: 0 0 10px 0;
        color: #232f3e;
        font-size: 24px;
        font-weight: 600;
    `;

    const subtitle = overlay.querySelector('.overlay-header p');
    subtitle.style.cssText = `
        margin: 0 0 30px 0;
        color: #666;
        font-size: 16px;
    `;

    const status = overlay.querySelector('.overlay-status');
    status.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    `;

    const spinner = overlay.querySelector('.loading-spinner');
    spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #ff9900;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;

    const statusText = overlay.querySelector('.overlay-status span');
    statusText.style.cssText = `
        color: #666;
        font-size: 14px;
    `;

    // Add keyframe animation for spinner - handle case where head doesn't exist yet
    try {
        if (document.head) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        } else {
            // If head doesn't exist, add the style to the overlay itself
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            overlay.appendChild(style);
        }
    } catch (e) {
        console.log('🔧 Style injection failed, continuing without animation:', e);
    }

    return overlay;
}

// Inject the overlay as early as possible
function injectOrdersOverlay() {
    try {
        // Check if overlay already exists
        if (document.getElementById('amazon-orders-archiver-overlay')) {
            console.log('🔧 Overlay already exists, skipping injection');
            return;
        }

        // Try to inject immediately without waiting for body
        let targetElement = null;

        // Strategy 1: Use documentElement (html tag) if body doesn't exist
        if (document.documentElement && !document.body) {
            targetElement = document.documentElement;
            console.log('🔧 Injecting overlay into documentElement (body not ready)');
        }
        // Strategy 2: Use body if it exists
        else if (document.body) {
            targetElement = document.body;
            console.log('🔧 Injecting overlay into body');
        }
        // Strategy 3: Create body element if neither exists
        else {
            // Create a minimal body element
            const body = document.createElement('body');
            document.documentElement.appendChild(body);
            targetElement = body;
            console.log('🔧 Created body element and injecting overlay');
        }

        if (targetElement) {
            const overlay = createOrdersOverlay();
            targetElement.appendChild(overlay);
            console.log('🔧 Orders overlay injected successfully');
        }
    } catch (error) {
        console.error('🔧 Error injecting orders overlay:', error);
    }
}

// Ultra-aggressive injection strategies
function attemptUltraEarlyInjection() {
    // Strategy 1: Try to inject immediately
    try {
        injectOrdersOverlay();
    } catch (e) {
        console.log('🔧 Immediate injection failed, trying next strategy...');
    }

    // Strategy 2: Use MutationObserver to catch when html element becomes available
    if (document.documentElement) {
        injectOrdersOverlay();
    } else {
        // Create a mutation observer to watch for when the html element appears
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'HTML') {
                            observer.disconnect();
                            console.log('🔧 HTML element detected, injecting overlay...');
                            injectOrdersOverlay();
                            return;
                        }
                    }
                }
            }
        });

        // Start observing the document
        observer.observe(document, {
            childList: true,
            subtree: true
        });

        // Fallback: try again after a short delay
        setTimeout(() => {
            observer.disconnect();
            injectOrdersOverlay();
        }, 10);
    }
}

// Even more aggressive: try to inject before anything exists
function attemptPreDocumentInjection() {
    try {
        // If we're at the very beginning, try to create the entire document structure
        if (!document.documentElement) {
            console.log('🔧 No documentElement found, attempting to create minimal structure...');

            // Create html element
            const html = document.createElement('html');
            document.appendChild(html);

            // Create head element
            const head = document.createElement('head');
            html.appendChild(head);

            // Create body element
            const body = document.createElement('body');
            html.appendChild(body);

            // Now inject the overlay
            const overlay = createOrdersOverlay();
            body.appendChild(overlay);
            console.log('🔧 Created minimal document structure and injected overlay');
            return true;
        }
    } catch (e) {
        console.log('🔧 Pre-document injection failed:', e);
    }
    return false;
}

// Try pre-document injection first
if (!attemptPreDocumentInjection()) {
    // Try ultra-early injection immediately
    attemptUltraEarlyInjection();
}

// Additional aggressive injection strategies
// Strategy: Use microtasks to inject as soon as possible
Promise.resolve().then(() => {
    if (!document.getElementById('amazon-orders-archiver-overlay')) {
        console.log('🔧 Attempting injection via microtask...');
        injectOrdersOverlay();
    }
});

// Strategy: Use requestAnimationFrame for next frame
if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
        if (!document.getElementById('amazon-orders-archiver-overlay')) {
            console.log('🔧 Attempting injection via requestAnimationFrame...');
            injectOrdersOverlay();
        }
    });
}

// Strategy: Use setTimeout with 0 delay for next tick
setTimeout(() => {
    if (!document.getElementById('amazon-orders-archiver-overlay')) {
        console.log('🔧 Attempting injection via setTimeout(0)...');
        injectOrdersOverlay();
    }
}, 0);

// Also try on various document events to ensure it gets injected
document.addEventListener('readystatechange', () => {
    if (document.readyState === 'loading' || document.readyState === 'interactive') {
        injectOrdersOverlay();
    }
});

// Try injection on DOMContentLoaded as final fallback
document.addEventListener('DOMContentLoaded', () => {
    // Only inject if we haven't already
    if (!document.getElementById('amazon-orders-archiver-overlay')) {
        injectOrdersOverlay();
        console.log('🔧 Orders overlay injected after DOMContentLoaded (fallback)');
    }

    // Check for multiple overlays
    const overlays = document.querySelectorAll('#amazon-orders-archiver-overlay');
    console.log(`🔧 Found ${overlays.length} overlay(s) on DOMContentLoaded`);

    // Hide overlay after 0.5 seconds
    setTimeout(() => {
        const overlay = document.getElementById('amazon-orders-archiver-overlay');
        if (overlay) {
            console.log('🔧 Hiding overlay after DOM load...');
            console.log('🔧 Overlay opacity before:', overlay.style.opacity);
            console.log('🔧 Overlay transform before:', overlay.style.transform);

            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(0.95)';

            console.log('🔧 Overlay opacity after:', overlay.style.opacity);
            console.log('🔧 Overlay transform after:', overlay.style.transform);

            // Remove from DOM after transition completes
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                    console.log('🔧 Overlay removed from DOM');
                } else {
                    console.log('🔧 Overlay already removed or has no parent');
                }
            }, 300); // Wait for CSS transition to complete

            // Fallback: force removal after 1 second if still visible
            setTimeout(() => {
                if (overlay.parentNode) {
                    console.log('🔧 Force removing overlay after fallback timeout');
                    overlay.parentNode.removeChild(overlay);
                }
            }, 1000);
        } else {
            console.log('🔧 No overlay found to hide');
        }
    }, 500);
});

console.log('🔧 Early content script initialization complete');
