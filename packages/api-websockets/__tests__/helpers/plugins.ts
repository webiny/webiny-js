import { createWebsocketsRoutePlugins } from "~/runner/routes";
import { createTenancyAndSecurity } from "~tests/helpers/tenancySecurity";
import { createIdentity, createPermissions } from "~tests/helpers/helpers";
import { createWebsockets } from "~/index";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createRawEventHandler } from "@webiny/handler-aws";
import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

export interface Params {
    plugins?: PluginCollection | PluginsContainer;
    permissions?: SecurityPermission[];
}

export const createPlugins = (params?: Params): PluginsContainer => {
    const { plugins, permissions } = params || {};

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const container = plugins instanceof PluginsContainer ? plugins : new PluginsContainer();
    container.register([
        createApiCore({
            storageOperations: apiCoreStorage.storageOperations
        }),
        createWebsocketsRoutePlugins(),
        ...cmsStorage.plugins,
        ...createTenancyAndSecurity({
            setupGraphQL: false,
            permissions: permissions || createPermissions(),
            identity: createIdentity()
        }),
        createWebsockets(),
        createHeadlessCmsContext(),
        createHeadlessCmsGraphQL(),
        graphQLHandlerPlugins(),

        createRawEventHandler(async ({ context }) => {
            return context;
        }),
        ...(plugins instanceof PluginsContainer ? [] : plugins || [])
    ]);
    return container;
};
