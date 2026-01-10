import { test, expect } from '@playwright/test';
import { ApiClientFactory } from '../src/helpers/api-client.factory';
import { TestDataFactory } from '../src/helpers/test-data.factory';
import { UsersResponse, User } from '../src/models/user.model';

test.describe('User CRUD Operations', () => {
    let userClient: any;
    const baseURL = process.env.API_BASE_URL || 'https://dummyjson.com';

    test.beforeEach(async ({ request }) => {
        userClient = ApiClientFactory.createUserClient(request, baseURL);
    });

    test.describe('User Listing', () => {
        test('@smoke @regression GET /users - Should return list of users', async () => {
            const response = await userClient.getUsers({ testName: test.info().title });

            expect(response.status()).toBe(200);

            const data: UsersResponse = await response.json();
            expect(data).toHaveProperty('users');
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('skip');
            expect(data).toHaveProperty('limit');
            expect(Array.isArray(data.users)).toBeTruthy();
            expect(data.users.length).toBeGreaterThan(0);
        });

        test('@regression GET /users - Should support pagination with limit', async () => {
            const limit = 5;
            const response = await userClient.getUsers({
                limit,
                testName: test.info().title,
            });

            expect(response.status()).toBe(200);

            const data: UsersResponse = await response.json();
            expect(data.users.length).toBeLessThanOrEqual(limit);
            expect(data.limit).toBe(limit);
        });

        test('@regression GET /users - Should support pagination with skip', async () => {
            const skip = 10;
            const response = await userClient.getUsers({
                skip,
                testName: test.info().title,
            });

            expect(response.status()).toBe(200);

            const data: UsersResponse = await response.json();
            expect(data.skip).toBe(skip);
        });

        test('@regression GET /users - Should support combined pagination', async () => {
            const limit = 3;
            const skip = 5;
            const response = await userClient.getUsers({
                limit,
                skip,
                testName: test.info().title,
            });

            expect(response.status()).toBe(200);

            const data: UsersResponse = await response.json();
            expect(data.users.length).toBeLessThanOrEqual(limit);
            expect(data.skip).toBe(skip);
            expect(data.limit).toBe(limit);
        });
    });

    test.describe('Single User Query', () => {
        test('@smoke @regression GET /users/:id - Should return single user', async () => {
            const userId = 1;
            const response = await userClient.getUserById(userId, test.info().title);

            expect(response.status()).toBe(200);

            const user: User = await response.json();
            expect(user).toHaveProperty('id', userId);
            expect(user).toHaveProperty('firstName');
            expect(user).toHaveProperty('lastName');
            expect(user).toHaveProperty('email');
        });

        test('@regression GET /users/:id - Should return 404 for non-existent user', async () => {
            const userId = 99999;
            const response = await userClient.getUserById(userId, test.info().title);

            expect(response.status()).toBe(404);
        });
    });

    test.describe('User Creation', () => {
        test('@smoke @regression POST /users/add - Should create user with valid data', async () => {
            const userData = TestDataFactory.createValidUser();
            const response = await userClient.createUser(userData, test.info().title);

            expect(response.status()).toBe(201);

            const createdUser: User = await response.json();
            expect(createdUser).toHaveProperty('id');
            expect(createdUser.firstName).toBe(userData.firstName);
            expect(createdUser.lastName).toBe(userData.lastName);
            expect(createdUser.age).toBe(userData.age);
        });

        test('@regression POST /users/add - Should create user with minimal data', async () => {
            const userData = TestDataFactory.createMinimalUser();
            const response = await userClient.createUser(userData, test.info().title);

            expect(response.status()).toBe(201);

            const createdUser = await response.json();
            expect(createdUser).toHaveProperty('id');
        });

        test('@regression POST /users/add - Should handle missing required fields', async () => {
            const userData = TestDataFactory.createUserWithMissingRequiredFields();
            const response = await userClient.createUser(userData, test.info().title);

            // DummyJSON accepts incomplete data, but we verify response
            expect([201, 400, 422]).toContain(response.status());
        });

        test('@regression POST /users/add - Should handle invalid age value', async () => {
            const userData = TestDataFactory.createUserWithInvalidAge();
            const response = await userClient.createUser(userData, test.info().title);

            // DummyJSON may accept or reject invalid data
            expect([201, 400, 422]).toContain(response.status());
        });

        test('@regression POST /users/add - Should handle invalid email format', async () => {
            const userData = TestDataFactory.createUserWithInvalidEmail();
            const response = await userClient.createUser(userData, test.info().title);

            // DummyJSON may accept or reject invalid data
            expect([201, 400, 422]).toContain(response.status());
        });

        test('@regression POST /users/add - Should handle empty request body', async () => {
            const response = await userClient.createUser({}, test.info().title);

            expect([201, 400, 422]).toContain(response.status());
        });

        test('@regression POST /users/add - Should handle null values', async () => {
            const userData = {
                firstName: null,
                lastName: null,
                age: null,
            };
            const response = await userClient.createUser(userData, test.info().title);

            expect([201, 400, 422]).toContain(response.status());
        });
    });

    test.describe('User Update - PUT', () => {
        test('@regression PUT /users/:id - Should update user completely', async () => {
            const userId = 1;
            const updateData = TestDataFactory.createValidUser();
            const response = await userClient.updateUserPut(
                userId,
                updateData,
                test.info().title
            );

            expect(response.status()).toBe(200);

            const updatedUser: User = await response.json();
            expect(updatedUser.firstName).toBe(updateData.firstName);
            expect(updatedUser.lastName).toBe(updateData.lastName);
        });

        test('@regression PUT /users/:id - Should return 404 for non-existent user', async () => {
            const userId = 99999;
            const updateData = TestDataFactory.createValidUser();
            const response = await userClient.updateUserPut(
                userId,
                updateData,
                test.info().title
            );

            expect(response.status()).toBe(404);
        });
    });

    test.describe('User Update - PATCH', () => {
        test('@smoke @regression PATCH /users/:id - Should update user partially', async () => {
            const userId = 1;
            const updateData = { firstName: 'UpdatedName' };
            const response = await userClient.updateUserPatch(
                userId,
                updateData,
                test.info().title
            );

            expect(response.status()).toBe(200);

            const updatedUser: User = await response.json();
            expect(updatedUser.firstName).toBe(updateData.firstName);
        });

        test('@regression PATCH /users/:id - Should update multiple fields', async () => {
            const userId = 1;
            const updateData = {
                firstName: 'NewFirst',
                lastName: 'NewLast',
                age: 35,
            };
            const response = await userClient.updateUserPatch(
                userId,
                updateData,
                test.info().title
            );

            expect(response.status()).toBe(200);

            const updatedUser: User = await response.json();
            expect(updatedUser.firstName).toBe(updateData.firstName);
            expect(updatedUser.lastName).toBe(updateData.lastName);
            expect(updatedUser.age).toBe(updateData.age);
        });

        test('@regression PATCH /users/:id - Should return 404 for non-existent user', async () => {
            const userId = 99999;
            const updateData = { firstName: 'Test' };
            const response = await userClient.updateUserPatch(
                userId,
                updateData,
                test.info().title
            );

            expect(response.status()).toBe(404);
        });
    });

    test.describe('User Deletion', () => {
        test('@smoke @regression DELETE /users/:id - Should delete user', async () => {
            const userId = 1;
            const response = await userClient.deleteUser(userId, test.info().title);

            expect(response.status()).toBe(200);

            const deletedUser = await response.json();
            expect(deletedUser).toHaveProperty('id', userId);
            expect(deletedUser).toHaveProperty('isDeleted', true);
            expect(deletedUser).toHaveProperty('deletedOn');
        });

        test('@regression DELETE /users/:id - Should return 404 for non-existent user', async () => {
            const userId = 99999;
            const response = await userClient.deleteUser(userId, test.info().title);

            expect(response.status()).toBe(404);
        });
    });
});