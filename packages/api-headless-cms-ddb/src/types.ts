import { PluginsContainer } from "@webiny/plugins/types.js";
import type {
    CmsContext,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsModelField,
    CmsModel,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { IEntryEntity, IGroupEntity, IModelEntity } from "~/definitions/types.js";
import type { ITable } from "@webiny/db-dynamodb";

export type { CmsContext };

export type { IGroupEntity, IModelEntity, IEntryEntity };

export enum ENTITIES {
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries"
}

export interface StorageOperationsFactoryParams {
    table?: string;
    plugins: PluginsContainer;
    container: CmsContext["container"];
}

export interface IHeadlessCmsStorageOperationsGetEntitiesResult {
    groups: IGroupEntity;
    models: IModelEntity;
    entries: IEntryEntity;
}

export interface HeadlessCmsStorageOperations extends BaseHeadlessCmsStorageOperations {
    getTable: () => ITable;
    getEntities: () => IHeadlessCmsStorageOperationsGetEntitiesResult;
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): HeadlessCmsStorageOperations;
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
