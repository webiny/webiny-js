import type {
    CmsContext,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations
} from "@webiny/api-headless-cms/types/index.js";

export { CmsContext };

export enum ENTITIES {
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries",
    ENTRIES_ES = "CmsEntriesElasticsearch"
}

export interface CmsEntryStorageOperations extends BaseCmsEntryStorageOperations {
    dataLoaders: IDataLoadersHandler;
}

export interface DataLoadersHandlerInterfaceClearAllParams {
    tenant: string;
}
export interface IDataLoadersHandler {
    clearAll: (params?: DataLoadersHandlerInterfaceClearAllParams) => void;
}
