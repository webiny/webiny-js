import { GraphQLScalarType, GraphQLSchema } from "graphql";
import { PluginsContainer } from "./PluginsContainer";

export { PluginsContainer };

export type GraphQLContext = {
    plugins: PluginsContainer;
    [key: string]: any;
};

export type Plugin = {
    name: string;
    type: string;
};

export type SchemaDefinition = {
    typeDefs: any;
    resolvers: any;
};

export type GraphQLSchemaPlugin = Plugin & {
    prepare?: (params: { plugins: PluginsContainer }) => void;
    schema: (params: { plugins: PluginsContainer }) => Promise<SchemaDefinition> | SchemaDefinition;
    [key: string]: any;
};

export type GraphQLContextPlugin = Plugin & {
    preApply?: (context: { [key: string]: any }) => Promise<void>;
    apply?: (context: { [key: string]: any }) => Promise<void>;
    postApply?: (context: { [key: string]: any }) => Promise<void>;
};

export type GraphQLMiddlewarePlugin = Plugin & {
    middleware: ({ plugins: PluginsContainer }) => Function[];
};

export type GraphqlScalarPlugin = Plugin & {
    scalar: GraphQLScalarType;
};

export type CreateApolloHandlerPlugin = Plugin & {
    create(params: { plugins: PluginsContainer; schema: GraphQLSchema }): Function;
};

export type CreateApolloGatewayPlugin = Plugin & {
    createGateway(params: { plugins: PluginsContainer }): Promise<Function>;
};
