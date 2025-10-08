import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication.js";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization.js";
import i18nContext from "@webiny/api-i18n/graphql/context.js";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import type { PermissionsArg } from "./helpers.js";
import { createDummyLocales, createPermissions } from "./helpers.js";
import type { ApiKey, SecurityIdentity } from "@webiny/api-security/types.js";
import type { ContextPlugin } from "@webiny/api";
import type { Context } from "~/types.js";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createBackgroundTaskContext } from "@webiny/tasks";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import { createMockTaskServicePlugin } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: `manage/${string}-${string}}` | `read/${string}-${string}}` | string;
    testProjectLicense?: DecryptedWcpProjectLicense;
}

process.env.S3_BUCKET = "my-mock-s3-bucket";

export const createHandlerCore = (params: CreateHandlerCoreParams = {}) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const locale = "en-US";
    const {
        permissions,
        identity,
        plugins = [],
        topPlugins = [],
        bottomPlugins = [],
        setupTenancyAndSecurityGraphQL
    } = params;

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const testProjectLicense = params.testProjectLicense || createTestWcpLicense();
    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        locale,
        plugins: [
            topPlugins,
            createWcpContext({
                testProjectLicense
            }),
            ...cmsStorage.plugins,
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
            } as ContextPlugin<Context>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createBackgroundTaskContext(),
            createHeadlessCmsGraphQL(),
            plugins,
            graphQLHandlerPlugins(),
            createMockTaskServicePlugin(),
            bottomPlugins
        ]
    };
};
