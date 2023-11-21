import {
    FormBuilderStorageOperations as BaseFormBuilderStorageOperations,
    FormBuilderSystemStorageOperations as BaseFormBuilderSystemStorageOperations,
    FormBuilderSubmissionStorageOperations as BaseFormBuilderSubmissionStorageOperations,
    FormBuilderSettingsStorageOperations as BaseFormBuilderSettingsStorageOperations,
    FormBuilderFormStorageOperations as BaseFormBuilderFormStorageOperations
} from "@webiny/api-form-builder/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { Client } from "@elastic/elasticsearch";
import { PluginCollection } from "@webiny/plugins/types";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    FORM = "FormBuilderForm",
    ES_FORM = "FormBuilderFormEs",
    SUBMISSION = "FormBuilderSubmission",
    ES_SUBMISSION = "FormBuilderSubmissionEs",
    SYSTEM = "FormBuilderSystem",
    SETTINGS = "FormBuilderSettings"
}

export interface FormBuilderStorageOperationsFactoryParams {
    documentClient: DocumentClient;
    elasticsearch: Client;
    table?: string;
    esTable?: string;
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: PluginCollection;
}

export interface FormBuilderSystemCreateKeysParams {
    tenant: string;
}

export interface FormBuilderSystemStorageOperations extends BaseFormBuilderSystemStorageOperations {
    createSystemPartitionKey: (params: FormBuilderSystemCreateKeysParams) => string;
    createSystemSortKey: () => string;
}

export interface FormBuilderFormCreateKeyParams {
    id: string;
    tenant: string;
    locale: string;
}

export interface FormBuilderFormStorageOperations extends BaseFormBuilderFormStorageOperations {
    createFormPartitionKey: (params: FormBuilderFormCreateKeyParams) => string;
}

export interface FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams {
    tenant: string;
    locale: string;
    formId: string;
}

export interface FormBuilderSubmissionStorageOperations
    extends BaseFormBuilderSubmissionStorageOperations {
    createSubmissionPartitionKey: (
        params: FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams
    ) => string;
    createSubmissionSortKey: (id: string) => string;
}

export interface FormBuilderSettingsStorageOperationsCreatePartitionKeyParams {
    tenant: string;
    locale: string;
}

export interface FormBuilderSettingsStorageOperations
    extends BaseFormBuilderSettingsStorageOperations {
    createSettingsPartitionKey: (
        params: FormBuilderSettingsStorageOperationsCreatePartitionKeyParams
    ) => string;
    createSettingsSortKey: () => string;
}

export type Entities = "form" | "esForm" | "submission" | "esSubmission" | "system" | "settings";

export interface FormBuilderStorageOperations
    extends BaseFormBuilderStorageOperations,
        FormBuilderSettingsStorageOperations,
        FormBuilderSubmissionStorageOperations,
        FormBuilderFormStorageOperations,
        FormBuilderSystemStorageOperations {
    getTable(): Table;
    getEsTable(): Table;
    getEntities(): Record<Entities, Entity<any>>;
}

export interface FormBuilderStorageOperationsFactory {
    (params: FormBuilderStorageOperationsFactoryParams): FormBuilderStorageOperations;
}
