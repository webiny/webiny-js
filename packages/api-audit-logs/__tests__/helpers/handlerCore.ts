import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import i18nContext from "@webiny/api-i18n/graphql/context";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import type { PermissionsArg } from "./helpers";
import { createDummyLocales, createPermissions } from "./helpers";
import type { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import type { ContextPlugin } from "@webiny/api";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { AuditLogsContext } from "~/types";
import { createAco } from "@webiny/api-aco";
import { createAuditLogs } from "~/index";
import { createContextPlugin } from "@webiny/handler";
import type { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { createFileManagerContext } from "@webiny/api-file-manager";
import type { AdminUsersStorageOperations } from "@webiny/api-admin-users/types";
import createAdminUsersApp from "@webiny/api-admin-users";
import { createMailerContext } from "@webiny/api-mailer";
import { NullLicense } from "@webiny/wcp";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createAcoAuditLogsContext } from "~/context/index.js";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
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
        bottomPlugins = [],
        setupTenancyAndSecurityGraphQL
    } = params || {};

    const documentClient = getDocumentClient();
    const i18nStorage = getStorageOps("i18n");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");

    const enableContextPlugin = createContextPlugin<AuditLogsContext>(async context => {
        context.wcp = {
            getProject: () => null,
            getRawLicense: () => null,
            canUseRecordLocking: () => true,
            canUseAuditLogs: () => true,
            canUseFileManagerThreatDetection: () => false,
            ensureCanUseFeature: () => void 0,
            canUseFolderLevelPermissions: () => true,
            canUseAacl: () => true,
            canUsePrivateFiles: () => true,
            canUseTeams: () => true,
            decrementSeats: async () => void 0,
            incrementSeats: async () => void 0,
            decrementTenants: async () => void 0,
            incrementTenants: async () => void 0,
            getProjectEnvironment: () => null,
            getProjectLicense: () => new NullLicense(),
            canUseFeature: () => true
        };
    });
    enableContextPlugin.name = "audit-logs-enable-feature";
    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            topPlugins,
            createWcpContext(),
            enableContextPlugin,
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
            i18nContext(),
            i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            createAdminUsersApp({
                storageOperations: adminUsersStorage.storageOperations
            }),
            createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
            createMailerContext(),
            createFileManagerContext({
                storageOperations: fileManagerStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createAco({ documentClient }),
            createAuditLogs(),
            createAcoAuditLogsContext(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
