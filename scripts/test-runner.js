#!/usr/bin/env node

// Test Runner Script for Amazon Order Archiver
// Provides custom test execution with better output formatting

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Amazon Order Archiver tests...\n');

// Test configuration
const testConfig = {
    watch: process.argv.includes('--watch'),
    coverage: process.argv.includes('--coverage'),
    verbose: process.argv.includes('--verbose'),
    pattern: process.argv.find(arg => arg.startsWith('--pattern='))?.split('=')[1]
};

// Build Jest command
const jestArgs = ['--config', 'jest.config.js'];

if (testConfig.watch) {
    jestArgs.push('--watch');
}

if (testConfig.coverage) {
    jestArgs.push('--coverage');
}

if (testConfig.verbose) {
    jestArgs.push('--verbose');
}

if (testConfig.pattern) {
    jestArgs.push('--testNamePattern', testConfig.pattern);
}

// Run Jest
const jestProcess = spawn('npx', ['jest', ...jestArgs], {
    stdio: 'inherit',
    shell: true
});

jestProcess.on('close', (code) => {
    console.log(`\n🏁 Tests completed with exit code: ${code}`);
    process.exit(code);
});

jestProcess.on('error', (error) => {
    console.error('❌ Error running tests:', error);
    process.exit(1);
});
