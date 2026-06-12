import { type Plugin, PluginsContainer } from "@webiny/plugins/types.js";
import type {
    CmsContext,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsModelField,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IEntryEntity, IGroupEntity, IModelEntity } from "~/definitions/types.js";
import type { ITable } from "@webiny/db-dynamodb";

export type { CmsContext };

export type { IGroupEntity, IModelEntity, IEntryEntity };

interface CmsFieldFilterValueTransformParams {
    /**
     * A field which value we are transforming.
     */
    field: Partial<CmsModelField> &
        Pick<CmsModelField, "id" | "storageId" | "fieldId" | "settings">;
    value: any;
}

export interface CmsFieldFilterValueTransformPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-field-filter-value-transform";
    /**
     * A field type this plugin is for.
     */
    fieldType: string;
    /**
     * Transform method which expect field definition and value to transform.
     */
    transform: (params: CmsFieldFilterValueTransformParams) => any;
}

export enum ENTITIES {
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries"
}

export interface StorageOperationsFactoryParams {
    documentClient: DynamoDBDocument;
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
