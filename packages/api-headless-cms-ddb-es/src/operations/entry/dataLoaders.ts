import DataLoader from "dataloader";
import { CmsContentEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import CmsContentEntryDynamoElastic from "./CmsContentEntryDynamoElastic";
import lodashChunk from "lodash.chunk";
import configurations from "../../configurations";

// Used in functions below. Ensures we are batch getting 100 keys at most.
const batchLoadKeys = loadChunk => {
    return new DataLoader<string, CmsContentEntry>(async keys => {
        // DynamoDB allows getting a maximum of 100 items in a single database call.
        // So, we are creating chunks that consist of a maximum of 100 keys.
        const keysChunks = lodashChunk(keys, 100);
        const promises = [];

        keysChunks.forEach(chunk => {
            promises.push(new Promise(resolve => resolve(loadChunk(chunk))));
        });

        const entriesChunks = await Promise.all(promises);
        return entriesChunks.reduce((current, items) => current.concat(items), []);
    });
};

const flattenResults = (results: any[]): any[] => {
    return results.reduce((collection, items) => {
        collection.push(...items);
        return collection;
    }, []);
};

const getAllEntryRevisions = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamoElastic
) => {
    return new DataLoader<string, CmsContentEntry[]>(async ids => {
        const results = [];

        for (const id of ids) {
            const [entries] = await context.db.read({
                ...configurations.db(),
                query: {
                    PK: storageOperations.getPartitionKey(id),
                    SK: { $beginsWith: "REV#" }
                }
            });

            results.push(entries);
        }

        return results;
    });
};

const getRevisionById = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamoElastic
) => {
    return batchLoadKeys(keys => {
        const queries = keys.reduce((collection, id) => {
            const partitionKey = storageOperations.getPartitionKey(id);
            const sortKey = storageOperations.getSortKeyRevision(id);
            const keys = `${partitionKey}__${sortKey}`;
            if (collection[keys]) {
                return collection;
            }
            collection[keys] = {
                ...configurations.db(),
                query: {
                    PK: storageOperations.getPartitionKey(id),
                    SK: storageOperations.getSortKeyRevision(id)
                }
            };

            return collection;
        }, {});

        return context.db
            .batch()
            .read(...Object.values(queries))
            .execute()
            .then(results => results.map(result => result[0]))
            .then(results => {
                const items = flattenResults(results);
                return keys.map(id => {
                    return items.filter(item => {
                        const partitionKey = storageOperations.getPartitionKey(id);
                        const sortKey = storageOperations.getSortKeyRevision(id);
                        return item.PK === partitionKey && item.SK === sortKey;
                    });
                }) as any;
            });
    });
};

const getPublishedRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamoElastic
) => {
    return batchLoadKeys(keys => {
        const sortKey = storageOperations.getSortKeyPublished();
        const queries = keys.reduce((collection, id) => {
            const partitionKey = storageOperations.getPartitionKey(id);
            if (collection[partitionKey]) {
                return collection;
            }
            collection[partitionKey] = {
                ...configurations.db(),
                query: {
                    PK: partitionKey,
                    SK: sortKey
                }
            };
            return collection;
        }, {});

        return context.db
            .batch()
            .read(...Object.values(queries))
            .execute()
            .then(results => results.map(result => result[0]))
            .then(results => {
                const items = flattenResults(results);
                return keys.map(id => {
                    return items.filter(item => {
                        const partitionKey = storageOperations.getPartitionKey(id);
                        return item.PK === partitionKey && item.SK === sortKey;
                    });
                }) as any;
            });
    });
};

const getLatestRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamoElastic
) => {
    return batchLoadKeys(keys => {
        const sortKey = storageOperations.getSortKeyLatest();
        const queries = keys.reduce((collection, id) => {
            const partitionKey = storageOperations.getPartitionKey(id);
            if (collection[partitionKey]) {
                return collection;
            }
            collection[partitionKey] = {
                ...configurations.db(),
                query: {
                    PK: storageOperations.getPartitionKey(id),
                    SK: sortKey
                }
            };
            return collection;
        }, {});

        return context.db
            .batch()
            .read(...Object.values(queries))
            .execute()
            .then(results => results.map(result => result[0]))
            .then(results => {
                const items = flattenResults(results);
                return keys.map(id => {
                    return items.filter(item => {
                        const partitionKey = storageOperations.getPartitionKey(id);
                        return item.PK === partitionKey && item.SK === sortKey;
                    });
                }) as any;
            });
    });
};

const dataLoaders = {
    getAllEntryRevisions,
    getRevisionById,
    getPublishedRevisionByEntryId,
    getLatestRevisionByEntryId
};

export class DataLoadersHandler {
    private readonly _loaders: Map<string, DataLoader<any, any>> = new Map();
    private readonly _context: CmsContext;
    private readonly _storageOperations: CmsContentEntryDynamoElastic;

    public constructor(context: CmsContext, storageOperations: CmsContentEntryDynamoElastic) {
        this._context = context;
        this._storageOperations = storageOperations;
    }

    public async getAllEntryRevisions(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        return await this.loadMany("getAllEntryRevisions", model, ids);
    }

    public clearAllEntryRevisions(model: CmsContentModel, entry?: CmsContentEntry): void {
        this.clear("getAllEntryRevisions", model, entry);
    }

    public async getRevisionById(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        return await this.loadMany("getRevisionById", model, ids);
    }

    public clearRevisionById(model: CmsContentModel, entry?: CmsContentEntry): void {
        this.clear("getRevisionById", model, entry);
    }

    public async getPublishedRevisionByEntryId(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        return await this.loadMany("getPublishedRevisionByEntryId", model, ids);
    }
    public clearPublishedRevisionByEntryId(model: CmsContentModel, entry?: CmsContentEntry): void {
        this.clear("getPublishedRevisionByEntryId", model, entry);
    }

    public async getLatestRevisionByEntryId(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        return await this.loadMany("getLatestRevisionByEntryId", model, ids);
    }

    public clearLatestRevisionByEntryId(model: CmsContentModel, entry?: CmsContentEntry): void {
        this.clear("getLatestRevisionByEntryId", model, entry);
    }

    private getLoader(name: string, model: CmsContentModel): DataLoader<any, any> {
        if (!dataLoaders[name]) {
            throw new WebinyError("Unknown data loader.", "UNKNOWN_DATA_LOADER", {
                name
            });
        }
        const loaderKey = `${name}-${model.modelId}`;
        if (!this._loaders.has(loaderKey)) {
            this._loaders.set(
                loaderKey,
                dataLoaders[name](this._context, model, this._storageOperations)
            );
        }
        return this._loaders.get(loaderKey);
    }

    private async loadMany(
        loader: string,
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        let results;
        try {
            results = await this.getLoader(loader, model).loadMany(ids);
            if (Array.isArray(results) === true) {
                return results.reduce((acc, res) => {
                    if (Array.isArray(res) === false) {
                        if (res?.message) {
                            throw new WebinyError(res.message, res.code, {
                                ...res,
                                data: JSON.stringify(res.data || {})
                            });
                        }
                        throw new WebinyError(
                            "Result from the data loader must be an array of arrays which contain requested items."
                        );
                    }
                    acc.push(...res);
                    return acc;
                }, []);
            }
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Data loader error.",
                ex.code || "DATA_LOADER_ERROR",
                {
                    loader,
                    ids,
                    model
                }
            );
        }
        throw new WebinyError(
            `Data loader did not return array of items or empty array.`,
            "INVALID_DATA_LOADER_RESULT",
            {
                loader,
                ids,
                results
            }
        );
    }
    /**
     * Helper to clear the cache for certain data loader.
     * If entry is passed then clear target key only.
     */
    private clear(name: string, model: CmsContentModel, entry?: CmsContentEntry): void {
        const loader = this.getLoader(name, model);
        if (!entry) {
            loader.clearAll();
            return;
        }
        loader.clear(entry.id);
        loader.clear(this._storageOperations.getPartitionKey(entry.id));
    }
}
