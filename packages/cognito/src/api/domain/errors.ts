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
 * Error when creating a user whose email already has an account in another tenant:
 * that account has to be linked to this tenant instead
 */
export class CognitoAccountInOtherTenantError extends BaseError<{ email: string }> {
    override readonly code = "Cognito/Account/ExistsInOtherTenant" as const;

    constructor(email: string) {
        super({
            message: `This email already has an account in another tenant. Link it instead.`,
            data: { email }
        });
    }
}

/**
 * Error when linking an email that has no account in the Cognito User Pool
 */
export class CognitoAccountNotFoundError extends BaseError<{ email: string }> {
    override readonly code = "Cognito/Account/NotFound" as const;

    constructor(email: string) {
        super({
            message: `There's no account with this email.`,
            data: { email }
        });
    }
}

/**
 * Error when loading an account from the Cognito User Pool fails
 */
export class CognitoGetUserError extends BaseError<{ error: Error }> {
    override readonly code = "Cognito/User/Get" as const;

    constructor(error: Error) {
        super({
            message: `Failed to load the account from Cognito: ${error.message}`,
            data: { error }
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
 * Error when updating a user fails and some tenants' records can't be put back,
 * so those records no longer match the Cognito account
 */
export class CognitoUpdateRollbackError extends BaseError<{
    error: Error;
    tenants: string[];
    rollbackErrors: Error[];
}> {
    override readonly code = "Cognito/User/UpdateRollback" as const;

    constructor(error: Error, tenants: string[], rollbackErrors: Error[]) {
        super({
            message: `Failed to update user: ${error.message}. The user's records in tenants ${tenants.join(", ")} could not be restored and no longer match the Cognito account.`,
            data: { error, tenants, rollbackErrors }
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
