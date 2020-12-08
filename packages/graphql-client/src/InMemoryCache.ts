import { GraphQLClientCache } from "./types";
import normalize from "./InMemoryCache/normalize";
import denormalize from "./InMemoryCache/denormalize";
import getQueryCacheKey from "./InMemoryCache/getQueryCacheKey";

export type InMemoryCacheConfiguration = {
    cacheKeyFields?: string[];
};

export type QueriesVariablesEntry = {
    entities: string[];
    result: Record<string, any>;
};

export default class InMemoryCache implements GraphQLClientCache {
    queries: Record<string, Record<string, QueriesVariablesEntry>>;
    entities: Record<string, Record<string, any>>;
    configuration: InMemoryCacheConfiguration;
    constructor(configuration: InMemoryCacheConfiguration = {}) {
        this.configuration = configuration;
        this.queries = {};
        this.entities = {};
    }

    writeQuery({ query, variables = {}, result }) {
        const [normalizedResult, normalizedEntities] = normalize(result);

        const [queryKey, variablesKey] = getQueryCacheKey(query, variables);
        const queries = {
            [queryKey]: {
                [variablesKey]: normalizedResult
            }
        };

        this.import(queries, normalizedEntities);
    }

    readQuery<TResult = Record<string, any>>({ query, variables = {} }) {
        const [queryKey, variablesKey] = getQueryCacheKey(query, variables);
        if (!this.queries[queryKey]) {
            return null;
        }

        if (!this.queries[queryKey][variablesKey]) {
            return null;
        }

        return denormalize(this.queries[queryKey][variablesKey], this.entities) as TResult;
    }

    deleteQuery({ query, variables = {} }) {
        const [queryKey, variablesKey] = getQueryCacheKey(query, variables);
        if (!this.queries[queryKey]) {
            return;
        }

        if (!this.queries[queryKey][variablesKey]) {
            return;
        }

        const entry: QueriesVariablesEntry = this.queries[queryKey][variablesKey];
        delete this.queries[queryKey][variablesKey];
        if (Object.keys(this.queries[queryKey]).length === 0) {
            delete this.queries[queryKey];
        }

        // Check if we can delete one or more entities from the entities cache.
        const entitiesToDelete = [];
        for (let i = 0; i < entry.entities.length; i++) {
            const entityId = entry.entities[i];
            let entityIsPresentInOtherQuery = false;
            nextEntity: for (const queryKey in this.queries) {
                for (const variablesKey in this.queries[queryKey]) {
                    if (this.queries[queryKey][variablesKey].entities.includes(entityId)) {
                        entityIsPresentInOtherQuery = true;
                        break nextEntity;
                    }
                }
            }

            if (!entityIsPresentInOtherQuery) {
                entitiesToDelete.push(entityId);
            }
        }

        for (let i = 0; i < entitiesToDelete.length; i++) {
            this.deleteEntity(entitiesToDelete[i]);
        }
    }

    import(queries, entities) {
        for (const queryKey in queries) {
            if (!this.queries[queryKey]) {
                this.queries[queryKey] = {};
            }

            for (const variablesKey in queries[queryKey]) {
                this.queries[queryKey][variablesKey] = queries[queryKey][variablesKey];
            }
        }

        for (const entityId in entities) {
            if (!this.entities[entityId]) {
                this.entities[entityId] = {};
            }

            Object.assign(this.entities[entityId], entities[entityId]);
        }
    }

    export() {
        return { queries: this.queries, entities: this.entities };
    }

    flush() {
        this.queries = {};
        this.entities = {};
    }

    writeEntity(id, data) {
        this.entities[id] = data;
    }
    readEntity(id) {
        return this.entities[id];
    }
    deleteEntity(id) {
        delete this.entities[id];
    }
}
