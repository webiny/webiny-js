/**
 * This file contains abstraction for use by third party developers.
 */
import { createAbstraction } from "@webiny/feature/api";
import type {
    Resolvers as IResolvers,
    TypeDefs as ITypeDefs,
    ResolverDecorators as IResolverDecorators
} from "~/types.js";

export interface IGraphQLResolverDecoratorsFactory {
    execute(): Promise<IResolverDecorators[]> | IResolverDecorators[];
}

/**
 * GraphQLResolverDecoratorsFactory
 */
export const GraphQLResolverDecoratorsFactory =
    createAbstraction<IGraphQLResolverDecoratorsFactory>("GraphQLResolverDecoratorsFactory");

export namespace GraphQLResolverDecoratorsFactory {
    export type Interface = IGraphQLResolverDecoratorsFactory;
    export type ResolverDecorators = IResolverDecorators;
}

export interface IGraphQLSchema<TContext = any> {
    typeDefs?: ITypeDefs;
    resolvers?: IResolvers<TContext>;
    resolverDecorators?: IResolverDecorators;
}

/**
 * GraphQLSchemaFactory
 */
export interface IGraphQLSchemaFactory<TContext = any> {
    execute(): Promise<IGraphQLSchema<TContext>[]> | IGraphQLSchema<TContext>[];
}

export const GraphQLSchemaFactory =
    createAbstraction<IGraphQLSchemaFactory>("GraphQLSchemaFactory");

export namespace GraphQLSchemaFactory {
    export type Interface<TContext = any> = IGraphQLSchemaFactory<TContext>;
    export type Return<TContext = any> =
        | Promise<IGraphQLSchema<TContext>[]>
        | IGraphQLSchema<TContext>[];
    export type Schema<TContext = any> = IGraphQLSchema<TContext>;
    export type TypeDefs = ITypeDefs;
    export type Resolvers<TContext = any> = IResolvers<TContext>;
}

/**
 * GraphQLTypeDefsFactory
 */
export interface IGraphQLTypeDefsFactory {
    execute(): Promise<ITypeDefs[]> | ITypeDefs[];
}

export const GraphQLTypeDefsFactory =
    createAbstraction<IGraphQLTypeDefsFactory>("GraphQLTypeDefsFactory");
export namespace GraphQLTypeDefsFactory {
    export type Interface = IGraphQLTypeDefsFactory;
    export type TypeDefs = ITypeDefs;
}

/**
 * GraphQLResolversFactory
 */
export interface IGraphQLResolversFactory<TContext = any> {
    execute(): Promise<IResolvers<TContext>[]> | IResolvers<TContext>[];
}

export const GraphQLResolversFactory =
    createAbstraction<IGraphQLResolversFactory>("GraphQLResolversFactory");

export namespace GraphQLResolversFactory {
    export type Interface<TContext = any> = IGraphQLResolversFactory<TContext>;
    export type Resolvers<TContext = any> = IResolvers<TContext>;
}
