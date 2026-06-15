import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createCmsExtension } from "@webiny/api-headless-cms";
import { createTenancyAndSecurity } from "./tenancySecurity";
import type { PermissionsArg } from "./helpers";
import { createPermissions } from "./helpers";
import type { ContextPlugin } from "@webiny/api";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { AuditLogsContext } from "~/types";
import { createAco } from "@webiny/api-aco";
import { createAuditLogs } from "~/index";
import { createFileManagerContext } from "@webiny/api-file-manager";
import { createMailerContext } from "@webiny/api-mailer";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiKey } from "@webiny/api-core/types/security.js";
import { createApiCore } from "@webiny/api-core";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import apiKeyAuthorization from "@webiny/api-core/legacy/security/plugins/apiKeyAuthorization.js";
import apiKeyAuthentication from "@webiny/api-core/legacy/security/plugins/apiKeyAuthentication.js";
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

export const createHandlerCore = (params?: CreateHandlerCoreParams) => {
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
        bottomPlugins = []
    } = params || {};

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const apiAcoStorage = getStorageOps<ApiCoreStorageOperations>("aco");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const auditLogsStorage = getStorageOps("auditLogs");

    const testProjectLicense = createTestWcpLicense();
    testProjectLicense.package.features["auditLogs"].enabled = true;

    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            topPlugins,
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
                testProjectLicense
            }),
            ...apiAcoStorage.plugins,
            ...cmsStorage.plugins,
            ...auditLogsStorage.plugins,
            ...createTenancyAndSecurity({
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
                            slug: tenant.id,
                            permissions: createPermissions(permissions),
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
            } as ContextPlugin<AuditLogsContext>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            createCmsExtension(),
            createMailerContext(),
            createFileManagerContext(),
            createWebsiteBuilder(),
            createAco(),
            createAuditLogs(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
