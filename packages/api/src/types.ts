import {
    GraphQLScalarType,
    GraphQLSchema,
    GraphQLFieldResolver as BaseGraphQLFieldResolver
} from "graphql";

import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export { Plugin, PluginsContainer };

export interface GraphQLContext {
    event?: any;
    plugins: PluginsContainer;
    [key: string]: any;
}

export type SchemaDefinition = {
    typeDefs: any;
    resolvers: any;
};

export type SchemaDefinitionFactory = (params: {
    plugins: PluginsContainer;
}) => Promise<SchemaDefinition>;

export type GraphQLSchemaPlugin = Plugin & {
    prepare?: (params: { context: GraphQLContext }) => Promise<void>;
    schema: SchemaDefinition | SchemaDefinitionFactory;
    [key: string]: any;
};

export type GraphQLContextPlugin<T = GraphQLContext> = Plugin & {
    preApply?: (context: T) => void | Promise<void>;
    apply?: (context: T) => void | Promise<void>;
    postApply?: (context: T) => void | Promise<void>;
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
