import { createAbstraction } from "@webiny/feature/api";
import type { BaseUserAttributes } from "@webiny/api-core/types/users.js";

export interface AttributeGetter {
    (user: BaseUserAttributes): string;
}

export interface ICognitoConfig {
    region: string;
    userPoolId: string;
}

export const CognitoConfig = createAbstraction<ICognitoConfig>("CognitoConfig");

export namespace CognitoConfig {
    export type Interface = ICognitoConfig;
}

// Cognito Service

export interface CognitoUserAttributes {
    givenName?: string;
    familyName?: string;
    preferredUsername: string;
    email: string;
    customId: string;
}

export interface ICognitoService {
    /**
     * Check if a user exists in Cognito User Pool
     */
    userExists(username: string): Promise<boolean>;

    /**
     * Create a new user in Cognito User Pool
     */
    createUser(params: {
        username: string;
        temporaryPassword: string;
        attributes: CognitoUserAttributes;
    }): Promise<void>;

    /**
     * Set email as verified for a user
     */
    setEmailVerified(username: string): Promise<void>;

    /**
     * Set a permanent password for a user
     */
    setPermanentPassword(username: string, password: string): Promise<void>;

    /**
     * Update user attributes in Cognito
     */
    updateUserAttributes(username: string, attributes: Record<string, string>): Promise<void>;

    /**
     * Delete a user from Cognito User Pool
     */
    deleteUser(username: string): Promise<void>;
}

export const CognitoService = createAbstraction<ICognitoService>("CognitoService");
export namespace CognitoService {
    export type Interface = ICognitoService;
    export type UserAttributes = CognitoUserAttributes;
}
