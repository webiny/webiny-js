import { PageBuilderStorageOperations as BasePageBuilderStorageOperations } from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Plugin } from "@webiny/plugins/types";
import { DynamoDBTypes, TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "PbSystem",
    SETTINGS = "PbSettings",
    CATEGORIES = "PbCategories",
    MENUS = "PbMenus",
    PAGE_ELEMENTS = "PbPageElements",
    PAGES = "PbPages",
    BLOCK_CATEGORIES = "PbBlockCategories"
}

export interface TableModifier {
    (table: TableConstructor): TableConstructor;
}

export interface PageBuilderStorageOperations extends BasePageBuilderStorageOperations {
    getTable: () => Table;
    getEntities: () => Record<
        | "system"
        | "settings"
        | "categories"
        | "menus"
        | "pageElements"
        | "pages"
        | "blockCategories",
        Entity<any>
    >;
}

export interface StorageOperationsFactoryParams {
    documentClient: DocumentClient;
    table?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: Plugin[] | Plugin[][];
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): PageBuilderStorageOperations;
}
