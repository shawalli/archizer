// Amazon Orders Early Content Script
// Runs at document_start to inject UI elements before the page fully loads

console.log('🔧 Archizer early content script loaded (document_start)');

let hasInjected = false;
let heightBlock = null;

    // Randomly select one gradient scheme
    const selectedScheme = gradientSchemes[Math.floor(Math.random() * gradientSchemes.length)];
    const randomGradient = selectedScheme.gradient;
    const textColor = selectedScheme.textColor;

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'amazon-orders-archiver-overlay';
    overlay.className = 'amazon-orders-archiver-overlay';

    // Get the extension URL for the logo
    const logoUrl = chrome.runtime.getURL('icons/logo.png');

    // Set content
    overlay.innerHTML = `
        <div class="overlay-content">
            <div class="overlay-header">
                <h3>Archizer</h3>
                <p>Loading order data...</p>
            </div>
            <div class="overlay-status">
                <img src="${logoUrl}" alt="Archizer Logo" class="logo-image" />
            </div>
        </div>
    `;

    // Apply minimal inline styles - CSS file handles the rest
    overlay.style.cssText = `
        opacity: 1;
        transform: scale(1);
        background: ${randomGradient};
    `;

    // Apply text color to overlay header
    const overlayHeader = overlay.querySelector('.overlay-header');
    if (overlayHeader) {
        overlayHeader.style.color = textColor;
    }

    // Add keyframe animation for gradient swirl
    try {
        if (document.head) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes swirlGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `;
            document.head.appendChild(style);
        }
    } catch (e) {
        console.log('🔧 Style injection failed, continuing without animation:', e);
    }

    return overlay;
}

// Optimized injection strategy - single, efficient approach
function injectOrdersOverlay() {
    try {
        // Check if overlay already exists
        if (document.getElementById('amazon-orders-archiver-overlay')) {
            console.log('🔧 Overlay already exists, skipping injection');
            return;
        }

            if (parentContainer) {
                // Create the window height block box
                heightBlock = document.createElement('div');
                heightBlock.className = 'window-height-block';

                // Add content to the block
                heightBlock.innerHTML = `
                    <div class="height-display">
                        <div class="height-icon">📏</div>
                        <div class="height-label">Boxing up hidden orders!</div>
                        <div class="height-value">Height: ${window.innerHeight - 225}px</div>
                    </div>
                `;

                // Insert the block after the parent container
                parentContainer.parentNode.insertBefore(heightBlock, parentContainer.nextSibling);

                console.log('✅ Window height block injected successfully');
                hasInjected = true;

                // Add a resize listener to update the height display
                window.addEventListener('resize', () => {
                    const heightValue = heightBlock.querySelector('.height-value');
                    if (heightValue) {
                        heightValue.textContent = `Height: ${window.innerHeight - 225}px`;
                    }
                });

                // Start shrinking immediately after successful injection
                setTimeout(() => {
                    startShrinkAnimation();
                }, 100); // Small delay to ensure smooth transition

            } else {
                console.log('⚠️ Could not find parent container for "Your Orders" section');
            }
        } else {
            console.log('⚠️ "Your Orders" heading not found yet');
        }
    } catch (error) {
        console.error('🔧 Error injecting orders overlay:', error);
    }
}

// Function to monitor for orders being loaded and hidden
function setupOrderMonitoring() {
    console.log('🔧 Setting up order monitoring for shrink animation');

    // Monitor for order elements being added to the page
    const orderObserver = new MutationObserver((mutations) => {
        if (!heightBlock) return;

        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Look for order containers (common Amazon order selectors)
                        const orderElements = node.querySelectorAll && node.querySelectorAll('[data-order-id], .order, .a-box-group, [class*="order"]');

                        if (orderElements && orderElements.length > 0) {
                            console.log(`🔧 Detected ${orderElements.length} order elements, starting shrink animation`);

                            // Wait a bit for orders to fully render, then start shrinking
                            setTimeout(() => {
                                startShrinkAnimation();
                            }, 1000);

                            // Stop observing once we've found orders
                            orderObserver.disconnect();
                            return;
                        }
                    }
                }
            }
        }
    });

    // Start observing for order elements
    if (document.body) {
        orderObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Also check periodically for existing orders
    const checkExistingOrders = setInterval(() => {
        const existingOrders = document.querySelectorAll('[data-order-id], .order, .a-box-group, [class*="order"]');
        if (existingOrders.length > 0) {
            console.log(`🔧 Found ${existingOrders.length} existing order elements, starting shrink animation`);
            clearInterval(checkExistingOrders);

            setTimeout(() => {
                startShrinkAnimation();
            }, 1000);
        }
    }, 500);

    // Clean up after 30 seconds if no orders found
    setTimeout(() => {
        clearInterval(checkExistingOrders);
        orderObserver.disconnect();
        console.log('⚠️ No orders detected within 30 seconds, keeping height block visible');
    }, 30000);
}

// Function to start the shrink animation
function startShrinkAnimation() {
    if (!heightBlock) return;

    console.log('🔧 Starting shrink animation for window height block');

    // Add transition for smooth animation
    heightBlock.style.transition = 'height 3s ease-in-out, opacity 3s ease-in-out';

    // Start shrinking
    heightBlock.style.height = '0px';
    heightBlock.style.opacity = '0';
    heightBlock.style.overflow = 'hidden';

    // Remove the block after animation completes
    setTimeout(() => {
        if (heightBlock && heightBlock.parentNode) {
            heightBlock.parentNode.removeChild(heightBlock);
            heightBlock = null;
            console.log('✅ Window height block removed after shrink animation');
        }
    }, 5000);
}

// Ultra-early injection: inject underneath the navigation toolbar
function injectUltraEarly() {
    console.log('🔧 Attempting ultra-early injection under navigation toolbar...');

    // Try to inject at the very beginning of the document
    if (document.documentElement) {
        // Create a placeholder that we'll position under the nav toolbar
        const placeholder = document.createElement('div');
        placeholder.className = 'window-height-block-placeholder';
        placeholder.style.cssText = `
            width: 100%;
            height: ${window.innerHeight - 150}px;
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #495057;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 1000;
        `;

        placeholder.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">📏</div>
                <div>Boxing up hidden orders!</div>
                <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">Height: ${window.innerHeight - 225}px</div>
            </div>
        `;

        // Try to inject under the navigation toolbar
        const navMain = document.getElementById('nav-main');
        if (navMain) {
            // Insert after the nav-main element
            navMain.parentNode.insertBefore(placeholder, navMain.nextSibling);
            console.log('✅ Ultra-early placeholder injected under navigation toolbar');

            // Set up the placeholder as the height block
            heightBlock = placeholder;
            hasInjected = true;

            // Start shrinking immediately after injection
            setTimeout(() => {
                startShrinkAnimation();
            }, 100); // Small delay to ensure smooth transition
        } else {
            // If nav-main not found yet, wait for it
            const navObserver = new MutationObserver((mutations) => {
                const navMain = document.getElementById('nav-main');
                if (navMain && !hasInjected) {
                    // Insert after the nav-main element
                    navMain.parentNode.insertBefore(placeholder, navMain.nextSibling);
                    console.log('✅ Ultra-early placeholder injected under navigation toolbar (delayed)');

                    // Set up the placeholder as the height block
                    heightBlock = placeholder;
                    hasInjected = true;

                    // Start shrinking immediately after injection
                    setTimeout(() => {
                        startShrinkAnimation();
                    }, 100); // Small delay to ensure smooth transition

                    navObserver.disconnect();
                }
            });

            navObserver.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            // Clean up if nav-main not found within 10 seconds
            setTimeout(() => {
                navObserver.disconnect();
                if (!hasInjected) {
                    console.log('⚠️ Navigation toolbar not found, will use normal injection');
                }
            }, 10000);
        }

    } else {
        console.log('⚠️ Document element not available for ultra-early injection');
    }
}

// Function to inject immediately if possible
function injectImmediately() {
    console.log('🔧 Attempting immediate injection...');
    injectWindowHeightBlock();
}

// Function to wait for the DOM to be ready and then inject the block
function waitForDOMAndInject() {
    // Check if the document is already loaded
    if (document.readyState === 'loading') {
        // Document is still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔧 DOM loaded, attempting to inject window height block');
            // Use a very small delay to ensure Amazon's content is rendered
            setTimeout(injectWindowHeightBlock, 50);
        });
    } else {
        // Document is already loaded, inject immediately
        console.log('🔧 Document already loaded, injecting window height block');
        injectWindowHeightBlock();
    }
}

// Set up MutationObserver to watch for DOM changes
function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        if (hasInjected) {
            return; // Already injected
        }
    }, 500);
});

console.log('🔧 Early content script initialization complete');
