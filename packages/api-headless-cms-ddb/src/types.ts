import type {
    CmsContext,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { IEntryEntity, IGroupEntity, IModelEntity } from "~/definitions/types.js";

export type { CmsContext };

export type { IGroupEntity, IModelEntity, IEntryEntity };

export enum ENTITIES {
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries"
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
