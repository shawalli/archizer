/**
 * Google OAuth2 Client for Web Applications
 * Handles authentication with Google Sheets API using web application OAuth flow
 */

import { specializedLogger as log } from '../../utils/logger.js';

export class GoogleOAuth {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.clientId = null;
        this.clientSecret = null;
        this.storageKey = 'google_oauth_tokens';
    }

    /**
     * Configure OAuth2 credentials
     */
    configure(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        log.info('OAuth2 client configured');
    }

    /**
     * Save tokens to Chrome storage
     */
    async saveTokens() {
        try {
            const tokenData = {
                accessToken: this.accessToken,
                refreshToken: this.refreshToken,
                tokenExpiry: this.tokenExpiry
            };

            await chrome.storage.local.set({ [this.storageKey]: tokenData });
            log.info('OAuth tokens saved to storage');
        } catch (error) {
            log.error('Error saving OAuth tokens:', error);
        }
    }

    /**
     * Load tokens from Chrome storage
     */
    async loadTokens() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            const tokenData = result[this.storageKey];

            if (tokenData) {
                this.accessToken = tokenData.accessToken;
                this.refreshToken = tokenData.refreshToken;
                this.tokenExpiry = tokenData.tokenExpiry;
                log.info('OAuth tokens loaded from storage');
                return true;
            }

            log.info('No OAuth tokens found in storage');
            return false;
        } catch (error) {
            log.error('Error loading OAuth tokens:', error);
            return false;
        }
    }

    /**
     * Get OAuth2 access token
     */
    async getAccessToken() {
        try {
            // First, try to load tokens from storage if we don't have them in memory
            if (!this.accessToken && !this.refreshToken) {
                await this.loadTokens();
            }

            // Check if we have a valid cached token
            if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                log.info('Using cached access token');
                return this.accessToken;
            }

            // Check if we have a refresh token
            if (this.refreshToken) {
                log.info('Refreshing access token...');
                return await this.refreshAccessToken();
            }

            // Need to get new token via authorization flow
            log.info('Starting OAuth2 authorization flow...');
            return await this.authorize();
        } catch (error) {
            log.error('Error getting OAuth2 access token:', error);
            throw error;
        }
    }

    /**
     * Start OAuth2 authorization flow
     */
    async authorize() {
        if (!this.clientId) {
            throw new Error('OAuth2 client not configured. Please set client ID and secret.');
        }

        const redirectUri = chrome.identity.getRedirectURL();
        const scope = 'https://www.googleapis.com/auth/spreadsheets';

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${this.clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scope)}&` +
            `access_type=offline&` +
            `prompt=consent`;

        log.info('Opening OAuth2 authorization URL...');
        log.info('Auth URL:', authUrl);
        log.info('Redirect URI:', redirectUri);

        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: true
            }, async (responseUrl) => {
                if (chrome.runtime.lastError) {
                    log.error('Chrome identity error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                log.info('OAuth2 response URL received:', responseUrl);

                try {
                    const url = new URL(responseUrl);
                    const code = url.searchParams.get('code');
                    const error = url.searchParams.get('error');

                    if (error) {
                        const errorDescription = url.searchParams.get('error_description');
                        log.error('OAuth2 error:', error, errorDescription);
                        reject(new Error(`OAuth2 error: ${error} - ${errorDescription}`));
                        return;
                    }

                    if (!code) {
                        log.error('No authorization code in response URL');
                        reject(new Error('No authorization code received'));
                        return;
                    }

                    log.info('Authorization code received, exchanging for tokens...');
                    // Exchange code for tokens
                    const tokens = await this.exchangeCodeForTokens(code, redirectUri);
                    this.accessToken = tokens.access_token;
                    this.refreshToken = tokens.refresh_token;
                    this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

                    // Save tokens to storage
                    await this.saveTokens();

                    log.success('OAuth2 authorization successful');
                    resolve(this.accessToken);
                } catch (error) {
                    log.error('Error processing OAuth2 response:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code, redirectUri) {
        const tokenUrl = 'https://oauth2.googleapis.com/token';

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const tokenUrl = 'https://oauth2.googleapis.com/token';

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: this.refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
        }

        const tokens = await response.json();
        this.accessToken = tokens.access_token;
        this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

        // Save updated tokens to storage
        await this.saveTokens();

        log.success('Access token refreshed');
        return this.accessToken;
    }

    /**
     * Clear stored tokens
     */
    async clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;

        // Also clear from storage
        try {
            await chrome.storage.local.remove([this.storageKey]);
            log.info('OAuth2 tokens cleared from storage');
        } catch (error) {
            log.error('Error clearing OAuth tokens from storage:', error);
        }

        log.info('OAuth2 tokens cleared');
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        try {
            const token = await this.getAccessToken();
            return !!token;
        } catch (error) {
            log.error('Authentication check failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const googleOAuth = new GoogleOAuth();
