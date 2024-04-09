import {
    FormBuilderStorageOperations as BaseFormBuilderStorageOperations,
    FormBuilderSystemStorageOperations as BaseFormBuilderSystemStorageOperations,
    FormBuilderSubmissionStorageOperations as BaseFormBuilderSubmissionStorageOperations,
    FormBuilderSettingsStorageOperations as BaseFormBuilderSettingsStorageOperations,
    FormBuilderFormStorageOperations as BaseFormBuilderFormStorageOperations
} from "@webiny/api-form-builder/types";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";
import { Plugin } from "@webiny/plugins";

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    FORM = "FormBuilderForm",
    SUBMISSION = "FormBuilderSubmission",
    SYSTEM = "FormBuilderSystem",
    SETTINGS = "FormBuilderSettings"
}

export interface FormBuilderStorageOperationsFactoryParams {
    documentClient: DynamoDBDocument;
    table?: string;
    attributes?: Record<ENTITIES, Attributes>;
    plugins?: Plugin;
}

export interface FormBuilderSystemCreateKeysParams {
    tenant: string;
}

export interface FormBuilderSystemStorageOperations extends BaseFormBuilderSystemStorageOperations {
    createSystemPartitionKey: (params: FormBuilderSystemCreateKeysParams) => string;
    createSystemSortKey: () => string;
}

export interface FormBuilderFormCreatePartitionKeyParams {
    tenant: string;
    locale: string;
}

export interface FormBuilderFormCreateGSIPartitionKeyParams {
    id?: string;
    formId?: string;
    tenant: string;
    locale: string;
}

export interface FormBuilderFormStorageOperations extends BaseFormBuilderFormStorageOperations {
    createFormPartitionKey: (params: FormBuilderFormCreatePartitionKeyParams) => string;
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

export type Entities = "form" | "submission" | "system" | "settings";

export interface FormBuilderStorageOperations
    extends BaseFormBuilderStorageOperations,
        FormBuilderSettingsStorageOperations,
        FormBuilderSubmissionStorageOperations,
        FormBuilderFormStorageOperations,
        FormBuilderSystemStorageOperations {
    getTable(): Table<string, string, string>;
    getEntities(): Record<Entities, Entity<any>>;
}

export interface FormBuilderStorageOperationsFactory {
    (params: FormBuilderStorageOperationsFactoryParams): FormBuilderStorageOperations;
}
