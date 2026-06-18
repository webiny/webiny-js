/**
 * This file contains abstraction for use by the core Webiny team, or anyone contributing to the webiny-js repository.
 */
import { createAbstraction } from "@webiny/feature/api";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";

/** Internal — ctx is a legacy bridge, not exposed to public implementors. */
export interface ICoreGraphQLSchemaFactory {
    execute(
        builder: GraphQLSchemaBuilder.Interface,
        ctx?: Record<string, any>
    ): Promise<GraphQLSchemaBuilder.Interface>;
}

export const CoreGraphQLSchemaFactory = createAbstraction<ICoreGraphQLSchemaFactory>(
    "CoreGraphQLSchemaFactory"
);
export namespace CoreGraphQLSchemaFactory {
    export type Interface = ICoreGraphQLSchemaFactory;
    export type SchemaBuilder = GraphQLSchemaBuilder.Interface;
    export type Return = Promise<GraphQLSchemaBuilder.Interface>;
}
