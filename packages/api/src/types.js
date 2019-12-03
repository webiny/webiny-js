// @flow
import type { PluginsContainer } from "./PluginsContainer";

export type PluginType = Object & {
    name: string,
    type: string
};

export type PluginsContainerType = PluginsContainer;

export type GraphQLMiddlewarePluginType = PluginType & {
    middleware: () => Object
};
