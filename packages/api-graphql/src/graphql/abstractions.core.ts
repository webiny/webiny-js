/**
 * This file contains abstraction for use by the core Webiny team, or anyone contributing to the webiny-js repository.
 */
import { createAbstraction } from "@webiny/feature/api";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";

export interface ICoreGraphQLSchemaFactory {
    execute(builder: GraphQLSchemaBuilder.Interface): Promise<GraphQLSchemaBuilder.Interface>;
    /**
     * Returns what this factory's type definitions and resolver paths depend on: the same key must
     * always mean the same output. When every factory has one, the GraphQL engine runs the factories
     * only if no schema is cached under the combined key yet. Leave it out and the factories run on
     * every request. Use `staticSchemaKey()` for a factory whose output never changes.
     */
    getSchemaKey?(): string | Promise<string>;
}

export const CoreGraphQLSchemaFactory = createAbstraction<ICoreGraphQLSchemaFactory>(
    "CoreGraphQLSchemaFactory"
);
export namespace CoreGraphQLSchemaFactory {
    export type Interface = ICoreGraphQLSchemaFactory;
    export type SchemaBuilder = GraphQLSchemaBuilder.Interface;
    export type Return = Promise<GraphQLSchemaBuilder.Interface>;
}
