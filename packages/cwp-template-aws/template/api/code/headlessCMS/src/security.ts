import tenancy from "@webiny/api-security-tenancy";
import authenticator from "@webiny/api-security/authenticator";
import personalAccessTokenAuthentication from "@webiny/api-security-tenancy/authentication/personalAccessToken";
import apiKeyAuthentication from "@webiny/api-security-tenancy/authentication/apiKey";
import userAuthorization from "@webiny/api-security-tenancy/authorization/user";
import apiKeyAuthorization from "@webiny/api-security-tenancy/authorization/apiKey";
import anonymousAuthorization from "@webiny/api-security-tenancy/authorization/anonymous";
import cognitoAuthentication from "@webiny/api-plugin-security-cognito/authentication";
import cognitoIdentityProvider from "@webiny/api-plugin-security-cognito/identityProvider";

export default () => [
    /**
     * Security Tenancy API (context, users, groups, tenant links).
     * This will setup the complete GraphQL schema to manage users, groups, access tokens,
     * and provide you with a TenancyContext to access current Tenant data and DB operations.
     */
    tenancy(),

    /**
     * Cognito IDP plugin (hooks for User CRUD methods).
     * This plugin will perform CRUD operations on Cognito when you do something with the user
     * via the UI or API. It's mostly to push changes to Cognito when they happen in your app.
     *
     * It also extends the GraphQL schema with things like "password", which we don't handle
     * natively in our security, but Cognito will handle it for us.
     */
    cognitoIdentityProvider({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID
    }),

    /**
     * Adds a context plugin to process `security-authentication` plugins.
     * NOTE: this has to be registered *after* the "tenancy" plugins
     * as some of the authentication plugins rely on tenancy context.
     */
    authenticator(),

    /**
     * Authentication plugin for Personal Access Tokens.
     * PATs are directly linked to Users. We consider a token to be valid, if we manage to load
     * a User who owns this particular token. The "identityType" is important, and it has to match
     * the "identityType" configured in the authorization plugin later in this file.
     */
    personalAccessTokenAuthentication({ identityType: "admin" }),

    /**
     * Authentication plugin for API Keys.
     * API Keys are a standalone entity, and are not connected to users in any way.
     * They identify a project, a 3rd party client, not the user.
     * They are used for programmatic API access, CMS data import/export, etc.
     */
    apiKeyAuthentication({ identityType: "api-key" }),

    /**
     * Cognito authentication plugin.
     * This plugin will verify the authorization token against a provided User Pool.
     */
    cognitoAuthentication({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        identityType: "admin"
    }),

    /**
     * Authorization plugin to fetch permissions for a verified API key.
     * The "identityType" must match the authentication plugin used to load the identity.
     */
    apiKeyAuthorization({ identityType: "api-key" }),

    /**
     * Authorization plugin to load user permissions for requested tenant.
     * The authorization will only be performed on identities whose "type" matches
     * the provided "identityType".
     */
    userAuthorization({ identityType: "admin" }),

    /**
     * Authorization plugin to load permissions for anonymous requests.
     * This allows you to control which API resources can be accessed publicly.
     * The authorization is performed by loading permissions from the "anonymous" user group.
     */
    anonymousAuthorization()
];
