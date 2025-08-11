// Background Script for Amazon Order Archiver
// Handles Google OAuth and API calls

console.log('Amazon Order Archiver background script loaded');

// Message handling for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
    } catch (error) {
        console.error('❌ Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }
});

// Handle different message types
async function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
        case 'ERROR_REPORT':
            await handleErrorReport(message.error);
            sendResponse({ success: true });
            break;

        case 'GET_EXTENSION_STATUS':
            const status = getExtensionStatus();
            sendResponse({ success: true, status });
            break;

        case 'RELOAD_EXTENSION':
            await reloadExtension();
            sendResponse({ success: true });
            break;

        default:
            console.warn('⚠️ Unknown message type:', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
    }
}

// Handle error reports from content scripts
async function handleErrorReport(errorInfo) {
    try {
        console.log('📝 Received error report:', errorInfo);

        // Store error in background storage for debugging
        await chrome.storage.local.set({
            [`error_${Date.now()}`]: errorInfo
        });

        // TODO: Implement external error reporting (e.g., to monitoring service)

    } catch (error) {
        console.error('❌ Failed to handle error report:', error);
    }
}

// Get extension status
function getExtensionStatus() {
    return {
        version: chrome.runtime.getManifest().version,
        timestamp: new Date().toISOString(),
        permissions: chrome.runtime.getManifest().permissions,
        hostPermissions: chrome.runtime.getManifest().host_permissions
    };
}

// Reload extension
async function reloadExtension() {
    try {
        console.log('🔄 Reloading extension...');

        // Clear any cached data
        await chrome.storage.local.clear();

        // Reload the extension
        chrome.runtime.reload();

    } catch (error) {
        console.error('❌ Failed to reload extension:', error);
        throw error;
    }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 Extension installed:', details.reason);

    if (details.reason === 'install') {
        // First time installation
        console.log('🎉 Welcome to Amazon Order Archiver!');

        // TODO: Show welcome page or onboarding
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup/popup.html')
        });

    } else if (details.reason === 'update') {
        // Extension updated
        console.log('🔄 Extension updated to version:', chrome.runtime.getManifest().version);
    }
});

// Extension startup handler
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Extension started');

    // TODO: Perform any startup tasks
    // TODO: Check for updates
    // TODO: Initialize background services
});

// TODO: Implement Google OAuth 2.0 authentication flow
// TODO: Implement Google Sheets API client
// TODO: Handle API rate limits and quota management
