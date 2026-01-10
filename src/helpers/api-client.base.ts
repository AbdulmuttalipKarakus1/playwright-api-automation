import { APIRequestContext, APIResponse } from '@playwright/test';
import { DatabaseManager } from '../services/database.manager';

export interface ApiCallOptions {
    headers?: Record<string, string>;
    data?: any;
    params?: Record<string, string>;
    testName?: string;
}

/**
 * Base API Client with logging capabilities
 * Implements common API call patterns and database logging
 */
export class ApiClientBase {
    protected request: APIRequestContext;
    protected baseURL: string;
    private dbManager: DatabaseManager;
    private logApiCalls: boolean;

    constructor(request: APIRequestContext, baseURL: string) {
        this.request = request;
        this.baseURL = baseURL;
        this.dbManager = DatabaseManager.getInstance();
        this.logApiCalls = process.env.LOG_API_CALLS === 'true';
    }

    protected async get(
        endpoint: string,
        options: ApiCallOptions = {}
    ): Promise<APIResponse> {
        return await this.makeRequest('GET', endpoint, options);
    }

    protected async post(
        endpoint: string,
        options: ApiCallOptions = {}
    ): Promise<APIResponse> {
        return await this.makeRequest('POST', endpoint, options);
    }

    protected async put(
        endpoint: string,
        options: ApiCallOptions = {}
    ): Promise<APIResponse> {
        return await this.makeRequest('PUT', endpoint, options);
    }

    protected async patch(
        endpoint: string,
        options: ApiCallOptions = {}
    ): Promise<APIResponse> {
        return await this.makeRequest('PATCH', endpoint, options);
    }

    protected async delete(
        endpoint: string,
        options: ApiCallOptions = {}
    ): Promise<APIResponse> {
        return await this.makeRequest('DELETE', endpoint, options);
    }

    private async makeRequest(
        method: string,
        endpoint: string,
        options: ApiCallOptions,
        retryCount = 0
    ): Promise<APIResponse> {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = Date.now();
        const maxRetries = 2;

        try {
            const requestOptions: any = {
                headers: options.headers || {},
                timeout: 30000,
            };

            if (options.data) {
                requestOptions.data = options.data;
            }

            let response: APIResponse;

            if (options.params) {
                const searchParams = new URLSearchParams(options.params);
                const fullUrl = `${url}?${searchParams.toString()}`;
                response = await this.request.fetch(fullUrl, {
                    method,
                    ...requestOptions,
                });
            } else {
                response = await this.request.fetch(url, {
                    method,
                    ...requestOptions,
                });
            }

            const executionTime = Date.now() - startTime;
            const shouldLog = this.logApiCalls && this.dbManager.isReady();

            if (shouldLog) {
                await this.logToDatabase(
                    method,
                    endpoint,
                    options,
                    response,
                    executionTime
                ).catch((err) => {
                    console.error('❌ Failed to log API call:', err.message);
                });
            }

            return response;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            if (
                error instanceof Error &&
                error.message.includes('context or browser has been closed') &&
                retryCount < maxRetries
            ) {
                console.warn(
                    `⚠️  Request failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying...`
                );
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.makeRequest(method, endpoint, options, retryCount + 1);
            }

            console.error(`API call failed: ${method} ${endpoint}`, error);

            if (this.logApiCalls && this.dbManager.isReady()) {
                await this.logToDatabase(
                    method,
                    endpoint,
                    options,
                    null,
                    executionTime
                ).catch(() => {});
            }

            throw error;
        }
    }

    private async logToDatabase(
        method: string,
        endpoint: string,
        options: ApiCallOptions,
        response: APIResponse | null,
        executionTime: number
    ): Promise<void> {
        try {
            let responseBody = null;
            let responseHeaders = null;
            let responseStatus: number | undefined = undefined;

            if (response) {
                try {
                    responseBody = await response.json();
                } catch {
                    try {
                        responseBody = await response.text();
                    } catch {
                        responseBody = 'Unable to parse response';
                    }
                }
                responseHeaders = response.headers();
                responseStatus = response.status();
            }

            await this.dbManager.logApiCall({
                testName: options.testName,
                endpoint,
                method,
                requestHeaders: options.headers,
                requestBody: options.data,
                responseStatus,
                responseHeaders,
                responseBody,
                executionTimeMs: executionTime,
            });
        } catch (error) {
            if (process.env.DEBUG === 'true') {
                console.warn(
                    '⚠️  Failed to log API call:',
                    error instanceof Error ? error.message : error
                );
            }
        }
    }
}