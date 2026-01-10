import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DatabaseConfigManager } from '../config/database.config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Singleton Pattern - TestContainer Manager
 * Manages PostgreSQL container lifecycle with reuse capability
 * If a container already exists, it will be reused instead of creating a new one
 */
export class TestContainerManager {
    private static instance: TestContainerManager;
    private container: StartedPostgreSqlContainer | null = null;

    private constructor() {}

    public static getInstance(): TestContainerManager {
        if (!TestContainerManager.instance) {
            TestContainerManager.instance = new TestContainerManager();
        }
        return TestContainerManager.instance;
    }

    /**
     * Check if a container with our name is already running
     */
    private async findExistingContainer(): Promise<{
        exists: boolean;
        containerId?: string;
        port?: number;
    }> {
        try {
            // First try to find containers with our label (new system)
            let { stdout } = await execPromise(
                `docker ps --filter "label=playwright-test=true" --format "{{.ID}},{{.Ports}}"`
            );

            // If no labeled containers, try to find any postgres:16-alpine container (old system)
            if (!stdout.trim()) {
                const result = await execPromise(
                    `docker ps --filter "ancestor=postgres:16-alpine" --format "{{.ID}},{{.Ports}}"`
                );
                stdout = result.stdout;

                if (stdout.trim()) {
                    console.log('ℹ️  Found existing PostgreSQL container without label (old system)');
                    console.log('   Adding label for better management...');
                    const containerId = stdout.trim().split(',')[0].split('\n')[0];
                    // Add label to existing container for future use
                    try {
                        await execPromise(
                            `docker update --label playwright-test=true ${containerId}`
                        );
                        console.log('✓ Label added to existing container');
                    } catch {
                        // Label update might not be supported, that's ok
                        console.log('⚠️  Could not add label (container will still be reused)');
                    }
                }
            }

            if (stdout.trim()) {
                const lines = stdout.trim().split('\n');
                const containerInfo = lines[0].split(',');
                const containerId = containerInfo[0];

                const portsString = containerInfo[1];
                const portMatch = portsString.match(/0\.0\.0\.0:(\d+)->5432/);
                const port = portMatch ? parseInt(portMatch[1]) : null;

                if (port) {
                    console.log(`✓ Found existing container: ${containerId.substring(0, 12)}`);
                    console.log(`✓ Container port: ${port}`);
                    return { exists: true, containerId, port };
                }
            }

            return { exists: false };
        } catch (error) {
            return { exists: false };
        }
    }

    /**
     * Get connection details from existing container
     */
    private async getExistingContainerConfig(containerId: string, port: number): Promise<void> {
        try {
            // Verify container is actually running and accessible
            const { stdout } = await execPromise(
                `docker inspect ${containerId} --format='{{.State.Running}}'`
            );

            if (stdout.trim() === 'true') {
                // Update DatabaseConfigManager with correct port
                const configManager = DatabaseConfigManager.getInstance();
                const config = configManager.getConfig();

                // Update the config with the actual container port
                process.env.DB_HOST = 'localhost';
                process.env.DB_PORT = port.toString();
                process.env.DB_NAME = config.database;
                process.env.DB_USER = config.user;
                process.env.DB_PASSWORD = config.password;
                process.env.DB_INITIALIZED = 'true';

                console.log('✓ Reusing existing PostgreSQL container');
                console.log(`  Host: localhost`);
                console.log(`  Port: ${port}`);
                console.log(`  Database: ${config.database}`);
            } else {
                throw new Error('Container is not running');
            }
        } catch (error) {
            console.warn('⚠️  Existing container is not healthy, will create new one');
            throw error;
        }
    }

    /**
     * Start or reuse PostgreSQL container
     */
    public async start(): Promise<StartedPostgreSqlContainer | null> {
        // Check if we should keep container running (debug mode)
        const keepContainerRunning = process.env.KEEP_CONTAINER_RUNNING === 'true';

        console.log('\n🔍 Checking for existing PostgreSQL container...');

        // Try to find and reuse existing container
        const existingContainer = await this.findExistingContainer();

        if (existingContainer.exists && existingContainer.port) {
            try {
                await this.getExistingContainerConfig(
                    existingContainer.containerId!,
                    existingContainer.port
                );
                console.log('✓ Successfully connected to existing container\n');
                return null; // Return null since we're reusing, not creating new
            } catch (error) {
                console.log('⚠️  Could not reuse existing container, creating new one...');
                // Clean up the problematic container
                try {
                    await execPromise(`docker rm -f ${existingContainer.containerId}`);
                } catch {}
            }
        } else {
            console.log('ℹ️  No existing container found, creating new one...');
        }

        // Create new container if no existing one found or reuse failed
        console.log('🚀 Starting new PostgreSQL container...');

        const config = DatabaseConfigManager.getInstance().getConfig();

        this.container = await new PostgreSqlContainer('postgres:16-alpine')
            .withDatabase(config.database)
            .withUsername(config.user)
            .withPassword(config.password)
            .withExposedPorts(5432)
            .withLabels({ 'playwright-test': 'true' }) // Add label for identification
            .withReuse() // Enable container reuse
            .start();

        // Set environment variables
        process.env.DB_HOST = this.container.getHost();
        process.env.DB_PORT = this.container.getPort().toString();
        process.env.DB_NAME = this.container.getDatabase();
        process.env.DB_USER = this.container.getUsername();
        process.env.DB_PASSWORD = this.container.getPassword();
        process.env.DB_INITIALIZED = 'true';

        console.log('✓ PostgreSQL container started successfully');
        console.log(`  Container ID: ${this.container.getId().substring(0, 12)}`);
        console.log(`  Host: ${this.container.getHost()}`);
        console.log(`  Port: ${this.container.getPort()}`);
        console.log(`  Database: ${this.container.getDatabase()}`);

        if (keepContainerRunning) {
            console.log('  Mode: DEBUG (container will persist after tests)');
        } else {
            console.log('  Mode: NORMAL (container will be cleaned up after tests)');
        }

        console.log(''); // Empty line for readability

        return this.container;
    }

    /**
     * Stop the container (only if we created it and not in debug mode)
     */
    public async stop(): Promise<void> {
        const keepContainerRunning = process.env.KEEP_CONTAINER_RUNNING === 'true';

        if (keepContainerRunning) {
            console.log('ℹ️  Container kept running for debugging (KEEP_CONTAINER_RUNNING=true)');
            console.log('   To stop it manually, run: npm run db:stop');
            return;
        }

        if (this.container) {
            await this.container.stop();
            this.container = null;
            console.log('✓ PostgreSQL container stopped');
        }
    }
}