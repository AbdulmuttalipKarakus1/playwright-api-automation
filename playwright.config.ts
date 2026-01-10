import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : 3,
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    use: {
        baseURL: process.env.API_BASE_URL || 'https://dummyjson.com',
        trace: 'on-first-retry',
        extraHTTPHeaders: {
            'Content-Type': 'application/json',
        },
        actionTimeout: 30000,
    },

    timeout: 90000,
    expect: {
        timeout: 15000,
    },

    projects: [
        {
            name: 'api-tests',
            testMatch: '**/*.spec.ts',
        },
    ],

    globalSetup: require.resolve('./src/config/global-setup.ts'),
    globalTeardown: require.resolve('./src/config/global-teardown.ts'),
});