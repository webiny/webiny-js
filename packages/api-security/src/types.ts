import { GraphQLContext, Plugin } from "@webiny/api/types";

export type SecurityPlugin = Plugin & {
    type: "graphql-security";
    authenticate(context: any): Promise<void>;
};

export type JWTPayload = { [key: string]: any };

export type SecurityAuthenticationProviderPlugin = Plugin & {
    type: "security-authentication-provider";
    // Load Webiny User using idToken
    userFromToken?: (
        { idToken: string, SecurityUser: any },
        context: GraphQLContext
    ) => Promise<any>;
    // Get authentication provider user data (eg: Cognito user data)
    getUser?: ({ email: string }) => Promise<any>;
    // Create user in a 3rd party authentication provider service
    createUser?: ({ data, user, permanent: boolean }) => Promise<any>;
    // Update user in a 3rd party authentication provider service
    updateUser?: ({ data, user }) => Promise<any>;
    // Delete user from a 3rd party authentication provider service
    deleteUser?: ({ user }) => Promise<any>;
    // Count users in a 3rd party authentication provider service
    countUsers?: () => Promise<number>;
    // Create a payload that will be encoded in the JWT token
    createJWTPayload?: (
        { defaultPayload }: JWTPayload,
        context: GraphQLContext
    ) => Promise<JWTPayload>;
};
