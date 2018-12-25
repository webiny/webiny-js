// @flow
import type { Entity } from "webiny-entity";
import { type PluginType as _PluginType } from "webiny-plugins/types";

export type PluginType = _PluginType;

export type EntityPluginType = PluginType & {
    namespace: string,
    entity: {
        name: string,
        factory: (context: Object) => Class<Entity>
    }
};

export type GraphQLSchemaPluginType = PluginType & {
    namespace: string,
    typeDefs: *,
    resolvers: Object | (() => Object)
};

export type GraphQLContextPluginType = PluginType & {
    apply: (context: Object) => any
};

export type SettingsPluginType = PluginType & {};
