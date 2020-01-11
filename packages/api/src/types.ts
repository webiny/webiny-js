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

export type SchemaDefinitionFactory = (params: {
    plugins: PluginsContainer;
}) => Promise<SchemaDefinition>;

export type GraphQLSchemaPlugin = Plugin & {
    prepare?: (params: { plugins: PluginsContainer }) => void;
    schema: SchemaDefinition | SchemaDefinitionFactory;
    [key: string]: any;
};

export type GraphQLContextPlugin = Plugin & {
    preApply?: (context: GraphQLContext) => Promise<void>;
    apply?: (context: GraphQLContext) => Promise<void>;
    postApply?: (context: GraphQLContext) => Promise<void>;
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
