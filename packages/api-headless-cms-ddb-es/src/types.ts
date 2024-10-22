import { Plugin, PluginCollection } from "@webiny/plugins/types";
import {
    CmsContext as BaseCmsContext,
    CmsEntry,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin,
    CmsModelFieldType,
    HeadlessCms,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types";
import { AttributeDefinition, Entity, Table, TableConstructor } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";

/**
 * A definition of the entry that is being prepared for the Elasticsearch.
 *
 * @category Elasticsearch
 * @category CmsEntry
 */
export interface CmsIndexEntry extends CmsEntry {
    /**
     * Values that are not going to be indexed.
     */
    rawValues: Record<string, any>;
    /**
     * A first part of the ID, without the revision.
     * For example, we can search for all the revisions of the given entry.
     */
    primaryId: string;
    /**
     * Dev can add what ever keys they want and need. Just need to be careful not to break the entry.
     */
    [key: string]: any;
}

/**
 * Arguments for the method that is transforming content entry in its original form to the one we are storing to the Elasticsearch.
 *
 * @category Elasticsearch
 * @category CmsEntry
 */
export interface CmsModelFieldToElasticsearchToParams {
    plugins: PluginsContainer;
    model: CmsModel;
    field: CmsModelField;
    /**
     * Raw value on the entry - before prepare for storage.
     */
    rawValue: any;
    /**
     * Value prepared for storage received from base api-headless-cms package.
     */
    value: any;
    getFieldIndexPlugin(fieldType: string): CmsModelFieldToElasticsearchPlugin;
    getFieldTypePlugin(fieldType: string): CmsModelFieldToGraphQLPlugin;
}

/**
 * Arguments for the method that is transforming content entry from Elasticsearch into the original one.
 *
 * @category Elasticsearch
 * @category CmsEntry
 */
export interface CmsModelFieldToElasticsearchFromParams {
    plugins: PluginsContainer;
    model: CmsModel;
    field: CmsModelField;
    value: any;
    rawValue: any;
    getFieldIndexPlugin(fieldType: string): CmsModelFieldToElasticsearchPlugin;
    getFieldTypePlugin(fieldType: string): CmsModelFieldToGraphQLPlugin;
}

interface ToIndexValue {
    /**
     * Use this key to store value for indexing.
     */
    value?: any;
    /**
     * Use this key to tell ES that this value should not be indexed.
     */
    rawValue?: any;
}

/**
 * A plugin defining transformation of entry for Elasticsearch.
 *
 * @category Plugin
 * @category ContentModelField
 * @category CmsEntry
 * @category Elasticsearch
 */
export interface CmsModelFieldToElasticsearchPlugin extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-field-to-elastic-search";
    /**
     * A unique identifier of the field type (text, number, json, myField, ...).
     *
     * ```ts
     * fieldType: "myField"
     * ```
     */
    fieldType: CmsModelFieldType;
    /**
     * If you need to define a type when building an Elasticsearch query.
     * Check [dateTimeIndexing](https://github.com/webiny/webiny-js/blob/3074165701b8b45e5fc6ac2444caace7d04ada66/packages/api-headless-cms/src/content/plugins/es/indexing/dateTimeIndexing.ts) plugin for usage example.
     *
     * ```ts
     * unmappedType: "date"
     * ```
     */
    unmappedType?: (field: Pick<CmsModelField, "fieldId" | "type">) => string;
    /**
     * This is meant to do some transformation of the entry, preferably only to fieldType it was defined for. Nothing is stopping you to do anything you want to other fields, but try to separate field transformations.
     * It returns `Partial<CmsContentIndexEntryType>`. Always return a top-level property of the entry since it is merged via spread operator.
     *
     * ```ts
     * toIndex({ value }) {
     *    return {
     *        value: value, // This will be stored and indexed
     *        rawValue: JSON.stringify(value) // This will be stored but excluded from indexing
     *    };
     * }
     * ```
     */
    toIndex?: (params: CmsModelFieldToElasticsearchToParams) => ToIndexValue;
    /**
     * This is meant to revert a transformation done in the `toIndex` method.
     * You have access to "value" or a "rawValue", depending on what you returned from `toIndex`.
     *
     * ```ts
     * fromIndex({ value, rawValue }) {
     *     return JSON.parse(rawValue);
     * }
     * ```
     */
    fromIndex?: (params: CmsModelFieldToElasticsearchFromParams) => any;
}

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "CmsSystem",
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries",
    ENTRIES_ES = "CmsEntriesElasticsearch"
}

export interface TableModifier {
    (table: TableConstructor<string, string, string>): TableConstructor<string, string, string>;
}

export interface StorageOperationsFactoryParams {
    documentClient: DynamoDBDocument;
    elasticsearch: Client;
    table?: TableModifier;
    esTable?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: PluginCollection;
}

export interface CmsContext extends BaseCmsContext, ElasticsearchContext {
    cms: HeadlessCms & {
        storageOperations: HeadlessCmsStorageOperations;
    };
}

export interface HeadlessCmsStorageOperations extends BaseHeadlessCmsStorageOperations<CmsContext> {
    getTable: () => Table<string, string, string>;
    getEsTable: () => Table<string, string, string>;
    getEntities: () => Record<
        "system" | "groups" | "models" | "entries" | "entriesEs",
        Entity<any>
    >;
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
