import type {
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";

export enum ENTITIES {
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries"
}

export interface DataLoadersHandlerInterfaceClearAllParams {
    tenant: string;
}

export interface DataLoadersHandlerDataLoaderParams {
    model: Pick<CmsModel, "tenant" | "modelId">;
    ids: readonly string[];
}

export interface IDataLoadersHandler {
    getAllEntryRevisions<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoadersHandlerDataLoaderParams
    ): Promise<CmsStorageEntry<T>[]>;
    getRevisionById<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoadersHandlerDataLoaderParams
    ): Promise<CmsStorageEntry<T>[]>;
    getPublishedRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoadersHandlerDataLoaderParams
    ): Promise<CmsStorageEntry<T>[]>;
    getLatestRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
        params: DataLoadersHandlerDataLoaderParams
    ): Promise<CmsStorageEntry<T>[]>;
    clearAll: (params?: DataLoadersHandlerInterfaceClearAllParams) => void;
}
