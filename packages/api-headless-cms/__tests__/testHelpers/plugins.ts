import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import i18nContext from "@webiny/api-i18n/graphql/context";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import graphqlPlugins from "@webiny/handler-graphql";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "~/index";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "~tests/testHelpers/tenancySecurity";
import { createDummyLocales, createPermissions, PermissionsArg } from "~tests/testHelpers/helpers";
import { SecurityIdentity } from "@webiny/api-security/types";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { enableBenchmarkOnEnvironmentVariable } from "./enableBenchmarkOnEnvironmentVariable";
import { HeadlessCmsStorageOperations } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import i18nPlugins from "@webiny/api-i18n/graphql";
import { createApwGraphQL } from "@webiny/api-apw";
import { createAco } from "@webiny/api-aco";
import { createAcoPageBuilderContext } from "@webiny/api-page-builder-aco";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { FormBuilderStorageOperations } from "@webiny/api-form-builder/types";
import { createFormBuilder } from "@webiny/api-form-builder";
import { createGzipCompression } from "@webiny/api-elasticsearch";
import pageBuilderPrerenderingPlugins from "@webiny/api-page-builder/prerendering";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import prerenderingServicePlugins from "@webiny/api-prerendering-service-aws/client";
import fileManagerS3 from "@webiny/api-file-manager-s3";
import { createBackgroundTasks } from "@webiny/api-background-tasks-os";
import { PageBuilderStorageOperations } from "@webiny/api-page-builder/types";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { createRecordLocking } from "@webiny/api-record-locking";
import { createWebsockets } from "@webiny/api-websockets";
import tenantManager from "@webiny/api-tenant-manager";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: `manage/${string}-${string}}` | `read/${string}-${string}}` | string;
}
export const createHandlerCore = (params: CreateHandlerCoreParams) => {
    process.env.S3_BUCKET = "some-wrong-s3-bucket-name";
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

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const pageBuilder = getStorageOps<PageBuilderStorageOperations>("pageBuilder");
    const formBuilder = getStorageOps<FormBuilderStorageOperations>("formBuilder");
    const fileManager = getStorageOps<FileManagerStorageOperations>("fileManager");
    const i18nStorage = getStorageOps<any[]>("i18n");

    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            enableBenchmarkOnEnvironmentVariable(),
            topPlugins,
            createWcpContext(),
            createWcpGraphQL(),
            ...cmsStorage.plugins,
            ...formBuilder.plugins,
            ...fileManager.plugins,
            ...pageBuilder.plugins,
            ...i18nStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: setupTenancyAndSecurityGraphQL,
                permissions: createPermissions(permissions),
                identity,
                tenant
            }),
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            ...i18nContext(),
            ...i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            ...createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            ...createHeadlessCmsGraphQL(),
            ...graphQLHandlerPlugins(),

            ///////
            ///////
            ///////
            // logsPlugins(),
            ...graphqlPlugins({ debug: true }),
            ...tenantManager(),
            ...i18nPlugins(),
            ...i18nDynamoDbStorageOperations(),
            ...createWebsockets(),
            ...createRecordLocking(),
            ...createBackgroundTasks(),
            createFileManagerContext({
                storageOperations: fileManager.storageOperations
            }),
            ...createFileManagerGraphQL(),
            // createAssetDelivery({ documentClient }),
            ...fileManagerS3(),
            prerenderingServicePlugins({
                eventBus: String("SOME_WRONG_EVENT_BUS")
            }),
            ...createPageBuilderContext({
                storageOperations: pageBuilder.storageOperations
            }),
            ...createPageBuilderGraphQL(),
            ...pageBuilderPrerenderingPlugins(),
            ...createFormBuilder({
                storageOperations: formBuilder.storageOperations
            }),
            createGzipCompression(),
            ...createApwGraphQL(),
            ...createAco(),
            createAcoPageBuilderContext(),
            createAcoHcmsContext(),
            ...createHcmsTasks(),
            ...createAuditLogs(),
            ///////
            ///////
            ///////
            plugins,
            bottomPlugins
        ]
    };
};
