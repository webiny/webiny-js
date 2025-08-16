import type {
    GraphQLScalarType,
    GraphQLFieldResolver as BaseGraphQLFieldResolver,
    GraphQLSchema
} from "graphql";
import type { Plugin } from "@webiny/plugins/types";
import type { Context, GenericRecord } from "@webiny/api/types";
import type { RouteMethodPath } from "@webiny/handler/types";
import type { ResolversComposition } from "@graphql-tools/resolvers-composition";
import type { IResolvers, TypeSource } from "@graphql-tools/utils";

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

/**
 * @deprecated Use `TypeDefs` instead.
 */
export type Types = TypeDefs;
export type TypeDefs = TypeSource;

export interface GraphQLSchemaPluginTypeArgs {
    context?: any;
    args?: any;
    source?: any;
}

export type Resolvers<TContext> = IResolvers<any, TContext>;

export type ResolverDecorator<TSource = any, TContext = any, TArgs = any> = ResolversComposition<
    GraphQLFieldResolver<TSource, TContext, TArgs>
>;

export type ResolverDecorators = GenericRecord<string, ResolverDecorator[]>;

export interface GraphQLSchemaDefinition<TContext> {
    typeDefs: TypeDefs;
    resolvers?: Resolvers<TContext>;
    resolverDecorators?: ResolverDecorators;
}

export interface GraphQLSchemaPlugin<TContext extends Context = Context> extends Plugin {
    type: "graphql-schema";
    schema: GraphQLSchemaDefinition<TContext>;
}

export interface GraphQLRequestBody {
    query: string;
    variables?: Record<string, any> | null;
    operationName?: string;
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
