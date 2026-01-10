import * as dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    schema: string;
}

/**
 * Singleton Pattern - Database Configuration Manager
 * Manages database configuration from environment variables
 */
export class DatabaseConfigManager {
    private static instance: DatabaseConfigManager;
    private config: DatabaseConfig;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): DatabaseConfigManager {
        if (!DatabaseConfigManager.instance) {
            DatabaseConfigManager.instance = new DatabaseConfigManager();
        }
        return DatabaseConfigManager.instance;
    }

    private loadConfig(): DatabaseConfig {
        return {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_NAME || 'api_test_db',
            user: process.env.DB_USER || 'testuser',
            password: process.env.DB_PASSWORD || 'testpass',
            schema: process.env.DB_SCHEMA || 'api_logs',
        };
    }

    /**
     * Get current configuration
     * Always reads fresh from environment variables to get latest port
     */
    public getConfig(): DatabaseConfig {
        this.config = this.loadConfig();
        return this.config;
    }
}