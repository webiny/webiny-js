import {
    FbSubmission,
    FormBuilderStorageOperationsDeleteSubmissionParams,
    FormBuilderStorageOperationsGetSubmissionParams
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import {
    FormBuilderSubmissionStorageOperations,
    FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams
} from "~/types";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { parseIdentifier } from "@webiny/utils";
import { get } from "@webiny/db-dynamodb/utils/get";

export interface CreateSubmissionStorageOperationsParams {
    entity: Entity<any>;
    table: Table;
    plugins: PluginsContainer;
}

export const createSubmissionStorageOperations = (
    params: CreateSubmissionStorageOperationsParams
): FormBuilderSubmissionStorageOperations => {
    const { entity } = params;

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
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    const updateSubmission = () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    // Skipped when moving backend to HCMS.
    const deleteSubmission = async (
        params: FormBuilderStorageOperationsDeleteSubmissionParams
    ): Promise<FbSubmission> => {
        const { submission, form } = params;

        const keys = {
            PK: createSubmissionPartitionKey(form),
            SK: createSubmissionSortKey(submission.id)
        };

        try {
            await entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete form submission from DynamoDB.",
                ex.code || "DELETE_FORM_SUBMISSION_ERROR",
                {
                    submission,
                    form,
                    keys
                }
            );
        }

        return submission;
    };

    const listSubmissions = () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    // Skipped when moving backend to HCMS.
    const getSubmission = async (
        params: FormBuilderStorageOperationsGetSubmissionParams
    ): Promise<FbSubmission | null> => {
        const { where } = params;

        const keys = {
            PK: createSubmissionPartitionKey(where),
            SK: createSubmissionSortKey(where.id)
        };

        try {
            const item = await get<FbSubmission>({ entity, keys });
            return cleanupItem(entity, item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not oad submission.",
                ex.code || "GET_SUBMISSION_ERROR",
                {
                    where,
                    keys
                }
            );
        }
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
