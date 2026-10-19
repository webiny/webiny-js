import type { GraphQLSchema } from "graphql";
import { GraphQLSchemaCache as Abstraction } from "./abstractions.js";

/*
 * A built schema is several megabytes. Tenants with the same models produce the same key and share
 * one entry, so a handful of entries covers the usual case without letting a process that serves
 * many differently shaped tenants grow without bound.
 */
const MAX_ENTRIES = 10;

/**
 * Keeps the most recently used schemas in memory, dropping the least recently used one once it holds
 * `MAX_ENTRIES`. It stores the build itself, so concurrent requests for a missing key share one
 * build, and a failed build is forgotten.
 */
class MemoryGraphQLSchemaCacheImpl implements Abstraction.Interface {
    private readonly schemas = new Map<string, Promise<GraphQLSchema>>();

    public getOrBuild(key: string, build: () => Promise<GraphQLSchema>): Promise<GraphQLSchema> {
        const cached = this.schemas.get(key);
        if (cached) {
            // Re-insert, so the map's insertion order doubles as the recently-used order.
            this.schemas.delete(key);
            this.schemas.set(key, cached);
            return cached;
        }

        const schema = build().catch(error => {
            if (this.schemas.get(key) === schema) {
                this.schemas.delete(key);
            }
            throw error;
        });
        this.schemas.set(key, schema);

        if (this.schemas.size > MAX_ENTRIES) {
            const oldestKey = this.schemas.keys().next().value as string;
            this.schemas.delete(oldestKey);
        }

        return schema;
    }
}

export const MemoryGraphQLSchemaCache = Abstraction.createImplementation({
    implementation: MemoryGraphQLSchemaCacheImpl,
    dependencies: []
});
