import type { Plugin } from "@webiny/plugins/types";
import type { PluginCollection } from "@webiny/project-utils/testing/environment";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityIdentity, SecurityStorageOperations } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { enableBenchmarkOnEnvironmentVariable } from "./enableBenchmarkOnEnvironmentVariable";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import type { Permission } from "./permissions";
import { createPermissions } from "./permissions";
import type { PathType } from "../types";
import type { TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";
import type { I18NLocalesStorageOperations } from "@webiny/api-i18n/types";
import type { PageBuilderStorageOperations } from "@webiny/api-page-builder/types";
import type { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import type { AdminUsersStorageOperations } from "@webiny/api-admin-users/types";
import createAdminUsersApp from "@webiny/api-admin-users";
import i18nPlugins from "@webiny/api-i18n/graphql";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import { createWebsockets } from "@webiny/api-websockets";
import { createRecordLocking } from "@webiny/api-record-locking";

import { createFormBuilder } from "@webiny/api-form-builder";
import type { FormBuilderStorageOperations } from "@webiny/api-form-builder/types";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createAco } from "@webiny/api-aco";
import { createAcoPageBuilderContext } from "@webiny/api-page-builder-aco";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks";
import { createApwGraphQL, createApwContext } from "@webiny/api-apw";
import type { ApwScheduleActionStorageOperations } from "@webiny/api-apw/scheduler/types";
import { createBackgroundTaskContext, createBackgroundTaskGraphQL } from "@webiny/tasks";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageBuilderImportExportStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createLogger } from "@webiny/api-log";
import { createCmsPlugins } from "../cms";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";

export interface ICreateCoreParams {
    plugins?: Plugin[];
    path: PathType;
    permissions?: Permission[];
    tenant?: Pick<Tenant, "id" | "name" | "parent">;
    features?: boolean;
}

export interface ICreateCoreResult {
    plugins: PluginCollection;
    cmsStorage: HeadlessCmsStorageOperations;
    i18nStorage: I18NLocalesStorageOperations;
    pageBuilderStorage: PageBuilderStorageOperations;
    formBuilderStorage: FormBuilderStorageOperations;
    fileManagerStorage: FileManagerStorageOperations;
    securityStorage: SecurityStorageOperations;
    tenancyStorage: TenancyStorageOperations;
    adminUsersStorage: AdminUsersStorageOperations;
    tenant: Pick<Tenant, "id" | "name" | "parent">;
    login: (identity?: SecurityIdentity | null) => void;
    logout: () => void;
}

export const createCore = (params: ICreateCoreParams): ICreateCoreResult => {
    const { permissions, tenant, plugins = [], features } = params;

    const documentClient = getDocumentClient();

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<I18NLocalesStorageOperations>("i18n");
    const pageBuilderStorage = getStorageOps<PageBuilderStorageOperations>("pageBuilder");
    const formBuilderStorage = getStorageOps<FormBuilderStorageOperations>("formBuilder");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");
    const apwScheduleStorage = getStorageOps<ApwScheduleActionStorageOperations>("apwSchedule");

    const security = createTenancyAndSecurity({
        permissions: createPermissions(permissions),
        tenant
    });

    return {
        cmsStorage: cmsStorage.storageOperations,
        i18nStorage: i18nStorage.storageOperations,
        pageBuilderStorage: pageBuilderStorage.storageOperations,
        formBuilderStorage: formBuilderStorage.storageOperations,
        fileManagerStorage: fileManagerStorage.storageOperations,
        securityStorage: securityStorage.storageOperations,
        tenancyStorage: tenancyStorage.storageOperations,
        adminUsersStorage: adminUsersStorage.storageOperations,
        tenant: security.tenant,
        login: security.login,
        logout: security.logout,
        plugins: [
            enableBenchmarkOnEnvironmentVariable(),
            createWcpContext({
                testProjectLicense: features ? createTestWcpLicense() : undefined
            }),
            createWcpGraphQL(),
            ...cmsStorage.plugins,
            ...pageBuilderStorage.plugins,
            ...fileManagerStorage.plugins,
            ...securityStorage.plugins,
            ...tenancyStorage.plugins,
            ...adminUsersStorage.plugins,
            ...security.plugins,
            createLogger({
                documentClient,
                createGraphQL: true
            }),
            createAdminUsersApp({
                storageOperations: adminUsersStorage.storageOperations
            }),
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nPlugins(),
            /**
             * We are 100% positive that storageOperations is a list of plugins, so we can safely spread it.
             */
            // @ts-expect-error
            ...i18nStorage.storageOperations,
            ...i18nStorage.plugins,
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            ...createCmsPlugins(),
            createPageBuilderContext({
                storageOperations: pageBuilderStorage.storageOperations
            }),
            createPageBuilderGraphQL(),
            createFileManagerContext({
                storageOperations: fileManagerStorage.storageOperations
            }),
            createFileManagerGraphQL(),
            createFormBuilder({
                storageOperations: formBuilderStorage.storageOperations
            }),
            pageBuilderImportExportPlugins({
                storageOperations: createPageBuilderImportExportStorageOperations({
                    documentClient
                })
            }),
            createApwContext({
                storageOperations: apwScheduleStorage.storageOperations
            }),
            createAco({ documentClient }),
            createAuditLogs(),
            createRecordLocking(),
            createWebsockets(),
            ...createBackgroundTaskContext(),
            ...createBackgroundTaskGraphQL(),
            createAcoPageBuilderContext(),
            createAcoHcmsContext(),
            createHcmsTasks(),
            createApwGraphQL(),
            plugins,
            graphQLHandlerPlugins()
        ]
    };
};
