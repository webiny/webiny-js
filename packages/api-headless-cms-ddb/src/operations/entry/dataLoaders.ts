import DataLoader from "dataloader";
import WebinyError from "@webiny/error";
import { CmsModel, CmsStorageEntry } from "@webiny/api-headless-cms/types";
import { CacheKeyParams, DataLoaderCache } from "~/operations/entry/dataLoader/DataLoaderCache";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { DataLoaders, getDataLoaderFactory } from "~/operations/entry/dataLoader";
import { parseIdentifier } from "@webiny/utils";
import { DataLoadersHandlerInterface, DataLoadersHandlerInterfaceClearAllParams } from "~/types";

interface DataLoaderParams {
    model: Pick<CmsModel, "tenant" | "locale" | "modelId">;
    ids: readonly string[];
    deleted: boolean;
}

interface GetLoaderParams {
    model: Pick<CmsModel, "tenant" | "locale" | "modelId">;
}

interface DataLoadersHandlerParams {
    entity: Entity<any>;
}

export class DataLoadersHandler implements DataLoadersHandlerInterface {
    private readonly entity: Entity<any>;
    private readonly cache: DataLoaderCache = new DataLoaderCache();

    public constructor(params: DataLoadersHandlerParams) {
        this.entity = params.entity;
    }

    public async getAllEntryRevisions(params: DataLoaderParams): Promise<CmsStorageEntry[]> {
        const ids = params.ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return entryId;
        });
        const entries = await this.loadMany("getAllEntryRevisions", params, ids);
        return this.filterEntriesByDeletedField(entries, params.deleted);
    }

    public async getRevisionById(params: DataLoaderParams): Promise<CmsStorageEntry[]> {
        const entries = await this.loadMany("getRevisionById", params, params.ids);
        return this.filterEntriesByDeletedField(entries, params.deleted);
    }

    public async getPublishedRevisionByEntryId(
        params: DataLoaderParams
    ): Promise<CmsStorageEntry[]> {
        const ids = params.ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return entryId;
        });
        const entries = await this.loadMany("getPublishedRevisionByEntryId", params, ids);
        return this.filterEntriesByDeletedField(entries, params.deleted);
    }

    public async getLatestRevisionByEntryId(params: DataLoaderParams): Promise<CmsStorageEntry[]> {
        const ids = params.ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return entryId;
        });
        const entries = await this.loadMany("getLatestRevisionByEntryId", params, ids);
        return this.filterEntriesByDeletedField(entries, params.deleted);
    }

    /**
     * TODO @ts-refactor
     * Maybe pass on the generics to DataLoader definition?
     */
    private getLoader(name: DataLoaders, params: GetLoaderParams): DataLoader<any, any> {
        const { model } = params;
        const cacheParams: CacheKeyParams = {
            tenant: model.tenant,
            locale: model.locale,
            name
        };
        let loader = this.cache.getDataLoader(cacheParams);
        if (loader) {
            return loader;
        }
        const factory = getDataLoaderFactory(name);
        loader = factory({
            entity: this.entity,
            tenant: model.tenant,
            locale: model.locale
        });
        this.cache.setDataLoader(cacheParams, loader);
        return loader;
    }

    private async loadMany(
        loader: DataLoaders,
        params: GetLoaderParams,
        ids: readonly string[]
    ): Promise<CmsStorageEntry[]> {
        let results: any[] = [];
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

    public clearAll(params?: DataLoadersHandlerInterfaceClearAllParams): void {
        this.cache.clearAll(params?.model);
    }

    private filterEntriesByDeletedField(
        entries: CmsStorageEntry[],
        includeDeleted = false
    ): CmsStorageEntry[] {
        return entries.filter(entry => (includeDeleted ? entry.deleted : !entry.deleted));
    }
}
