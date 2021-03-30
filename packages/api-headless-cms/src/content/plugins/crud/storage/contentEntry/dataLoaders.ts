import DataLoader from "dataloader";
import { CmsContentEntry, CmsContentModel, CmsContext } from "../../../../../types";
import WebinyError from "@webiny/error";
import CmsContentEntryCrudDynamoElastic from "./dynamoElastic";
import * as utils from "../../../../../utils";
import chunk from "lodash/chunk";

// Used in functions below. Ensures we are batch getting 100 keys at most.
const batchLoadKeys = loadChunk => {
    return new DataLoader<string, CmsContentEntry>(async keys => {
        // DynamoDB allows getting a maximum of 100 items in a single database call.
        // So, we are creating chunks that consist of a maximum of 100 keys.
        const keysChunks = chunk(keys, 100);
        const promises = [];

        keysChunks.forEach(chunk => {
            promises.push(new Promise(resolve => resolve(loadChunk(chunk))));
        });

        const entriesChunks = await Promise.all(promises);
        return entriesChunks.reduce((current, item) => current.concat(item), []);
    });
};

const getAllEntryRevisions = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryCrudDynamoElastic
) => {
    return new DataLoader<string, CmsContentEntry[]>(async ids => {
        const results = [];

        for (const id of ids) {
            const [entries] = await context.db.read({
                ...utils.defaults.db(),
                query: {
                    PK: storageOperations.getPrimaryKey(id),
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
    storageOperations: CmsContentEntryCrudDynamoElastic
) => {
    return batchLoadKeys(keys => {
        const queries = keys.map(id => ({
            ...utils.defaults.db(),
            query: {
                PK: storageOperations.getPrimaryKey(id),
                SK: storageOperations.getSecondaryKeyRevision(id)
            }
        }));

        return context.db
            .batch()
            .read(...queries)
            .execute()
            .then(results => results.map(result => result[0]));
    });
};

const getPublishedRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryCrudDynamoElastic
) => {
    return batchLoadKeys(keys => {
        const queries = keys.map(id => ({
            ...utils.defaults.db(),
            query: {
                PK: storageOperations.getPrimaryKey(id),
                SK: storageOperations.getSecondaryKeyPublished()
            }
        }));
        return context.db
            .batch()
            .read(...queries)
            .execute()
            .then(results => results.map(result => result[0]));
    });
};

const getLatestRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryCrudDynamoElastic
) => {
    return batchLoadKeys(chunk =>
        context.db
            .batch()
            .read(
                ...chunk.map(id => ({
                    ...utils.defaults.db(),
                    query: {
                        PK: storageOperations.getPrimaryKey(id),
                        SK: storageOperations.getSecondaryKeyLatest()
                    }
                }))
            )
            .execute()
            .then(results => results.map(result => result[0]))
    );
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
    private readonly _storageOperations: CmsContentEntryCrudDynamoElastic;

    public constructor(context: CmsContext, storageOperations: CmsContentEntryCrudDynamoElastic) {
        this._context = context;
        this._storageOperations = storageOperations;
    }

    public async getAllEntryRevisions(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        const items = await this.loadMany("getAllEntryRevisions", model, ids);

        return items;
    }

    public async getRevisionById(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        const items = await this.loadMany("getRevisionById", model, ids);

        return items;
    }

    public async getPublishedRevisionByEntryId(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        const items = await this.loadMany("getPublishedRevisionByEntryId", model, ids);

        return items;
    }

    public async getLatestRevisionByEntryId(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        const items = await this.loadMany("getLatestRevisionByEntryId", model, ids);

        return items;
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
}
