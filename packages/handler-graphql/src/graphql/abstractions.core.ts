/**
 * This file contains abstraction for use by the core Webiny team, or anyone contributing to the webiny-js repository.
 */
import { createAbstraction } from "@webiny/feature/api";
import type { IGraphQLSchemaFactory } from "./abstractions.public.js";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";

/**
 * CoreGraphQLSchemaFactory
 */
export const CoreGraphQLSchemaFactory = createAbstraction<IGraphQLSchemaFactory>(
    "CoreGraphQLSchemaFactory"
);
export namespace CoreGraphQLSchemaFactory {
    export type Interface = IGraphQLSchemaFactory;
    export type SchemaBuilder = GraphQLSchemaBuilder.Interface;
    export type Return = Promise<GraphQLSchemaBuilder.Interface>;
}
