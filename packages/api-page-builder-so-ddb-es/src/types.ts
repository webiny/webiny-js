import {
    BlockCategoryStorageOperations as BaseBlockCategoryStorageOperations,
    CategoryStorageOperations as BaseCategoryStorageOperations,
    PageBlockStorageOperations as BasePageBlockStorageOperations,
    PageBuilderContextObject,
    PageBuilderStorageOperations as BasePageBuilderStorageOperations,
    PageTemplateStorageOperations as BasePageTemplateStorageOperations,
    PbContext as BasePbContext
} from "@webiny/api-page-builder/types";
import { AttributeDefinition, Entity, Table, TableConstructor } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Client } from "@elastic/elasticsearch";
import { PluginCollection } from "@webiny/plugins/types";

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "PbSystem",
    SETTINGS = "PbSettings",
    CATEGORIES = "PbCategories",
    MENUS = "PbMenus",
    PAGE_ELEMENTS = "PbPageElements",
    PAGES = "PbPages",
    PAGES_ES = "PbPagesEs",
    BLOCK_CATEGORIES = "PbBlockCategories",
    PAGE_BLOCKS = "PbPageBlocks",
    PAGE_TEMPLATES = "PbPageTemplates"
}

export interface TableModifier {
    (table: TableConstructor<string, string, string>): TableConstructor<string, string, string>;
}

export interface PageBuilderStorageOperations extends BasePageBuilderStorageOperations {
    getTable: () => Table<string, string, string>;
    getEsTable: () => Table<string, string, string>;
    getEntities: () => Record<
        | "system"
        | "settings"
        | "categories"
        | "menus"
        | "pageElements"
        | "pages"
        | "pagesEs"
        | "blockCategories"
        | "pageBlocks"
        | "pageTemplates",
        Entity<any>
    >;
}

export interface PbContext extends BasePbContext {
    pageBuilder: PageBuilderContextObject & {
        storageOperations: PageBuilderStorageOperations;
    };
}

export interface StorageOperationsFactoryParams {
    documentClient: DynamoDBDocument;
    elasticsearch: Client;
    table?: TableModifier;
    esTable?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: PluginCollection;
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): PageBuilderStorageOperations;
}

export interface DataContainer<T> {
    PK: string;
    SK: string;
    TYPE: string;
    data: T;
}

export interface DataLoaderInterface {
    clear: () => void;
}

export interface PageTemplateStorageOperations extends BasePageTemplateStorageOperations {
    dataLoader: DataLoaderInterface;
}

export interface BlockCategoryStorageOperations extends BaseBlockCategoryStorageOperations {
    dataLoader: DataLoaderInterface;
}

export interface CategoryStorageOperations extends BaseCategoryStorageOperations {
    dataLoader: DataLoaderInterface;
}

export interface PageBlockStorageOperations extends BasePageBlockStorageOperations {
    dataLoader: DataLoaderInterface;
}
