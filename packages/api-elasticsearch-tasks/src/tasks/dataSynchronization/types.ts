import { IManager } from "~/types";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { IIndexManager } from "~/settings/types";
import { ITaskResponseResult } from "@webiny/tasks";

export interface IDataSynchronizationInputValue {
    finished?: boolean;
}

export interface IDataSynchronizationInputElasticsearchToDynamoDbValue
    extends IDataSynchronizationInputValue {
    index?: string;
    cursor?: PrimitiveValue[];
}

export interface IDataSynchronizationInput {
    elasticsearchToDynamoDb?: IDataSynchronizationInputElasticsearchToDynamoDbValue;
    dynamoDbElasticsearch?: IDataSynchronizationInputValue;
    dynamoDb?: IDataSynchronizationInputValue;
}

export interface ISynchronization {
    run(input: IDataSynchronizationInput): Promise<ITaskResponseResult>;
}

export interface IElasticsearchSyncParams {
    manager: IDataSynchronizationManager;
    indexManager: IIndexManager;
}

export interface IElasticsearchSyncFactory {
    (params: IElasticsearchSyncParams): ISynchronization;
}

export interface IDynamoDbElasticsearchSyncParams {
    manager: IDataSynchronizationManager;
}

export interface IDynamoDbElasticsearchSyncFactory {
    (params: IDynamoDbElasticsearchSyncParams): ISynchronization;
}

export interface IDynamoDbSyncParams {
    manager: IDataSynchronizationManager;
}

export interface IDynamoDbSyncFactory {
    (params: IDynamoDbSyncParams): ISynchronization;
}

export interface IFactories {
    createElasticsearchToDynamoDb: IElasticsearchSyncFactory;
    createDynamoDbElasticsearch: IDynamoDbElasticsearchSyncFactory;
    createDynamoDb: IDynamoDbSyncFactory;
}

export type IDataSynchronizationManager = IManager<IDataSynchronizationInput>;
