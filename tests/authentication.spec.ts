import {test, expect} from '@playwright/test';
import {ApiClientFactory} from '../src/helpers/api-client.factory';
import {TestDataFactory} from '../src/helpers/test-data.factory';
import {LoginResponse} from '../src/models/auth.model';

test.describe('Authentication & Authorization', () => {
    let authClient: any;
    const baseURL = process.env.API_BASE_URL || 'https://dummyjson.com';

    test.beforeEach(async ({request}) => {
        authClient = ApiClientFactory.createAuthClient(request, baseURL);
    });

    test.describe('Login Flow', () => {
        test('@smoke @regression POST /auth/login - Should login with valid credentials', async () => {
            const credentials = TestDataFactory.createValidLoginCredentials();
            const response = await authClient.login(credentials, test.info().title);

            expect(response.status()).toBe(200);

            const loginData: LoginResponse = await response.json();
            expect(loginData).toHaveProperty('accessToken');
            expect(loginData).toHaveProperty('refreshToken');
            expect(loginData).toHaveProperty('id');
            expect(loginData).toHaveProperty('username', credentials.username);
            expect(loginData).toHaveProperty('email');
            expect(loginData).toHaveProperty('firstName');
            expect(loginData).toHaveProperty('lastName');
            expect(typeof loginData.accessToken).toBe('string');
            expect(loginData.accessToken.length).toBeGreaterThan(0);
        });

        test('@regression POST /auth/login - Should reject invalid credentials', async () => {
            const credentials = TestDataFactory.createInvalidLoginCredentials();
            const response = await authClient.login(credentials, test.info().title);

            expect(response.status()).toBe(400);

            const errorData = await response.json();
            expect(errorData).toHaveProperty('message');
        });

        test('@regression POST /auth/login - Should reject missing password', async () => {
            const credentials = TestDataFactory.createLoginWithMissingPassword();
            const response = await authClient.login(credentials as any, test.info().title);

            expect([400, 422]).toContain(response.status());
        });

        test('@regression POST /auth/login - Should reject empty credentials', async () => {
            const credentials = {username: '', password: ''};
            const response = await authClient.login(credentials, test.info().title);

            expect([400, 422]).toContain(response.status());
        });

        test('@regression POST /auth/login - Should handle missing username', async () => {
            const credentials = {username: '', password: 'somepassword'};
            const response = await authClient.login(credentials, test.info().title);

            expect([400, 422]).toContain(response.status());
        });
    });

    test.describe('Token Validation', () => {
        test('@smoke @regression GET /auth/me - Should return user info with valid token', async () => {
            // First, login to get token
            const credentials = TestDataFactory.createValidLoginCredentials();
            const loginResponse = await authClient.login(credentials, 'Login for token');
            const loginData: LoginResponse = await loginResponse.json();

            // Then, get current user info
            const response = await authClient.getCurrentUser(
                loginData.accessToken,
                test.info().title
            );

            expect(response.status()).toBe(200);

            const userData = await response.json();
            expect(userData).toHaveProperty('id');
            expect(userData).toHaveProperty('username', credentials.username);
            expect(userData).toHaveProperty('email');
        });

        test('@regression GET /auth/me - Should reject invalid token', async () => {
            const invalidToken = 'invalid.token.here';
            const response = await authClient.getCurrentUser(
                invalidToken,
                test.info().title
            );
            expect([401, 500]).toContain(response.status());
        });

        test('@regression GET /auth/me - Should reject missing token', async () => {
            const response = await authClient.getCurrentUser('', test.info().title);

            expect([401, 403]).toContain(response.status());
        });
    });

    test.describe('Token Refresh', () => {
        test('@regression POST /auth/refresh - Should refresh token with valid refresh token', async () => {
            // First, login to get refresh token
            const credentials = TestDataFactory.createValidLoginCredentials();
            const loginResponse = await authClient.login(credentials, 'Login for refresh');
            const loginData: LoginResponse = await loginResponse.json();

            // Then, refresh the token
            const response = await authClient.refreshToken(
                loginData.refreshToken,
                test.info().title
            );

            expect(response.status()).toBe(200);

            const refreshData = await response.json();
            expect(refreshData).toHaveProperty('accessToken');
            expect(refreshData).toHaveProperty('refreshToken');
            expect(refreshData.token).not.toBe(loginData.accessToken);
        });

        test('@regression POST /auth/refresh - Should reject invalid refresh token', async () => {
            const invalidRefreshToken = 'invalid.refresh.accessToken';
            const response = await authClient.refreshToken(
                invalidRefreshToken,
                test.info().title
            );

            expect([400, 401, 403]).toContain(response.status());
        });
    });
});