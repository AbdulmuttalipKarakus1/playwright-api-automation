import { TestContainerManager } from '../services/testcontainer.manager';
import { DatabaseManager } from '../services/database.manager';

/**
 * Global Teardown - Runs once after all tests
 * Closes database connections and stops container (unless in debug mode)
 */
async function globalTeardown() {
    console.log('\n========================================');
    console.log('🧹 GLOBAL TEARDOWN - Cleaning Up');
    console.log('========================================\n');

    const keepContainerRunning = process.env.KEEP_CONTAINER_RUNNING === 'true';
    const logApiCalls = process.env.LOG_API_CALLS === 'true';

    // Skip if logging was not enabled
    if (!logApiCalls) {
        console.log('ℹ️  API logging was disabled, no cleanup needed\n');
        console.log('========================================\n');
        return;
    }

    try {
        // Step 1: Close database connections
        console.log('📦 Step 1: Closing database connections...');
        const dbManager = DatabaseManager.getInstance();
        await dbManager.close();
        console.log('');

        // Step 2: Stop container (only if not in debug mode)
        if (keepContainerRunning) {
            console.log('📦 Step 2: Container Management...');
            console.log('ℹ️  Container kept running for debugging (KEEP_CONTAINER_RUNNING=true)');
            console.log('');
            console.log('💡 Container is still running! To access it:');
            console.log('   View logs: npm run db:logs');
            console.log('   Access DB: npm run db:shell');
            console.log('   Stop DB: npm run db:stop');
            console.log('');
        } else {
            console.log('📦 Step 2: Stopping container...');
            const containerManager = TestContainerManager.getInstance();
            await containerManager.stop();
            console.log('');
        }

        console.log('========================================');
        console.log('✅ GLOBAL TEARDOWN COMPLETED');
        console.log('========================================\n');
    } catch (error) {
        console.error('\n========================================');
        console.error('❌ GLOBAL TEARDOWN FAILED');
        console.error('========================================');
        console.error('Error details:', error);
        console.error('\nNote: This is usually not critical.');
        console.error('You can manually clean up with: npm run db:clean');
        console.error('========================================\n');
    }
}

export default globalTeardown;