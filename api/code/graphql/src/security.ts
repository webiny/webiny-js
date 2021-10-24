import{ createTenancyApp, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityApp, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import groupAuthorization from "@webiny/api-security/plugins/groupAuthorization";
import parentTenantGroupAuthorization from "@webiny/api-security/plugins/parentTenantGroupAuthorization";
import cognitoAuthentication from "@webiny/api-security-cognito";
// import * as okta from "@webiny/api-security-okta";
import anonymousAuthorization from "@webiny/api-security/plugins/anonymousAuthorization";

export default ({ documentClient }) => [
    /**
     * Create Tenancy app in the `context`.
     */
    createTenancyApp({
        multiTenancy: true,
        storageOperations: tenancyStorageOperations({ documentClient })
    }),

    /**
     * Expose tenancy GraphQL schema. 
     */
    createTenancyGraphQL(),

    /**
     * Create Security app in the `context`.
     */
    createSecurityApp({
        storageOperations: securityStorageOperations({ documentClient })
    }),

    /**
     * Expose security GraphQL schema. 
     */
    createSecurityGraphQL(),

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

    // /**
    //  * Okta authentication plugin.
    //  */
    // okta.oktaAuthenticator({
    //     clientId: process.env.OKTA_CLIENT_ID,
    //     issuer: process.env.OKTA_ISSUER,
    //     getIdentity({ token }) {
    //         return {
    //             id: token.sub,
    //             type: "admin",
    //             displayName: token.name,
    //             // This part stores JWT claims into SecurityIdentity
    //             group: token.webiny_group
    //         };
    //     }
    // }),
    //
    // /**
    //  * Okta authorization plugin.
    //  */
    // okta.oktaGroupAuthorizer({
    //     identityType: "admin",
    //     getGroupSlug({ security }) {
    //         return security.getIdentity().group;
    //     }
    // }),
    //
    // /**
    //  * Okta identity type.
    //  * This plugin adds a GraphQL type that implements the SecurityIdentity interface.
    //  * Every identity type must have a corresponding GraphQL type. You can further extend
    //  * this type by adding `GraphQLSchemaPlugin` plugins.
    //  */
    // okta.oktaIdentityType({
    //     name: "OktaIdentity",
    //     identityType: "admin"
    // }),

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
