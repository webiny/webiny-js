import DataLoader from "dataloader";
import { CmsContentEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import { CmsContentEntryDynamo } from "./CmsContentEntryDynamo";

/**
 * *** GLOBAL NOTE ***
 * When records are received from the batch get, we get them in all sorts of order.
 * What we need for DataLoader to work properly we must have id > records order.
 * So in the order IDs got into the DataLoader, its records must go out in the same order / bundle.
 */

const flatResponses = (responses: Record<string, CmsContentEntry[]>): CmsContentEntry[] => {
    const entries = [];
    const values = Object.values(responses);
    for (const items of values) {
        entries.push(...items);
    }
    return entries;
};

const executeBatchGet = async (storageOperations: CmsContentEntryDynamo, batch: any[]) => {
    const items = [];
    const result = await storageOperations.table.batchGet(batch);
    if (!result) {
        return items;
    }
    if (result.Responses) {
        items.push(...flatResponses(result.Responses));
    }
    if (typeof result.next === "function") {
        let previous = result;
        let nResult;
        while ((nResult = await previous.next())) {
            items.push(...flatResponses(nResult.Responses));
            previous = nResult;
            if (!nResult || typeof nResult.next !== "function") {
                return items;
            }
        }
    }

    return items;
};

const getAllEntryRevisions = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamo
) => {
    return new DataLoader<string, CmsContentEntry[]>(async ids => {
        const promises = ids.map(id => {
            const partitionKey = storageOperations.getPartitionKey(id);
            return storageOperations.runQuery({
                partitionKey,
                options: {
                    beginsWith: "REV#"
                }
            });
        });

        return Promise.all(promises);
    });
};

const getRevisionById = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamo
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        const batch = ids.reduce((collection, id) => {
            const partitionKey = storageOperations.getPartitionKey(id);
            const sortKey = storageOperations.getSortKeyRevision(id);
            const keys = `${partitionKey}__${sortKey}`;
            if (collection[keys]) {
                return collection;
            }
            collection[keys] = storageOperations.entity.getBatch({
                PK: partitionKey,
                SK: sortKey
            });
            return collection;
        }, {});

        const items = await executeBatchGet(storageOperations, Object.values(batch));

        return ids.map(id => {
            return items.filter(item => {
                const partitionKey = storageOperations.getPartitionKey(id);
                const sortKey = storageOperations.getSortKeyRevision(id);
                return item.PK === partitionKey && item.SK === sortKey;
            });
        }) as any;
    });
};

const getPublishedRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamo
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        const sortKey = storageOperations.getSortKeyPublished();
        const batch = ids.reduce((collection, id) => {
            const partitionKey = storageOperations.getPartitionKey(id);
            if (collection[partitionKey]) {
                return collection;
            }
            collection[partitionKey] = storageOperations.entity.getBatch({
                PK: partitionKey,
                SK: sortKey
            });
            return collection;
        }, {});

        const items = await executeBatchGet(storageOperations, Object.values(batch));
        return ids.map(id => {
            return items.filter(item => {
                const partitionKey = storageOperations.getPartitionKey(id);
                return item.PK === partitionKey && item.SK === sortKey;
            });
        }) as any;
    });
};

const getLatestRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryDynamo
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        const sortKey = storageOperations.getSortKeyLatest();
        const batch = ids.reduce((collection, id) => {
            const partitionKey = storageOperations.getPartitionKey(id);
            if (collection[partitionKey]) {
                return collection;
            }
            collection[partitionKey] = storageOperations.entity.getBatch({
                PK: partitionKey,
                SK: sortKey
            });
            return collection;
        }, {});

        const items = await executeBatchGet(storageOperations, Object.values(batch));
        return ids.map(id => {
            return items.filter(item => {
                const partitionKey = storageOperations.getPartitionKey(id);
                return item.PK === partitionKey && item.SK === sortKey;
            });
        }) as any;
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
    private readonly _storageOperations: CmsContentEntryDynamo;

    public constructor(context: CmsContext, storageOperations: CmsContentEntryDynamo) {
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
                    model,
                    data: ex.data || {}
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
