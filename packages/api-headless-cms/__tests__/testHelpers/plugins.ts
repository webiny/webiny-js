import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOperations } from "~tests/testHelpers/storageOperations";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "~/index";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "~tests/testHelpers/tenancySecurity";
import { createDummyLocales, createPermissions, PermissionsArg } from "~tests/testHelpers/helpers";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { TestContext } from "~tests/testHelpers/types";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { Plugin, PluginCollection } from "@webiny/plugins/types";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: string;
}
export const createHandlerCore = (params: CreateHandlerCoreParams) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const {
        permissions,
        identity,
        plugins = [],
        topPlugins = [],
        setupTenancyAndSecurityGraphQL
    } = params;

    const ops = getStorageOperations({
        plugins: params.storageOperationPlugins || []
    });

    return {
        storageOperations: ops.storageOperations,
        tenant,
        plugins: [
            topPlugins,
            createWcpContext(),
            ...ops.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: setupTenancyAndSecurityGraphQL,
                permissions: createPermissions(permissions),
                identity
            }),
            {
                type: "context",
                name: "context-security-tenant",
                async apply(context) {
                    context.security.getApiKeyByToken = async (
                        token: string
                    ): Promise<ApiKey | null> => {
                        if (!token || token !== "aToken") {
                            return null;
                        }
                        const apiKey = "a1234567890";
                        return {
                            id: apiKey,
                            name: apiKey,
                            tenant: tenant.id,
                            // @ts-ignore
                            permissions: identity?.permissions || [],
                            token,
                            createdBy: {
                                id: "test",
                                displayName: "test",
                                type: "admin"
                            },
                            description: "test",
                            createdOn: new Date().toISOString(),
                            webinyVersion: context.WEBINY_VERSION
                        };
                    };
                }
            } as ContextPlugin<TestContext>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            createDummyLocales(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: ops.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            plugins,
            graphQLHandlerPlugins()
        ]
    };
};
