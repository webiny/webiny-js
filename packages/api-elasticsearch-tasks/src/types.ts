import type { OpenSearchContext } from "@webiny/api-opensearch/types.js";
import type { Context as TasksContext } from "@webiny/background-tasks/api/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Client, createOpenSearchTable } from "@webiny/api-opensearch";
import type { BatchReadItem } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import type { IEntity } from "@webiny/db-dynamodb";
import type { GenericRecord } from "@webiny/api/types.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface Context extends OpenSearchContext, TasksContext {}

export interface IElasticsearchIndexingTaskValuesKeys {
    PK: string;
    SK: string;
}

export interface IIndexSettingsValues {
    numberOfReplicas: number;
    refreshInterval: string;
}

export interface IElasticsearchIndexingTaskValuesSettings {
    [key: string]: IIndexSettingsValues;
}

export interface IElasticsearchIndexingTaskValues {
    matching?: string;
    limit?: number;
    keys?: IElasticsearchIndexingTaskValuesKeys;
    settings?: IElasticsearchIndexingTaskValuesSettings;
}

export interface AugmentedError extends Error {
    data?: GenericRecord;
    [key: string]: any;
}

export interface IDynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    GSI_TENANT: string;
    TYPE?: string;
    index: string;
    _et?: string;
    entity: string;
    data: GenericRecord;
    modified: string;
}

export interface IManager<
    I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> {
    readonly documentClient: DynamoDBDocument;
    readonly elasticsearch: Client;
    readonly table: ReturnType<typeof createOpenSearchTable>;
    readonly controller: TaskController.Interface<I, O>;
    getEntity: (name: string) => IEntity;
    read<T>(items: BatchReadItem[]): Promise<T[]>;
}
