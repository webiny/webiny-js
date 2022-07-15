import { Plugin } from "@webiny/plugins/types";
import {
    CmsModelField,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types";
import { DynamoDBTypes, TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Entity, Table } from "dynamodb-toolbox";

interface CmsFieldFilterValueTransformParams {
    /**
     * A field which value we are transforming.
     */
    field: CmsModelField;
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

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "CmsSystem",
    SETTINGS = "CmsSettings",
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries"
}

export interface TableModifier {
    (table: TableConstructor): TableConstructor;
}

export interface StorageOperationsFactoryParams {
    documentClient: DocumentClient;
    table?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: Plugin[] | Plugin[][];
}

export interface HeadlessCmsStorageOperations extends BaseHeadlessCmsStorageOperations {
    getTable: () => Table;
    getEntities: () => Record<"system" | "settings" | "groups" | "models" | "entries", Entity<any>>;
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): HeadlessCmsStorageOperations;
}
