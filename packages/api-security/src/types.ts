import { Context, Plugin } from "@webiny/graphql/types";

export type SecurityIdentity = {
    id: string;
    displayName: string;
} & { [key: string]: any };

export type SecurityPlugin = Plugin & {
    type: "security";
    authenticate(context: any): Promise<null> | Promise<SecurityIdentity>;
};

export type JWTPayload = { [key: string]: any };

export type SecurityAuthenticationProviderPlugin = Plugin & {
    type: "security-authentication-provider";
    // Load Webiny User using idToken
    userFromToken?: ({ idToken: string, SecurityUser: any }, context: Context) => Promise<any>;
    // Get authentication provider user data (eg: Cognito user data)
    getUser?: (params: { email: string }) => Promise<any>;
    // Create user in a 3rd party authentication provider service
    createUser?: (params: { data; user; permanent?: boolean }, context: Context) => Promise<any>;
    // Update user in a 3rd party authentication provider service
    updateUser?: (params: { data; user }, context: Context) => Promise<any>;
    // Delete user from a 3rd party authentication provider service
    deleteUser?: (params: { user }) => Promise<any>;
    // Count users in a 3rd party authentication provider service
    countUsers?: () => Promise<number>;
    // Create a payload that will be encoded in the JWT token
    createJWTPayload?: ({ defaultPayload }: JWTPayload, context: Context) => Promise<JWTPayload>;
};
