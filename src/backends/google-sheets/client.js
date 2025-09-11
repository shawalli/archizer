/**
 * Google Sheets Client with OAuth2 Authentication
 * Handles both read (API key) and write (OAuth2) operations
 */

import { specializedLogger as log } from '../../utils/logger.js';
import { googleOAuth } from './oauth.js';

export class GoogleSheetsClient {
    constructor() {
        this.sheetId = null;
        this.apiKey = null;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    /**
     * Configure the client with sheet ID and API key
     */
    configure(sheetId, apiKey) {
        this.sheetId = sheetId;
        this.apiKey = apiKey;
        log.info('Google Sheets client configured with sheet ID:', sheetId);
    }

    /**
     * Check if client is properly configured
     */
    isConfigured() {
        return !!this.sheetId; // Only need sheet ID for OAuth2, API key is optional
    }

    /**
     * Get sheet metadata
     */
    async getSheetInfo() {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            // Get OAuth2 access token for read operations
            const accessToken = await googleOAuth.getAccessToken();

            const url = `${this.baseUrl}/${this.sheetId}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get sheet info: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            log.info('Retrieved sheet info:', data.properties.title);
            return data;
        } catch (error) {
            log.error('Error getting sheet info:', error);
            throw error;
        }
    }

    /**
     * Read data from a specific range
     */
    async readRange(range) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            // Get OAuth2 access token for read operations
            const accessToken = await googleOAuth.getAccessToken();

            const url = `${this.baseUrl}/${this.sheetId}/values/${range}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to read range: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            log.info(`Read range ${range}:`, data.values?.length || 0, 'rows');
            return data.values || [];
        } catch (error) {
            log.error(`Error reading range ${range}:`, error);
            throw error;
        }
    }

    /**
     * Write data to a specific range
     */
    async writeRange(range, values) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            const url = `${this.baseUrl}/${this.sheetId}/values/${range}?valueInputOption=RAW&key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [values]  // Wrap values in an array to create a single row
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to write range: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            log.info(`Wrote to range ${range}:`, data.updatedRows, 'rows updated');
            return data;
        } catch (error) {
            log.error(`Error writing to range ${range}:`, error);
            throw error;
        }
    }

    /**
     * Append data to the end of a sheet
     */
    async appendData(sheetName, values) {
        if (!this.sheetId) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            // Get OAuth2 access token for write operations
            const accessToken = await googleOAuth.getAccessToken();

            const range = `${sheetName}!A:A`; // Append to column A
            const url = `${this.baseUrl}/${this.sheetId}/values/${range}:append?valueInputOption=RAW`;

            log.info(`📤 Appending data to sheet "${sheetName}":`, values);
            log.info(`📤 API URL: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    values: [values]  // Wrap values in an array to create a single row
                })
            });

            log.info(`📥 Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                log.error(`❌ Append failed: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to append data: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            log.info(`Appended data to ${sheetName}:`, data.updates.updatedRows, 'rows added');
            return data;
        } catch (error) {
            log.error(`Error appending data to ${sheetName}:`, error);
            throw error;
        }
    }

    /**
     * Clear a range of data
     */
    async clearRange(range) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            const url = `${this.baseUrl}/${this.sheetId}/values/${range}:clear?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Failed to clear range: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            log.info(`Cleared range ${range}`);
            return data;
        } catch (error) {
            log.error(`Error clearing range ${range}:`, error);
            throw error;
        }
    }

    /**
     * Get all sheet names
     */
    async getSheetNames() {
        try {
            const info = await this.getSheetInfo();
            return info.sheets.map(sheet => sheet.properties.title);
        } catch (error) {
            log.error('Error getting sheet names:', error);
            throw error;
        }
    }

    /**
     * Create a new sheet in the spreadsheet
     */
    async createSheet(sheetName) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            // Get OAuth2 access token for write operations
            const accessToken = await googleOAuth.getAccessToken();

            const url = `${this.baseUrl}/${this.sheetId}:batchUpdate`;

            const requestBody = {
                requests: [{
                    addSheet: {
                        properties: {
                            title: sheetName
                        }
                    }
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Failed to create sheet: ${response.status} ${response.statusText} ${response.body}`);
            }

            const data = await response.json();
            log.info(`Sheet "${sheetName}" created successfully`);
            return data;
        } catch (error) {
            log.error(`Error creating sheet "${sheetName}":`, error);
            throw error;
        }
    }

    /**
     * Format the header row (make it bold)
     */
    async formatHeaderRow(sheetName) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            const url = `${this.baseUrl}/${this.sheetId}:batchUpdate?key=${this.apiKey}`;

            const requestBody = {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId: await this.getSheetIdByName(sheetName),
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 0,
                            endColumnIndex: 8 // Assuming 8 columns max
                        },
                        cell: {
                            userEnteredFormat: {
                                textFormat: {
                                    bold: true
                                }
                            }
                        },
                        fields: 'userEnteredFormat.textFormat.bold'
                    }
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Failed to format header row: ${response.status} ${response.statusText}`);
            }

            log.info(`Header row formatted for sheet "${sheetName}"`);
            return await response.json();
        } catch (error) {
            log.error(`Error formatting header row for "${sheetName}":`, error);
            throw error;
        }
    }

    /**
     * Get sheet ID by sheet name
     */
    async getSheetIdByName(sheetName) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets client not configured. Please set sheet ID.');
        }

        try {
            const sheetInfo = await this.getSheetInfo();
            const sheet = sheetInfo.sheets.find(s => s.properties.title === sheetName);
            if (!sheet) {
                throw new Error(`Sheet "${sheetName}" not found`);
            }
            return sheet.properties.sheetId;
        } catch (error) {
            log.error(`Error getting sheet ID for "${sheetName}":`, error);
            throw error;
        }
    }
}

// Export a default instance
export const googleSheetsClient = new GoogleSheetsClient();
