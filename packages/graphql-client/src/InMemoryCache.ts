import { GraphQLClientCache, OnCacheChangeCallback } from "./types";
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
    configuration: InMemoryCacheConfiguration;
    onChangeCallbacks: OnCacheChangeCallback[];
    data: {
        queries: Record<string, Record<string, QueriesVariablesEntry>>;
        entities: Record<string, Record<string, any>>;
    };
    constructor(configuration: InMemoryCacheConfiguration = {}) {
        this.configuration = configuration;
        this.onChangeCallbacks = [];
        this.data = {
            queries: {},
            entities: {}
        };
    }

    getData() {
        return this.data;
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
        if (!this.data.queries[queryKey]) {
            return null;
        }

        if (!this.data.queries[queryKey][variablesKey]) {
            return null;
        }

        return denormalize(
            this.data.queries[queryKey][variablesKey],
            this.data.entities
        ) as TResult;
    }

    deleteQuery({ query, variables = {} }) {
        const [queryKey, variablesKey] = getQueryCacheKey(query, variables);
        if (!this.data.queries[queryKey]) {
            return;
        }

        if (!this.data.queries[queryKey][variablesKey]) {
            return;
        }

        const entry: QueriesVariablesEntry = this.data.queries[queryKey][variablesKey];
        delete this.data.queries[queryKey][variablesKey];
        if (Object.keys(this.data.queries[queryKey]).length === 0) {
            delete this.data.queries[queryKey];
        }

        // Check if we can delete one or more entities from the entities cache.
        const entitiesToDelete = [];
        for (let i = 0; i < entry.entities.length; i++) {
            const entityId = entry.entities[i];
            let entityIsPresentInOtherQuery = false;
            nextEntity: for (const queryKey in this.data.queries) {
                for (const variablesKey in this.data.queries[queryKey]) {
                    if (this.data.queries[queryKey][variablesKey].entities.includes(entityId)) {
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

    onChange(callback) {
        this.onChangeCallbacks.push(callback);
        return () => {
            this.onChangeCallbacks = this.onChangeCallbacks.filter(fn => fn !== callback);
        };
    }

    runOnChangeCallbacks() {
        for (let i = 0; i < this.onChangeCallbacks.length; i++) {
            this.onChangeCallbacks[i]();
        }
    }

    import(queries, entities) {
        mergeNormalizedQueries(this.data.queries, queries);
        mergeNormalizedEntities(this.data.entities, entities);
        this.runOnChangeCallbacks();
    }

    export() {
        return { queries: this.data.queries, entities: this.data.entities };
    }

    flush() {
        this.data = {
            queries: {},
            entities: {}
        };
        this.runOnChangeCallbacks();
    }

    writeEntity({ id, typename }, data) {
        if (!this.data.entities[typename]) {
            this.data.entities[typename] = {};
        }

        this.data.entities[typename][id] = data;
        this.runOnChangeCallbacks();
    }

    readEntity({ id, typename }) {
        if (!this.data.entities[typename]) {
            return null;
        }
        return this.data.entities[typename][id] || null;
    }

    deleteEntity({ id, typename }) {
        if (!this.data.entities[typename]) {
            return;
        }

        delete this.data.entities[typename][id];

        if (Object.keys(this.data.entities[typename]).length === 0) {
            delete this.data.entities[typename];
        }

        this.runOnChangeCallbacks();
    }
}
