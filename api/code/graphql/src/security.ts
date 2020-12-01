import tenancy from "@webiny/api-security-tenancy";
import authenticator from "@webiny/api-security/authenticator";
import personalAccessTokenAuthentication from "@webiny/api-security-tenancy/authentication/personalAccessToken";
import accessTokenAuthentication from "@webiny/api-security-tenancy/authentication/accessToken";
import userAuthorization from "@webiny/api-security-tenancy/authorization/user";
import accessTokenAuthorization from "@webiny/api-security-tenancy/authorization/accessToken";
import anonymousAuthorization from "@webiny/api-security-tenancy/authorization/anonymous";
import cognitoAuthentication from "@webiny/api-plugin-security-cognito/authentication";
import cognitoIdentityProvider from "@webiny/api-plugin-security-cognito/identityProvider";

export default () => [
    /**
     * Security Tenancy API (context, users, groups, tenant links).
     */
    tenancy(),

    /**
     * Cognito IDP plugin (CRUD methods for users)
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
     * Authentication plugin for Access Tokens.
     * Access Tokens are a standalone entity, and are not connected to users in any way.
     * They allow you to have permanent tokens which are authorized using the same
     * set of permissions a regular admin user is.
     * They are used for programmatic API access, CMS data import/export, etc.
     */
    accessTokenAuthentication({ identityType: "access-token" }),

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
     * Authorization plugin to load permissions for a verified access token.
     */
    accessTokenAuthorization({ identityType: "access-token" }),

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
