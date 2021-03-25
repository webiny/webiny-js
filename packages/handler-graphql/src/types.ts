import { GraphQLScalarType, GraphQLFieldResolver as BaseGraphQLFieldResolver } from "graphql";
import { Plugin } from "@webiny/plugins/types";
import { ContextInterface } from "@webiny/handler/types";

export type GraphQLScalarPlugin = Plugin & {
    type: "graphql-scalar";
    scalar: GraphQLScalarType;
};

export type GraphQLFieldResolver<
    TSource = any,
    TArgs = any,
    TContext = ContextInterface
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
    resolvers?: Resolvers<TContext>;
};

export type GraphQLSchemaPlugin<TContext extends ContextInterface = ContextInterface> = Plugin<{
    type: "graphql-schema";
    schema: GraphQLSchemaDefinition<TContext>;
}>;
