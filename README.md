# Archizer Chrome Extension

<p align="center">
  <img src="./icons/logo.png" alt="Archizer Logo" width="256" height="256">
</p>

A Chrome extension that allows users to archive and hide Amazon orders.

## Features

- **Order Hiding**: Hide individual orders or order details on Amazon order history page
- **Google Sheets Integration**: Automatically sync hidden orders to Google Sheets
- **Tagging System**: Add custom tags to orders for better organization
- **User Management**: Support for multiple users with separate order tracking
- **Easy Restoration**: Unhide orders with a single click

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
4. Add the Client ID and Client Secret to the extension in the settings page of the extension popup.

### Google Sheets Setup

1. Create a Google Sheet for order storage
2. Add the Sheets URL to the extension in the settings page of the extension popup.
3. Click "Test Connection" to perform OAuth login and setup Google Sheet.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

Apache 2.0 License - see LICENSE file for details
