import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createTenancyAndSecurity } from "./tenancySecurity";
import type { PermissionsArg } from "./helpers";
import { createPermissions } from "./helpers";
import type { ContextPlugin } from "@webiny/api";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { AuditLogsContext } from "~/types";
import { createAco } from "@webiny/api-aco";
import { createAuditLogs } from "~/index";
import type { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { createFileManagerContext } from "@webiny/api-file-manager";
import { createMailerContext } from "@webiny/api-mailer";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createAcoAuditLogsContext } from "~/context/index.js";
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

    const documentClient = getDocumentClient();
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

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
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
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
                            permissions: createPermissions(permissions),
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
            } as ContextPlugin<AuditLogsContext>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
            createMailerContext(),
            createFileManagerContext({
                storageOperations: fileManagerStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createWebsiteBuilder(),
            createAco({ documentClient }),
            createAuditLogs(),
            createAcoAuditLogsContext(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
