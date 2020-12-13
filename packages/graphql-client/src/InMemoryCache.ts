import { GraphQLClientCache } from "./types";
import normalize from "./InMemoryCache/normalize";
import denormalize from "./InMemoryCache/denormalize";
import getQueryCacheKey from "./InMemoryCache/getQueryCacheKey";
import mergeNormalizedEntities from "./InMemoryCache/mergeNormalizedEntities";
import mergeNormalizedQueries from "./InMemoryCache/mergeNormalizedQueries";

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
        const normalizedQueries = {
            [queryKey]: {
                [variablesKey]: normalizedResult
            }
        };

        this.import(normalizedQueries, normalizedEntities);
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
            // @ts-ignore
            this.deleteEntity(entitiesToDelete[i]);
        }
    }

    import(queries, entities) {
        mergeNormalizedQueries(this.queries, queries);
        mergeNormalizedEntities(this.entities, entities);
    }

    export() {
        return { queries: this.queries, entities: this.entities };
    }

    flush() {
        this.queries = {};
        this.entities = {};
    }

    writeEntity(typename, id, data) {
        this.entities[typename][id] = data;
    }
    readEntity(typename, id) {
        return this.entities[typename][id];
    }
    deleteEntity(typename, id) {
        delete this.entities[typename][id];
    }
}
