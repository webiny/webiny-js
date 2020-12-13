import { GraphQLScalarType, GraphQLFieldResolver as BaseGraphQLFieldResolver } from "graphql";
import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";

export type GraphQLScalarPlugin = Plugin & {
    type: "graphql-scalar";
    scalar: GraphQLScalarType;
};

export interface HandlerGraphQLOptions {
    debug?: boolean | string;
}

export type GraphQLFieldResolver<
    TSource = any,
    TArgs = any,
    TContext = Context
> = BaseGraphQLFieldResolver<TSource, TContext, TArgs>;

// `GraphQLSchemaPlugin` types.
export type Types = string | (() => string | Promise<string>);

export type GraphQLSchemaPluginTypeArgs = {
    context?: any;
    args?: any;
    source?: any;
};

export type Resolvers<TContext> =
    | GraphQLScalarType
    | GraphQLFieldResolver<any, Record<string, any>, TContext>
    | { [property: string]: Resolvers<TContext> };

export type GraphQLSchemaDefinition<TContext> = {
    typeDefs: Types;
    resolvers: Resolvers<TContext>;
};

export type GraphQLSchemaPlugin<TContext = Context> = Plugin<{
    type: "graphql-schema";
    schema: GraphQLSchemaDefinition<TContext>;
}>;
