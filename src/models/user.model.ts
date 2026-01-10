export interface Address {
    address: string;
    city: string;
    state: string;
    stateCode: string;
    postalCode: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    country: string;
}

export interface Bank {
    cardExpire: string;
    cardNumber: string;
    cardType: string;
    currency: string;
    iban: string;
}

export interface Company {
    department: string;
    name: string;
    title: string;
    address: Address;
}

export interface Crypto {
    coin: string;
    wallet: string;
    network: string;
}

export interface Hair {
    color: string;
    type: string;
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    maidenName: string;
    age: number;
    gender: string;
    email: string;
    phone: string;
    username: string;
    password: string;
    birthDate: string;
    image: string;
    bloodGroup: string;
    height: number;
    weight: number;
    eyeColor: string;
    hair: Hair;
    ip: string;
    address: Address;
    macAddress: string;
    university: string;
    bank: Bank;
    company: Company;
    ein: string;
    ssn: string;
    userAgent: string;
    crypto: Crypto;
    role: string;
}

export interface UsersResponse {
    users: User[];
    total: number;
    skip: number;
    limit: number;
}

/**
 * Builder Pattern - User Builder
 * Provides fluent interface for creating User objects
 */
export class UserBuilder {
    private user: Partial<User> = {};

    withFirstName(firstName: string): UserBuilder {
        this.user.firstName = firstName;
        return this;
    }

    withLastName(lastName: string): UserBuilder {
        this.user.lastName = lastName;
        return this;
    }

    withAge(age: number): UserBuilder {
        this.user.age = age;
        return this;
    }

    withGender(gender: string): UserBuilder {
        this.user.gender = gender;
        return this;
    }

    withEmail(email: string): UserBuilder {
        this.user.email = email;
        return this;
    }

    withPhone(phone: string): UserBuilder {
        this.user.phone = phone;
        return this;
    }

    withUsername(username: string): UserBuilder {
        this.user.username = username;
        return this;
    }

    withPassword(password: string): UserBuilder {
        this.user.password = password;
        return this;
    }

    withBirthDate(birthDate: string): UserBuilder {
        this.user.birthDate = birthDate;
        return this;
    }

    withImage(image: string): UserBuilder {
        this.user.image = image;
        return this;
    }

    withBloodGroup(bloodGroup: string): UserBuilder {
        this.user.bloodGroup = bloodGroup;
        return this;
    }

    withHeight(height: number): UserBuilder {
        this.user.height = height;
        return this;
    }

    withWeight(weight: number): UserBuilder {
        this.user.weight = weight;
        return this;
    }

    build(): Partial<User> {
        return this.user;
    }

    buildMinimal(): Partial<User> {
        return {
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            age: this.user.age,
        };
    }
}