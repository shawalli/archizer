/**
 * GoogleSheetsSchema Unit Tests
 * Tests schema definition and validation functionality
 */

import { GoogleSheetsSchema, defaultSchema } from './schema.js';

describe('GoogleSheetsSchema', () => {
    let schema;

    beforeEach(() => {
        schema = new GoogleSheetsSchema();
    });

    describe('Constructor', () => {
        it('should create a new instance', () => {
            expect(schema).toBeInstanceOf(GoogleSheetsSchema);
        });
    });

    describe('getSchema', () => {
        it('should return complete schema object', () => {
            const completeSchema = schema.getSchema();

            expect(completeSchema).toHaveProperty('sheets');
            expect(completeSchema.sheets).toHaveProperty('hiddenOrders');
            expect(completeSchema.sheets).toHaveProperty('actionLog');
            expect(completeSchema.sheets).toHaveProperty('userSettings');
            expect(completeSchema).toHaveProperty('constraints');
            expect(completeSchema).toHaveProperty('version');
            expect(completeSchema).toHaveProperty('description');
        });

        it('should return consistent schema structure', () => {
            const schema1 = schema.getSchema();
            const schema2 = schema.getSchema();

            expect(schema1).toEqual(schema2);
        });
    });

    describe('getHiddenOrdersSchema', () => {
        it('should return HiddenOrders schema with correct columns', () => {
            const hiddenOrdersSchema = schema.getHiddenOrdersSchema();

            expect(hiddenOrdersSchema).toHaveProperty('name', 'HiddenOrders');
            expect(hiddenOrdersSchema).toHaveProperty('columns');
            expect(Array.isArray(hiddenOrdersSchema.columns)).toBe(true);

            const expectedColumns = [
                'orderId',
                'orderDate',
                'hiddenBy',
                'hiddenAt',
                'hiddenType',
                'tags',
                'notes',
                'lastModified'
            ];

            expectedColumns.forEach(columnName => {
                const column = hiddenOrdersSchema.columns.find(col => col.name === columnName);
                expect(column).toBeDefined();
                expect(column).toHaveProperty('type');
                expect(column).toHaveProperty('required');
            });
        });

        it('should have correct column types and requirements', () => {
            const hiddenOrdersSchema = schema.getHiddenOrdersSchema();

            const orderIdColumn = hiddenOrdersSchema.columns.find(col => col.name === 'orderId');
            expect(orderIdColumn.type).toBe('string');
            expect(orderIdColumn.required).toBe(true);

            const orderDateColumn = hiddenOrdersSchema.columns.find(col => col.name === 'orderDate');
            expect(orderDateColumn.type).toBe('date');
            expect(orderDateColumn.required).toBe(true);

            const tagsColumn = hiddenOrdersSchema.columns.find(col => col.name === 'tags');
            expect(tagsColumn.type).toBe('array');
            expect(tagsColumn.required).toBe(false);

            const hiddenTypeColumn = hiddenOrdersSchema.columns.find(col => col.name === 'hiddenType');
            expect(hiddenTypeColumn.type).toBe('string');
            expect(hiddenTypeColumn.required).toBe(true);
        });
    });

    describe('getActionLogSchema', () => {
        it('should return ActionLog schema with correct columns', () => {
            const actionLogSchema = schema.getActionLogSchema();

            expect(actionLogSchema).toHaveProperty('name', 'ActionLog');
            expect(actionLogSchema).toHaveProperty('columns');
            expect(Array.isArray(actionLogSchema.columns)).toBe(true);

            const expectedColumns = [
                'timestamp',
                'orderId',
                'action',
                'actionType',
                'performedBy',
                'tags',
                'notes',
                'browserInfo'
            ];

            expectedColumns.forEach(columnName => {
                const column = actionLogSchema.columns.find(col => col.name === columnName);
                expect(column).toBeDefined();
                expect(column).toHaveProperty('type');
                expect(column).toHaveProperty('required');
            });
        });

        it('should have correct column types and requirements', () => {
            const actionLogSchema = schema.getActionLogSchema();

            const actionTypeColumn = actionLogSchema.columns.find(col => col.name === 'actionType');
            expect(actionTypeColumn.type).toBe('string');
            expect(actionTypeColumn.required).toBe(true);

            const orderIdColumn = actionLogSchema.columns.find(col => col.name === 'orderId');
            expect(orderIdColumn.type).toBe('string');
            expect(orderIdColumn.required).toBe(true);

            const tagsColumn = actionLogSchema.columns.find(col => col.name === 'tags');
            expect(tagsColumn.type).toBe('string');
            expect(tagsColumn.required).toBe(false);

            const browserInfoColumn = actionLogSchema.columns.find(col => col.name === 'browserInfo');
            expect(browserInfoColumn.type).toBe('string');
            expect(browserInfoColumn.required).toBe(false);
        });
    });

    describe('getUserSettingsSchema', () => {
        it('should return UserSettings schema with correct columns', () => {
            const userSettingsSchema = schema.getUserSettingsSchema();

            expect(userSettingsSchema).toHaveProperty('name', 'UserSettings');
            expect(userSettingsSchema).toHaveProperty('columns');
            expect(Array.isArray(userSettingsSchema.columns)).toBe(true);

            const expectedColumns = [
                'username',
                'createdAt',
                'lastActive',
                'isActive'
            ];

            expectedColumns.forEach(columnName => {
                const column = userSettingsSchema.columns.find(col => col.name === columnName);
                expect(column).toBeDefined();
                expect(column).toHaveProperty('type');
                expect(column).toHaveProperty('required');
            });
        });

        it('should have correct column types and requirements', () => {
            const userSettingsSchema = schema.getUserSettingsSchema();

            const usernameColumn = userSettingsSchema.columns.find(col => col.name === 'username');
            expect(usernameColumn.type).toBe('string');
            expect(usernameColumn.required).toBe(true);

            const createdAtColumn = userSettingsSchema.columns.find(col => col.name === 'createdAt');
            expect(createdAtColumn.type).toBe('datetime');
            expect(createdAtColumn.required).toBe(true);
        });
    });

    describe('getSchemaConstraints', () => {
        it('should return schema constraints object', () => {
            const constraints = schema.getSchemaConstraints();

            expect(constraints).toHaveProperty('integrity');
            expect(constraints).toHaveProperty('relationships');
        });

        it('should have correct constraint types', () => {
            const constraints = schema.getSchemaConstraints();

            // Check HiddenOrders constraints
            expect(constraints.HiddenOrders).toHaveProperty('orderId');
            expect(constraints.HiddenOrders.orderId).toHaveProperty('unique', true);
            expect(constraints.HiddenOrders.orderId).toHaveProperty('maxLength', 50);

            expect(constraints.HiddenOrders).toHaveProperty('username');
            expect(constraints.HiddenOrders.username).toHaveProperty('maxLength', 100);

            expect(constraints.HiddenOrders).toHaveProperty('tags');
            expect(constraints.HiddenOrders.tags).toHaveProperty('maxCount', 20);
            expect(constraints.HiddenOrders.tags).toHaveProperty('maxLength', 50);

            // Check ActionLog constraints
            expect(constraints.ActionLog).toHaveProperty('actionType');
            expect(constraints.ActionLog.actionType).toHaveProperty('allowedValues');
            expect(Array.isArray(constraints.ActionLog.actionType.allowedValues)).toBe(true);
            expect(constraints.ActionLog.actionType.allowedValues).toContain('hide');
            expect(constraints.ActionLog.actionType.allowedValues).toContain('unhide');

            // Check UserSettings constraints
            expect(constraints.UserSettings).toHaveProperty('username');
            expect(constraints.UserSettings.username).toHaveProperty('unique', true);
            expect(constraints.UserSettings.username).toHaveProperty('maxLength', 100);
        });
    });



    describe('getSampleData', () => {
        it('should return sample data for all sheets', () => {
            const sampleData = schema.getSampleData();

            expect(sampleData).toHaveProperty('hiddenOrders');
            expect(sampleData).toHaveProperty('actionLog');
            expect(sampleData).toHaveProperty('userSettings');
        });

        it('should have correct sample data structure for HiddenOrders', () => {
            const sampleData = schema.getSampleData();
            const hiddenOrdersSample = sampleData.hiddenOrders;

            expect(Array.isArray(hiddenOrdersSample)).toBe(true);
            expect(hiddenOrdersSample.length).toBeGreaterThan(0);

            const firstSample = hiddenOrdersSample[0];
            expect(firstSample).toHaveProperty('orderId');
            expect(firstSample).toHaveProperty('orderDate');
            expect(firstSample).toHaveProperty('hiddenBy');
            expect(firstSample).toHaveProperty('tags');
            expect(firstSample).toHaveProperty('hiddenType');
            expect(firstSample).toHaveProperty('hiddenAt');

            expect(firstSample.hiddenType).toBe('details');
            expect(typeof firstSample.tags).toBe('string');
        });

        it('should have correct sample data structure for ActionLog', () => {
            const sampleData = schema.getSampleData();
            const actionLogSample = sampleData.actionLog;

            expect(Array.isArray(actionLogSample)).toBe(true);
            expect(actionLogSample.length).toBeGreaterThan(0);

            const firstSample = actionLogSample[0];
            expect(firstSample).toHaveProperty('action');
            expect(firstSample).toHaveProperty('orderId');
            expect(firstSample).toHaveProperty('performedBy');
            expect(firstSample).toHaveProperty('tags');
            expect(firstSample).toHaveProperty('timestamp');
            expect(firstSample).toHaveProperty('browserInfo');

            expect(['hide', 'unhide']).toContain(firstSample.action);
            expect(typeof firstSample.tags).toBe('string');
        });

        it('should have correct sample data structure for UserSettings', () => {
            const sampleData = schema.getSampleData();
            const userSettingsSample = sampleData.userSettings;

            expect(Array.isArray(userSettingsSample)).toBe(true);
            expect(userSettingsSample.length).toBeGreaterThan(0);

            const firstSample = userSettingsSample[0];
            expect(firstSample).toHaveProperty('username');
            expect(firstSample).toHaveProperty('createdAt');

            expect(typeof firstSample.username).toBe('string');
            expect(firstSample.username.length).toBeGreaterThan(0);
        });

        it('should have realistic sample data values', () => {
            const sampleData = schema.getSampleData();

            // Check HiddenOrders sample
            const hiddenOrderSample = sampleData.hiddenOrders[0];
            expect(hiddenOrderSample.orderId).toMatch(/^\d{3}-\d{7}-\d{7}$/);
            expect(hiddenOrderSample.orderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(hiddenOrderSample.hiddenBy).toMatch(/^[a-z_]+$/);
            expect(hiddenOrderSample.hiddenType).toBe('details');

            // Check ActionLog sample
            const actionLogSample = sampleData.actionLog[0];
            expect(['hide', 'unhide']).toContain(actionLogSample.action);
            expect(actionLogSample.orderId).toMatch(/^\d{3}-\d{7}-\d{7}$/);
            expect(actionLogSample.performedBy).toMatch(/^[a-z_]+$/);

            // Check UserSettings sample
            const userSettingsSample = sampleData.userSettings[0];
            expect(userSettingsSample.username).toMatch(/^[a-z_]+$/);
        });
    });

    describe('validateData', () => {
        it('should validate HiddenOrders data correctly', () => {
            const validData = {
                orderId: '123-4567890-1234567',
                orderDate: '2024-01-15',
                hiddenBy: 'john_doe',
                tags: 'electronics, gadgets',
                hiddenType: 'details',
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
            };

            const result = schema.validateData('HiddenOrders', validData);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect validation errors in HiddenOrders data', () => {
            const invalidData = {
                orderId: '', // Empty order ID
                orderDate: 'invalid-date',
                hiddenBy: 'a'.repeat(150), // Too long username
                tags: 'electronics',
                hiddenType: 'order', // Invalid hidden type
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
            };

            const result = schema.validateData('HiddenOrders', invalidData);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should validate ActionLog data correctly', () => {
            const validData = {
                timestamp: '2024-01-15T10:30:00Z',
                action: 'hide',
                orderId: '123-4567890-1234567',
                actionType: 'details',
                performedBy: 'john_doe',
                tags: 'electronics',
                browserInfo: 'Chrome 120.0.0.0'
            };

            const result = schema.validateData('ActionLog', validData);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect validation errors in ActionLog data', () => {
            const invalidData = {
                timestamp: '2024-01-15T10:30:00Z',
                action: 'invalid_action', // Invalid action type
                orderId: '123-4567890-1234567',
                actionType: 'details',
                performedBy: 'john_doe',
                tags: 'electronics',
                browserInfo: 'Chrome 120.0.0.0'
            };

            const result = schema.validateData('ActionLog', invalidData);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should validate UserSettings data correctly', () => {
            const validData = {
                username: 'john_doe',
                createdAt: '2024-01-15T10:30:00Z',
                lastActive: '2024-01-15T10:30:00Z',
                isActive: true
            };

            const result = schema.validateData('UserSettings', validData);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect validation errors in UserSettings data', () => {
            const invalidData = {
                username: '', // Empty username
                createdAt: 'invalid-timestamp',
                lastActive: '2024-01-15T10:30:00Z',
                isActive: true
            };

            const result = schema.validateData('UserSettings', invalidData);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should reject unknown sheet names', () => {
            const validData = { orderId: '123-4567890-1234567' };

            const result = schema.validateData('UnknownSheet', validData);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Unknown sheet: UnknownSheet');
        });
    });

    describe('defaultSchema', () => {
        it('should be an instance of GoogleSheetsSchema', () => {
            expect(defaultSchema).toBeInstanceOf(GoogleSheetsSchema);
        });

        it('should have all required methods', () => {
            expect(typeof defaultSchema.getSchema).toBe('function');
            expect(typeof defaultSchema.getHiddenOrdersSchema).toBe('function');
            expect(typeof defaultSchema.getActionLogSchema).toBe('function');
            expect(typeof defaultSchema.getUserSettingsSchema).toBe('function');
            expect(typeof defaultSchema.getSchemaConstraints).toBe('function');
            expect(typeof defaultSchema.getSampleData).toBe('function');
            expect(typeof defaultSchema.validateData).toBe('function');
        });

        it('should return consistent data across calls', () => {
            const schema1 = defaultSchema.getSchema();
            const schema2 = defaultSchema.getSchema();

            expect(schema1).toEqual(schema2);
        });
    });

    describe('Schema Relationships', () => {
        it('should maintain referential integrity between sheets', () => {
            const constraints = schema.getSchemaConstraints();

            // Check that constraints have the expected structure
            expect(constraints).toHaveProperty('integrity');
            expect(constraints).toHaveProperty('relationships');
        });

        it('should have consistent data types across related fields', () => {
            const hiddenOrdersSchema = schema.getHiddenOrdersSchema();
            const actionLogSchema = schema.getActionLogSchema();

            const hiddenOrdersOrderId = hiddenOrdersSchema.columns.find(col => col.name === 'orderId');
            const actionLogOrderId = actionLogSchema.columns.find(col => col.name === 'orderId');

            expect(hiddenOrdersOrderId.type).toBe(actionLogOrderId.type);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty tags string', () => {
            const dataWithEmptyTags = {
                orderId: '123-4567890-1234567',
                orderDate: '2024-01-15',
                hiddenBy: 'john_doe',
                tags: '',
                hiddenType: 'details',
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
            };

            const result = schema.validateData('HiddenOrders', dataWithEmptyTags);
            expect(result.valid).toBe(true);
        });

        it('should handle null tags', () => {
            const dataWithNullTags = {
                orderId: '123-4567890-1234567',
                orderDate: '2024-01-15',
                hiddenBy: 'john_doe',
                tags: null,
                hiddenType: 'details',
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
            };

            const result = schema.validateData('HiddenOrders', dataWithNullTags);
            expect(result.valid).toBe(true);
        });

        it('should handle missing optional fields', () => {
            const dataWithMissingFields = {
                orderId: '123-4567890-1234567',
                orderDate: '2024-01-15',
                hiddenBy: 'john_doe',
                hiddenType: 'details',
                hiddenAt: '2024-01-15T10:30:00Z',
                lastModified: '2024-01-15T10:30:00Z'
                // Missing tags field
            };

            const result = schema.validateData('HiddenOrders', dataWithMissingFields);
            expect(result.valid).toBe(true);
        });
    });
});
