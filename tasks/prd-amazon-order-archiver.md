# Product Requirements Document: Archizer Chrome Extension

## Introduction/Overview

In May 2025, Amazon.com removed the order archiving feature that allowed customers to hide orders from their main order history page. This Chrome extension will restore this functionality by providing users the ability to hide order details or entire orders from their Amazon order history page (https://www.amazon.com/your-orders/orders), with the ability to manage and restore hidden items through a convenient popup interface.

The extension solves the problem of order history clutter and privacy concerns when sharing devices or screens, allowing users to selectively hide sensitive, embarrassing, or simply irrelevant orders while maintaining access to them when needed.

## Goals

1. **Restore Order Privacy Control**: Enable users to hide specific orders or order details from their Amazon order history page
2. **Provide Granular Hiding Options**: Offer both "Hide details" (hide product information) and "Hide order" (hide entire order) functionality
3. **Ensure Easy Recovery**: Provide a simple popup interface to view and restore hidden orders
4. **Enable Shared Account Management**: Allow multiple users sharing an Amazon account to access the same hidden orders list across all devices
5. **Deliver Seamless Integration**: Integrate naturally with Amazon's existing order history interface

## User Stories

1. **As a privacy-conscious user**, I want to hide embarrassing or personal orders from my order history so that others using my device cannot see them.

2. **As a gift purchaser**, I want to hide order details (but keep the order visible) so that family members can't see what I've bought them while still seeing that I made a purchase.

3. **As a shared-computer user**, I want to quickly hide sensitive orders when someone else needs to use my computer so that my purchase history remains private.

4. **As a frequent Amazon shopper**, I want to declutter my order history by hiding old or irrelevant orders so that I can focus on recent and important purchases.

5. **As someone who shares an Amazon account with family**, I want our hidden orders to be accessible from any device so that we can both manage our shared privacy preferences.

6. **As someone who occasionally needs to find old orders**, I want an easy way to view and restore hidden orders so that I can access them when needed for returns or reference.

7. **As a gift-giver who plans ahead**, I want to tag my hidden orders with the occasion and recipient so that when I see them in my history I can quickly understand why they were hidden without revealing the surprise.

8. **As someone sharing an Amazon account**, I want to see who hid each order so that I know whether it was my decision or my partner's, helping us coordinate our privacy preferences.

## Functional Requirements

1. **Order History Page Integration**
   1.1. The extension must add two buttons to each order on the Amazon order history page (https://www.amazon.com/your-orders/orders)
   1.2. The first button must display "Hide details" text
   1.3. The second button must display "Hide order" text
   1.4. Buttons must be visually integrated with Amazon's existing design language
   1.5. The extension must monitor for newly loaded orders (via pagination, infinite scroll, or dynamic loading) and immediately apply hiding rules to any orders that should be hidden
   1.6. Hidden orders must remain hidden when navigating between pages or when new orders are dynamically loaded

2. **Hide Details Functionality**
   2.1. Clicking "Hide details" must hide all order items including: thumbnail images, product text/links, buy-it-again buttons, and any other item-identifying details
   2.2. Clicking "Hide details" must display a tagging dialog before proceeding
   3.3. The tagging dialog must allow users to input one or more tags via a textbox (e.g., "christmas", "birthday", "shawn-birthday", "other")
   2.4. The button text must toggle to "Show details" when details are hidden
   2.5 Hidden-details orders must be stored with their order number, total price, order date, tags, and hiding user, as well as a unique state differentiating it from hidden orders
   2.6. Clicking the button again must restore all hidden details and revert button text to "Hide details" must display a tagging dialog before proceeding
   2.7. The hide/show state must persist across browser sessions
   2.8. The hide/show state must sync across all devices and users via Google Sheets backend

3. **Hide Order Functionality**
   3.1. Clicking "Hide order" must display a tagging dialog before proceeding
   3.2. The tagging dialog must allow users to input one or more tags via a textbox (e.g., "christmas", "birthday", "shawn-birthday", "other")
   3.3. After tagging, the entire order must be removed from the visible order history page
   3.4. Hidden orders must be stored with their order number, total price, order date, tags, and hiding user, as well as a unique state differentiating it from hidden-details orders

4. **Extension Popup Interface**
   4.1. The extension must provide a popup accessible via the Chrome toolbar extension icon
   4.2. The popup must display a paginated list of all hidden orders (10 items per page)
   4.3. Each hidden order entry must show: state (hidden-details or hidden), order number, total price, order-placed date, tags, and hiding user
   4.4. Tags must be displayed with visual indicators (e.g., colored badges or icons)
   4.5. Each entry must include an "Unhide" link
   4.6. Clicking "Unhide" must restore the order to the order history page
   4.7. The popup must remain open after unhiding an order
   4.8. The popup must show "No hidden orders" message when no orders are hidden
   4.9. The popup must allow filtering by one or more tags and hiding user

5. **Data Persistence and Sync**
   5.1. All hidden order data must persist indefinitely until manually unhidden, with the exception of data declared in 5.6.
   5.2. Hidden order preferences must sync across all devices and users via Google Sheets backend
   5.3. Data must be stored: order number, hide type (details vs full order), timestamp, price, order date, tags, and hiding user
   5.4. The extension must authenticate with Google Sheets API using a pre-configured service account
   5.5. Data must be stored in a structured Google Sheet with columns for each data field
   5.6. User's name and tag configurations (name, chosen color) should store to device-specific storage, like browser storage.

6. **Error Handling**
   6.1. If Amazon's page structure changes and the extension cannot function, it must display a user-friendly error message
   6.2. The extension must gracefully handle network issues during Google Sheets API calls
   6.3. Invalid or corrupted storage data must be handled without breaking functionality
   6.4. Google Sheets API authentication failures must be handled with clear user guidance

## Non-Goals (Out of Scope)

1. **Multi-Site Support**: This extension will only work on amazon.com (US site), not international Amazon domains
2. **Order Modification**: The extension will not modify, delete, or interact with actual Amazon order data
3. **Advanced Search**: No complex search functionality beyond basic tag and user filtering
4. **Order Analytics**: No tracking, reporting, or analytics features
5. **Mobile Support**: Extension will not work on mobile Amazon apps or mobile browsers
6. **Account Integration**: No integration with Amazon account settings or preferences
7. **Bulk Operations**: No ability to hide/unhide multiple orders simultaneously

## Design Considerations

1. **Visual Integration**: Buttons should match Amazon's current design system using similar colors, fonts, and spacing
2. **Button Placement**: Buttons should be placed in a logical location within each order card without disrupting the existing layout
3. **Popup Design**: The popup should have a clean, minimal interface consistent with modern Chrome extension standards
4. **Responsive Behavior**: The popup should handle various screen sizes and different numbers of hidden orders gracefully
5. **Loading States**: Provide visual feedback during sync operations and when loading hidden orders

## Technical Considerations

1. **Content Script Requirements**: The extension will need content scripts to inject buttons and modify the Amazon order history page
2. **Google Sheets Backend**: Use Google Sheets API with Apps Script for shared data storage across users and devices
3. **Authentication**: Use OAuth 2.0 with user's personal Google account for accessing their Google Sheets
4. **Dynamic Order Hiding**: Content script must monitor for newly loaded orders (via pagination, infinite scroll, etc.) and apply hiding rules in real-time
5. **DOM Manipulation**: Robust selectors needed to identify Amazon order elements (may require periodic updates)
6. **Permissions**: Required permissions: activeTab, storage (for caching and user preferences), identity (for Google OAuth), host permissions for amazon.com and Google Sheets API
7. **Performance**: Minimize impact on page load times; cache Google Sheets data locally with periodic sync
8. **Browser Compatibility**: Target Chrome v88+ for modern storage, identity, and extension APIs
9. **Apps Script Integration**: Google Apps Script functions to handle CRUD operations on the sheet data

## Success Metrics

1. **Functionality Success**: 100% of hide/unhide operations work correctly without breaking Amazon's page functionality
2. **User Adoption**: Extension maintains 4+ star rating on Chrome Web Store
3. **Reliability**: Less than 1% error rate for Google Sheets API operations
4. **Performance**: No measurable impact on Amazon page load times
5. **Compatibility**: Extension continues to work through minor Amazon page updates without immediate intervention

## Setup Requirements

**Manual Google Account Setup (One-time):**
1. **Create Google Sheet**: User must create a new Google Sheet in their Google Drive
2. **Configure Sheet Structure**: The sheet must have the following columns:
   - Column A: `order_number` (Amazon order number)
   - Column B: `hide_type` ("details" or "full")
   - Column C: `price` (order total)
   - Column D: `order_date` (date order was placed)
   - Column E: `hidden_date` (timestamp when hidden)
   - Column F: `tags` (comma-separated free-form tags, e.g., "christmas,gift,wife" or "birthday,personal")
   - Column G: `hidden_by_user` (name/identifier of person who hid the order)
3. **Create Apps Script Project**: User must create a Google Apps Script project linked to the sheet
4. **Deploy Apps Script**: User must deploy the Apps Script as a web app with access restricted to their Google account
5. **OAuth Setup**: User must configure OAuth consent screen and enable Google Sheets API for their project
6. **Configure Extension**: User must authenticate the extension with their Google account during first use
7. **Share Sheet**: The Google Sheet must be shared with their spouse with edit permissions

**Apps Script Functions Required:**
- `addHiddenOrder(orderNumber, hideType, price, orderDate, tags, hiddenByUser)` - Add a new hidden order with free-form tags
- `removeHiddenOrder(orderNumber)` - Remove/unhide an order
- `getHiddenOrders()` - Retrieve all hidden orders with full metadata
- `updateHideType(orderNumber, hideType)` - Toggle between "details" and "full" hiding
- `getFilteredOrders(tags, hiddenByUser)` - Retrieve orders filtered by tags and user

## Apps Script Template

**Copy and paste this code into your Google Apps Script project:**

```javascript
/**
 * Archizer - Google Apps Script Backend
 * Copy this code into your Apps Script project and deploy as a web app
 */

// Configuration - Update these values
const SHEET_NAME = 'HiddenOrders'; // Name of your sheet tab
const HEADERS = ['order_number', 'hide_type', 'price', 'order_date', 'hidden_date', 'tags', 'hidden_by_user'];

/**
 * Initialize the sheet with proper headers if it doesn't exist
 */
function initializeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  
  return sheet;
}

/**
 * Main entry point for web app requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'addHiddenOrder':
        return addHiddenOrder(data.orderNumber, data.hideType, data.price, data.orderDate, data.tags, data.hiddenByUser);
      case 'removeHiddenOrder':
        return removeHiddenOrder(data.orderNumber);
      case 'getHiddenOrders':
        return getHiddenOrders();
      case 'updateHideType':
        return updateHideType(data.orderNumber, data.hideType);
      case 'getFilteredOrders':
        return getFilteredOrders(data.tags, data.hiddenByUser);
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Add a new hidden order
 */
function addHiddenOrder(orderNumber, hideType, price, orderDate, tags, hiddenByUser) {
  try {
    const sheet = initializeSheet();
    const hiddenDate = new Date().toISOString();
    
    // Check if order already exists
    const existingRow = findOrderRow(orderNumber);
    if (existingRow > 0) {
      // Update existing order
      sheet.getRange(existingRow, 2, 1, 6).setValues([[hideType, price, orderDate, hiddenDate, tags, hiddenByUser]]);
    } else {
      // Add new order
      sheet.appendRow([orderNumber, hideType, price, orderDate, hiddenDate, tags, hiddenByUser]);
    }
    
    return createResponse(true, 'Order hidden successfully');
  } catch (error) {
    return createResponse(false, 'Error adding hidden order: ' + error.toString());
  }
}

/**
 * Remove/unhide an order
 */
function removeHiddenOrder(orderNumber) {
  try {
    const sheet = initializeSheet();
    const row = findOrderRow(orderNumber);
    
    if (row > 0) {
      sheet.deleteRow(row);
      return createResponse(true, 'Order unhidden successfully');
    } else {
      return createResponse(false, 'Order not found');
    }
  } catch (error) {
    return createResponse(false, 'Error removing hidden order: ' + error.toString());
  }
}

/**
 * Get all hidden orders
 */
function getHiddenOrders() {
  try {
    const sheet = initializeSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createResponse(true, 'No hidden orders found', []);
    }
    
    const orders = data.slice(1).map(row => ({
      orderNumber: row[0],
      hideType: row[1],
      price: row[2],
      orderDate: row[3],
      hiddenDate: row[4],
      tags: row[5],
      hiddenByUser: row[6]
    }));
    
    return createResponse(true, 'Orders retrieved successfully', orders);
  } catch (error) {
    return createResponse(false, 'Error getting hidden orders: ' + error.toString());
  }
}

/**
 * Update hide type for an existing order
 */
function updateHideType(orderNumber, hideType) {
  try {
    const sheet = initializeSheet();
    const row = findOrderRow(orderNumber);
    
    if (row > 0) {
      sheet.getRange(row, 2).setValue(hideType);
      return createResponse(true, 'Hide type updated successfully');
    } else {
      return createResponse(false, 'Order not found');
    }
  } catch (error) {
    return createResponse(false, 'Error updating hide type: ' + error.toString());
  }
}

/**
 * Get filtered orders based on tags and user
 */
function getFilteredOrders(tags, hiddenByUser) {
  try {
    const allOrders = getHiddenOrders();
    if (!allOrders.success) {
      return allOrders;
    }
    
    let filteredOrders = allOrders.data;
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      filteredOrders = filteredOrders.filter(order => {
        const orderTags = order.tags.toLowerCase().split(',');
        return tags.some(tag => orderTags.includes(tag.toLowerCase()));
      });
    }
    
    // Filter by user if provided
    if (hiddenByUser) {
      filteredOrders = filteredOrders.filter(order => 
        order.hiddenByUser.toLowerCase().includes(hiddenByUser.toLowerCase())
      );
    }
    
    return createResponse(true, 'Filtered orders retrieved successfully', filteredOrders);
  } catch (error) {
    return createResponse(false, 'Error filtering orders: ' + error.toString());
  }
}

/**
 * Helper function to find order row by order number
 */
function findOrderRow(orderNumber) {
  const sheet = initializeSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderNumber) {
      return i + 1; // +1 because getRange is 1-indexed
    }
  }
  
  return -1; // Not found
}

/**
 * Helper function to create consistent response format
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run this to verify your setup works
 */
function testSetup() {
  console.log('Testing Apps Script setup...');
  
  // Test adding an order
  const addResult = addHiddenOrder('123-456789-123456', 'full', '$29.99', '2024-01-15', 'test,setup', 'TestUser');
  console.log('Add test:', addResult.getContent());
  
  // Test getting orders
  const getResult = getHiddenOrders();
  console.log('Get test:', getResult.getContent());
  
  // Test removing the order
  const removeResult = removeHiddenOrder('123-456789-123456');
  console.log('Remove test:', removeResult.getContent());
  
  console.log('Setup test complete!');
}
```

**Setup Instructions:**
1. Open Google Apps Script (script.google.com)
2. Create a new project
3. Replace the default code with the template above
4. Save the project with a meaningful name (e.g., "Archizer")
5. Run the `testSetup()` function to verify everything works
6. Deploy as a web app:
   - Click "Deploy" → "New deployment"
   - Choose "Web app" as the type
   - Set execute as "Me" and access to "Anyone with Google account"
   - Copy the web app URL for use in the Chrome extension

## Open Questions

1. **Amazon Layout Changes**: How frequently should we monitor for Amazon UI changes, and what's the update strategy?
2. **Google Sheets Limits**: What happens if the Google Sheet reaches row limits or API quotas?
3. **Sheet Management**: Template Apps Script code provided below for easy copy-paste setup
4. **Future Features**: Should we consider adding features like temporary hiding (auto-unhide after X days) in future versions?
5. **Testing Strategy**: How will we test the Google Sheets integration during development?
6. **Error Recovery**: How should the extension handle temporary Google Sheets API outages?
