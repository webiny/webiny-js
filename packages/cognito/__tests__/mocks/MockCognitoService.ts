import type { CognitoService } from "~/api/features/CognitoService/index.js";

export class MockCognitoService implements CognitoService.Interface {
    private users = new Map<string, any>();
    private shouldThrowError = false;
    private errorToThrow: Error | null = null;

    setShouldThrowError(error: Error): void {
        this.shouldThrowError = true;
        this.errorToThrow = error;
    }

    clearError(): void {
        this.shouldThrowError = false;
        this.errorToThrow = null;
    }

    reset(): void {
        this.users.clear();
        this.clearError();
    }

    async userExists(username: string): Promise<boolean> {
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        return this.users.has(username);
    }

    async getUser(username: string): Promise<CognitoService.User | null> {
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        const user = this.users.get(username);
        if (!user) {
            return null;
        }
        return {
            username,
            attributes: {
                email: user.attributes.email,
                given_name: user.attributes.givenName ?? "",
                family_name: user.attributes.familyName ?? "",
                "custom:id": user.attributes.customId
            }
        };
    }

    async createUser(params: {
        username: string;
        temporaryPassword: string;
        attributes: CognitoService.UserAttributes;
    }): Promise<void> {
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        this.users.set(params.username, params);
    }

    async setEmailVerified(username: string): Promise<void> {
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        const user = this.users.get(username);
        if (user) {
            user.emailVerified = true;
        }
    }

    async setPermanentPassword(username: string, password: string): Promise<void> {
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        const user = this.users.get(username);
        if (user) {
            user.permanentPassword = password;
        }
    }

    async updateUserAttributes(
        username: string,
        attributes: Record<string, string>
    ): Promise<void> {
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        const user = this.users.get(username);
        if (user) {
            user.attributes = { ...user.attributes, ...attributes };
        }
    }

    async deleteUser(username: string): Promise<void> {
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        this.users.delete(username);
    }
}
