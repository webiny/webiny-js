
import { Entity, Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import {
    FormBuilderSubmissionStorageOperations,
    FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams
} from "~/types";
import { parseIdentifier } from "@webiny/utils";

export interface CreateSubmissionStorageOperationsParams {
    entity: Entity<any>;
    esEntity: Entity<any>;
    table: Table<string, string, string>;
    elasticsearch: Client;
    plugins: PluginsContainer;
}

export const createSubmissionStorageOperations = (): FormBuilderSubmissionStorageOperations => {
    const createSubmissionPartitionKey = (
        params: FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams
    ) => {
        const { tenant, locale, formId } = params;

        const { id } = parseIdentifier(formId);

        return `T#${tenant}#L#${locale}#FB#F#${id}`;
    };
    const createSubmissionSortKey = (id: string) => {
        return `FS#${id}`;
    };

    const createSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const updateSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const deleteSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const listSubmissions = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const getSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    return {
        createSubmission,
        deleteSubmission,
        updateSubmission,
        listSubmissions,
        getSubmission,
        createSubmissionPartitionKey,
        createSubmissionSortKey
    };
};
