// Amazon Orders Early Content Script
// Runs at document_start to inject UI elements before the page fully loads

console.log('🔧 Amazon Order Archiver early content script loaded (document_start)');

// Create and inject the orders overlay immediately
function createOrdersOverlay() {
    // Define 12 beautiful gradient schemes
    const gradientSchemes = [
        'linear-gradient(45deg, #667eea, #764ba2, #667eea, #764ba2)', // Blue to Purple
        'linear-gradient(45deg, #f093fb, #f5576c, #f093fb, #f5576c)', // Pink to Red
        'linear-gradient(45deg, #4facfe, #00f2fe, #4facfe, #00f2fe)', // Blue to Cyan
        'linear-gradient(45deg, #43e97b, #38f9d7, #43e97b, #38f9d7)', // Green to Teal
        'linear-gradient(45deg, #fa709a, #fee140, #fa709a, #fee140)', // Pink to Yellow
        'linear-gradient(45deg, #a8edea, #fed6e3, #a8edea, #fed6e3)', // Mint to Pink
        'linear-gradient(45deg, #ff9a9e, #fecfef, #ff9a9e, #fecfef)', // Coral to Pink
        'linear-gradient(45deg, #a18cd1, #fbc2eb, #a18cd1, #fbc2eb)', // Lavender to Pink
        'linear-gradient(45deg, #ffecd2, #fcb69f, #ffecd2, #fcb69f)', // Peach to Coral
        'linear-gradient(45deg, #ff9a9e, #fad0c4, #ff9a9e, #fad0c4)', // Coral to Peach
        'linear-gradient(45deg, #a8edea, #fed6e3, #a8edea, #fed6e3)', // Mint to Pink
        'linear-gradient(45deg, #d299c2, #fef9d7, #d299c2, #fef9d7)'  // Rose to Cream
    ];

    // Randomly select one gradient scheme
    const randomGradient = gradientSchemes[Math.floor(Math.random() * gradientSchemes.length)];

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

    // Apply minimal inline styles - CSS file handles the rest
    overlay.style.cssText = `
        opacity: 1;
        transform: scale(1);
        background: ${randomGradient};
    `;

    // Add keyframe animation for spinner
    try {
        if (document.head) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
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

        let targetElement = null;

        // Use body if available, otherwise documentElement
        if (document.body) {
            targetElement = document.body;
        } else if (document.documentElement) {
            targetElement = document.documentElement;
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

// Single, efficient injection attempt
function attemptInjection() {
    // Try immediate injection
    injectOrdersOverlay();

    // If not successful, try on next tick
    if (!document.getElementById('amazon-orders-archiver-overlay')) {
        setTimeout(injectOrdersOverlay, 0);
    }
}

// Start injection process
attemptInjection();

// Fallback injection on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('amazon-orders-archiver-overlay')) {
        injectOrdersOverlay();
    }

    // Hide overlay after 0.5 seconds
    setTimeout(() => {
        const overlay = document.getElementById('amazon-orders-archiver-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(0.95)';

            // Remove from DOM after transition completes
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }, 500);
});

console.log('🔧 Early content script initialization complete');
