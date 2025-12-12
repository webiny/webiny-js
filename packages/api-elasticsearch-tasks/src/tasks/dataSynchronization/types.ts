import type { IManager } from "~/types.js";
import type { PrimitiveValue } from "@webiny/api-elasticsearch/types.js";
import type { IIndexManager } from "~/settings/types.js";
import type { IElasticsearchSynchronize } from "~/tasks/dataSynchronization/elasticsearch/abstractions/ElasticsearchSynchronize.js";
import type { IElasticsearchFetcher } from "~/tasks/dataSynchronization/elasticsearch/abstractions/ElasticsearchFetcher.js";
import type { ITaskResponseDoneResultOutput } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition} from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IDataSynchronizationInputValue {
    finished?: boolean;
}

export interface IDataSynchronizationInputElasticsearchToDynamoDbValue
    extends IDataSynchronizationInputValue {
    index?: string;
    cursor?: PrimitiveValue[];
}

export interface IDataSynchronizationInput {
    flow: "elasticsearchToDynamoDb";
    elasticsearchToDynamoDb?: IDataSynchronizationInputElasticsearchToDynamoDbValue;
}

export type IDataSynchronizationOutput = ITaskResponseDoneResultOutput;

export type ISynchronizationRunResult =
    | TaskDefinition.ResultContinue<IDataSynchronizationInput>
    | TaskDefinition.ResultDone<IDataSynchronizationOutput>
    | TaskDefinition.ResultError
    | TaskDefinition.ResultAborted;

export interface ISynchronization {
    run(input: IDataSynchronizationInput): Promise<ISynchronizationRunResult>;
}

export interface IElasticsearchSyncParams {
    manager: IDataSynchronizationManager;
    indexManager: IIndexManager;
    synchronize: IElasticsearchSynchronize;
    fetcher: IElasticsearchFetcher;
}

export interface IElasticsearchSyncFactory {
    (params: IElasticsearchSyncParams): ISynchronization;
}

export interface IFactories {
    /**
     * Delete all the records which are in the Elasticsearch but not in the Elasticsearch DynamoDB table.
     */
    elasticsearchToDynamoDb: IElasticsearchSyncFactory;
}

export type IDataSynchronizationManager = IManager<
    IDataSynchronizationInput,
    IDataSynchronizationOutput
>;
