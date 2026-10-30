import { createFeature } from "@webiny/feature/api";
import { MemoryGraphQLSchemaKeyVerification } from "./MemoryGraphQLSchemaKeyVerification.js";

/**
 * Register in the ROOT container of test handlers, next to GraphQLSchemaCacheFeature. Every request
 * then also runs each keyed factory on its own and checks its output against its schema key, so a
 * factory whose key misses a dependency fails the tests instead of serving a stale schema.
 */
export const GraphQLSchemaKeyVerificationFeature = createFeature({
    name: "GraphQLSchemaKeyVerification",
    register(container) {
        container.register(MemoryGraphQLSchemaKeyVerification).inSingletonScope();
    }
});
