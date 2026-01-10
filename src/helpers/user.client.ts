import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiClientBase } from './api-client.base';
import { User } from '../models/user.model';

/**
 * User API Client
 * Handles all user-related API operations
 */
export class UserClient extends ApiClientBase {
    constructor(request: APIRequestContext, baseURL: string) {
        super(request, baseURL);
    }

    async getUsers(options: {
        limit?: number;
        skip?: number;
        testName?: string;
    } = {}): Promise<APIResponse> {
        const params: Record<string, string> = {};

        if (options.limit) params.limit = options.limit.toString();
        if (options.skip) params.skip = options.skip.toString();

        return await this.get('/users', {
            params,
            testName: options.testName,
        });
    }

    async getUserById(userId: number, testName?: string): Promise<APIResponse> {
        return await this.get(`/users/${userId}`, { testName });
    }

    async searchUsers(query: string, testName?: string): Promise<APIResponse> {
        return await this.get('/users/search', {
            params: { q: query },
            testName,
        });
    }

    async createUser(userData: Partial<User>, testName?: string): Promise<APIResponse> {
        return await this.post('/users/add', {
            data: userData,
            testName,
        });
    }

    async updateUserPut(
        userId: number,
        userData: Partial<User>,
        testName?: string
    ): Promise<APIResponse> {
        return await this.put(`/users/${userId}`, {
            data: userData,
            testName,
        });
    }

    async updateUserPatch(
        userId: number,
        userData: Partial<User>,
        testName?: string
    ): Promise<APIResponse> {
        return await this.patch(`/users/${userId}`, {
            data: userData,
            testName,
        });
    }

    async deleteUser(userId: number, testName?: string): Promise<APIResponse> {
        return await this.delete(`/users/${userId}`, { testName });
    }
}