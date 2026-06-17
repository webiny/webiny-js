import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createTenancyAndSecurity } from "./tenancySecurity";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { PermissionsArg } from "./permissions";
import { createPermissions } from "./permissions";
import { createRecordLocking } from "~/index";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
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

    const testProjectLicense = createTestWcpLicense({ recordLocking: true });

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
            graphQLHandlerPlugins(),
            createHeadlessCmsContext(),
            createHeadlessCmsGraphQL(),
            createRecordLocking(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
