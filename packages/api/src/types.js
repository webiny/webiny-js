// @flow
import type { PluginsContainer } from "@webiny/plugins";

export type PluginType = Object & {
    name: string,
    type: string
};

export type PluginsContainerType = PluginsContainer;

export type GraphQLMiddlewarePluginType = PluginType & {
    middleware: () => Object
};
