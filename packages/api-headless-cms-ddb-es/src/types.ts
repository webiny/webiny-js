import { Plugin } from "@webiny/plugins/types";
import {
    CmsEntry,
    CmsModel,
    CmsModelField,
    CmsContext,
    CmsModelFieldToGraphQLPlugin,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types";
import {
    ElasticsearchBoolQueryConfig,
    ElasticsearchQueryOperator
} from "@webiny/api-elasticsearch/types";
import { DynamoDBTypes, TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { Client } from "@elastic/elasticsearch";
import { Entity, Table } from "dynamodb-toolbox";
import { PluginsContainer } from "@webiny/plugins";

/**
 * Definition for arguments of the ElasticsearchQueryBuilderPlugin.apply method.
 *
 * @see ElasticsearchQueryBuilderPlugin.apply
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderArgsPlugin {
    field: string;
    value: any;
    context: CmsContext;
    parentObject?: string;
    originalField?: string;
}

/**
 * Arguments for ElasticsearchQueryPlugin.
 *
 * @see ElasticsearchQueryPlugin.modify
 */
interface ElasticsearchQueryPluginArgs {
    query: ElasticsearchBoolQueryConfig;
    model: CmsModel;
}

/**
 * A plugin definition to modify Elasticsearch query.
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryPlugin extends Plugin {
    type: "cms-elasticsearch-query";
    modify: (args: ElasticsearchQueryPluginArgs) => void;
}

/**
 * A plugin definition to build Elasticsearch query.
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-elastic-search-query-builder";
    /**
     * Name of the plugin. Name it for better debugging experience.
     */
    name: string;
    /**
     * Target operator.
     */
    operator: ElasticsearchQueryOperator;
    /**
     * Method used to modify received query object.
     * Has access to whole query object so it can remove something added by other plugins.
     */
    apply: (query: ElasticsearchBoolQueryConfig, args: ElasticsearchQueryBuilderArgsPlugin) => void;
}

/**
 * Arguments for ElasticsearchQueryBuilderValueSearchPlugin.
 *
 * @see ElasticsearchQueryBuilderValueSearchPlugin.transform
 */
interface ElasticsearchQueryBuilderValueSearchPluginArgs {
    field: CmsModelField;
    value: any;
}

/**
 * A plugin definition for transforming the search value for Elasticsearch.
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderValueSearchPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-elastic-search-query-builder-value-search";
    /**
     * A field type for plugin to target.
     */
    fieldType: string;
    /**
     * Transform value that is going to be searched for in the Elasticsearch.
     */
    transform: (args: ElasticsearchQueryBuilderValueSearchPluginArgs) => any;
}

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
interface CmsModelFieldToElasticsearchToParams {
    plugins: PluginsContainer;
    model: CmsModel;
    field: CmsModelField;
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
interface CmsModelFieldToElasticsearchFromParams {
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
    fieldType: string;
    /**
     * If you need to define a type when building an Elasticsearch query.
     * Check [dateTimeIndexing](https://github.com/webiny/webiny-js/blob/3074165701b8b45e5fc6ac2444caace7d04ada66/packages/api-headless-cms/src/content/plugins/es/indexing/dateTimeIndexing.ts) plugin for usage example.
     *
     * ```ts
     * unmappedType: "date"
     * ```
     */
    unmappedType?: (field: CmsModelField) => string;
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

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "CmsSystem",
    SETTINGS = "CmsSettings",
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries",
    ENTRIES_ES = "CmsEntriesElasticsearch"
}

export interface TableModifier {
    (table: TableConstructor): TableConstructor;
}

export interface StorageOperationsFactoryParams {
    documentClient: DocumentClient;
    elasticsearch: Client;
    table?: TableModifier;
    esTable?: TableModifier;
    modelFieldToGraphQLPlugins: CmsModelFieldToGraphQLPlugin[];
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: Plugin[] | Plugin[][];
}

export interface HeadlessCmsStorageOperations extends BaseHeadlessCmsStorageOperations {
    getTable: () => Table;
    getEsTable: () => Table;
    getEntities: () => Record<
        "system" | "settings" | "groups" | "models" | "entries" | "entriesEs",
        Entity<any>
    >;
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): HeadlessCmsStorageOperations;
}
