/**
 * This file contains abstraction for use by third party developers.
 */
import { createAbstraction } from "@webiny/feature/api";
import type {
    Resolvers as IResolvers,
    TypeDefs as ITypeDefs,
    ResolverDecorators as IResolverDecorators
} from "~/types.js";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";

export interface IGraphQLSchema {
    typeDefs?: ITypeDefs;
    resolvers?: IResolvers<any>;
    resolverDecorators?: IResolverDecorators;
}

/** Define custom GraphQL schema extensions. */
export interface IGraphQLSchemaFactory {
    execute(builder: GraphQLSchemaBuilder.Interface): Promise<GraphQLSchemaBuilder.Interface>;
    /**
     * Returns what this factory's type definitions and resolver paths depend on: the same key must
     * always mean the same output. When every factory has one, the GraphQL engine runs the factories
     * only if no schema is cached under the combined key yet. Leave it out and the factories run on
     * every request. Use `staticSchemaKey()` for a factory whose output never changes.
     */
    getSchemaKey?(): string | Promise<string>;
}

/** Define custom GraphQL schema extensions. */
export const GraphQLSchemaFactory =
    createAbstraction<IGraphQLSchemaFactory>("GraphQLSchemaFactory");

export namespace GraphQLSchemaFactory {
    export type Interface = IGraphQLSchemaFactory;
    export type SchemaBuilder = GraphQLSchemaBuilder.Interface;
    export type Return = Promise<GraphQLSchemaBuilder.Interface>;
}
