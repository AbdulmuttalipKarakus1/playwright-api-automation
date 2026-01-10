import { APIRequestContext } from '@playwright/test';
import { UserClient } from './user.client';
import { AuthClient } from './auth.client';

/**
 * Factory Pattern - API Client Factory
 * Creates API client instances
 */
export class ApiClientFactory {
    static createUserClient(
        request: APIRequestContext,
        baseURL: string
    ): UserClient {
        return new UserClient(request, baseURL);
    }

    static createAuthClient(
        request: APIRequestContext,
        baseURL: string
    ): AuthClient {
        return new AuthClient(request, baseURL);
    }
}