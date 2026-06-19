import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createCmsExtension } from "@webiny/api-headless-cms";
import { createTenancyAndSecurity } from "./tenancySecurity";
import type { PermissionsArg } from "./helpers";
import { createPermissions } from "./helpers";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { createSchedulerManifestPlugin } from "./../schedulerManifestPlugin.js";
import { createApiCore } from "@webiny/api-core";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { registerSchedulerExtension } from "@webiny/api-scheduler";
import { registerSchedulerAwsExtension } from "~/context.js";

export interface CreateHandlerCoreParams {
    getScheduleClient: (config?: SchedulerClientConfig) => Pick<SchedulerClient, "send">;
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: `manage/${string}-${string}}` | `read/${string}-${string}}` | string;
}

process.env.S3_BUCKET = "my-mock-s3-bucket";

export const createHandlerCore = (params: CreateHandlerCoreParams) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const { permissions, identity, plugins = [], topPlugins = [], bottomPlugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            topPlugins,
            ...cmsStorage.plugins,
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
                testProjectLicense: createTestWcpLicense()
            }),
            ...createTenancyAndSecurity({
                permissions: createPermissions(permissions),
                identity
            }),
            createSchedulerManifestPlugin(),
            createCmsExtension(),
            plugins,
            graphQLHandlerPlugins(),
            registerSchedulerExtension(),
            registerSchedulerAwsExtension({
                getClient: config => {
                    return params.getScheduleClient(config);
                }
            }),
            bottomPlugins
        ]
    };
};
