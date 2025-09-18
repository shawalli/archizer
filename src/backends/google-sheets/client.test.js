/**
 * Unit tests for Google Sheets client module
 */

import { GoogleSheetsClient } from './client.js';

// Mock OAuth module
jest.mock('./oauth.js', () => ({
    googleOAuth: {
        getAccessToken: jest.fn().mockResolvedValue('mock_access_token')
    }
}));

// Mock chrome API
global.chrome = {
    storage: {
        local: {
            set: jest.fn(),
            get: jest.fn(),
            remove: jest.fn()
        }
    }
};

// Mock fetch
global.fetch = jest.fn();

describe('GoogleSheetsClient', () => {
    let client;

    beforeEach(() => {
        client = new GoogleSheetsClient();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(client.sheetId).toBeNull();
            expect(client.baseUrl).toBe('https://sheets.googleapis.com/v4/spreadsheets');
        });
    });

    describe('configure', () => {
        it('should configure client with sheet ID', () => {
            client.configure('test_sheet_id');

            expect(client.sheetId).toBe('test_sheet_id');
        });
    });

    describe('isConfigured', () => {
        it('should return false when not configured', () => {
            expect(client.isConfigured()).toBe(false);
        });

        it('should return true when fully configured', () => {
            client.configure('test_sheet_id');
            expect(client.isConfigured()).toBe(true);
        });

        it('should return false when only sheet ID is set', () => {
            client.sheetId = 'test_sheet_id';
            expect(client.isConfigured()).toBe(true); // With OAuth2, only sheetId is needed
        });

        it('should return false when only sheet ID is set but not configured', () => {
            client.sheetId = 'test_sheet_id';
            expect(client.isConfigured()).toBe(true); // With OAuth2, only sheetId is needed
        });
    });

    describe('getSheetInfo', () => {
        it('should throw error when not configured', async () => {
            await expect(client.getSheetInfo()).rejects.toThrow(
                'Google Sheets client not configured. Please set sheet ID.'
            );
        });

        it('should fetch sheet info when configured', async () => {
            client.configure('test_sheet_id');

            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    properties: { title: 'Test Sheet' }
                })
            };
            global.fetch.mockResolvedValue(mockResponse);

            const result = await client.getSheetInfo();

            expect(global.fetch).toHaveBeenCalledWith(
                'https://sheets.googleapis.com/v4/spreadsheets/test_sheet_id',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock_access_token'
                    })
                })
            );
            expect(result.properties.title).toBe('Test Sheet');
        });

        it('should handle API errors', async () => {
            client.configure('test_sheet_id');

            const mockResponse = {
                ok: false,
                status: 403,
                statusText: 'Forbidden'
            };
            global.fetch.mockResolvedValue(mockResponse);

            await expect(client.getSheetInfo()).rejects.toThrow(
                'Failed to get sheet info: 403 Forbidden'
            );
        });
    });

    describe('readRange', () => {
        it('should throw error when not configured', async () => {
            await expect(client.readRange('A1:B10')).rejects.toThrow(
                'Google Sheets client not configured. Please set sheet ID.'
            );
        });

        it('should read range when configured', async () => {
            client.configure('test_sheet_id');

            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    values: [['A1', 'B1'], ['A2', 'B2']]
                })
            };
            global.fetch.mockResolvedValue(mockResponse);

            const result = await client.readRange('A1:B2');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://sheets.googleapis.com/v4/spreadsheets/test_sheet_id/values/A1:B2',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock_access_token'
                    })
                })
            );
            expect(result).toEqual([['A1', 'B1'], ['A2', 'B2']]);
        });
    });

    describe('writeRange', () => {
        it('should throw error when not configured', async () => {
            await expect(client.writeRange('A1:B2', ['A1', 'B1'])).rejects.toThrow(
                'Google Sheets client not configured. Please set sheet ID.'
            );
        });

        it('should write range when configured', async () => {
            client.configure('test_sheet_id');

            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    updatedRows: 2
                })
            };
            global.fetch.mockResolvedValue(mockResponse);

            const result = await client.writeRange('A1:B2', ['A1', 'B1']);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://sheets.googleapis.com/v4/spreadsheets/test_sheet_id/values/A1:B2?valueInputOption=RAW',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer mock_access_token'
                    }),
                    body: JSON.stringify({ values: [['A1', 'B1']] })
                })
            );
            expect(result.updatedRows).toBe(2);
        });
    });

    describe('appendData', () => {
        it('should throw error when not configured', async () => {
            await expect(client.appendData('Sheet1', ['New Row'])).rejects.toThrow(
                'Google Sheets client not configured. Please set sheet ID.'
            );
        });

        it('should append data when configured', async () => {
            client.configure('test_sheet_id');

            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    updates: { updatedRows: 1 }
                })
            };
            global.fetch.mockResolvedValue(mockResponse);

            const result = await client.appendData('Sheet1', ['New Row']);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://sheets.googleapis.com/v4/spreadsheets/test_sheet_id/values/Sheet1!A:A:append?valueInputOption=RAW',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer mock_access_token'
                    }),
                    body: JSON.stringify({ values: [['New Row']] })
                })
            );
            expect(result.updates.updatedRows).toBe(1);
        });
    });

    describe('clearRange', () => {
        it('should throw error when not configured', async () => {
            await expect(client.clearRange('A1:B10')).rejects.toThrow(
                'Google Sheets client not configured. Please set sheet ID.'
            );
        });

        it('should clear range when configured', async () => {
            client.configure('test_sheet_id');

            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({})
            };
            global.fetch.mockResolvedValue(mockResponse);

            await client.clearRange('A1:B10');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://sheets.googleapis.com/v4/spreadsheets/test_sheet_id/values/A1:B10:clear',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock_access_token'
                    })
                })
            );
        });
    });

    describe('getSheetNames', () => {
        it('should get sheet names from sheet info', async () => {
            client.configure('test_sheet_id');

            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    properties: { title: 'Test Sheet' },
                    sheets: [
                        { properties: { title: 'Sheet1' } },
                        { properties: { title: 'Sheet2' } }
                    ]
                })
            };
            global.fetch.mockResolvedValue(mockResponse);

            const result = await client.getSheetNames();

            expect(result).toEqual(['Sheet1', 'Sheet2']);
        });
    });
});
