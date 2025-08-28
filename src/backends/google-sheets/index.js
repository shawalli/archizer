/**
 * Google Sheets Backend Package
 * Exports all Google Sheets related functionality
 */

export { defaultSchema, GoogleSheetsSchema } from './schema.js';
export { defaultImporter, GoogleSheetsImporter } from './importer.js';
export { defaultSync, GoogleSheetsSync } from './sync.js';
export { defaultValidator, GoogleSheetsValidator } from './validation.js';
export { defaultTransformer, GoogleSheetsTransformer } from './transformer.js';

// Convenience exports
export const GoogleSheetsBackend = {
    schema: defaultSchema,
    importer: defaultImporter,
    sync: defaultSync,
    validator: defaultValidator,
    transformer: defaultTransformer
};
