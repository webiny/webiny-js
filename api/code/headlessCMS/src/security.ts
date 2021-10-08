import tenancy from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import security from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import groupAuthorization from "@webiny/api-security/plugins/groupAuthorization";
import anonymousAuthorization from "@webiny/api-security/plugins/anonymousAuthorization";
import cognitoAuthentication from "@webiny/api-security-cognito";

export default ({ documentClient }) => [
    /**
     * Setup Tenancy app.
     */
    tenancy({ storageOperations: tenancyStorageOperations({ documentClient }) }),

    /**
     * Adds a context plugin to setup Security app.
     */
    security({
        storageOperations: securityStorageOperations({ documentClient })
    }),

    /**
     * Perform authentication using the common "Authorization" HTTP header.
     */
    authenticateUsingHttpHeader(),

    /**
     * Authentication plugin for API Keys.
     * API Keys are a standalone entity, and are not connected to users in any way.
     * They identify a project, a 3rd party client, not the user.
     * They are used for programmatic API access, CMS data import/export, etc.
     */
    apiKeyAuthentication({ identityType: "api-key" }),

    /**
     * Cognito authentication plugin.
     * This plugin will verify the JWT token against a provided User Pool.
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
     * Authorization plugin to load permissions for anonymous requests.
     * This allows you to control which API resources can be accessed publicly.
     * The authorization is performed by loading permissions from the "anonymous" user group.
     */
    anonymousAuthorization()
];
