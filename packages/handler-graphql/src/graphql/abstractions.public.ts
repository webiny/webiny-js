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

/**
 * GraphQLSchemaFactory
 */
export interface IGraphQLSchemaFactory {
    execute(builder: GraphQLSchemaBuilder.Interface): Promise<GraphQLSchemaBuilder.Interface>;
}

export const GraphQLSchemaFactory =
    createAbstraction<IGraphQLSchemaFactory>("GraphQLSchemaFactory");

export namespace GraphQLSchemaFactory {
    export type Interface = IGraphQLSchemaFactory;
    export type SchemaBuilder = GraphQLSchemaBuilder.Interface;
    export type Return = Promise<GraphQLSchemaBuilder.Interface>;
}
