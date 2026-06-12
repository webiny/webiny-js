import type {
    CmsContext as BaseCmsContext,
    CmsEntry,
    CmsEntryStorageOperations as BaseCmsEntryStorageOperations,
    CmsEntryValues,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type {
    Client,
    IOpenSearchEntity as IElasticsearchEntity,
    OpenSearchContext
} from "@webiny/api-opensearch";
import type { PluginsContainer } from "@webiny/plugins";
import type { IEntryEntity, IGroupEntity, IModelEntity } from "~/definitions/types.js";
import type { ITable } from "@webiny/db-dynamodb";

export interface CmsContext extends BaseCmsContext, OpenSearchContext {}
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
    documentClient: DynamoDBDocument;
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
    getTable: () => ITable;
    getEsTable: () => ITable;
    getEntities: () => IGetEntitiesResponse;
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
