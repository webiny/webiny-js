// @flow
import type { PluginsContainer } from "./PluginsContainer";

export type PluginType = Object & {
    name: string,
    type: string
};

export type PluginsContainerType = PluginsContainer;

export type GraphQLSchemaType = {
    namespace: string,
    typeDefs: *,
    resolvers: Object | (() => Object)
};

export type GraphQLSchemaPluginType = PluginType & {
    schema?: GraphQLSchemaType | (() => GraphQLSchemaType),
    security?: Object | (() => Object)
};

export type GraphQLMiddlewarePluginType = PluginType & {
    middleware: () => Object
};

export type ApiContext = {
    getDatabase: () => Object,
    config: Object
};
