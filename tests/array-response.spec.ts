import { test, expect } from '@playwright/test';
import { ApiClientFactory } from '../src/helpers/api-client.factory';
import { UsersResponse, User } from '../src/models/user.model';

test.describe('Array Response Validation', () => {
    let userClient: any;
    const baseURL = process.env.API_BASE_URL || 'https://dummyjson.com';

    test.beforeEach(async ({ request }) => {
        userClient = ApiClientFactory.createUserClient(request, baseURL);
    });

    test.describe('Array Data Extraction', () => {
        test('@smoke @regression Should extract specific user from users array', async () => {
            const response = await userClient.getUsers({ testName: test.info().title });
            expect(response.status()).toBe(200);

            const data: UsersResponse = await response.json();

            // Verify array response structure
            expect(Array.isArray(data.users)).toBeTruthy();
            expect(data.users.length).toBeGreaterThan(0);

            // Extract first user
            const firstUser = data.users[0];
            expect(firstUser).toHaveProperty('id');
            expect(firstUser).toHaveProperty('firstName');
            expect(firstUser).toHaveProperty('lastName');
            expect(firstUser).toHaveProperty('email');
        });

        test('@regression Should find user by specific criteria in array', async () => {
            const response = await userClient.getUsers({ testName: test.info().title });
            const data: UsersResponse = await response.json();

            // Find user with specific firstName
            const userWithSpecificName = data.users.find(
                (user: User) => user.firstName === 'Emily'
            );

            expect(userWithSpecificName).toBeDefined();
            if (userWithSpecificName) {
                expect(userWithSpecificName.firstName).toBe('Emily');
                expect(userWithSpecificName).toHaveProperty('id');
                expect(userWithSpecificName).toHaveProperty('email');
            }
        });

        test('@regression Should filter users by age range', async () => {
            const response = await userClient.getUsers({
                limit: 30,
                testName: test.info().title
            });
            const data: UsersResponse = await response.json();

            const usersInAgeRange = data.users.filter(
                (user: User) => user.age >= 25 && user.age <= 35
            );

            expect(usersInAgeRange.length).toBeGreaterThan(0);
            usersInAgeRange.forEach((user: User) => {
                expect(user.age).toBeGreaterThanOrEqual(25);
                expect(user.age).toBeLessThanOrEqual(35);
            });
        });

        test('@regression Should map and extract specific fields from array', async () => {
            const response = await userClient.getUsers({
                limit: 10,
                testName: test.info().title
            });
            const data: UsersResponse = await response.json();

            const userEmails = data.users.map((user: User) => user.email);

            expect(userEmails.length).toBe(data.users.length);
            userEmails.forEach((email: string) => {
                expect(email).toContain('@');
                expect(typeof email).toBe('string');
            });
        });

        test('@regression Should validate all users have required fields', async () => {
            const response = await userClient.getUsers({
                limit: 15,
                testName: test.info().title
            });
            const data: UsersResponse = await response.json();

            const requiredFields = ['id', 'firstName', 'lastName', 'email', 'age'];

            data.users.forEach((user: User) => {
                requiredFields.forEach((field) => {
                    expect(user).toHaveProperty(field);
                    expect(user[field as keyof User]).toBeDefined();
                });
            });
        });

        test('@regression Should group users by gender', async () => {
            const response = await userClient.getUsers({
                limit: 20,
                testName: test.info().title
            });
            const data: UsersResponse = await response.json();

            const maleUsers = data.users.filter((user: User) => user.gender === 'male');
            const femaleUsers = data.users.filter((user: User) => user.gender === 'female');

            expect(maleUsers.length + femaleUsers.length).toBe(data.users.length);

            maleUsers.forEach((user: User) => {
                expect(user.gender).toBe('male');
            });

            femaleUsers.forEach((user: User) => {
                expect(user.gender).toBe('female');
            });
        });

        test('@regression Should find user with highest age', async () => {
            const response = await userClient.getUsers({
                limit: 30,
                testName: test.info().title
            });
            const data: UsersResponse = await response.json();

            const oldestUser = data.users.reduce((oldest: User, current: User) => {
                return current.age > oldest.age ? current : oldest;
            }, data.users[0]);

            expect(oldestUser).toBeDefined();
            expect(oldestUser.age).toBeGreaterThan(0);

            const allOlderOrEqual = data.users.every(
                (user: User) => user.age <= oldestUser.age
            );
            expect(allOlderOrEqual).toBeTruthy();
        });

        test('@regression Should validate nested object structure in array items', async () => {
            const response = await userClient.getUsers({ testName: test.info().title });
            const data: UsersResponse = await response.json();

            const firstUser = data.users[0];

            // Validate nested address object
            expect(firstUser).toHaveProperty('address');
            expect(firstUser.address).toHaveProperty('address');
            expect(firstUser.address).toHaveProperty('city');
            expect(firstUser.address).toHaveProperty('coordinates');

            // Validate nested coordinates object
            expect(firstUser.address.coordinates).toHaveProperty('lat');
            expect(firstUser.address.coordinates).toHaveProperty('lng');
            expect(typeof firstUser.address.coordinates.lat).toBe('number');
            expect(typeof firstUser.address.coordinates.lng).toBe('number');
        });

        test('@regression Should search users and validate search results', async () => {
            const searchQuery = 'John';
            const response = await userClient.searchUsers(searchQuery, test.info().title);

            expect(response.status()).toBe(200);

            const data: UsersResponse = await response.json();
            expect(Array.isArray(data.users)).toBeTruthy();

            // If results found, verify they match search criteria
            if (data.users.length > 0) {
                data.users.forEach((user: User) => {
                    const matchesSearch =
                        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.lastName.toLowerCase().includes(searchQuery.toLowerCase());
                    expect(matchesSearch).toBeTruthy();
                });
            }
        });

        test('@regression Should validate pagination metadata with array response', async () => {
            const limit = 5;
            const skip = 10;
            const response = await userClient.getUsers({
                limit,
                skip,
                testName: test.info().title
            });
            const data: UsersResponse = await response.json();

            // Validate metadata
            expect(data.total).toBeGreaterThan(0);
            expect(data.skip).toBe(skip);
            expect(data.limit).toBe(limit);

            // Validate array length respects limit
            expect(data.users.length).toBeLessThanOrEqual(limit);

            // Validate we can calculate remaining items
            const remainingItems = data.total - skip;
            const expectedLength = Math.min(limit, remainingItems);
            expect(data.users.length).toBe(expectedLength);
        });
    });
});