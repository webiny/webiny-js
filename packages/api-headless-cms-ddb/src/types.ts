import { Plugin } from "@webiny/plugins/types";
import {
    CmsContentModelField,
    CmsModelFieldToGraphQLPlugin,
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
    field: CmsContentModelField;
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

interface CmsFieldFilterPathParams {
    /**
     * A field for which we are creating the value path.
     */
    field: CmsContentModelField;
    /**
     * If value is an array we will need index position.
     * It is up to the developer to add.
     */
    index?: number | string;
}
export interface CmsFieldFilterPathPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-field-filter-path";
    /**
     * A field type this plugin is for.
     */
    fieldType: string;
    /**
     * A field id this plugin is for.
     * It is meant for targeting only specific fields in a certain type.
     */
    fieldId?: string[];
    /**
     * Get a path for given field.
     */
    createPath: (params: CmsFieldFilterPathParams) => string;
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
    table: TableModifier;
    modelFieldToGraphQLPlugins: CmsModelFieldToGraphQLPlugin[];
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
