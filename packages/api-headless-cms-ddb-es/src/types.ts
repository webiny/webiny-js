import type {
    CmsContext,
    CmsEntry,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { Client, IOpenSearchEntity as IElasticsearchEntity } from "@webiny/api-opensearch";
import type { IEntryEntity, IGroupEntity, IModelEntity } from "~/definitions/types.js";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { PluginsContainer } from "@webiny/plugins";

export { CmsContext };
/**
 * A definition of the entry that is being prepared for the Elasticsearch.
 *
 * @category Elasticsearch
 * @category CmsEntry
 */
export interface CmsIndexEntry<T extends CmsEntryValues = CmsEntryValues> extends CmsEntry<T> {
    /**
     * Values that are not going to be indexed.
     */
    rawValues: Partial<T>;
    /**
     * Dev can add whatever keys they want and need. Just need to be careful not to break the entry.
     */
    [key: string]: any;
}

export enum ENTITIES {
    GROUPS = "CmsGroups",
    MODELS = "CmsModels",
    ENTRIES = "CmsEntries",
    ENTRIES_ES = "CmsEntriesElasticsearch"
}

export interface StorageOperationsFactoryParams {
    elasticsearch: Client;
    table?: string;
    esTable?: string;
    plugins: PluginsContainer;
    container: CmsContext["container"];
}

export interface IGetEntitiesResponse {
    groups: IGroupEntity;
    models: IModelEntity;
    entries: IEntryEntity;
    entriesEs: IElasticsearchEntity;
}

export interface HeadlessCmsStorageOperations extends BaseHeadlessCmsStorageOperations {
    getTable: () => DynamoDbDocumentClient.Interface;
    getEsTable: () => DynamoDbDocumentClient.Interface;
    getEntities: () => IGetEntitiesResponse;
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
