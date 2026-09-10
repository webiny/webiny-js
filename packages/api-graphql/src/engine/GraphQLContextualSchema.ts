import { createAbstraction } from "@webiny/feature/api";
import type { GraphQLSchema } from "graphql";

/**
 * A schema that is built after context enhancement — use when schema content depends on
 * runtime data (e.g. CMS content models fetched from the database).
 *
 * Registered schemas are merged with the static schema from GraphQLSchemaComposer.
 */
export interface IGraphQLContextualSchema {
    build(ctx: Record<string, any>): Promise<GraphQLSchema>;
}

export const GraphQLContextualSchema =
    createAbstraction<IGraphQLContextualSchema>("GraphQLContextualSchema");

export namespace GraphQLContextualSchema {
    export type Interface = IGraphQLContextualSchema;
}
