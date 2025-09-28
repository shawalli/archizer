// Amazon Orders Early Content Script
// Runs at document_start to inject UI elements before the page fully loads

console.log('🔧 Archizer early content script loaded (document_start)');

// Create and inject the orders overlay immediately
function createOrdersOverlay() {
    // Define 12 beautiful gradient schemes with corresponding text colors
    const gradientSchemes = [
        { gradient: 'linear-gradient(45deg, #667eea, #764ba2, #667eea, #764ba2)', textColor: '#ffffff' }, // Blue to Purple
        { gradient: 'linear-gradient(45deg, #f093fb, #f5576c, #f093fb, #f5576c)', textColor: '#ffffff' }, // Pink to Red
        { gradient: 'linear-gradient(45deg, #4facfe, #00f2fe, #4facfe, #00f2fe)', textColor: '#ffffff' }, // Blue to Cyan
        { gradient: 'linear-gradient(45deg, #43e97b, #38f9d7, #43e97b, #38f9d7)', textColor: '#ffffff' }, // Green to Teal
        { gradient: 'linear-gradient(45deg, #fa709a, #fee140, #fa709a, #fee140)', textColor: '#ffffff' }, // Pink to Yellow
        { gradient: 'linear-gradient(45deg, #a8edea, #fed6e3, #a8edea, #fed6e3)', textColor: '#333333' }, // Mint to Pink
        { gradient: 'linear-gradient(45deg, #ff9a9e, #fecfef, #ff9a9e, #fecfef)', textColor: '#333333' }, // Coral to Pink
        { gradient: 'linear-gradient(45deg, #a18cd1, #fbc2eb, #a18cd1, #fbc2eb)', textColor: '#ffffff' }, // Lavender to Pink
        { gradient: 'linear-gradient(45deg, #ffecd2, #fcb69f, #ffecd2, #fcb69f)', textColor: '#333333' }, // Peach to Coral
        { gradient: 'linear-gradient(45deg, #ff9a9e, #fad0c4, #ff9a9e, #fad0c4)', textColor: '#333333' }, // Coral to Peach
        { gradient: 'linear-gradient(45deg, #a8edea, #fed6e3, #a8edea, #fed6e3)', textColor: '#333333' }, // Mint to Pink
        { gradient: 'linear-gradient(45deg, #d299c2, #fef9d7, #d299c2, #fef9d7)', textColor: '#333333' }  // Rose to Cream
    ];

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
