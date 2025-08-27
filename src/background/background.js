// Background Script for Amazon Order Archiver
// Handles Google OAuth and API calls

import { StorageManager } from '../utils/storage.js';
import { specializedLogger as log } from '../utils/logger.js';

log.info('Amazon Order Archiver background script loaded');

// Initialize storage manager
let storageManager;

// Initialize storage systems
async function initializeStorage() {
    try {
        storageManager = new StorageManager();
        log.success('Storage initialized successfully');
    } catch (error) {
        log.error('Error initializing storage:', error);
    }
}

// Message handling for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
    } catch (error) {
        log.error('Error handling message:', error);
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
            log.warning('Unknown message type:', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
    }
}

// Handle error reports from content scripts
async function handleErrorReport(errorInfo) {
    try {
        log.info('Received error report:', errorInfo);

        // Store error in background storage for debugging
        await chrome.storage.local.set({
            [`error_${Date.now()}`]: errorInfo
        });



    } catch (error) {
        log.error('Failed to handle error report:', error);
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
        log.info('Reloading extension...');

        // Clear any cached data
        await chrome.storage.local.clear();

        // Reload the extension
        chrome.runtime.reload();

    } catch (error) {
        log.error('Failed to reload extension:', error);
        throw error;
    }
}

// Extension startup handler
chrome.runtime.onStartup.addListener(async () => {
    log.info('Extension starting up...');
    await initializeStorage();
});

// Extension installation handler
chrome.runtime.onInstalled.addListener(async (details) => {
    log.info('Extension installed:', details.reason);

    // Initialize storage and handle migration
    await initializeStorage();

    if (details.reason === 'install') {
        // First time installation
        log.success('Welcome to Amazon Order Archiver!');


        chrome.tabs.create({
            url: chrome.runtime.getURL('popup/popup.html')
        });

    } else if (details.reason === 'update') {
        // Extension updated
        log.info('Extension updated to version:', chrome.runtime.getManifest().version);
    }
});


