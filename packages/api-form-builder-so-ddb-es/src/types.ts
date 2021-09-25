import {
    FormBuilderStorageOperationsFactory,
    FormBuilderStorageOperations as BaseFormBuilderStorageOperations,
    FormBuilderSystemStorageOperations as BaseFormBuilderSystemStorageOperations,
    FormBuilderSubmissionStorageOperations as BaseFormBuilderSubmissionStorageOperations,
    FormBuilderSettingsStorageOperations as BaseFormBuilderSettingsStorageOperations
} from "@webiny/api-form-builder/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { Client } from "@elastic/elasticsearch";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    FORM = "FormBuilderForm",
    SUBMISSION = "FormBuilderSubmission",
    SYSTEM = "FormBuilderSystem",
    SETTINGS = "FormBuilderSettings"
}

export interface CreateStorageOperationsFactoryParams {
    documentClient: DocumentClient;
    elasticsearch: Client;
    table?: string;
    attributes?: Record<ENTITIES, Attributes>;
}

export type Entities = "form" | "submission" | "system" | "settings";

export interface FormBuilderStorageOperations extends BaseFormBuilderStorageOperations {
    getTable(): Table;
    getEntities(): Record<Entities, Entity<any>>;
}

export interface CreateStorageOperationsFactory {
    (params: CreateStorageOperationsFactoryParams): FormBuilderStorageOperationsFactory;
}

export interface FormBuilderSystemStorageOperations extends BaseFormBuilderSystemStorageOperations {
    createPartitionKey: () => string;
    createSortKey: () => string;
}

export interface FormBuilderSubmissionStorageOperations
    extends BaseFormBuilderSubmissionStorageOperations {
    createPartitionKey: () => string;
    createSortKey: () => string;
}

export interface FormBuilderSettingsStorageOperations
    extends BaseFormBuilderSettingsStorageOperations {
    createPartitionKey: () => string;
    createSortKey: () => string;
}
