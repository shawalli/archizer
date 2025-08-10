# Task List: Amazon Order Archiver Chrome Extension

## Relevant Files

- `manifest.json` - Chrome extension manifest with required permissions and content scripts
- `src/content-scripts/amazon-orders.js` - Content script for injecting buttons and modifying Amazon order history page
- `src/background/background.js` - Background script for handling Google OAuth and API calls
- `src/popup/popup.html` - HTML structure for the extension popup interface
- `src/popup/popup.js` - JavaScript logic for popup functionality and order management
- `src/popup/popup.css` - Styling for the popup interface
- `src/utils/google-sheets-api.js` - Utility functions for Google Sheets API integration
- `src/utils/order-parser.js` - Functions to parse Amazon order data and extract required information
- `src/utils/storage.js` - Local storage management for user preferences and caching
- `src/utils/dom-manipulator.js` - DOM manipulation utilities for hiding/showing order elements
- `src/components/tagging-dialog.js` - Modal dialog component for order tagging functionality
- `src/components/tagging-dialog.css` - Styling for the tagging dialog
- `src/components/tagging-dialog.test.js` - Unit tests for tagging dialog component
- `src/content-scripts/amazon-orders.test.js` - Unit tests for content script functionality
- `src/popup/popup.test.js` - Unit tests for popup functionality
- `src/utils/google-sheets-api.test.js` - Unit tests for Google Sheets API utilities
- `src/utils/order-parser.test.js` - Unit tests for order parsing utilities
- `src/utils/storage.test.js` - Unit tests for storage utilities
- `src/utils/dom-manipulator.test.js` - Unit tests for DOM manipulation utilities

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 **Chrome Extension Foundation Setup**
  - [ ] 1.1 Create `manifest.json` with required permissions (activeTab, storage, identity, host permissions for amazon.com and Google Sheets API)
  - [ ] 1.2 Set up project structure with proper directory organization
  - [ ] 1.3 Configure build process and development environment
  - [ ] 1.4 Set up Jest testing framework for unit testing
  - [ ] 1.5 Create basic extension loading and error handling

- [ ] 2.0 **Content Script Implementation for Amazon Integration**
  - [ ] 2.1 Implement order detection and parsing on Amazon order history page
  - [ ] 2.2 Create button injection system for "Hide details" and "Hide order" buttons
  - [ ] 2.3 Implement order element identification and hiding functionality
  - [ ] 2.4 Add dynamic monitoring for newly loaded orders (pagination, infinite scroll)
  - [ ] 2.5 Implement order restoration functionality when unhiding
  - [ ] 2.6 Add visual styling to match Amazon's design language
  - [ ] 2.7 Implement error handling for Amazon page structure changes

- [ ] 3.0 **Google Sheets API Integration & Authentication**
  - [ ] 3.1 Set up Google OAuth 2.0 authentication flow
  - [ ] 3.2 Implement Google Sheets API client with Apps Script web app integration
  - [ ] 3.3 Create CRUD operations for hidden orders (add, remove, get, update)
  - [ ] 3.4 Implement data synchronization between local cache and Google Sheets
  - [ ] 3.5 Add error handling for API failures and network issues
  - [ ] 3.6 Implement retry logic and offline fallback mechanisms

- [ ] 4.0 **Extension Popup Interface Development**
  - [ ] 4.1 Design and implement popup HTML structure with pagination
  - [ ] 4.2 Create hidden orders list display with order metadata (state, number, price, date, tags, user)
  - [ ] 4.3 Implement tag filtering and user filtering functionality
  - [ ] 4.4 Add visual tag indicators (colored badges/icons) for better UX
  - [ ] 4.5 Implement "Unhide" functionality with order restoration
  - [ ] 4.6 Add loading states and error messages for better user feedback
  - [ ] 4.7 Implement responsive design for various popup sizes

- [ ] 5.0 **Data Management & State Persistence**
  - [ ] 5.1 Implement local storage for user preferences and tag configurations
  - [ ] 5.2 Create data models for hidden orders and user settings
  - [ ] 5.3 Implement caching system for Google Sheets data to improve performance
  - [ ] 5.4 Add data validation and sanitization for order information
  - [ ] 5.5 Implement conflict resolution for concurrent modifications
  - [ ] 5.6 Add data export/import functionality for backup purposes
  - [ ] 5.7 Create data migration utilities for future schema changes

## Implementation Notes

### Chrome Extension Architecture
- Use Manifest V3 for modern Chrome extension development
- Implement content scripts for Amazon page manipulation
- Use background script for Google OAuth and API management
- Implement popup interface for order management

### Google Sheets Integration
- Use Google Identity API for OAuth 2.0 authentication
- Implement Apps Script web app as backend service
- Cache data locally to minimize API calls and improve performance
- Handle API rate limits and quota management

### Amazon Page Integration
- Use MutationObserver to detect dynamically loaded content
- Implement robust CSS selectors for order element identification
- Add fallback mechanisms for Amazon UI changes
- Ensure minimal impact on page performance

### Testing Strategy
- Unit tests for all utility functions and components
- Integration tests for Google Sheets API functionality
- Manual testing on Amazon order history page
- Cross-browser compatibility testing (Chrome v88+)

### Performance Considerations
- Lazy load popup data to minimize initial load time
- Implement efficient DOM manipulation to avoid page slowdowns
- Use debouncing for API calls and user interactions
- Cache frequently accessed data locally

### Security Considerations
- Validate all user input before processing
- Implement proper CORS handling for API calls
- Secure OAuth token storage and management
- Sanitize data before storing in Google Sheets
