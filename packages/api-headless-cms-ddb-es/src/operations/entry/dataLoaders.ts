import DataLoader from "dataloader";
import { CmsContentEntry, CmsContentModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import { Entity } from "dynamodb-toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import {
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "./keys";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { parseIdentifier } from "@webiny/utils";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";

const getAllEntryRevisions = (params: LoaderParams) => {
    const { entity, locale, tenant } = params;
    return new DataLoader<string, CmsContentEntry[]>(async ids => {
        const results = [];
        for (const id of ids) {
            const queryAllParams: QueryAllParams = {
                entity,
                partitionKey: createPartitionKey({
                    tenant,
                    locale,
                    id
                }),
                options: {
                    beginsWith: "REV#"
                }
            };
            const items = await queryAll<CmsContentEntry>(queryAllParams);
            const entries = cleanupItems(entity, items);
            results.push(entries);
        }

        return results;
    });
};

const getRevisionById = (params: LoaderParams) => {
    const { entity, locale, tenant } = params;

    return new DataLoader<string, CmsContentEntry>(async (ids: readonly string[]) => {
        const queries = ids.reduce((collection, id) => {
            const partitionKey = createPartitionKey({
                tenant,
                locale,
                id
            });
            const { version } = parseIdentifier(id);
            const sortKey = createRevisionSortKey({
                version
            });
            const keys = `${partitionKey}__${sortKey}`;
            if (collection[keys]) {
                return collection;
            }

            collection[keys] = entity.getBatch({
                PK: partitionKey,
                SK: sortKey
            });

            return collection;
        }, {});

        const records = await batchReadAll<CmsContentEntry>({
            table: entity.table,
            items: Object.values(queries)
        });
        const items = cleanupItems(entity, records);

        return ids.map(id => {
            return items.find(item => {
                return id === item.id;
            });
        });
    });
};

const getPublishedRevisionByEntryId = (params: LoaderParams) => {
    const { entity, locale, tenant } = params;

    const publishedKey = createPublishedSortKey();

    return new DataLoader<string, CmsContentEntry>(async ids => {
        const queries = ids.reduce((collection, id) => {
            const partitionKey = createPartitionKey({
                tenant,
                locale,
                id
            });
            if (collection[partitionKey]) {
                return collection;
            }
            collection[partitionKey] = entity.getBatch({
                PK: partitionKey,
                SK: publishedKey
            });
        }, {});

        const records = await batchReadAll<CmsContentEntry>({
            table: entity.table,
            items: Object.values(queries)
        });
        const items = cleanupItems(entity, records);

        return ids.map(id => {
            return items.find(item => {
                return id === item.id;
            });
        });
    });
};

const getLatestRevisionByEntryId = (params: LoaderParams) => {
    const { entity, locale, tenant } = params;

    const latestKey = createLatestSortKey();

    return new DataLoader<string, CmsContentEntry>(async ids => {
        const queries = ids.reduce((collection, id) => {
            const partitionKey = createPartitionKey({
                tenant,
                locale,
                id
            });
            if (collection[partitionKey]) {
                return collection;
            }
            collection[partitionKey] = entity.getBatch({
                PK: partitionKey,
                SK: latestKey
            });
        }, {});

        const records = await batchReadAll<CmsContentEntry>({
            table: entity.table,
            items: Object.values(queries)
        });
        const items = cleanupItems(entity, records);

        return ids.map(id => {
            return items.find(item => {
                return id === item.id;
            });
        });
    });
};

const dataLoaders = {
    getAllEntryRevisions,
    getRevisionById,
    getPublishedRevisionByEntryId,
    getLatestRevisionByEntryId
};

export interface GetAllEntryRevisionsParams {
    ids: readonly string[];
    model: CmsContentModel;
    tenant: string;
    locale: string;
}

export interface GetRevisionByIdParams {
    ids: readonly string[];
    model: CmsContentModel;
    tenant: string;
    locale: string;
}

export interface GetPublishedRevisionByEntryIdParams {
    ids: readonly string[];
    model: CmsContentModel;
    tenant: string;
    locale: string;
}

export interface GetLatestRevisionByEntryIdParams {
    ids: readonly string[];
    model: CmsContentModel;
    tenant: string;
    locale: string;
}

interface LoaderParams {
    entity: Entity<any>;
    model: CmsContentModel;
    tenant: string;
    locale: string;
}

interface GetLoaderParams {
    model: CmsContentModel;
    tenant: string;
    locale: string;
}

interface ClearLoaderParams {
    tenant: string;
    locale: string;
    model: CmsContentModel;
    entry?: CmsContentEntry;
}

export interface Params {
    entity: Entity<any>;
}
export class DataLoadersHandler {
    private readonly loaders: Map<string, DataLoader<any, any>> = new Map();
    private readonly entity: Entity<any>;

    public constructor(params) {
        this.entity = params.entity;
    }

    public async getAllEntryRevisions(
        params: GetAllEntryRevisionsParams
    ): Promise<CmsContentEntry[]> {
        return await this.loadMany("getAllEntryRevisions", params, params.ids);
    }

    public clearAllEntryRevisions(params: ClearLoaderParams): void {
        this.clear("getAllEntryRevisions", params);
    }

    public async getRevisionById(params: GetRevisionByIdParams): Promise<CmsContentEntry[]> {
        return await this.loadMany("getRevisionById", params, params.ids);
    }

    public clearRevisionById(params: ClearLoaderParams): void {
        this.clear("getRevisionById", params);
    }

    public async getPublishedRevisionByEntryId(
        params: GetPublishedRevisionByEntryIdParams
    ): Promise<CmsContentEntry[]> {
        return await this.loadMany("getPublishedRevisionByEntryId", params, params.ids);
    }
    public clearPublishedRevisionByEntryId(params: ClearLoaderParams): void {
        this.clear("getPublishedRevisionByEntryId", params);
    }

    public async getLatestRevisionByEntryId(
        params: GetLatestRevisionByEntryIdParams
    ): Promise<CmsContentEntry[]> {
        return await this.loadMany("getLatestRevisionByEntryId", params, params.ids);
    }

    public clearLatestRevisionByEntryId(params: ClearLoaderParams): void {
        this.clear("getLatestRevisionByEntryId", params);
    }

    private getLoader(name: string, params: GetLoaderParams): DataLoader<any, any> {
        if (!dataLoaders[name]) {
            throw new WebinyError("Unknown data loader.", "UNKNOWN_DATA_LOADER", {
                name
            });
        }
        const loaderKey = `${name}-${params.tenant}-${params.locale}-${params.model.modelId}`;
        if (!this.loaders.has(loaderKey)) {
            this.loaders.set(loaderKey, dataLoaders[name](params));
        }
        return this.loaders.get(loaderKey);
    }

    private async loadMany(
        loader: string,
        params: GetLoaderParams,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        let results;
        try {
            results = await this.getLoader(loader, params).loadMany(ids);
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
                    ...params
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
    private clear(name: string, params: ClearLoaderParams): void {
        const { entry } = params;
        const loader = this.getLoader(name, params);
        if (!entry) {
            loader.clearAll();
            return;
        }
        loader.clear(entry.id);
        loader.clear(
            createPartitionKey({
                ...params,
                id: entry.id
            })
        );
    }
}
