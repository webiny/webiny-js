import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import anonymousAuthorization from "@webiny/api-security/plugins/anonymousAuthorization";
import createAdminUsersApp from "@webiny/api-admin-users";
import { createOkta } from "@webiny/api-security-okta";
import { createStorageOperations as createAdminUsersStorageOperations } from "@webiny/api-admin-users-so-ddb";

export default ({ documentClient }: { documentClient: DocumentClient }) => [
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
        /**
         * For Okta, this must be set to `false`, as we don't have links in the database.
         */
        verifyIdentityToTenantLink: false,
        storageOperations: securityStorageOperations({ documentClient })
    }),

    /**
     * Expose security GraphQL schema.
     */
    createSecurityGraphQL({
        /**
         * For Okta, we must provide custom logic to determine the "default" tenant for current identity.
         * Since we're not linking identities to tenants via DB records, we can just return the current tenant.
         */
        async getDefaultTenant(context) {
            return context.tenancy.getCurrentTenant();
        }
    }),

    /**
     * Perform authentication using the common "Authorization" HTTP header.
     * This will fetch the value of the header, and execute the authentication process.
     */
    authenticateUsingHttpHeader(),

    /**
     * Create Admin Users app.
     */
    createAdminUsersApp({
        storageOperations: createAdminUsersStorageOperations({ documentClient })
    }),

    /**
     * Configure Okta authentication and authorization.
     */
    createOkta({
        /**
         * `issuer` is required for token verification.
         */
        issuer: "https://dev-844500.oktapreview.com/oauth2/default",
        /**
         * Construct the identity object and map token claims to arbitrary identity properties.
         */
        getIdentity({ token }) {
            return {
                id: token.sub,
                type: "admin",
                displayName: token.name,
                group: token.webiny_group
            };
        },
        /**
         * Get the slug of a security role to fetch permissions from.
         */
        getGroupSlug(context) {
            return context.security.getIdentity().group;
        }
    }),

    /**
     * API Key authenticator.
     * API Keys are a standalone entity, and are not connected to users in any way.
     * They identify a project, a 3rd party client, not a particular user.
     * They are used for programmatic API access, CMS data import/export, etc.
     */
    apiKeyAuthentication({ identityType: "api-key" }),

    /**
     * Authorization plugin to fetch permissions for a verified API key.
     * The "identityType" must match the authentication plugin used to load the identity.
     */
    apiKeyAuthorization({ identityType: "api-key" }),

    /**
     * Authorization plugin to load permissions for anonymous requests.
     * This allows you to control which API resources can be accessed publicly.
     * The authorization is performed by loading permissions from the "anonymous" user group.
     */
    anonymousAuthorization()
];
