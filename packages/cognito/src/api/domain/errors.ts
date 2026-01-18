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
