import {
    GraphQLScalarType,
    GraphQLSchema,
    GraphQLFieldResolver as BaseGraphQLFieldResolver
} from "graphql";

import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export { Plugin, PluginsContainer };

export interface GraphQLContext {
    plugins: PluginsContainer;
    [key: string]: any;
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
    preApply?: (context: GraphQLContext) => void | Promise<void>;
    apply?: (context: GraphQLContext) => void | Promise<void>;
    postApply?: (context: GraphQLContext) => void | Promise<void>;
};

export type GraphQLMiddlewarePlugin = Plugin & {
    middleware: (params: { plugins: PluginsContainer }) => Function[];
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

export type GraphQLFieldResolver<
    TSource = any,
    TArgs = any,
    TContext = GraphQLContext
> = BaseGraphQLFieldResolver<TSource, TContext, TArgs>;
