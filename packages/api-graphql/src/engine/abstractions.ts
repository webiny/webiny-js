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
    getOrBuild(key: string, build: () => Promise<GraphQLSchema>): Promise<GraphQLSchema>;
}

export const GraphQLSchemaCache = createAbstraction<IGraphQLSchemaCache>("GraphQLSchemaCache");

export namespace GraphQLSchemaCache {
    export type Interface = IGraphQLSchemaCache;
}

export interface IGraphQLSchemaKeyCheck {
    factory: string;
    key: string;
    output: string;
}

export interface IGraphQLSchemaKeyVerification {
    check(params: IGraphQLSchemaKeyCheck): void;
}

/**
 * GraphQLSchemaKeyVerification - Fails when a schema factory produces different output under the same
 * schema key, which would serve a stale schema. Register it in the root container of test handlers.
 */
export const GraphQLSchemaKeyVerification = createAbstraction<IGraphQLSchemaKeyVerification>(
    "GraphQLSchemaKeyVerification"
);

export namespace GraphQLSchemaKeyVerification {
    export type Interface = IGraphQLSchemaKeyVerification;
    export type Check = IGraphQLSchemaKeyCheck;
}
