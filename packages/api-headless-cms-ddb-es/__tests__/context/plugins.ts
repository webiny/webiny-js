import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createCmsExtension } from "@webiny/api-headless-cms";
import { createTenancyAndSecurity } from "./tenancySecurity";
import type { PermissionsArg } from "./helpers";
import { createPermissions } from "./helpers";
import type { ContextPlugin } from "@webiny/api";
import type { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createBackgroundTaskContext } from "@webiny/background-tasks/api";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ApiKey } from "@webiny/api-core/types/security";
import apiKeyAuthentication from "@webiny/api-core/legacy/security/plugins/apiKeyAuthentication.js";
import apiKeyAuthorization from "@webiny/api-core/legacy/security/plugins/apiKeyAuthorization.js";
import { createApiCore } from "@webiny/api-core";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: `manage/${string}-${string}}` | `read/${string}-${string}}` | string;
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
        bottomPlugins = [],
        setupTenancyAndSecurityGraphQL
    } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const testProjectLicense = createTestWcpLicense();
    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            topPlugins,
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
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
                    // @ts-expect-error
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
                            slug: "apiKey-slug",
                            permissions: identity?.permissions || [],
                            token,
                            createdBy: {
                                id: "test",
                                displayName: "test",
                                type: "admin"
                            },
                            description: "test",
                            createdOn: new Date().toISOString()
                        };
                    };
                }
            } as ContextPlugin<CmsContext>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            createCmsExtension(),
            createBackgroundTaskContext(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
