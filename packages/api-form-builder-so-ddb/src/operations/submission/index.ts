import {
    FbSubmission,
    FormBuilderStorageOperationsCreateSubmissionParams,
    FormBuilderStorageOperationsDeleteSubmissionParams,
    FormBuilderStorageOperationsGetSubmissionParams,
    FormBuilderStorageOperationsListSubmissionsParams,
    FormBuilderStorageOperationsListSubmissionsResponse,
    FormBuilderStorageOperationsUpdateSubmissionParams
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
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { decodeCursor, encodeCursor } from "@webiny/db-dynamodb/utils/cursor";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { FormSubmissionDynamoDbFieldPlugin } from "~/plugins/FormSubmissionDynamoDbFieldPlugin";

export interface Params {
    entity: Entity<any>;
    table: Table;
    plugins: PluginsContainer;
}

export const createSubmissionStorageOperations = (
    params: Params
): FormBuilderSubmissionStorageOperations => {
    const { entity, plugins } = params;

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

    const createSubmissionType = () => {
        return "fb.formSubmission";
    };

    const createSubmission = async (
        params: FormBuilderStorageOperationsCreateSubmissionParams
    ): Promise<FbSubmission> => {
        const { submission, form } = params;
        const keys = {
            PK: createSubmissionPartitionKey(form),
            SK: createSubmissionSortKey(submission.id)
        };

        try {
            await entity.put({
                ...submission,
                ...keys,
                TYPE: createSubmissionType()
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create form submission in the DynamoDB.",
                ex.code || "UPDATE_FORM_SUBMISSION_ERROR",
                {
                    submission,
                    form,
                    keys
                }
            );
        }

        return submission;
    };

    const updateSubmission = async (
        params: FormBuilderStorageOperationsUpdateSubmissionParams
    ): Promise<FbSubmission> => {
        const { submission, form, original } = params;
        const keys = {
            PK: createSubmissionPartitionKey(form),
            SK: createSubmissionSortKey(submission.id)
        };

        try {
            await entity.put({
                ...submission,
                ...keys,
                TYPE: createSubmissionType()
            });
            return submission;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update form submission in the DynamoDB.",
                ex.code || "UPDATE_FORM_SUBMISSION_ERROR",
                {
                    submission,
                    original,
                    form,
                    keys
                }
            );
        }
    };

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

    const listSubmissions = async (
        params: FormBuilderStorageOperationsListSubmissionsParams
    ): Promise<FormBuilderStorageOperationsListSubmissionsResponse> => {
        const { where: initialWhere, sort, limit = 100000, after } = params;

        const where = {
            ...initialWhere
        };
        const { tenant, locale, formId } = where;
        /**
         * We need to remove conditions so we do not filter by them again.
         */
        delete where.tenant;
        delete where.locale;
        delete where.formId;

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createSubmissionPartitionKey({
                tenant,
                locale,
                formId
            }),
            options: {
                gte: " ",
                reverse: true
            }
        };

        let results;
        try {
            results = await queryAll<FbSubmission>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could list form submissions.",
                ex.code || "LIST_SUBMISSIONS_ERROR",
                {
                    where: initialWhere,
                    partitionKey: queryAllParams.partitionKey
                }
            );
        }

        const fields = plugins.byType<FormSubmissionDynamoDbFieldPlugin>(
            FormSubmissionDynamoDbFieldPlugin.type
        );

        const filteredSubmissions = filterItems({
            plugins,
            items: results,
            where,
            fields
        });

        const sortedSubmissions = sortItems({
            items: filteredSubmissions,
            sort,
            fields
        });

        const totalCount = sortedSubmissions.length;
        const start = decodeCursor(after) || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const items = sortedSubmissions.slice(start, end);
        /**
         * Although we do not need a cursor here, we will use it as such to keep it standardized.
         * Number is simply encoded.
         */
        const cursor = items.length > 0 ? encodeCursor(start + limit) : null;

        const meta = {
            hasMoreItems,
            totalCount,
            cursor
        };

        return {
            items,
            meta
        };
    };

    const getSubmission = async (
        params: FormBuilderStorageOperationsGetSubmissionParams
    ): Promise<FbSubmission> => {
        const { where } = params;

        const keys = {
            PK: createSubmissionPartitionKey(where),
            SK: createSubmissionSortKey(where.id)
        };

        try {
            const result = await entity.get(keys);

            if (!result || !result.Item) {
                return null;
            }

            return cleanupItem(entity, result.Item);
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
