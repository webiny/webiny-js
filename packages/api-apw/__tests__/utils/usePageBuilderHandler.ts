import { SecurityIdentity } from "@webiny/api-security/types";
import { PermissionsArg } from "./helpers";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createPageBuilderGQLHandler } from "./createPageBuilderGQLHandler";
import { createContentHeadlessCmsContext } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";

export interface GQLHandlerCallableParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path: string;
}

export const usePageBuilderHandler = (params: GQLHandlerCallableParams) => {
    return createPageBuilderGQLHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: true,
        plugins: (params.plugins || []).concat([graphQLHandlerPlugins()]),
        createHeadlessCmsApp: createContentHeadlessCmsContext
    });
};
