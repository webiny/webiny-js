import type { PrimitiveValue } from "@webiny/api-opensearch/types.js";
import type { IGenericOutput } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IDataSynchronizationInputValue {
    finished?: boolean;
}

export interface IDataSynchronizationInputElasticsearchToDynamoDbValue extends IDataSynchronizationInputValue {
    index?: string;
    cursor?: PrimitiveValue[];
}

export interface IDataSynchronizationInput {
    flow: "elasticsearchToDynamoDb";
    elasticsearchToDynamoDb?: IDataSynchronizationInputElasticsearchToDynamoDbValue;
}

export type IDataSynchronizationOutput = IGenericOutput;

export type ISynchronizationRunResult =
    | TaskDefinition.ResultContinue<IDataSynchronizationInput>
    | TaskDefinition.ResultDone<IDataSynchronizationOutput>
    | TaskDefinition.ResultError
    | TaskDefinition.ResultAborted;
