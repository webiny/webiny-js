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
    /**
     * Runs once per cached schema, not once per request. Resolvers added here must get request-scoped
     * services through `addResolver({ dependencies })`, never from `this`.
     */
    execute(builder: GraphQLSchemaBuilder.Interface): Promise<GraphQLSchemaBuilder.Interface>;
}

/**
 * Define custom GraphQL schema extensions.
 *
 * The built schema is cached across requests. Constructor dependencies are injected only for the
 * request that builds it, so a resolver must never read them (`this.identityContext` and similar):
 * every later request would run with that request's identity, tenant and use cases. Declare what a
 * resolver needs in `builder.addResolver({ dependencies })`, which resolves it from the current
 * request, and register the factory with `dependencies: []`.
 */
export const GraphQLSchemaFactory =
    createAbstraction<IGraphQLSchemaFactory>("GraphQLSchemaFactory");

export namespace GraphQLSchemaFactory {
    export type Interface = IGraphQLSchemaFactory;
    export type SchemaBuilder = GraphQLSchemaBuilder.Interface;
    export type Return = Promise<GraphQLSchemaBuilder.Interface>;
}
