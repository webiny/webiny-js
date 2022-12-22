import DataLoader from "dataloader";
import WebinyError from "@webiny/error";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
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
    const { entity, model } = params;
    const { tenant, locale } = model;
    return new DataLoader<string, CmsEntry[]>(async (ids: readonly string[]) => {
        const results: Record<string, CmsEntry[]> = {};
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
            const items = await queryAll<CmsEntry>(queryAllParams);

            results[id] = cleanupItems(entity, items);
        }

        return ids.map(id => {
            return results[id] || [];
        });
    });
};

const getRevisionById = (params: LoaderParams) => {
    const { entity, model } = params;
    const { locale, tenant } = model;

    return new DataLoader<string, CmsEntry[]>(async (ids: readonly string[]) => {
        const queries = ids.reduce((collection, id) => {
            const partitionKey = createPartitionKey({
                tenant,
                locale,
                id
            });
            const { version } = parseIdentifier(id);
            if (!version) {
                return collection;
            }
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
            /**
             * We use any because there is no type for the return type.
             */
        }, {} as Record<string, any>);

        const records = await batchReadAll<CmsEntry>({
            table: entity.table,
            items: Object.values(queries)
        });
        const items = cleanupItems(entity, records);

        return ids.map(id => {
            return items.filter(item => {
                return id === item.id;
            });
        });
    });
};

const getPublishedRevisionByEntryId = (params: LoaderParams) => {
    const { entity, model } = params;
    const { locale, tenant } = model;

    const publishedKey = createPublishedSortKey();

    return new DataLoader<string, CmsEntry[]>(async (ids: readonly string[]) => {
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
            return collection;
            /**
             * We use any because there is no type for the return type.
             */
        }, {} as Record<string, any>);

        const records = await batchReadAll<CmsEntry>({
            table: entity.table,
            items: Object.values(queries)
        });
        const items = cleanupItems(entity, records);

        return ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return items.filter(item => {
                return entryId === item.entryId;
            });
        });
    });
};

const getLatestRevisionByEntryId = (params: LoaderParams) => {
    const { entity, model } = params;
    const { locale, tenant } = model;

    const latestKey = createLatestSortKey();

    return new DataLoader<string, CmsEntry[]>(async (ids: readonly string[]) => {
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
            return collection;
            /**
             * We use any because there is no type for the return type.
             */
        }, {} as Record<string, any>);

        const records = await batchReadAll<CmsEntry>({
            table: entity.table,
            items: Object.values(queries)
        });
        const items = cleanupItems(entity, records);

        return ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return items.filter(item => {
                return entryId === item.entryId;
            });
        });
    });
};

const dataLoaders: Record<Loaders, any> = {
    getAllEntryRevisions,
    getRevisionById,
    getPublishedRevisionByEntryId,
    getLatestRevisionByEntryId
};

export interface GetAllEntryRevisionsParams {
    ids: readonly string[];
    model: CmsModel;
}

export interface GetRevisionByIdParams {
    ids: readonly string[];
    model: CmsModel;
}

export interface GetPublishedRevisionByEntryIdParams {
    ids: readonly string[];
    model: CmsModel;
}

export interface GetLatestRevisionByEntryIdParams {
    ids: readonly string[];
    model: CmsModel;
}

interface LoaderParams {
    entity: Entity<any>;
    model: CmsModel;
}

interface GetLoaderParams {
    model: CmsModel;
}

interface ClearLoaderParams {
    model: CmsModel;
    entry?: CmsEntry;
}

type Loaders =
    | "getAllEntryRevisions"
    | "getRevisionById"
    | "getPublishedRevisionByEntryId"
    | "getLatestRevisionByEntryId";

const loaderNames = Object.keys(dataLoaders) as Loaders[];

export interface DataLoadersHandlerParams {
    entity: Entity<any>;
}
export class DataLoadersHandler {
    private readonly loaders: Map<string, DataLoader<any, any>> = new Map();
    private readonly entity: Entity<any>;

    public constructor(params: DataLoadersHandlerParams) {
        this.entity = params.entity;
    }

    public async getAllEntryRevisions(params: GetAllEntryRevisionsParams): Promise<CmsEntry[]> {
        return await this.loadMany("getAllEntryRevisions", params, params.ids);
    }

    public clearAllEntryRevisions(params: ClearLoaderParams): void {
        this.clear("getAllEntryRevisions", params);
    }

    public async getRevisionById(params: GetRevisionByIdParams): Promise<CmsEntry[]> {
        return await this.loadMany("getRevisionById", params, params.ids);
    }

    public clearRevisionById(params: ClearLoaderParams): void {
        this.clear("getRevisionById", params);
    }

    public async getPublishedRevisionByEntryId(
        params: GetPublishedRevisionByEntryIdParams
    ): Promise<CmsEntry[]> {
        return await this.loadMany("getPublishedRevisionByEntryId", params, params.ids);
    }
    public clearPublishedRevisionByEntryId(params: ClearLoaderParams): void {
        this.clear("getPublishedRevisionByEntryId", params);
    }

    public async getLatestRevisionByEntryId(
        params: GetLatestRevisionByEntryIdParams
    ): Promise<CmsEntry[]> {
        return await this.loadMany("getLatestRevisionByEntryId", params, params.ids);
    }

    public clearLatestRevisionByEntryId(params: ClearLoaderParams): void {
        this.clear("getLatestRevisionByEntryId", params);
    }
    /**
     * TODO @ts-refactor
     * Maybe pass on the generics to DataLoader definition?
     */
    private getLoader(name: Loaders, params: GetLoaderParams): DataLoader<any, any> {
        if (!dataLoaders[name]) {
            throw new WebinyError("Unknown data loader.", "UNKNOWN_DATA_LOADER", {
                name
            });
        }
        const { model } = params;
        const { tenant, locale } = model;
        const loaderKey = `${name}-${tenant}-${locale}-${model.modelId}`;
        if (!this.loaders.has(loaderKey)) {
            this.loaders.set(
                loaderKey,
                dataLoaders[name]({
                    ...params,
                    entity: this.entity
                })
            );
        }
        return this.loaders.get(loaderKey) as DataLoader<any, any>;
    }

    private async loadMany(
        loader: Loaders,
        params: GetLoaderParams,
        ids: readonly string[]
    ): Promise<CmsEntry[]> {
        let results;
        try {
            results = await this.getLoader(loader, params).loadMany(ids);
            if (Array.isArray(results) === true) {
                return results.reduce((acc, res) => {
                    if (Array.isArray(res) === false) {
                        if (res && res.message) {
                            throw new WebinyError(res.message, res.code, {
                                ...res,
                                data: JSON.stringify(res.data || {})
                            });
                        }
                        throw new WebinyError(
                            "Result from the data loader must be an array of arrays which contain requested items.",
                            "DATA_LOADER_RESULTS_ERROR",
                            {
                                ...params,
                                loader
                            }
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
                    error: ex,
                    ...params,
                    loader,
                    ids
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

    public clearAll(params: Omit<ClearLoaderParams, "entry">): void {
        for (const name of loaderNames) {
            const loader = this.getLoader(name, params);
            loader.clearAll();
        }
    }
    /**
     * Helper to clear the cache for certain data loader.
     * If entry is passed then clear target key only.
     */
    private clear(name: Loaders, params: ClearLoaderParams): void {
        const { entry } = params;
        const loader = this.getLoader(name, params);
        if (!entry) {
            loader.clearAll();
            return;
        }
        loader.clear(entry.id);
        const { tenant, locale } = params.model;
        loader.clear(
            createPartitionKey({
                tenant,
                locale,
                id: entry.id
            })
        );
    }
}
