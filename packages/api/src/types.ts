import { PluginsContainer } from "./PluginsContainer";

export { PluginsContainer };

export type PluginType = { [key: string]: any } & {
    name: string;
    type: string;
};

export interface GraphQLSchemaPlugin extends PluginType {
    schema: {
        typeDefs: any;
        resolvers: { [type: string]: { [field: string]: Function } };
    };
}

export type GraphQLContextPlugin = PluginType & {
    preApply?: (context: { [key: string]: any }) => Promise<void>;
    apply?: (context: { [key: string]: any }) => Promise<void>;
    postApply?: (context: { [key: string]: any }) => Promise<void>;
};

export type GraphQLMiddlewarePlugin = PluginType & {
    middleware: ({ plugins: PluginsContainer }) => Function[];
};
