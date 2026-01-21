import type DataLoader from "dataloader";
import WebinyError from "@webiny/error";
import type {
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { CacheKeyParams } from "~/operations/entry/dataLoader/DataLoaderCache.js";
import { DataLoaderCache } from "~/operations/entry/dataLoader/DataLoaderCache.js";
import type { DataLoaders } from "~/operations/entry/dataLoader/index.js";
import { getDataLoaderFactory } from "~/operations/entry/dataLoader/index.js";
import { parseIdentifier } from "@webiny/utils";
import type { DataLoadersHandlerInterfaceClearAllParams, IDataLoadersHandler } from "~/types.js";
import type { IEntryEntity } from "~/definitions/types.js";

interface DataLoaderParams {
    model: Pick<CmsModel, "tenant" | "modelId">;
    ids: readonly string[];
}

interface GetLoaderParams {
    model: Pick<CmsModel, "tenant" | "modelId">;
}

interface IDataLoadersHandlerParams {
    entity: IEntryEntity;
}

export interface ClearAllParams {
    model: Pick<CmsModel, "tenant" | "modelId">;
}

export class DataLoadersHandler implements IDataLoadersHandler {
    private readonly entity;
    private readonly cache = new DataLoaderCache();

    public constructor(params: IDataLoadersHandlerParams) {
        this.entity = params.entity;
    }

    public async getAllEntryRevisions<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoaderParams
    ): Promise<CmsStorageEntry<T>[]> {
        const ids = params.ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return entryId;
        });
        return await this.loadMany<T>("getAllEntryRevisions", params, ids);
    }

    public async getRevisionById<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoaderParams
    ): Promise<CmsStorageEntry<T>[]> {
        return await this.loadMany<T>("getRevisionById", params, params.ids);
    }

    public async getPublishedRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoaderParams
    ): Promise<CmsStorageEntry<T>[]> {
        const ids = params.ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return entryId;
        });
        return await this.loadMany<T>("getPublishedRevisionByEntryId", params, ids);
    }

    public async getLatestRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoaderParams
    ): Promise<CmsStorageEntry<T>[]> {
        const ids = params.ids.map(id => {
            const { id: entryId } = parseIdentifier(id);
            return entryId;
        });
        return await this.loadMany<T>("getLatestRevisionByEntryId", params, ids);
    }

    /**
     * TODO @ts-refactor
     * Maybe pass on the generics to DataLoader definition?
     */
    private getLoader(name: DataLoaders, params: GetLoaderParams): DataLoader<any, any> {
        const { model } = params;
        const cacheParams: CacheKeyParams = {
            tenant: model.tenant,
            name
        };
        let loader = this.cache.getDataLoader(cacheParams);
        if (loader) {
            return loader;
        }
        const factory = getDataLoaderFactory(name);
        loader = factory({
            entity: this.entity,
            tenant: model.tenant
        });
        this.cache.setDataLoader(cacheParams, loader);
        return loader;
    }

    private async loadMany<T extends CmsEntryValues = CmsEntryValues>(
        loader: DataLoaders,
        params: GetLoaderParams,
        ids: readonly string[]
    ): Promise<CmsStorageEntry<T>[]> {
        let results: CmsStorageEntry<T>[] = [];
        try {
            results = await this.getLoader(loader, params).loadMany(ids);
            if (Array.isArray(results) === true) {
                return results.reduce<CmsStorageEntry<T>[]>((acc, res) => {
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
}
