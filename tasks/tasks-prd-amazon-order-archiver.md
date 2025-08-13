# Task List: Amazon Order Archiver Chrome Extension

## Relevant Files

- `src/content-scripts/amazon-orders.js` - Main content script that orchestrates all Amazon integration functionality with button injection system
- `src/content-scripts/amazon-orders.css` - Styling for injected buttons and elements to match Amazon's design with hidden state support
- `src/utils/order-parser.js` - Enhanced order parsing utilities for all supported page formats
- `src/utils/order-parser.test.js` - Unit tests for order parsing functionality
- `src/utils/dom-manipulator.js` - DOM manipulation utilities for hiding/showing orders and injecting buttons with event handling
- `src/utils/dom-manipulator.test.js` - Unit tests for DOM manipulation functionality
- `src/utils/storage.js` - Extended storage manager for hidden order data and preferences
- `src/utils/storage.test.js` - Unit tests for storage functionality
- `src/components/tagging-dialog.html` - HTML template for the tagging dialog
- `src/components/tagging-dialog.css` - Styling for the tagging dialog
- `src/components/tagging-dialog.js` - JavaScript functionality for the tagging dialog
- `src/components/tagging-dialog.test.js` - Unit tests for tagging dialog functionality
- `src/utils/extension-loader.js` - Enhanced extension loader with order monitoring capabilities

### Notes

- All "npm" commands must be prefixed with "mise exec node -- npm", e.g. "npm run build" -> "mise exec node -- npm run build"
- Unit tests should be placed alongside the code files they are testing (e.g., `order-parser.js` and `order-parser.test.js` in the same directory)
- Use `mise run test` to run tests. Running without a path executes all tests found by the Jest configuration
- The sample data files contain real Amazon page structures that should be used to develop and test the selectors
- Order "112-8383531-6014102" should be used for live testing to validate the implementation works with real Amazon data
- Mock data should be created for unit tests to avoid dependencies on external services
- All DOM manipulation should be designed to work across the three supported page formats (your-account, css, your-orders)

## Tasks

- [x] 1.0 **Chrome Extension Foundation Setup**
  - [x] 1.1 Create `manifest.json` with required permissions (activeTab, storage, identity, host permissions for amazon.com and Google Sheets API)
  - [x] 1.2 Set up project structure with proper directory organization
  - [x] 1.3 Configure build process and development environment
  - [x] 1.4 Set up Jest testing framework for unit testing
  - [x] 1.5 Create basic extension loading and error handling

- [ ] 2.0 **Content Script Implementation for Amazon Integration**
  - [x] 2.1 **Order Detection and Parsing System** ✅
    - [x] 2.1.1 Analyze sample data from all three supported page formats (your-account, css, your-orders)
    - [x] 2.1.2 Update OrderParser class with robust selectors for each page format
    - [x] 2.1.3 Implement order element detection for dynamic content loading
    - [x] 2.1.4 Add comprehensive order data extraction (ID, date, total, status, items)
    - [x] 2.1.5 Create unit tests with mock data for each page format
    - [x] 2.1.6 Test with live order "112-8383531-6014102" for validation (requires live Amazon access)
  - [x] 2.2 **DOM Integration and Button Injection** ✅
    - [x] 2.2.1 Design button placement strategy for each order format
    - [x] 2.2.2 Implement "Hide details" button injection with Amazon-style design ✅
    - [x] 2.2.3 Implement "Hide order" button injection with Amazon-style design
    - [x] 2.2.4 Add proper event listeners for button interactions ✅
    - [x] 2.2.5 Ensure buttons work across all supported page formats ✅
    - [x] 2.2.6 Create unit tests for button injection and event handling ✅
  - [x] 2.3 **Order Hiding and Showing Functionality** ✅
    - [x] 2.3.1 Implement "Hide details" logic (hide product info, images, links, return/replace text, auto-delivery text, and Amazon action buttons) ✅
    - [x] 2.3.2 Implement "Hide order" logic (remove entire order from view) ✅
    - [x] 2.3.3 Create state management system for hidden orders ✅
    - [x] 2.3.4 Implement toggle functionality for hide/show operations ✅
    - [x] 2.3.5 Add visual feedback for hidden state (button text changes, styling) ✅
    - [ ] 2.3.6 Create unit tests for hiding/showing functionality
  - [x] 2.4 **Tagging Dialog System** (Modified) ✅
    - [x] 2.4.1 Design and implement tagging dialog HTML/CSS
    - [x] 2.4.2 Add tag input functionality with comma-separated support
    - [x] 2.4.3 Implement dialog positioning and Amazon-style theming
    - [x] 2.4.4 Add validation for tag input (length, format, etc.)
    - [x] 2.4.5 Modify hide operations to show tagging dialog instead of separate Tag & Hide button
    - [ ] 2.4.6 Update unit tests for modified tagging dialog integration
  - [ ] 2.5 **Dynamic Content Monitoring**
    - [ ] 2.5.1 Implement MutationObserver for DOM changes
    - [ ] 2.5.2 Handle pagination and infinite scroll scenarios
    - [ ] 2.5.3 Apply hiding rules to newly loaded orders
    - [ ] 2.5.4 Maintain hidden state across page navigation
    - [ ] 2.5.5 Optimize performance for large order lists
    - [ ] 2.5.6 Create unit tests for dynamic content handling
  - [ ] 2.6 **Data Persistence and Sync Preparation**
    - [ ] 2.6.1 Extend StorageManager for hidden order data
    - [ ] 2.6.2 Implement local caching for hidden order preferences
    - [ ] 2.6.3 Design data structure for hidden orders (order number, type, tags, user, timestamp)
    - [ ] 2.6.4 Add methods for storing/retrieving hidden order data
    - [ ] 2.6.5 Prepare data format for future Google Sheets integration
    - [ ] 2.6.6 Create unit tests for storage functionality

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
