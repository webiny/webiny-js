import { createWebsocketsRoutePlugins } from "~/runner/routes";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "~tests/helpers/tenancySecurity";
import { createDummyLocales, createIdentity, createPermissions } from "~tests/helpers/helpers";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createWebsockets } from "~/index";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createRawEventHandler } from "@webiny/handler-aws";
import { PluginsContainer } from "@webiny/plugins";
import { PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";

export const createPlugins = (plugins?: PluginCollection | PluginsContainer): PluginsContainer => {
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const container = plugins instanceof PluginsContainer ? plugins : new PluginsContainer();
    container.register([
        createWebsocketsRoutePlugins(),
        createWcpContext(),
        ...cmsStorage.plugins,
        ...createTenancyAndSecurity({
            setupGraphQL: false,
            permissions: createPermissions(),
            identity: createIdentity()
        }),
        i18nContext(),
        i18nStorage.storageOperations,
        createWebsockets(),
        createDummyLocales(),
        mockLocalesPlugins(),
        createHeadlessCmsContext({
            storageOperations: cmsStorage.storageOperations
        }),
        createHeadlessCmsGraphQL(),
        graphQLHandlerPlugins(),

        createRawEventHandler(async ({ context }) => {
            return context;
        }),
        ...(plugins instanceof PluginsContainer ? [] : plugins || [])
    ]);
    return container;
};
