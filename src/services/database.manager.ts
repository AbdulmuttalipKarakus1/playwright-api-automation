import { Pool, PoolClient } from 'pg';
import { DatabaseConfigManager } from '../config/database.config';

/**
 * Singleton Pattern - Database Manager
 * Manages PostgreSQL connection pool and schema initialization
 */
export class DatabaseManager {
    private static instance: DatabaseManager;
    private pool: Pool | null = null;
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('ℹ️  Database already initialized');
            return;
        }

        // Always get fresh config to ensure we have the correct port
        const config = DatabaseConfigManager.getInstance().getConfig();

        console.log(`🔌 Connecting to PostgreSQL at ${config.host}:${config.port}...`);

        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        try {
            await this.pool.query('SELECT 1');
            console.log('✓ Database connection verified');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            console.error(`   Attempted connection: ${config.host}:${config.port}`);
            throw error;
        }

        this.isInitialized = true;
        await this.createSchemaAndTables();

        console.log('✓ Database initialized successfully');
    }

    private async createSchemaAndTables(): Promise<void> {
        const config = DatabaseConfigManager.getInstance().getConfig();
        const client = await this.getClient();

        try {
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${config.schema}`);

            await client.query(`
                CREATE TABLE IF NOT EXISTS ${config.schema}.api_logs (
                                                                         id SERIAL PRIMARY KEY,
                                                                         test_name VARCHAR(255),
                    endpoint VARCHAR(500) NOT NULL,
                    method VARCHAR(10) NOT NULL,
                    request_headers JSONB,
                    request_body JSONB,
                    response_status INTEGER,
                    response_headers JSONB,
                    response_body JSONB,
                    execution_time_ms INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_api_logs_method
                    ON ${config.schema}.api_logs(method)
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint
                    ON ${config.schema}.api_logs(endpoint)
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_api_logs_created_at
                    ON ${config.schema}.api_logs(created_at DESC)
            `);

            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_api_logs_test_name 
        ON ${config.schema}.api_logs(test_name)
      `);

            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_api_logs_response_status 
        ON ${config.schema}.api_logs(response_status)
      `);

            console.log('✓ Database schema and tables created/verified');
            console.log(`✓ Schema: ${config.schema}`);
            console.log('✓ Tables: api_logs');
            console.log('✓ Indexes: method, endpoint, created_at, test_name, response_status');
        } finally {
            client.release();
        }
    }

    public async getClient(): Promise<PoolClient> {
        if (!this.pool || !this.isInitialized) {
            throw new Error('Database pool not initialized. Call initialize() first.');
        }
        return await this.pool.connect();
    }

    public async query(text: string, params?: any[]): Promise<any> {
        if (!this.pool || !this.isInitialized) {
            throw new Error('Database pool not initialized. Call initialize() first.');
        }
        return await this.pool.query(text, params);
    }

    public isReady(): boolean {
        if (!this.isInitialized && process.env.DB_INITIALIZED === 'true') {
            this.reinitializePool();
        }

        return this.isInitialized && this.pool !== null;
    }

    private reinitializePool(): void {
        if (this.isInitialized) {
            return;
        }

        try {
            const config = DatabaseConfigManager.getInstance().getConfig();

            this.pool = new Pool({
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.user,
                password: config.password,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            });

            this.isInitialized = true;
        } catch (error) {
            if (process.env.DEBUG === 'true') {
                console.error('❌ The pool could not be recreated:', error);
            }
        }
    }

    public async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.isInitialized = false;
            console.log('✓ Database connection closed');
        }
    }

    public async logApiCall(data: {
        testName?: string;
        endpoint: string;
        method: string;
        requestHeaders?: any;
        requestBody?: any;
        responseStatus?: number;
        responseHeaders?: any;
        responseBody?: any;
        executionTimeMs?: number | null;
    }): Promise<void> {

        if (!this.isReady()) {
            if (process.env.DEBUG === 'true') {
                console.warn('⚠️  Database not ready, skipping log');
            }
            return;
        }

        try {
            const config = DatabaseConfigManager.getInstance().getConfig();

            const query = `
                INSERT INTO ${config.schema}.api_logs (
                    test_name, endpoint, method, request_headers, request_body,
                    response_status, response_headers, response_body, execution_time_ms
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING id
            `;

            const stringifyJson = (obj: any) => {
                if (obj === null || obj === undefined) return null;
                try {
                    return JSON.stringify(obj);
                } catch {
                    return JSON.stringify({ error: 'Failed to stringify object' });
                }
            };

            const values = [
                data.testName || null,
                data.endpoint,
                data.method,
                stringifyJson(data.requestHeaders),
                stringifyJson(data.requestBody),
                data.responseStatus || null,
                stringifyJson(data.responseHeaders),
                stringifyJson(data.responseBody),
                data.executionTimeMs || null,
            ];

            const result = await this.query(query, values);

            if (process.env.DEBUG === 'true') {
                console.log(`✓ API call logged with ID: ${result.rows[0].id}`);
                console.log(`  Method: ${data.method}`);
                console.log(`  Endpoint: ${data.endpoint}`);
                console.log(`  Status: ${data.responseStatus}`);
                console.log(`  Execution Time: ${data.executionTimeMs}ms`);
            }
        } catch (error) {
            if (process.env.DEBUG === 'true') {
                console.warn('⚠️  Failed to log API call to database:');
                console.error(error instanceof Error ? error.message : error);
                console.error('Data attempted to log:', {
                    testName: data.testName,
                    endpoint: data.endpoint,
                    method: data.method,
                    hasRequestHeaders: !!data.requestHeaders,
                    hasRequestBody: !!data.requestBody,
                    responseStatus: data.responseStatus,
                    hasResponseHeaders: !!data.responseHeaders,
                    hasResponseBody: !!data.responseBody,
                });
            }
        }
    }
}