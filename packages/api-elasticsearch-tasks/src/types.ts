import type { ElasticsearchContext } from "@webiny/api-elasticsearch/types.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Client } from "@webiny/api-elasticsearch";
import type { createTable } from "~/definitions/index.js";
import type { BatchReadItem, IEntity } from "@webiny/db-dynamodb";
import type { GenericRecord } from "@webiny/api/types.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { DbRegistry } from "~/abstractions/DbRegistry.js";

export interface Context extends ElasticsearchContext, TasksContext {}

export interface IElasticsearchTaskConfig {
    documentClient: DynamoDBDocument;
    elasticsearchClient: Client;
}

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
    TYPE?: string;
    index: string;
    _et?: string;
    entity: string;
    data: GenericRecord;
    modified: string;
}

export interface IManager<
    I extends TaskDefinition.TaskDataInput = TaskDefinition.TaskDataInput,
    O extends TaskDefinition.TaskDoneOutput = TaskDefinition.TaskDoneOutput
> {
    readonly documentClient: DynamoDBDocument;
    readonly elasticsearch: Client;
    readonly table: ReturnType<typeof createTable>;
    readonly controller: TaskController.Interface<I, O>;
    readonly dbRegistry?: DbRegistry.Interface;
    getEntity: (name: string) => IEntity;
    read<T>(items: BatchReadItem[]): Promise<T[]>;
}
