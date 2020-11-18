import { GraphQLScalarType, GraphQLFieldResolver as BaseGraphQLFieldResolver } from "graphql";
import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";

export type GraphQLScalarPlugin = Plugin & {
    type: "graphql-scalar";
    scalar: GraphQLScalarType;
};

export interface HandlerGraphQLOptions {
    debug?: boolean | string;
    server?: {
        introspection?: boolean | string;
        playground?: boolean | string;
    };
    handler?: {
        cors?: { [key: string]: any };
    };
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
    | GraphQLFieldResolver<any, Record<string, any>, TContext>
    | { [property: string]: Resolvers<TContext> };

export type GraphQLSchemaPlugin<TContext = Context> = Plugin<{
    type: "graphql-schema";

    // TODO: is this necessary?
    /*prepare?: (params: { context: T }) => Promise<void>;*/

    schema: {
        typeDefs: Types;
        resolvers: Resolvers<TContext>;
    };
}>;
