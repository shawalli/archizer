# Archizer Chrome Extension

A Chrome extension that allows users to archive and hide Amazon orders.

## Features

- **Order Hiding**: Hide individual orders or order details on Amazon order history page
- **Google Sheets Integration**: Automatically sync hidden orders to Google Sheets
- **Tagging System**: Add custom tags to orders for better organization
- **User Management**: Support for multiple users with separate order tracking
- **Easy Restoration**: Unhide orders with a single click

## Project Structure

```
archizer/
├── manifest.json                 # Chrome extension manifest
├── package.json                  # Project dependencies and scripts
├── README.md                     # Project documentation
├── src/
│   ├── content-scripts/         # Amazon page integration
│   │   ├── amazon-orders.js     # Main content script
│   │   └── amazon-orders.css    # Content script styles
│   ├── background/              # Background service worker
│   │   └── background.js        # OAuth and API management
│   ├── popup/                   # Extension popup interface
│   │   ├── popup.html          # Popup HTML structure
│   │   ├── popup.js            # Popup JavaScript logic
│   │   └── popup.css           # Popup styling
│   ├── utils/                   # Utility functions
│   │   ├── google-sheets-api.js # Google Sheets API integration
│   │   ├── order-parser.js      # Order data parsing
│   │   ├── storage.js          # Local storage management
│   │   └── dom-manipulator.js  # DOM manipulation utilities
│   ├── components/              # Reusable components
│   │   ├── tagging-dialog.js   # Tagging modal component
│   │   ├── tagging-dialog.css  # Tagging dialog styles
│   │   └── tagging-dialog.html # Tagging dialog HTML
│   └── test-setup.js           # Jest test configuration
└── icons/                       # Extension icons
    ├── icon16.png              # 16x16 icon
    ├── icon32.png              # 32x32 icon
    ├── icon48.png              # 48x48 icon
    └── icon128.png             # 128x128 icon
```

## Development Setup

1. **Install dependencies:**
   ```bash
   mise exec node -- npm install
   ```

2. **Run tests:**
   ```bash
   mise run test
   ```

3. **Build extension:**
   ```bash
   mise run build
   ```

4. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Testing

The project uses Jest for unit testing with a custom test environment that mocks Chrome extension APIs.

```bash
# Run all tests
mise run test

# Run tests in watch mode
mise exec node -- npm test:watch
```

## Building

```bash
# Build the extension
mise exec node -- npm build
```

## Configuration

### Google OAuth Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials
4. Update the `client_id` in `manifest.json`

### Google Sheets Setup

1. Create a Google Sheet for order storage
2. Set up Apps Script web app for backend API
3. Configure sharing permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details