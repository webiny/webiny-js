import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createOkta } from "@webiny/api-security-okta";
import anonymousAuthorization from "@webiny/api-security/plugins/anonymousAuthorization";
import tenantLinkAuthorization from "@webiny/api-security/plugins/tenantLinkAuthorization";
import createAdminUsersApp from "@webiny/api-admin-users";
import { createStorageOperations as createAdminUsersStorageOperations } from "@webiny/api-admin-users-so-ddb";
import { Context } from "./types";

export default ({ documentClient }: { documentClient: DynamoDBDocument }) => [
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
    createSecurityGraphQL({
        async getDefaultTenant(context) {
            return context.tenancy.getRootTenant();
        }
    }),

    /**
     * Create Admin Users app.
     */
    createAdminUsersApp({
        storageOperations: createAdminUsersStorageOperations({ documentClient })
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
     * Configure Okta authentication and authorization.
     */
    createOkta<Context & { pavel: string }>({
        /**
         * `issuer` is required for token verification.
         */
        issuer: String(process.env.OKTA_ISSUER),
        /**
         * Construct the identity object and map token claims to arbitrary identity properties.
         */
        getIdentity({ token }) {
            return {
                id: token["sub"],
                type: "admin",
                displayName: token["name"],
                group: "full-access"
            };
        }
    }),

    /**
     * Authorization plugin to fetch permissions for a verified API key.
     * The "identityType" must match the authentication plugin used to load the identity.
     */
    apiKeyAuthorization({ identityType: "api-key" }),

    /**
     * Authorization plugin to fetch permissions from a security role or team associated with the identity.
     */
    tenantLinkAuthorization({ identityType: "admin" }),

    /**
     * Authorization plugin to fetch permissions from the parent tenant.
     */
    tenantLinkAuthorization({ identityType: "admin", parent: true }),

    /**
     * Authorization plugin to load permissions for anonymous requests.
     * This allows you to control which API resources can be accessed publicly.
     * The authorization is performed by loading permissions from the "anonymous" user group.
     */
    anonymousAuthorization()
];
