// Example configuration file for Amazon Order Archiver
// Copy this file to config.js and update with your actual values

module.exports = {
    // Google OAuth Configuration
    google: {
        clientId: 'your_google_client_id_here',
        clientSecret: 'your_google_client_secret_here',
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    },

    // Google Sheets Configuration
    sheets: {
        spreadsheetId: 'your_google_sheet_id_here',
        appsScriptUrl: 'your_apps_script_web_app_url_here'
    },

    // Development Configuration
    development: {
        debug: true,
        logLevel: 'debug',
        mockApi: false
    },

    // Chrome Extension Configuration
    extension: {
        id: 'your_extension_id_here',
        version: '1.0.0'
    }
};
