import {
    GraphQLScalarType,
    GraphQLFieldResolver as BaseGraphQLFieldResolver,
    GraphQLSchema
} from "graphql";
import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/api/types";
import { RouteMethodPath } from "@webiny/handler/types";

export interface GraphQLScalarPlugin extends Plugin {
    type: "graphql-scalar";
    scalar: GraphQLScalarType;
}

export interface HandlerGraphQLOptions {
    path?: RouteMethodPath;
    debug?: boolean | string;
}

export type GraphQLFieldResolver<
    TSource = any,
    TArgs = any,
    TContext = Context
> = BaseGraphQLFieldResolver<TSource, TContext, TArgs>;

// `GraphQLSchemaPlugin` types.
export type Types = string | string[] | (() => string | string[] | Promise<string | string[]>);

export interface GraphQLSchemaPluginTypeArgs {
    context?: any;
    args?: any;
    source?: any;
}

export type Resolvers<TContext> =
    | GraphQLScalarType
    | GraphQLFieldResolver<any, Record<string, any>, TContext>
    | { [property: string]: Resolvers<TContext> }
    | undefined;

export interface GraphQLSchemaDefinition<TContext> {
    typeDefs: Types;
    resolvers?: Resolvers<TContext>;
}

export interface GraphQLSchemaPlugin<TContext extends Context = Context> extends Plugin {
    type: "graphql-schema";
    schema: GraphQLSchemaDefinition<TContext>;
}

export interface GraphQLRequestBody {
    query: string;
    variables: Record<string, any>;
    operationName: string;
}

export interface GraphQLBeforeQueryPlugin<TContext extends Context = Context> extends Plugin {
    type: "graphql-before-query";
    apply(params: { body: GraphQLRequestBody; schema: GraphQLSchema; context: TContext }): void;
}

export interface GraphQLAfterQueryPlugin<TContext extends Context = Context> extends Plugin {
    type: "graphql-after-query";
    apply(params: {
        result: any;
        body: GraphQLRequestBody;
        schema: GraphQLSchema;
        context: TContext;
    }): void;
}
