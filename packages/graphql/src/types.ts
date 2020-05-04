import { GraphQLScalarType, GraphQLFieldResolver as BaseGraphQLFieldResolver } from "graphql";
import { GraphQLSchemaModule } from "apollo-graphql";
import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export { Plugin, PluginsContainer };

export interface Context {
    event?: any;
    plugins: PluginsContainer;
    isColdStart?: boolean;
    [key: string]: any;
}

export type SchemaDefinitionFactory = (params: {
    plugins: PluginsContainer;
}) => GraphQLSchemaModule | Promise<GraphQLSchemaModule>;

export type GraphQLSchemaPlugin<T = Context> = Plugin & {
    prepare?: (params: { context: T }) => Promise<void>;
    schema: GraphQLSchemaModule | SchemaDefinitionFactory;
    [key: string]: any;
};

export type ContextPlugin<T = Context> = Plugin & {
    type: "context";
    preApply?: (context: T) => void | Promise<void>;
    apply?: (context: T) => void | Promise<void>;
    postApply?: (context: T) => void | Promise<void>;
};

export type GraphQLScalarPlugin = Plugin & {
    scalar: GraphQLScalarType;
};

export type GraphQLFieldResolver<
    TSource = any,
    TArgs = any,
    TContext = Context
> = BaseGraphQLFieldResolver<TSource, TContext, TArgs>;
