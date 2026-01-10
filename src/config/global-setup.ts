import { TestContainerManager } from '../services/testcontainer.manager';
import { DatabaseManager } from '../services/database.manager';
import { DatabaseConfigManager } from './database.config';

/**
 * Global Setup - Runs once before all tests
 * Sets up PostgreSQL container (reuses if exists) and initializes database
 */
async function globalSetup() {
    console.log('\n========================================');
    console.log('🚀 GLOBAL SETUP - Starting Test Environment');
    console.log('========================================\n');

    const logApiCalls = process.env.LOG_API_CALLS === 'true';
    const keepContainerRunning = process.env.KEEP_CONTAINER_RUNNING === 'true';

    console.log('📋 Configuration:');
    console.log(`  LOG_API_CALLS: ${logApiCalls}`);
    console.log(`  KEEP_CONTAINER_RUNNING: ${keepContainerRunning}`);
    console.log('');

    // Only start container if logging is enabled
    if (!logApiCalls) {
        console.log('ℹ️  API logging disabled, skipping database setup');
        console.log('   To enable logging, run: npm run test:debug\n');
        console.log('========================================\n');
        return;
    }

    try {
        // Step 1: Initialize DatabaseConfigManager first
        console.log('📦 Step 1: Initializing database configuration...');
        DatabaseConfigManager.getInstance();
        console.log('✓ Database configuration initialized\n');

        // Step 2: Start or reuse PostgreSQL container
        console.log('📦 Step 2: Setting up PostgreSQL container...');
        const containerManager = TestContainerManager.getInstance();
        await containerManager.start();

        // Give container a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // IMPORTANT: Reinitialize config after container is started
        // This ensures we have the correct port from either new or existing container
        const freshConfig = DatabaseConfigManager.getInstance().getConfig();
        console.log('✓ Database configuration refreshed');
        console.log(`  Connecting to: ${freshConfig.host}:${freshConfig.port}`);

        // Step 3: Initialize database (create schema and tables)
        console.log('\n📦 Step 3: Initializing database schema...');
        const dbManager = DatabaseManager.getInstance();
        await dbManager.initialize();
        console.log('');

        // Step 4: Verify everything is ready
        console.log('📦 Step 4: Verifying setup...');
        if (dbManager.isReady()) {
            console.log('✓ Database is ready for logging');
        } else {
            console.warn('⚠️  Database initialization completed but not ready');
        }

        console.log('\n========================================');
        console.log('✅ GLOBAL SETUP COMPLETED SUCCESSFULLY');
        console.log('========================================\n');

        if (keepContainerRunning) {
            console.log('💡 TIP: Container will stay running after tests');
            console.log('   View logs: npm run db:logs');
            console.log('   Access DB: npm run db:shell');
            console.log('   Stop DB: npm run db:stop\n');
        }
    } catch (error) {
        console.error('\n========================================');
        console.error('❌ GLOBAL SETUP FAILED');
        console.error('========================================');
        console.error('Error details:', error);
        console.error('\nTroubleshooting:');
        console.error('  1. Check if Colima is running: colima status');
        console.error('  2. Check if Docker is accessible: docker ps');
        console.error('  3. Try restarting Colima: colima restart');
        console.error('  4. Check for port conflicts: lsof -i :5432');
        console.error('========================================\n');
        throw error;
    }
}

export default globalSetup;