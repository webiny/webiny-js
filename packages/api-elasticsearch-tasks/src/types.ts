import type { Context as TasksContext } from "@webiny/background-tasks/api/types.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface Context extends TasksContext {}

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
