import { Plugin } from "@webiny/plugins/types";
import { getStorageOps, PluginCollection } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { SecurityIdentity, SecurityStorageOperations } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { enableBenchmarkOnEnvironmentVariable } from "./enableBenchmarkOnEnvironmentVariable";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createTenancyAndSecurity, getDefaultTenant } from "./tenancySecurity";
import { isCmsPath } from "./isCmsPath";
import { createPermissions, Permission } from "./permissions";
import { PathType } from "../types";
import { TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";
import { I18NLocalesStorageOperations } from "@webiny/api-i18n/types";
import { PageBuilderStorageOperations } from "@webiny/api-page-builder/types";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { AdminUsersStorageOperations } from "@webiny/api-admin-users/types";
import createAdminUsersApp from "@webiny/api-admin-users";
import i18nPlugins from "@webiny/api-i18n/graphql";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";

import { createFormBuilder } from "@webiny/api-form-builder";
import { FormBuilderStorageOperations } from "@webiny/api-form-builder/types";

export interface ICreateCoreParams {
    plugins?: Plugin[];
    path: PathType;
    permissions?: Permission[];
    identity?: SecurityIdentity;
    tenant?: Pick<Tenant, "id" | "name" | "parent">;
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
}

export const createCore = (params: ICreateCoreParams): ICreateCoreResult => {
    const { permissions, identity, tenant, plugins = [] } = params;

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<I18NLocalesStorageOperations>("i18n");
    const pageBuilderStorage = getStorageOps<PageBuilderStorageOperations>("pageBuilder");
    const formBuilderStorage = getStorageOps<FormBuilderStorageOperations>("formBuilder");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");

    return {
        cmsStorage: cmsStorage.storageOperations,
        i18nStorage: i18nStorage.storageOperations,
        pageBuilderStorage: pageBuilderStorage.storageOperations,
        formBuilderStorage: formBuilderStorage.storageOperations,
        fileManagerStorage: fileManagerStorage.storageOperations,
        securityStorage: securityStorage.storageOperations,
        tenancyStorage: tenancyStorage.storageOperations,
        adminUsersStorage: adminUsersStorage.storageOperations,
        tenant: tenant || getDefaultTenant(),
        plugins: [
            enableBenchmarkOnEnvironmentVariable(),
            createWcpContext(),
            createWcpGraphQL(),
            ...cmsStorage.plugins,
            ...pageBuilderStorage.plugins,
            ...fileManagerStorage.plugins,
            ...securityStorage.plugins,
            ...tenancyStorage.plugins,
            ...adminUsersStorage.plugins,
            createTenancyAndSecurity({
                setupGraphQL: !isCmsPath(params),
                permissions: createPermissions(permissions),
                identity,
                tenant
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
            createPageBuilderContext({
                storageOperations: pageBuilderStorage.storageOperations
            }),
            createPageBuilderGraphQL(),
            createFormBuilder({
                storageOperations: formBuilderStorage.storageOperations
            }),
            plugins,
            graphQLHandlerPlugins()
        ]
    };
};
