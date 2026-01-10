import { UserBuilder } from '../models/user.model';
import { LoginRequest } from '../models/auth.model';

/**
 * Factory Pattern - Test Data Factory
 * Creates test data objects with Builder pattern integration
 */
export class TestDataFactory {
    static createValidUser() {
        return new UserBuilder()
            .withFirstName('John')
            .withLastName('Doe')
            .withAge(30)
            .withGender('male')
            .withEmail('john.doe@example.com')
            .withPhone('+1234567890')
            .withUsername('johndoe')
            .withPassword('johndoe123')
            .withBirthDate('1993-01-01')
            .withBloodGroup('O+')
            .withHeight(175)
            .withWeight(70)
            .build();
    }

    static createMinimalUser() {
        return new UserBuilder()
            .withFirstName('Jane')
            .withLastName('Smith')
            .withAge(25)
            .buildMinimal();
    }

    static createUserWithMissingRequiredFields() {
        return new UserBuilder()
            .withLastName('Incomplete')
            .withAge(20)
            .buildMinimal();
    }

    static createUserWithInvalidAge() {
        return new UserBuilder()
            .withFirstName('Invalid')
            .withLastName('Age')
            .withAge(-5)
            .build();
    }

    static createUserWithInvalidEmail() {
        return new UserBuilder()
            .withFirstName('Invalid')
            .withLastName('Email')
            .withAge(30)
            .withEmail('invalid-email')
            .build();
    }

    static createValidLoginCredentials(): LoginRequest {
        return {
            username: process.env.API_USERNAME || 'emilys',
            password: process.env.API_PASSWORD || 'emilyspass',
            expiresInMins: 30,
        };
    }

    static createInvalidLoginCredentials(): LoginRequest {
        return {
            username: 'invaliduser',
            password: 'wrongpassword',
        };
    }

    static createLoginWithMissingPassword(): Partial<LoginRequest> {
        return {
            username: 'testuser',
        };
    }
}