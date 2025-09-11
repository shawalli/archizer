/**
 * Google Sheets Backend Package
 * Exports all Google Sheets related functionality
 */

export { defaultSchema, GoogleSheetsSchema } from './schema.js';
export { defaultImporter, GoogleSheetsImporter } from './importer.js';
export { defaultSync, GoogleSheetsSync } from './sync.js';
export { defaultValidator, GoogleSheetsValidator } from './validation.js';
export { defaultTransformer, GoogleSheetsTransformer } from './transformer.js';
export { GoogleSheetsClient, googleSheetsClient } from './client.js';
export { GoogleSheetsConfig, googleSheetsConfig } from './config.js';
export { GoogleOAuth, googleOAuth } from './oauth.js';
// Convenience exports
export const GoogleSheetsBackend = {
    schema: defaultSchema,
    importer: defaultImporter,
    sync: defaultSync,
    validator: defaultValidator,
    transformer: defaultTransformer,
    client: googleSheetsClient,
    config: googleSheetsConfig
};
