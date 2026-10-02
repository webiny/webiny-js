import { createFeature } from "@webiny/feature/api";
import { MemoryGraphQLSchemaCache } from "./MemoryGraphQLSchemaCache.js";

/**
 * Register in the ROOT container. The request container registers the GraphQL engine again on every
 * request, so a cache registered there would start empty each time.
 */
export const GraphQLSchemaCacheFeature = createFeature({
    name: "GraphQLSchemaCache",
    register(container) {
        container.register(MemoryGraphQLSchemaCache).inSingletonScope();
    }
});
