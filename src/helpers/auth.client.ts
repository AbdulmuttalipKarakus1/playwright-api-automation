import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiClientBase } from './api-client.base';
import { LoginRequest } from '../models/auth.model';

/**
 * Authentication API Client
 * Handles authentication-related operations
 */
export class AuthClient extends ApiClientBase {
    constructor(request: APIRequestContext, baseURL: string) {
        super(request, baseURL);
    }

    async login(credentials: LoginRequest, testName?: string): Promise<APIResponse> {
        return await this.post('/auth/login', {
            data: credentials,
            testName,
        });
    }

    async getCurrentUser(token: string, testName?: string): Promise<APIResponse> {
        return await this.get('/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            testName,
        });
    }

    async refreshToken(refreshToken: string, testName?: string): Promise<APIResponse> {
        return await this.post('/auth/refresh', {
            data: { refreshToken },
            testName,
        });
    }
}