import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { Context as TasksContext } from "@webiny/tasks/types";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Client } from "@webiny/api-elasticsearch";
import { createTable } from "~/definitions";
import { ITaskResponse } from "@webiny/tasks/response/abstractions";
import { ITaskManagerStore } from "@webiny/tasks/runner/abstractions";
import { BatchWriteItem, BatchWriteResult } from "@webiny/db-dynamodb";

export interface Context extends ElasticsearchContext, TasksContext {}

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
    keys?: IElasticsearchIndexingTaskValuesKeys;
    settings?: IElasticsearchIndexingTaskValuesSettings;
}

export interface AugmentedError extends Error {
    data?: Record<string, any>;
    [key: string]: any;
}

export interface IDynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    index: string;
    _et?: string;
    entity: string;
    data: Record<string, any>;
    modified: string;
}

export interface IManager {
    readonly documentClient: DynamoDBDocument;
    readonly elasticsearch: Client;
    readonly context: Context;
    readonly table: ReturnType<typeof createTable>;
    readonly isCloseToTimeout: () => boolean;
    readonly isAborted: () => boolean;
    readonly response: ITaskResponse;
    readonly store: ITaskManagerStore<IElasticsearchIndexingTaskValues>;

    getEntity: (name: string) => Entity<any>;

    write: (items: BatchWriteItem[]) => Promise<BatchWriteResult>;
}
