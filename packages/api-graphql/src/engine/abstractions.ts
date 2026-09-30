import type { GraphQLSchema } from "graphql";
import { createAbstraction } from "@webiny/feature/api";

export interface IGraphQLEngine {
    execute(body: any): Promise<any>;
}

export const GraphQLEngine = createAbstraction<IGraphQLEngine>("GraphQLEngine");

export namespace GraphQLEngine {
    export type Interface = IGraphQLEngine;
}

/**
 * GraphQLSchemaCache - Keeps built executable schemas across requests, keyed by what they were built
 * from. Register it in the root container, so it lives as long as the handler.
 */
export interface IGraphQLSchemaCache {
    getOrBuild(key: string, build: () => GraphQLSchema): GraphQLSchema;
}

export const GraphQLSchemaCache = createAbstraction<IGraphQLSchemaCache>("GraphQLSchemaCache");

export namespace GraphQLSchemaCache {
    export type Interface = IGraphQLSchemaCache;
}
