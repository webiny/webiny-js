import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import groupAuthorization from "@webiny/api-security/plugins/groupAuthorization";
import parentTenantGroupAuthorization from "@webiny/api-security/plugins/parentTenantGroupAuthorization";
import cognitoAuthentication from "@webiny/api-security-cognito";
import anonymousAuthorization from "@webiny/api-security/plugins/anonymousAuthorization";
import createAdminUsersApp from "@webiny/api-admin-users-cognito";
import { syncWithCognito } from "@webiny/api-admin-users-cognito/syncWithCognito";
import { createStorageOperations as createAdminUsersStorageOperations } from "@webiny/api-admin-users-cognito-so-ddb";

export default ({ documentClient }) => [
    /**
     * Create Tenancy app in the `context`.
     */
    createTenancyContext({
        storageOperations: tenancyStorageOperations({ documentClient })
    }),

    /**
     * Expose tenancy GraphQL schema.
     */
    createTenancyGraphQL(),

    /**
     * Create Security app in the `context`.
     */
    createSecurityContext({
        storageOperations: securityStorageOperations({ documentClient })
    }),

    /**
     * Expose security GraphQL schema.
     */
    createSecurityGraphQL(),

    /**
     * Create Admin Users app.
     */
    createAdminUsersApp({
        storageOperations: createAdminUsersStorageOperations({ documentClient })
    }),

    /**
     * Sync Admin Users with Cognito User Pool.
     */
    syncWithCognito({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID
    }),

    /**
     * Perform authentication using the common "Authorization" HTTP header.
     * This will fetch the value of the header, and execute the authentication process.
     */
    authenticateUsingHttpHeader(),

    /**
     * API Key authenticator.
     * API Keys are a standalone entity, and are not connected to users in any way.
     * They identify a project, a 3rd party client, not a particular user.
     * They are used for programmatic API access, CMS data import/export, etc.
     */
    apiKeyAuthentication({ identityType: "api-key" }),

    /**
     * Cognito authentication plugin.
     * This plugin will verify the JWT token against the provided User Pool.
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
     * Authorization plugin to fetch permissions from a security group associated with the identity.
     */
    groupAuthorization({ identityType: "admin" }),

    /**
     * Authorization plugin to fetch permissions from the parent tenant.
     */
    parentTenantGroupAuthorization({ identityType: "admin" }),

    /**
     * Authorization plugin to load permissions for anonymous requests.
     * This allows you to control which API resources can be accessed publicly.
     * The authorization is performed by loading permissions from the "anonymous" user group.
     */
    anonymousAuthorization()
];
