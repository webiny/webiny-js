import { createAbstraction } from "@webiny/feature/api";
import type { ResolverDecorators, Resolvers, TypeDefs } from "~/types.js";

interface ISchemaParts {
    typeDefs: TypeDefs;
    resolvers: Resolvers<any>[];
    resolverDecorators: ResolverDecorators[]
}

export interface IGraphQLSchemaBuilder {
    build(): Promise<ISchemaParts>;
}

export const GraphQLSchemaBuilder =
    createAbstraction<IGraphQLSchemaBuilder>("GraphQLSchemaBuilder");

export namespace GraphQLSchemaBuilder {
    export type Interface = IGraphQLSchemaBuilder;
    export type SchemaParts = ISchemaParts;
}
