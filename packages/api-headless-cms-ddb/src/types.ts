import type { Plugin } from "@webiny/plugins/types.js";
import type {
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsModel,
    CmsModelField,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { AttributeDefinition, Table } from "@webiny/db-dynamodb/toolbox.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IEntryEntity, IGroupEntity, IModelEntity } from "~/definitions/types.js";

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

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries"
}

export interface StorageOperationsFactoryParams {
    documentClient: DynamoDBDocument;
    table?: string;
    plugins?: Plugin[] | Plugin[][];
}

export interface IHeadlessCmsStorageOperationsGetEntitiesResult {
    groups: IGroupEntity;
    models: IModelEntity;
    entries: IEntryEntity;
}

export interface HeadlessCmsStorageOperations extends BaseHeadlessCmsStorageOperations {
    getTable: () => Table<string, string, string>;
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
