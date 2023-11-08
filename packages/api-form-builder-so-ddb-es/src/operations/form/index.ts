import { Entity, Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { parseIdentifier } from "@webiny/utils";
import { PluginsContainer } from "@webiny/plugins";
import { FormBuilderFormCreateKeyParams, FormBuilderFormStorageOperations } from "~/types";

export type DbRecord<T = any> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};

export interface CreateFormStorageOperationsParams {
    entity: Entity<any>;
    esEntity: Entity<any>;
    table: Table;
    elasticsearch: Client;
    plugins: PluginsContainer;
}

export const createFormStorageOperations = (): FormBuilderFormStorageOperations => {
    const createFormPartitionKey = (params: FormBuilderFormCreateKeyParams): string => {
        const { tenant, locale, id: targetId } = params;

        const { id } = parseIdentifier(targetId);

        return `T#${tenant}#L#${locale}#FB#F#${id}`;
    };

    const createForm = () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const createFormFrom = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const updateForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const getForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const listForms = () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const listFormRevisions = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const deleteForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const deleteFormRevision = async () => {
        throw new Error(
            "api-form-builder-so-ddb-esdoes not implement the Form Builder storage operations."
        );
    };

    const publishForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const unpublishForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    return {
        createForm,
        createFormFrom,
        updateForm,
        listForms,
        listFormRevisions,
        getForm,
        deleteForm,
        deleteFormRevision,
        publishForm,
        unpublishForm,
        createFormPartitionKey
    };
};
