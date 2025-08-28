/**
 * Google Sheets Data Schema Definition
 * Defines the normalized data structure for Google Sheets integration
 * 
 * This schema supports three main sheets:
 * 1. HiddenOrders - Currently hidden orders with metadata
 * 2. ActionLog - Audit trail of all hide/unhide actions
 * 3. UserSettings - User configuration and preferences
 */

export class GoogleSheetsSchema {
    constructor() {
        // Define the three main sheets and their column structures
        this.sheets = {
            hiddenOrders: this.getHiddenOrdersSchema(),
            actionLog: this.getActionLogSchema(),
            userSettings: this.getUserSettingsSchema()
        };

        // Define data relationships and constraints
        this.constraints = this.getSchemaConstraints();
    }

    /**
     * Get the complete schema definition
     * @returns {Object} Complete schema object
     */
    getSchema() {
        return {
            sheets: this.sheets,
            constraints: this.constraints,
            version: '1.0.0',
            description: 'Amazon Order Archiver Google Sheets Schema'
        };
    }

    /**
     * Hidden Orders Sheet Schema
     * Tracks currently hidden orders and their metadata
     * @returns {Object} Schema definition
     */
    getHiddenOrdersSchema() {
        return {
            name: 'HiddenOrders',
            description: 'Currently hidden orders with metadata',
            columns: [
                {
                    name: 'orderId',
                    displayName: 'Order ID',
                    description: 'Amazon order number (e.g., 112-8383531-6014102)',
                    type: 'string',
                    required: true,
                    unique: true,
                    example: '112-8383531-6014102'
                },
                {
                    name: 'orderDate',
                    displayName: 'Order Date',
                    description: 'Date when the order was placed (YYYY-MM-DD format)',
                    type: 'date',
                    required: false,
                    example: '2024-01-15'
                },
                {
                    name: 'hiddenBy',
                    displayName: 'Hidden By',
                    description: 'Username who hid the order',
                    type: 'string',
                    required: true,
                    example: 'shawalli'
                },
                {
                    name: 'hiddenAt',
                    displayName: 'Hidden At',
                    description: 'Timestamp when order was hidden (ISO 8601 format)',
                    type: 'datetime',
                    required: true,
                    example: '2024-01-20T14:30:00Z'
                },
                {
                    name: 'hiddenType',
                    displayName: 'Hidden Type',
                    description: 'Type of hiding (always "details" for order details)',
                    type: 'string',
                    required: true,
                    allowedValues: ['details'],
                    example: 'details'
                },
                {
                    name: 'tags',
                    displayName: 'Tags',
                    description: 'Comma-separated list of tags associated with the order',
                    type: 'string',
                    required: false,
                    example: 'electronics, gift, expensive'
                },
                {
                    name: 'notes',
                    displayName: 'Notes',
                    description: 'Additional notes about the order or hiding reason',
                    type: 'string',
                    required: false,
                    example: 'Birthday gift for spouse'
                },
                {
                    name: 'lastModified',
                    displayName: 'Last Modified',
                    description: 'Timestamp of last modification (ISO 8601 format)',
                    type: 'datetime',
                    required: true,
                    example: '2024-01-20T14:30:00Z'
                }
            ]
        };
    }

    /**
     * Action Log Sheet Schema
     * Audit trail of all hide/unhide actions with complete tag history
     * @returns {Object} Schema definition
     */
    getActionLogSchema() {
        return {
            name: 'ActionLog',
            description: 'Complete audit trail of hide/unhide actions',
            columns: [
                {
                    name: 'timestamp',
                    displayName: 'Timestamp',
                    description: 'When the action occurred (ISO 8601 format)',
                    type: 'datetime',
                    required: true,
                    example: '2024-01-20T14:30:00Z'
                },
                {
                    name: 'orderId',
                    displayName: 'Order ID',
                    description: 'Amazon order number affected by the action',
                    type: 'string',
                    required: true,
                    example: '112-8383531-6014102'
                },
                {
                    name: 'action',
                    displayName: 'Action',
                    description: 'Type of action performed (hide, unhide)',
                    type: 'string',
                    required: true,
                    allowedValues: ['hide', 'unhide'],
                    example: 'hide'
                },
                {
                    name: 'actionType',
                    displayName: 'Action Type',
                    description: 'Type of hiding/unhiding (always "details" for order details)',
                    type: 'string',
                    required: true,
                    allowedValues: ['details'],
                    example: 'details'
                },
                {
                    name: 'performedBy',
                    displayName: 'Performed By',
                    description: 'Username who performed the action',
                    type: 'string',
                    required: true,
                    example: 'shawalli'
                },
                {
                    name: 'tags',
                    displayName: 'Tags',
                    description: 'Complete list of all tags associated with the order at the time of action (comma-separated)',
                    type: 'string',
                    required: false,
                    example: 'electronics, gift, expensive'
                },
                {
                    name: 'notes',
                    displayName: 'Notes',
                    description: 'Notes added during the action',
                    type: 'string',
                    required: false,
                    example: 'Birthday gift for spouse'
                },
                {
                    name: 'browserInfo',
                    displayName: 'Browser Info',
                    description: 'Browser and version information for debugging (e.g., "Chrome 120.0.6099.109", "Arc 1.0.0")',
                    type: 'string',
                    required: false,
                    example: 'Chrome 120.0.6099.109'
                }
            ]
        };
    }

    /**
     * User Settings Sheet Schema
     * User configuration and preferences
     * @returns {Object} Schema definition
     */
    getUserSettingsSchema() {
        return {
            name: 'UserSettings',
            description: 'User configuration and preferences',
            columns: [
                {
                    name: 'username',
                    displayName: 'Username',
                    description: 'Unique username identifier',
                    type: 'string',
                    required: true,
                    unique: true,
                    example: 'shawalli'
                },
                {
                    name: 'createdAt',
                    displayName: 'Created At',
                    description: 'When the user was first added to the system (ISO 8601 format)',
                    type: 'datetime',
                    required: true,
                    example: '2024-01-15T10:00:00Z'
                },
                {
                    name: 'lastActive',
                    displayName: 'Last Active',
                    description: 'Last time the user performed an action (ISO 8601 format)',
                    type: 'datetime',
                    required: true,
                    example: '2024-01-20T14:30:00Z'
                },
                {
                    name: 'isActive',
                    displayName: 'Is Active',
                    description: 'Whether the user is currently active in the system',
                    type: 'boolean',
                    required: true,
                    example: true
                }
            ]
        };
    }

    /**
     * Get schema constraints and relationships
     * @returns {Object} Constraints definition
     */
    getSchemaConstraints() {
        return {
            // Data integrity constraints
            integrity: {
                // Order ID format validation (Amazon order format: XXX-XXXXXXX-XXXXXXX)
                orderIdFormat: /^\d{3}-\d{7}-\d{7}$/,

                // Username format (alphanumeric, underscores, hyphens)
                usernameFormat: /^[a-zA-Z0-9_-]+$/,

                // Maximum field lengths
                maxLengths: {
                    orderId: 25,
                    username: 50,
                    tags: 500,
                    notes: 1000
                }
            },

            // Cross-sheet relationships
            relationships: {
                // HiddenOrders.orderId references ActionLog.orderId
                hiddenOrdersToActionLog: {
                    from: 'HiddenOrders.orderId',
                    to: 'ActionLog.orderId',
                    type: 'foreign_key'
                },

                // HiddenOrders.hiddenBy references UserSettings.username
                hiddenOrdersToUserSettings: {
                    from: 'HiddenOrders.hiddenBy',
                    to: 'UserSettings.username',
                    type: 'foreign_key'
                },

                // ActionLog.performedBy references UserSettings.username
                actionLogToUserSettings: {
                    from: 'ActionLog.performedBy',
                    to: 'UserSettings.username',
                    type: 'foreign_key'
                }
            },

            // Business rules
            businessRules: {
                // An order can only be hidden once (unique constraint on orderId in HiddenOrders)
                uniqueHiddenOrder: 'Each order can only appear once in HiddenOrders',

                // When unhiding, the order must exist in HiddenOrders
                unhideValidation: 'Cannot unhide an order that is not currently hidden',

                // Tags are cumulative across all actions for an order
                tagCumulation: 'All tags from previous actions should be included in subsequent actions',

                // Hidden type is always "details" for order details
                hiddenTypeConstraint: 'Hidden type is always "details" for order details hiding'
            }
        };
    }

    /**
     * Get sample data for each sheet
     * @returns {Object} Sample data for testing and documentation
     */
    getSampleData() {
        return {
            hiddenOrders: [
                {
                    orderId: '112-8383531-6014102',
                    orderDate: '2024-01-15',
                    hiddenBy: 'shawalli',
                    hiddenAt: '2024-01-20T14:30:00Z',
                    hiddenType: 'details',
                    tags: 'electronics, gift, expensive',
                    notes: 'Birthday gift for spouse',
                    lastModified: '2024-01-20T14:30:00Z'
                }
            ],
            actionLog: [
                {
                    timestamp: '2024-01-20T14:30:00Z',
                    orderId: '112-8383531-6014102',
                    action: 'hide',
                    actionType: 'details',
                    performedBy: 'shawalli',
                    tags: 'electronics, gift, expensive',
                    notes: 'Birthday gift for spouse',
                    browserInfo: 'Chrome 120.0.6099.109'
                }
            ],
            userSettings: [
                {
                    username: 'shawalli',
                    createdAt: '2024-01-15T10:00:00Z',
                    lastActive: '2024-01-20T14:30:00Z',
                    isActive: true
                }
            ]
        };
    }

    /**
     * Validate data against the schema
     * @param {string} sheetName - Name of the sheet to validate
     * @param {Object} data - Data to validate
     * @returns {Object} Validation result with errors and warnings
     */
    validateData(sheetName, data) {
        const schema = this.sheets[sheetName];
        if (!schema) {
            return { valid: false, errors: [`Unknown sheet: ${sheetName}`] };
        }

        const errors = [];
        const warnings = [];

        // Validate required fields
        schema.columns.forEach(column => {
            if (column.required && !data[column.name]) {
                errors.push(`Missing required field: ${column.name}`);
            }
        });

        // Validate field types and formats
        if (data.orderId && !this.constraints.integrity.orderIdFormat.test(data.orderId)) {
            errors.push(`Invalid order ID format: ${data.orderId}`);
        }

        if (data.username && !this.constraints.integrity.usernameFormat.test(data.username)) {
            errors.push(`Invalid username format: ${data.username}`);
        }

        // Validate hidden type constraints
        if (data.hiddenType && data.hiddenType !== 'details') {
            errors.push(`Invalid hidden type: ${data.hiddenType}. Only 'details' is supported.`);
        }

        if (data.actionType && data.actionType !== 'details') {
            errors.push(`Invalid action type: ${data.actionType}. Only 'details' is supported.`);
        }

        // Validate field lengths
        Object.entries(this.constraints.integrity.maxLengths).forEach(([field, maxLength]) => {
            if (data[field] && data[field].length > maxLength) {
                errors.push(`Field ${field} exceeds maximum length of ${maxLength}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}

// Export a default instance
export const defaultSchema = new GoogleSheetsSchema();
