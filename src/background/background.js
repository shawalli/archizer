// Background Script for Amazon Order Archiver
// Handles Google Sheets API calls

import { StorageManager } from '../backends/local-storage/storage.js';
import { configManager } from '../utils/config-manager.js';
import { googleSheetsClient } from '../backends/google-sheets/client.js';
import { googleOAuth } from '../backends/google-sheets/oauth.js';
import { GoogleSheetsSchema } from '../backends/google-sheets/schema.js';
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

// Initialize Google Sheets
async function initializeGoogleSheets() {
    try {
        const config = await configManager.get('google_sheets');
        if (config && config.sheetUrl) {
            const sheetId = configManager.extractSheetId(config.sheetUrl);
            if (sheetId) {
                googleSheetsClient.configure(sheetId);
                log.success('Google Sheets client initialized successfully');
            } else {
                log.error('Could not extract Sheet ID from URL');
            }
        } else {
            log.info('Google Sheets not configured yet');
        }
    } catch (error) {
        log.error('Error initializing Google Sheets:', error);
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
            const status = await getExtensionStatus();
            sendResponse({ success: true, status });
            break;

        case 'RELOAD_EXTENSION':
            await reloadExtension();
            sendResponse({ success: true });
            break;

        case 'GOOGLE_SHEETS_CONFIG_GET':
            await handleGoogleSheetsConfigGet(sendResponse);
            break;

        case 'GOOGLE_SHEETS_CONFIG_SET':
            await handleGoogleSheetsConfigSet(message.config, sendResponse);
            break;

        case 'GOOGLE_SHEETS_CONFIG_VALIDATE':
            await handleGoogleSheetsConfigValidate(sendResponse);
            break;

        case 'GOOGLE_SHEETS_TEST_CONNECTION':
            await handleGoogleSheetsTestConnection(message, sendResponse);
            break;

        case 'GOOGLE_SHEETS_SETUP':
            await handleGoogleSheetsSetup(message, sendResponse);
            break;

        case 'SYNC_HIDDEN_ORDER_TO_SHEETS':
            await handleSyncHiddenOrderToSheets(message, sendResponse);
            break;

        case 'REMOVE_HIDDEN_ORDER_FROM_SHEETS':
            await handleRemoveHiddenOrderFromSheets(message, sendResponse);
            break;

        case 'ADD_AUDIT_LOG_ENTRY':
            await handleAddAuditLogEntry(message, sendResponse);
            break;

        case 'FETCH_HIDDEN_ORDERS_FROM_SHEETS':
            await handleFetchHiddenOrdersFromSheets(message, sendResponse);
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
async function getExtensionStatus() {
    try {
        const googleSheetsStatus = await configManager.isConfigured('google_sheets');
        const googleSheetsConfig = await configManager.get('google_sheets');

        return {
            version: chrome.runtime.getManifest().version,
            timestamp: new Date().toISOString(),
            permissions: chrome.runtime.getManifest().permissions,
            hostPermissions: chrome.runtime.getManifest().host_permissions,
            googleSheets: {
                isConfigured: googleSheetsStatus,
                lastSync: googleSheetsConfig?.lastSync || null
            }
        };
    } catch (error) {
        log.error('Error getting extension status:', error);
        return {
            version: chrome.runtime.getManifest().version,
            timestamp: new Date().toISOString(),
            permissions: chrome.runtime.getManifest().permissions,
            hostPermissions: chrome.runtime.getManifest().host_permissions,
            googleSheets: {
                isConfigured: false,
                error: error.message
            }
        };
    }
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

// Google Sheets handlers
async function handleGoogleSheetsConfigGet(sendResponse) {
    try {
        log.info('📥 Received GOOGLE_SHEETS_CONFIG_GET request');
        const config = await configManager.get('google_sheets');
        log.info('📤 Sending config response:', { ...config });
        sendResponse({ success: true, config });
    } catch (error) {
        log.error('❌ Error getting Google Sheets config:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleGoogleSheetsConfigSet(config, sendResponse) {
    try {
        log.info('📥 Received GOOGLE_SHEETS_CONFIG_SET request:', { ...config });

        await configManager.set('google_sheets', config);
        log.info('💾 Config saved successfully');

        // Configure the client with new settings
        if (config.sheetUrl) {
            const sheetId = configManager.extractSheetId(config.sheetUrl);
            if (sheetId) {
                googleSheetsClient.configure(sheetId);
                log.info('🔧 Google Sheets client configured');
            } else {
                log.error('❌ Could not extract Sheet ID from URL');
            }
        }

        log.info('✅ Sending success response');
        sendResponse({ success: true });
    } catch (error) {
        log.error('❌ Error setting Google Sheets config:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleGoogleSheetsConfigValidate(sendResponse) {
    try {
        const config = await configManager.get('google_sheets');
        const validation = configManager.validate('google_sheets', config);
        sendResponse({ success: true, validation });
    } catch (error) {
        log.error('Error validating Google Sheets config:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Set up the 3 required sheets in Google Sheets
 * @param {string} sheetId - Google Sheets ID
 * @param {GoogleSheetsSchema} schema - Schema definition
 * @returns {Object} Setup result
 */
async function setupGoogleSheets(sheetId, schema) {
    try {
        log.info('🔧 Setting up Google Sheets with 4 required sheets...');

        const setupResult = {
            sheetsCreated: [],
            sheetsSkipped: [],
            errors: []
        };

        // Get existing sheet names
        const sheetNames = await googleSheetsClient.getSheetNames();
        log.info('📋 Existing sheets:', sheetNames);

        // Define the 4 sheets we need to create
        const requiredSheets = [
            {
                name: 'HiddenOrders',
                schema: schema.sheets.hiddenOrders,
                headers: ['Order ID', 'Order Date', 'Hidden By', 'Hidden At', 'Hidden Type', 'Tags', 'Notes', 'Last Modified']
            },
            {
                name: 'ActionLog',
                schema: schema.sheets.actionLog,
                headers: ['Timestamp', 'Order ID', 'Action', 'Action Type', 'Performed By', 'Tags', 'Notes', 'Browser Info']
            },
            {
                name: 'UserSettings',
                schema: schema.sheets.userSettings,
                headers: ['Username', 'Created At', 'Last Active', 'Is Active']
            },
            {
                name: 'TestConnection',
                schema: schema.sheets.testConnection,
                headers: [] // TestConnection sheet has no columns
            }
        ];

        // Create each required sheet
        for (const sheet of requiredSheets) {
            try {
                log.info(`🔧 Processing sheet: ${sheet.name}, headers:`, sheet.headers);
                if (sheetNames.includes(sheet.name)) {
                    log.info(`⏭️ Sheet "${sheet.name}" already exists, ensuring headers...`);

                    // Ensure headers exist in existing sheet
                    if (sheet.headers && sheet.headers.length > 0) {
                        log.info(`🔧 Calling ensureSheetHeaders for "${sheet.name}" with headers:`, sheet.headers);
                        await ensureSheetHeaders(sheet.name, sheet.headers);
                        log.info(`✅ Completed ensureSheetHeaders for "${sheet.name}"`);
                    } else {
                        log.info(`⚠️ Sheet "${sheet.name}" has no headers defined`);
                    }

                    setupResult.sheetsSkipped.push(sheet.name);
                } else {
                    log.info(`📝 Creating sheet "${sheet.name}"...`);

                    // Create the sheet
                    await googleSheetsClient.createSheet(sheet.name);

                    // Add headers to the sheet (only if it has headers)
                    if (sheet.headers && sheet.headers.length > 0) {
                        const rangeToWrite = `${sheet.name}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1`;
                        log.info(`📝 Writing headers to range: ${rangeToWrite}`);
                        log.info(`📝 Headers data:`, sheet.headers);
                        await googleSheetsClient.writeRange(rangeToWrite, sheet.headers);

                        // Format the header row (bold)
                        await googleSheetsClient.formatHeaderRow(sheet.name);
                    }

                    log.success(`✅ Sheet "${sheet.name}" created successfully`);
                    setupResult.sheetsCreated.push(sheet.name);
                }
            } catch (error) {
                log.error(`❌ Error creating sheet "${sheet.name}":`, error);
                let errorMsg = error.message;
                if (error.message.includes('401')) {
                    errorMsg = 'API key lacks permissions to create sheets';
                } else if (error.message.includes('403')) {
                    errorMsg = 'Access denied - check sheet sharing permissions';
                }
                setupResult.errors.push({
                    sheet: sheet.name,
                    error: errorMsg
                });
            }
        }

        log.info('🎉 Google Sheets setup completed:', setupResult);
        return setupResult;

    } catch (error) {
        log.error('❌ Error setting up Google Sheets:', error);
        throw error;
    }
}

/**
 * Test write permissions by inserting a test row
 * @param {string} sheetName - Name of the sheet to test
 * @returns {Object} Test result
 */
async function testWritePermissions(sheetName) {
    try {
        log.info(`🧪 Testing write permissions on sheet "${sheetName}"...`);

        // First, get sheet info to check if the sheet exists
        const sheetInfo = await googleSheetsClient.getSheetInfo();
        const existingSheets = sheetInfo.sheets.map(sheet => sheet.properties.title);

        log.info(`📋 Existing sheets:`, existingSheets);

        // Check if TestConnection sheet exists, create it if it doesn't
        if (!existingSheets.includes('TestConnection')) {
            log.info(`📝 Creating new sheet "TestConnection"...`);
            try {
                await googleSheetsClient.createSheet('TestConnection');
                log.success(`✅ Sheet "TestConnection" created successfully`);
            } catch (createError) {
                log.error(`❌ Failed to create sheet "TestConnection":`, createError);
                // Continue with the original sheet name if creation fails
                log.info(`🔄 Falling back to using "${sheetName}" for test`);
            }
        } else {
            log.info(`✅ Sheet "TestConnection" already exists, using it for test`);
        }

        // Use TestConnection sheet for the test
        const testSheetName = 'TestConnection';

        // Create a test row with current timestamp
        const testRow = [
            'TEST',
            new Date().toISOString(),
            'Amazon Order Archiver',
            'Connection Test',
            'Write permissions verified'
        ];

        // Try to append the test row to TestConnection sheet
        await googleSheetsClient.appendData(testSheetName, testRow);

        log.success(`✅ Write test successful - test row added to "${testSheetName}"`);

        return {
            success: true,
            message: `Write permissions verified - test row added to "${testSheetName}"`,
            testRow: testRow,
            sheetCreated: !existingSheets.includes('TestConnection')
        };

    } catch (error) {
        log.error(`❌ Write test failed for sheet "${sheetName}":`, error);

        let errorMsg = error.message;
        if (error.message.includes('401')) {
            errorMsg = 'OAuth2 token lacks write permissions';
        } else if (error.message.includes('403')) {
            errorMsg = 'Access denied - check sheet sharing permissions';
        }

        return {
            success: false,
            message: `Write test failed: ${errorMsg}`,
            error: error.message
        };
    }
}

async function handleGoogleSheetsTestConnection(message, sendResponse) {
    try {
        // Use test config if provided, otherwise use saved config
        let config;
        if (message.testConfig) {
            config = message.testConfig;
        } else {
            config = await configManager.get('google_sheets');
        }

        if (!config || !config.oauthClientId || !config.oauthClientSecret || !config.sheetUrl) {
            sendResponse({
                success: false,
                error: 'Configuration incomplete. Please set OAuth Client ID, Client Secret, and Sheet URL.'
            });
            return;
        }

        // Extract Sheet ID from URL
        const sheetId = configManager.extractSheetId(config.sheetUrl);
        if (!sheetId) {
            sendResponse({
                success: false,
                error: 'Invalid Google Sheets URL format. Please provide the full URL.'
            });
            return;
        }

        // Configure OAuth2 client
        googleOAuth.configure(config.oauthClientId, config.oauthClientSecret);

        // Configure client with sheet ID (no API key needed for OAuth2)
        googleSheetsClient.configure(sheetId, null);

        // Test OAuth2 authentication first
        log.info('🔐 Testing OAuth2 authentication...');
        const isAuthenticated = await googleOAuth.isAuthenticated();
        if (!isAuthenticated) {
            sendResponse({
                success: false,
                error: 'OAuth2 authentication failed. Please check your Google account permissions.'
            });
            return;
        }
        log.info('✅ OAuth2 authentication successful');

        // Test basic connection (read operation)
        const sheetInfo = await googleSheetsClient.getSheetInfo();
        log.info('✅ Basic connection successful, checking required sheets...');

        // Check for and create required sheets
        const schema = new GoogleSheetsSchema();
        const setupResult = await setupGoogleSheets(sheetId, schema);

        log.info('📋 Sheet setup result:', setupResult);

        // Test writing a single row to the TestConnection sheet
        const testResult = await testWritePermissions('TestConnection');

        // Save configuration if requested
        if (message.saveConfig) {
            log.info('💾 Saving Google Sheets configuration...');
            await configManager.set('google_sheets', {
                oauthClientId: config.oauthClientId,
                oauthClientSecret: config.oauthClientSecret,
                sheetUrl: config.sheetUrl
            });
            log.info('✅ Configuration saved successfully');
        }

        sendResponse({
            success: true,
            sheetInfo: {
                title: sheetInfo.properties.title,
                sheetCount: sheetInfo.sheets.length,
                testResult: testResult,
                setupResult: setupResult
            }
        });
    } catch (error) {
        log.error('Error testing Google Sheets connection:', error);

        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('401')) {
            errorMessage = 'OAuth2 authentication failed (401). Please check your Google account permissions and try again.';
        } else if (error.message.includes('403')) {
            errorMessage = 'Access denied (403). Please check: 1) Sheet is shared with "Anyone with the link can view", 2) Your Google account has access to the sheet';
        } else if (error.message.includes('404')) {
            errorMessage = 'Sheet not found (404). Please check the Sheet URL is correct';
        } else if (error.message.includes('400')) {
            errorMessage = 'Bad request (400). Please check your Sheet URL format';
        }

        sendResponse({ success: false, error: errorMessage });
    }
}

async function handleGoogleSheetsSetup(message, sendResponse) {
    try {
        log.info('🔧 Handling Google Sheets setup request...');

        const config = message.config;
        if (!config || !config.oauthClientId || !config.oauthClientSecret || !config.sheetUrl) {
            sendResponse({
                success: false,
                error: 'Configuration incomplete. Please provide OAuth Client ID, Client Secret, and Sheet URL.'
            });
            return;
        }

        // Extract Sheet ID from URL
        const sheetId = configManager.extractSheetId(config.sheetUrl);
        if (!sheetId) {
            sendResponse({
                success: false,
                error: 'Invalid Google Sheets URL format. Please provide the full URL.'
            });
            return;
        }

        // Configure OAuth2 client
        googleOAuth.configure(config.oauthClientId, config.oauthClientSecret);

        // Configure client with sheet ID
        googleSheetsClient.configure(sheetId, null);

        // Test OAuth2 authentication first
        log.info('🔐 Testing OAuth2 authentication...');
        const isAuthenticated = await googleOAuth.isAuthenticated();
        if (!isAuthenticated) {
            sendResponse({
                success: false,
                error: 'OAuth2 authentication failed. Please check your Google account permissions.'
            });
            return;
        }
        log.info('✅ OAuth2 authentication successful');

        // Set up the Google Sheets structure
        log.info('📝 Setting up Google Sheets structure...');
        const schema = new GoogleSheetsSchema();
        const setupResult = await setupGoogleSheets(sheetId, schema);

        sendResponse({
            success: true,
            setupResult: setupResult
        });

    } catch (error) {
        log.error('❌ Error setting up Google Sheets:', error);

        let errorMessage = error.message;
        if (error.message.includes('401')) {
            errorMessage = 'OAuth2 authentication failed (401). Please check your Google account permissions and try again.';
        } else if (error.message.includes('403')) {
            errorMessage = 'Access denied (403). Please check: 1) Sheet is shared with "Anyone with the link can view", 2) Your Google account has access to the sheet';
        } else if (error.message.includes('404')) {
            errorMessage = 'Sheet not found (404). Please check the Sheet URL is correct';
        } else if (error.message.includes('400')) {
            errorMessage = 'Bad request (400). Please check your Sheet URL format';
        }

        sendResponse({ success: false, error: errorMessage });
    }
}

async function handleSyncHiddenOrderToSheets(message, sendResponse) {
    try {
        log.info('📤 Syncing hidden order to Google Sheets...');

        const hiddenOrderData = message.hiddenOrderData;
        if (!hiddenOrderData) {
            sendResponse({
                success: false,
                error: 'No hidden order data provided'
            });
            return;
        }

        // Get Google Sheets configuration
        const config = await configManager.get('google_sheets');
        if (!config || !config.oauthClientId || !config.oauthClientSecret || !config.sheetUrl) {
            log.warning('⚠️ Google Sheets not configured, skipping sync');
            sendResponse({
                success: false,
                error: 'Google Sheets not configured'
            });
            return;
        }

        // Extract Sheet ID from URL
        const sheetId = configManager.extractSheetId(config.sheetUrl);
        if (!sheetId) {
            sendResponse({
                success: false,
                error: 'Invalid Google Sheets URL format'
            });
            return;
        }

        // Configure OAuth2 client
        googleOAuth.configure(config.oauthClientId, config.oauthClientSecret);
        googleSheetsClient.configure(sheetId, null);

        // Prepare data for Google Sheets
        const orderData = hiddenOrderData.orderData || {};
        const sheetRow = [
            hiddenOrderData.orderId,                    // Order ID
            orderData.orderDate || '',                  // Order Date
            hiddenOrderData.username,                   // Hidden By
            hiddenOrderData.timestamp,                  // Hidden At
            hiddenOrderData.type,                       // Hidden Type
            orderData.tags ? orderData.tags.join(',') : '', // Tags
            orderData.notes || '',                      // Notes
            hiddenOrderData.timestamp                   // Last Modified
        ];

        // Check if order already exists in HiddenOrders sheet
        const existingRange = 'HiddenOrders!A:H';
        const existingData = await googleSheetsClient.getRange(existingRange);

        let orderExists = false;
        let existingRowIndex = -1;

        if (existingData && existingData.values && existingData.values.length > 1) {
            // Skip header row, check data rows
            const dataRows = existingData.values.slice(1);
            for (let i = 0; i < dataRows.length; i++) {
                if (dataRows[i][0] === hiddenOrderData.orderId) {
                    orderExists = true;
                    existingRowIndex = i + 2; // +2 because we skipped header and arrays are 0-based
                    break;
                }
            }
        }

        if (orderExists) {
            // Update existing row
            log.info(`📝 Updating existing hidden order ${hiddenOrderData.orderId} in Google Sheets (row ${existingRowIndex})`);
            const updateRange = `HiddenOrders!A${existingRowIndex}:H${existingRowIndex}`;
            await googleSheetsClient.writeRange(updateRange, sheetRow);
        } else {
            // Append new row
            log.info(`➕ Adding new hidden order ${hiddenOrderData.orderId} to Google Sheets`);
            await googleSheetsClient.appendData('HiddenOrders', sheetRow);
        }

        log.info(`✅ Successfully synced hidden order ${hiddenOrderData.orderId} to Google Sheets`);
        sendResponse({ success: true });

    } catch (error) {
        log.error('❌ Error syncing hidden order to Google Sheets:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

/**
 * Handle removing hidden order from Google Sheets
 */
async function handleRemoveHiddenOrderFromSheets(message, sendResponse) {
    try {
        log.info('📤 Removing hidden order from Google Sheets...');
        log.info('📤 Message received:', message);

        const hiddenOrderData = message.hiddenOrderData;
        if (!hiddenOrderData) {
            sendResponse({
                success: false,
                error: 'No hidden order data provided'
            });
            return;
        }

        // Get Google Sheets configuration
        const config = await configManager.get('google_sheets');
        if (!config || !config.oauthClientId || !config.oauthClientSecret || !config.sheetUrl) {
            log.warning('⚠️ Google Sheets not configured, skipping removal');
            sendResponse({
                success: false,
                error: 'Google Sheets not configured'
            });
            return;
        }

        // Extract Sheet ID from URL
        const sheetId = configManager.extractSheetId(config.sheetUrl);
        if (!sheetId) {
            sendResponse({
                success: false,
                error: 'Invalid Google Sheets URL format'
            });
            return;
        }

        // Configure OAuth2 client
        googleOAuth.configure(config.oauthClientId, config.oauthClientSecret);
        googleSheetsClient.configure(sheetId);

        // Find and remove the order from HiddenOrders sheet
        // We need to find the row with the matching order ID and delete it
        const sheetInfo = await googleSheetsClient.getSheetInfo();
        const hiddenOrdersSheet = sheetInfo.sheets.find(sheet => sheet.properties.title === 'HiddenOrders');

        if (!hiddenOrdersSheet) {
            log.warning('⚠️ HiddenOrders sheet not found');
            sendResponse({
                success: false,
                error: 'HiddenOrders sheet not found'
            });
            return;
        }

        // Get all data from HiddenOrders sheet to find the row to delete
        const range = `HiddenOrders!A:A`; // Get all order IDs from column A
        const response = await googleSheetsClient.getRange(range);

        if (response && response.values) {
            let rowToDelete = -1;
            for (let i = 0; i < response.values.length; i++) {
                if (response.values[i][0] === hiddenOrderData.orderId) {
                    rowToDelete = i + 1; // Google Sheets is 1-indexed
                    break;
                }
            }

            if (rowToDelete > 0) {
                // Delete the row
                await googleSheetsClient.deleteRow('HiddenOrders', rowToDelete);
                log.info(`✅ Successfully removed hidden order ${hiddenOrderData.orderId} from Google Sheets`);
            } else {
                log.warning(`⚠️ Order ${hiddenOrderData.orderId} not found in HiddenOrders sheet`);
            }
        }

        sendResponse({ success: true });

    } catch (error) {
        log.error('❌ Error removing hidden order from Google Sheets:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

/**
 * Handle adding audit log entry to Google Sheets
 */
async function handleAddAuditLogEntry(message, sendResponse) {
    try {
        log.info('📝 Adding audit log entry to Google Sheets...');

        const auditLogData = message.auditLogData;
        if (!auditLogData) {
            sendResponse({
                success: false,
                error: 'No audit log data provided'
            });
            return;
        }

        // Get Google Sheets configuration
        const config = await configManager.get('google_sheets');
        if (!config || !config.oauthClientId || !config.oauthClientSecret || !config.sheetUrl) {
            log.warning('⚠️ Google Sheets not configured, skipping audit log');
            sendResponse({
                success: false,
                error: 'Google Sheets not configured'
            });
            return;
        }

        // Extract Sheet ID from URL
        const sheetId = configManager.extractSheetId(config.sheetUrl);
        if (!sheetId) {
            sendResponse({
                success: false,
                error: 'Invalid Google Sheets URL format'
            });
            return;
        }

        // Configure OAuth2 client
        googleOAuth.configure(config.oauthClientId, config.oauthClientSecret);
        googleSheetsClient.configure(sheetId);

        // Prepare audit log data for Google Sheets
        const auditLogRow = [
            auditLogData.timestamp,     // Timestamp
            auditLogData.orderId,       // Order ID
            auditLogData.action,        // Action (hide/unhide)
            auditLogData.actionType,    // Action Type (details)
            auditLogData.performedBy    // Performed By (username)
        ];

        // Append to ActionLog sheet
        await googleSheetsClient.appendData('ActionLog', auditLogRow);

        log.info(`✅ Successfully added audit log entry for ${auditLogData.action} operation on order ${auditLogData.orderId}`);
        sendResponse({ success: true });

    } catch (error) {
        log.error('❌ Error adding audit log entry to Google Sheets:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

/**
 * Ensure a sheet has proper headers
 * @param {string} sheetName - Name of the sheet
 * @param {Array} expectedHeaders - Array of expected header names
 */
async function ensureSheetHeaders(sheetName, expectedHeaders) {
    try {
        log.info(`🔍 ensureSheetHeaders called for "${sheetName}" with headers:`, expectedHeaders);
        log.info(`🔍 Checking headers for sheet "${sheetName}"...`);

        // Check if client is configured
        if (!googleSheetsClient.isConfigured()) {
            log.error(`❌ Google Sheets client not configured when ensuring headers for "${sheetName}"`);
            return;
        }

        log.info(`🔍 Google Sheets client is configured, sheet ID: ${googleSheetsClient.sheetId}`);

        // Get the first row to check if headers exist
        const headerRange = `${sheetName}!A1:Z1`; // Use a wider range to avoid column issues
        log.info(`🔍 Attempting to get range: ${headerRange}`);
        const headerResponse = await googleSheetsClient.getRange(headerRange);
        log.info(`🔍 getRange response for "${sheetName}":`, headerResponse);

        if (!headerResponse || !headerResponse.values || headerResponse.values.length === 0) {
            // No data in first row, add headers
            log.info(`📝 Adding headers to sheet "${sheetName}"...`);
            const rangeToWrite = `${sheetName}!A1:${String.fromCharCode(65 + expectedHeaders.length - 1)}1`;
            log.info(`📝 Writing headers to range: ${rangeToWrite}`);
            log.info(`📝 Headers data:`, expectedHeaders);
            await googleSheetsClient.writeRange(rangeToWrite, expectedHeaders);
            await googleSheetsClient.formatHeaderRow(sheetName);
            log.info(`✅ Headers added to sheet "${sheetName}"`);
        } else {
            const existingHeaders = headerResponse.values[0];
            log.info(`📊 Existing headers in "${sheetName}":`, existingHeaders);

            // Check if headers match expected format
            const hasValidHeaders = existingHeaders.length >= expectedHeaders.length &&
                existingHeaders[0] && existingHeaders[0].toLowerCase().includes('order');

            if (!hasValidHeaders) {
                log.info(`📝 Headers don't match expected format, adding proper headers...`);
                const rangeToWrite = `${sheetName}!A1:${String.fromCharCode(65 + expectedHeaders.length - 1)}1`;
                log.info(`📝 Writing headers to range: ${rangeToWrite}`);
                log.info(`📝 Headers data:`, expectedHeaders);
                await googleSheetsClient.writeRange(rangeToWrite, expectedHeaders);
                await googleSheetsClient.formatHeaderRow(sheetName);
                log.info(`✅ Headers updated in sheet "${sheetName}"`);
            } else {
                log.info(`✅ Sheet "${sheetName}" already has proper headers`);
            }
        }
    } catch (error) {
        log.error(`❌ Error ensuring headers for sheet "${sheetName}":`, error);
        log.error(`❌ Error details:`, {
            message: error.message,
            stack: error.stack,
            sheetName: sheetName,
            expectedHeaders: expectedHeaders
        });
        // Don't throw error - this is a best-effort operation
    }
}

/**
 * Handle fetching hidden orders from Google Sheets
 */
async function handleFetchHiddenOrdersFromSheets(message, sendResponse) {
    try {
        log.info('📥 Fetching hidden orders from Google Sheets...');

        // Get Google Sheets configuration
        const config = await configManager.get('google_sheets');
        if (!config || !config.oauthClientId || !config.oauthClientSecret || !config.sheetUrl) {
            log.warning('⚠️ Google Sheets not configured, cannot fetch hidden orders');
            sendResponse({
                success: false,
                error: 'Google Sheets not configured'
            });
            return;
        }

        // Extract Sheet ID from URL
        const sheetId = configManager.extractSheetId(config.sheetUrl);
        if (!sheetId) {
            sendResponse({
                success: false,
                error: 'Invalid Google Sheets URL format'
            });
            return;
        }

        // Configure OAuth2 client
        googleOAuth.configure(config.oauthClientId, config.oauthClientSecret);
        googleSheetsClient.configure(sheetId);

        // Ensure HiddenOrders sheet has proper headers
        await ensureSheetHeaders('HiddenOrders', ['Order ID', 'Order Date', 'Hidden By', 'Hidden At', 'Hidden Type', 'Tags', 'Notes', 'Last Modified']);

        // Get all data from HiddenOrders sheet
        const range = 'HiddenOrders!A:H'; // Get all columns (assuming 8 columns based on schema)
        const response = await googleSheetsClient.getRange(range);

        log.info('📊 Raw Google Sheets response:', response);
        log.info('📊 Response values:', response?.values);
        log.info('📊 Number of rows:', response?.values?.length);

        if (!response || !response.values || response.values.length <= 1) {
            // No data or only header row
            log.info('📥 No hidden orders found in Google Sheets');
            sendResponse({
                success: true,
                hiddenOrders: []
            });
            return;
        }

        // Convert sheet data to hidden orders format
        const hiddenOrders = [];

        // Always expect the first row to be a header - skip it
        const dataRows = response.values.slice(1); // Skip header row
        log.info(`📊 Processing ${dataRows.length} data rows from Google Sheets (skipped header)`);

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            log.info(`📊 Processing row ${i + 1}:`, row);

            if (row.length >= 8 && row[0]) { // Ensure we have order ID
                // Additional validation: check if the first column looks like an order ID
                const orderId = row[0].toString().trim();
                const isValidOrderId = /^[A-Z0-9]{3}-[A-Z0-9]{7}-[A-Z0-9]{7}$/.test(orderId);

                if (isValidOrderId) {
                    const hiddenOrder = {
                        orderId: orderId,           // Order ID
                        orderDate: row[1] || '',   // Order Date
                        hiddenBy: row[2] || '',    // Hidden By
                        hiddenAt: row[3] || '',    // Hidden At
                        type: row[4] || 'details', // Hidden Type
                        tags: row[5] || '',        // Tags
                        notes: row[6] || '',       // Notes
                        lastModified: row[7] || '' // Last Modified
                    };

                    log.info(`✅ Converted row ${i + 1} to hidden order:`, hiddenOrder);
                    hiddenOrders.push(hiddenOrder);
                } else {
                    log.info(`⚠️ Skipping row ${i + 1} - invalid order ID format: "${orderId}"`);
                }
            } else {
                log.info(`⚠️ Skipping invalid row ${i + 1}:`, row);
            }
        }

        log.info(`✅ Successfully fetched ${hiddenOrders.length} hidden orders from Google Sheets`);
        log.info('📊 Final hidden orders array:', hiddenOrders);

        sendResponse({
            success: true,
            hiddenOrders: hiddenOrders
        });

    } catch (error) {
        log.error('❌ Error fetching hidden orders from Google Sheets:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Extension startup handler
chrome.runtime.onStartup.addListener(async () => {
    log.info('Extension starting up...');
    await initializeStorage();
    await initializeGoogleSheets();
});

// Extension installation handler
chrome.runtime.onInstalled.addListener(async (details) => {
    log.info('Extension installed:', details.reason);

    // Initialize storage and handle migration
    await initializeStorage();
    await initializeGoogleSheets();

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


