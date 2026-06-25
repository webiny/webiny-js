import { PluginsContainer } from "@webiny/plugins/types.js";
import type {
    CmsContext,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsModel,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { IEntryEntity, IGroupEntity, IModelEntity } from "~/definitions/types.js";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";

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
    getTable: () => DynamoDbDocumentClient.Interface;
    getEntities: () => IHeadlessCmsStorageOperationsGetEntitiesResult;
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): HeadlessCmsStorageOperations;
}

export interface CmsEntryStorageOperations extends BaseCmsEntryStorageOperations {
    dataLoaders: IDataLoadersHandler;
}

export interface DataLoadersHandlerInterfaceClearAllParams {
    model: Pick<CmsModel, "tenant">;
}
export interface IDataLoadersHandler {
    clearAll: (params?: DataLoadersHandlerInterfaceClearAllParams) => void;
}
