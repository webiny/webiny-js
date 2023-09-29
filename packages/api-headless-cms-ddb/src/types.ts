import { Plugin } from "@webiny/plugins/types";
import {
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsModel,
    CmsModelField,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import { AttributeDefinition } from "dynamodb-toolbox/dist/classes/Entity";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table } from "dynamodb-toolbox";

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
    SYSTEM = "CmsSystem",
    SETTINGS = "CmsSettings",
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries"
}

export interface TableModifier {
    (table: TableConstructor<string, string, string>): TableConstructor<string, string, string>;
}

export interface StorageOperationsFactoryParams {
    documentClient: DynamoDBClient;
    table?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: Plugin[] | Plugin[][];
}

export interface HeadlessCmsStorageOperations extends BaseHeadlessCmsStorageOperations {
    getTable: () => Table<string, string, string>;
    getEntities: () => Record<"system" | "settings" | "groups" | "models" | "entries", Entity<any>>;
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): HeadlessCmsStorageOperations;
}

export interface CmsEntryStorageOperations extends BaseCmsEntryStorageOperations {
    dataLoaders: DataLoadersHandlerInterface;
}

export interface DataLoadersHandlerInterfaceClearAllParams {
    model: Pick<CmsModel, "tenant" | "locale">;
}
export interface DataLoadersHandlerInterface {
    clearAll: (params?: DataLoadersHandlerInterfaceClearAllParams) => void;
}
