import { BaseError } from "@webiny/feature/api";

/**
 * Error when a user already exists in Cognito User Pool
 */
export class CognitoAccountExistsError extends BaseError<{ email: string }> {
    override readonly code = "Cognito/Account/Exists" as const;

    constructor(email: string) {
        super({
            message: `An account with this email already exists in your Cognito User Pool.`,
            data: { email }
        });
    }
}

/**
 * Error when creating a user in Cognito fails
 */
export class CognitoCreateUserError extends BaseError<{ error: Error }> {
    override readonly code = "Cognito/User/Create" as const;

    constructor(error: Error) {
        super({
            message: `Failed to create user in Cognito: ${error.message}`,
            data: { error }
        });
    }
}

/**
 * Error when updating a user in Cognito fails
 */
export class CognitoUpdateUserError extends BaseError<{ error: Error }> {
    override readonly code = "Cognito/User/Update" as const;

    constructor(error: Error) {
        super({
            message: `Failed to update user in Cognito: ${error.message}`,
            data: { error }
        });
    }
}

/**
 * Error when deleting a user from Cognito fails
 */
export class CognitoDeleteUserError extends BaseError<{ error: Error }> {
    override readonly code = "Cognito/User/Delete" as const;

    constructor(error: Error) {
        super({
            message: `Failed to delete user from Cognito: ${error.message}`,
            data: { error }
        });
    }
}

/**
 * Error when an administrator changes the sign-in details of an account that other tenants share
 */
export class CognitoSharedAccountError extends BaseError<{ id: string }> {
    override readonly code = "Cognito/Account/Shared" as const;

    constructor(id: string) {
        super({
            message: `This person's account is also used in other tenants, so only they can change its name, email and password.`,
            data: { id }
        });
    }
}
