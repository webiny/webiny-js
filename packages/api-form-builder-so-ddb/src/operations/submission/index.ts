import { Entity, Table } from "dynamodb-toolbox";
import { PluginsContainer } from "@webiny/plugins";
import {
    FormBuilderSubmissionStorageOperations,
    FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams
} from "~/types";
import { parseIdentifier } from "@webiny/utils";

export interface CreateSubmissionStorageOperationsParams {
    entity: Entity<any>;
    table: Table<string, string, string>;
    plugins: PluginsContainer;
}

export const createSubmissionStorageOperations = (): FormBuilderSubmissionStorageOperations => {
    const createSubmissionPartitionKey = (
        params: FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams
    ) => {
        const { tenant, locale, formId } = params;

        const { id } = parseIdentifier(formId);

        return `T#${tenant}#L#${locale}#FB#FS#${id}`;
    };
    const createSubmissionSortKey = (id: string) => {
        return id;
    };

    const createSubmission = () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    const updateSubmission = () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    const deleteSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    const listSubmissions = () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    const getSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
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
