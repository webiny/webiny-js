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
import { Client } from "@elastic/elasticsearch";
import WebinyError from "@webiny/error";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import {
    createElasticsearchBody,
    createSubmissionElasticType
} from "~/operations/submission/elasticsearchBody";
import { PluginsContainer } from "@webiny/plugins";
import {
    FormBuilderSubmissionStorageOperations,
    FormBuilderSubmissionStorageOperationsCreatePartitionKeyParams
} from "~/types";
import { configurations } from "~/configurations";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { parseIdentifier } from "@webiny/utils";
import { decodeCursor, encodeCursor } from "@webiny/api-elasticsearch/cursors";
import { ElasticsearchSearchResponse } from "@webiny/api-elasticsearch/types";

export interface CreateSubmissionStorageOperationsParams {
    entity: Entity<any>;
    esEntity: Entity<any>;
    table: Table;
    elasticsearch: Client;
    plugins: PluginsContainer;
}

export const createSubmissionStorageOperations = (
    params: CreateSubmissionStorageOperationsParams
): FormBuilderSubmissionStorageOperations => {
    const { entity, esEntity, table, elasticsearch, plugins } = params;

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

        try {
            const { index } = configurations.es({
                tenant: form.tenant,
                locale: form.locale
            });
            await esEntity.put({
                index,
                data: {
                    ...submission,
                    __type: createSubmissionElasticType()
                },
                TYPE: createSubmissionType(),
                ...keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create form submission in the Elasticsearch.",
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
    /**
     * We do not save the data in the Elasticsearch because there is no need for that.
     */
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

        try {
            await esEntity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete form submission from Elasticsearch.",
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

    /**
     *
     * We are using this method because it is faster to fetch the exact data from the DynamoDB than Elasticsearch.
     *
     * @internal
     */
    const listSubmissionsByIds = async (
        params: FormBuilderStorageOperationsListSubmissionsParams
    ): Promise<FbSubmission[]> => {
        const { where, sort } = params;
        const items = (where.id_in || []).map(id => {
            return entity.getBatch({
                PK: createSubmissionPartitionKey({
                    ...where
                }),
                SK: createSubmissionSortKey(id)
            });
        });

        let results: FbSubmission[] = [];

        try {
            results = await batchReadAll<FbSubmission>({
                table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch read form submissions.",
                ex.code || "BATCH_READ_SUBMISSIONS_ERROR",
                {
                    where,
                    sort
                }
            );
        }
        /**
         * We need to remove empty results because it is a possibility that batch read returned null for non-existing record.
         */
        const submissions = results.filter(Boolean).map(submission => {
            return cleanupItem(entity, submission);
        }) as FbSubmission[];
        if (!sort) {
            return submissions;
        }
        return sortItems<FbSubmission>({
            items: submissions,
            sort,
            fields: []
        });
    };

    const listSubmissions = async (
        params: FormBuilderStorageOperationsListSubmissionsParams
    ): Promise<FormBuilderStorageOperationsListSubmissionsResponse> => {
        const { where, sort = [], limit: initialLimit, after } = params;

        if (where.id_in) {
            const items = await listSubmissionsByIds(params);

            return {
                items,
                meta: {
                    hasMoreItems: false,
                    cursor: null,
                    totalCount: items.length
                }
            };
        }

        const limit = createLimit(initialLimit);

        const body = createElasticsearchBody({
            plugins,
            sort,
            limit: limit + 1,
            where,
            after: decodeCursor(after) as any
        });

        const esConfig = configurations.es({
            tenant: where.tenant,
            locale: where.locale
        });

        const query = {
            ...esConfig,
            body
        };

        let response: ElasticsearchSearchResponse<FbSubmission>;
        try {
            response = await elasticsearch.search(query);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could list form submissions.",
                ex.code || "LIST_SUBMISSIONS_ERROR",
                {
                    where,
                    query
                }
            );
        }

        const { hits, total } = response.body.hits;
        const items = hits.map(item => item._source);

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            /**
             * Remove the last item from results, we don't want to include it.
             */
            items.pop();
        }
        /**
         * Cursor is the `sort` value of the last item in the array.
         * https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
         */
        const meta = {
            hasMoreItems,
            totalCount: total.value,
            cursor: items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null
        };

        return {
            items,
            meta
        };
    };

    const getSubmission = async (
        params: FormBuilderStorageOperationsGetSubmissionParams
    ): Promise<FbSubmission | null> => {
        const { where } = params;

        const keys = {
            PK: createSubmissionPartitionKey({
                ...where,
                formId: where.formId as string
            }),
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
