// Amazon Orders Early Content Script
// Runs at document_start to inject UI elements before the page fully loads

console.log('🔧 Amazon Order Archiver early content script loaded (document_start)');

let hasInjected = false;

// Function to inject the window height block box
function injectWindowHeightBlock() {
    if (hasInjected) {
        return; // Already injected, don't duplicate
    }

    try {
        // Look for the "Your Orders" heading
        const yourOrdersHeading = document.querySelector('h1');

        if (yourOrdersHeading && yourOrdersHeading.textContent.trim() === 'Your Orders') {
            console.log('🔧 Found "Your Orders" heading, injecting window height block');

            // Find the parent container that holds the heading and search bar
            const parentContainer = yourOrdersHeading.closest('.a-row.a-spacing-medium');

            if (parentContainer) {
                // Create the window height block box
                const heightBlock = document.createElement('div');
                heightBlock.className = 'window-height-block';

                // Add content to the block
                heightBlock.innerHTML = `
                    <div class="height-display">
                        <div class="height-icon">📏</div>
                        <div class="height-label">Window Height Block</div>
                        <div class="height-value">Height: ${window.innerHeight}px</div>
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
                        heightValue.textContent = `Height: ${window.innerHeight}px`;
                    }
                });

            } else {
                console.log('⚠️ Could not find parent container for "Your Orders" section');
            }
        } else {
            console.log('⚠️ "Your Orders" heading not found yet');
        }
    } catch (error) {
        console.error('❌ Error injecting window height block:', error);
    }
}

// Ultra-early injection: try to inject before any DOM elements exist
function injectUltraEarly() {
    console.log('🔧 Attempting ultra-early injection...');

    // Try to inject at the very beginning of the document
    if (document.documentElement) {
        // Create a placeholder that we'll move later
        const placeholder = document.createElement('div');
        placeholder.className = 'window-height-block-placeholder';
        placeholder.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #495057;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        `;

        placeholder.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">📏</div>
                <div>Window Height Block (Ultra-Early)</div>
                <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">Height: ${window.innerHeight}px</div>
            </div>
        `;

        document.documentElement.appendChild(placeholder);
        console.log('✅ Ultra-early placeholder injected');

        // Set up a timer to move it to the correct location once we find the "Your Orders" section
        const moveTimer = setInterval(() => {
            if (hasInjected) {
                clearInterval(moveTimer);
                return;
            }

            const yourOrdersHeading = document.querySelector('h1');
            if (yourOrdersHeading && yourOrdersHeading.textContent.trim() === 'Your Orders') {
                const parentContainer = yourOrdersHeading.closest('.a-row.a-spacing-medium');
                if (parentContainer) {
                    // Move the placeholder to the correct location
                    parentContainer.parentNode.insertBefore(placeholder, parentContainer.nextSibling);
                    placeholder.style.position = 'static';
                    placeholder.style.top = 'auto';
                    placeholder.style.left = 'auto';
                    placeholder.style.zIndex = 'auto';
                    console.log('✅ Moved ultra-early placeholder to correct location');
                    hasInjected = true;
                    clearInterval(moveTimer);
                }
            }
        }, 50);

        // Clean up if we can't move it within 10 seconds
        setTimeout(() => {
            clearInterval(moveTimer);
            if (!hasInjected) {
                console.log('⚠️ Could not move ultra-early placeholder, will use normal injection');
            }
        }, 10000);

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

        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any of the added nodes contain the "Your Orders" heading
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if this node or its children contain the heading
                        const heading = node.querySelector && node.querySelector('h1');
                        if (heading && heading.textContent.trim() === 'Your Orders') {
                            console.log('🔧 MutationObserver detected "Your Orders" heading, injecting immediately');
                            setTimeout(injectWindowHeightBlock, 10); // Very small delay
                            return;
                        }
                    }
                }
            }
        }
    });

    // Start observing the document body for changes
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('🔧 MutationObserver started watching for DOM changes');
    } else {
        // If body doesn't exist yet, wait for it
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log('🔧 MutationObserver started watching for DOM changes (delayed)');
        });
    }
}

// Also try to inject when the page becomes visible (for dynamic content)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !hasInjected) {
        console.log('🔧 Page became visible, checking for injection opportunity');
        setTimeout(injectWindowHeightBlock, 100);
    }
});

// Start the injection process with ultra-early attempt
injectUltraEarly();

// Start the injection process immediately
injectImmediately();

// Set up mutation observer for dynamic content detection
setupMutationObserver();

// Start the injection process with DOM events
waitForDOMAndInject();

// Fallback: try injection multiple times with increasing delays
const injectionAttempts = [100, 250, 500, 1000, 2000];
injectionAttempts.forEach(delay => {
    setTimeout(injectWindowHeightBlock, delay);
});

console.log('🔧 Early content script initialization complete');
