import {
    FormBuilderStorageOperations as BaseFormBuilderStorageOperations,
    FormBuilderSystemStorageOperations as BaseFormBuilderSystemStorageOperations,
    FormBuilderSubmissionStorageOperations,
    FormBuilderSettingsStorageOperations as BaseFormBuilderSettingsStorageOperations,
    FormBuilderFormStorageOperations
} from "@webiny/api-form-builder/types";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    FORM = "FormBuilderForm",
    SUBMISSION = "FormBuilderSubmission",
    SYSTEM = "FormBuilderSystem",
    SETTINGS = "FormBuilderSettings"
}

export interface FormBuilderStorageOperationsFactoryParams {
    documentClient: DynamoDBClient;
    table?: string;
    attributes?: Record<ENTITIES, Attributes>;
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
export interface FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams {
    tenant: string;
    locale: string;
    formId: string;
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

export type Entities = "system" | "settings";

export interface FormBuilderStorageOperations
    extends BaseFormBuilderStorageOperations,
        FormBuilderSettingsStorageOperations,
        FormBuilderSystemStorageOperations {
    forms: FormBuilderFormStorageOperations;
    submissions: FormBuilderSubmissionStorageOperations;
    getEntities(): Record<Entities, Entity<any>>;
}

export interface FormBuilderStorageOperationsFactory {
    (params: FormBuilderStorageOperationsFactoryParams): FormBuilderStorageOperations;
}
