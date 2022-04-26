import {
    FbForm,
    FormBuilderStorageOperationsCreateFormFromParams,
    FormBuilderStorageOperationsCreateFormParams,
    FormBuilderStorageOperationsDeleteFormParams,
    FormBuilderStorageOperationsDeleteFormRevisionParams,
    FormBuilderStorageOperationsGetFormParams,
    FormBuilderStorageOperationsListFormRevisionsParams,
    FormBuilderStorageOperationsListFormRevisionsParamsWhere,
    FormBuilderStorageOperationsListFormsParams,
    FormBuilderStorageOperationsListFormsResponse,
    FormBuilderStorageOperationsPublishFormParams,
    FormBuilderStorageOperationsUnpublishFormParams,
    FormBuilderStorageOperationsUpdateFormParams
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { configurations } from "~/configurations";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import fields from "./fields";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { parseIdentifier, zeroPad } from "@webiny/utils";
import { createElasticsearchBody, createFormElasticType } from "./elasticsearchBody";
import { decodeCursor, encodeCursor } from "@webiny/api-elasticsearch/cursors";
import { PluginsContainer } from "@webiny/plugins";
import { FormBuilderFormCreateKeyParams, FormBuilderFormStorageOperations } from "~/types";
import { ElasticsearchSearchResponse } from "@webiny/api-elasticsearch/types";

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

type FbFormElastic = Omit<FbForm, "triggers" | "fields" | "settings" | "layout" | "stats"> & {
    __type: string;
};

const getESDataForLatestRevision = (form: FbForm): FbFormElastic => ({
    __type: createFormElasticType(),
    id: form.id,
    createdOn: form.createdOn,
    savedOn: form.savedOn,
    name: form.name,
    slug: form.slug,
    published: form.published,
    publishedOn: form.publishedOn,
    version: form.version,
    locked: form.locked,
    status: form.status,
    createdBy: form.createdBy,
    ownedBy: form.ownedBy,
    tenant: form.tenant,
    locale: form.locale,
    webinyVersion: form.webinyVersion,
    formId: form.formId
});

export const createFormStorageOperations = (
    params: CreateFormStorageOperationsParams
): FormBuilderFormStorageOperations => {
    const { entity, esEntity, table, plugins, elasticsearch } = params;

    const formDynamoDbFields = fields();

    const createFormPartitionKey = (params: FormBuilderFormCreateKeyParams): string => {
        const { tenant, locale, id: targetId } = params;

        const { id } = parseIdentifier(targetId);

        return `T#${tenant}#L#${locale}#FB#F#${id}`;
    };

    const createRevisionSortKey = (value: string | number | undefined): string => {
        const version =
            typeof value === "number" ? Number(value) : (parseIdentifier(value).version as number);
        return `REV#${zeroPad(version)}`;
    };

    const createLatestSortKey = (): string => {
        return "L";
    };

    const createLatestPublishedSortKey = (): string => {
        return "LP";
    };

    const createFormType = (): string => {
        return "fb.form";
    };

    const createFormLatestType = (): string => {
        return "fb.form.latest";
    };

    const createFormLatestPublishedType = (): string => {
        return "fb.form.latestPublished";
    };

    const createForm = async (
        params: FormBuilderStorageOperationsCreateFormParams
    ): Promise<FbForm> => {
        const { form } = params;

        const revisionKeys = {
            PK: createFormPartitionKey(form),
            SK: createRevisionSortKey(form.id)
        };
        const latestKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestSortKey()
        };

        const items = [
            entity.putBatch({
                ...form,
                TYPE: createFormType(),
                ...revisionKeys
            }),
            entity.putBatch({
                ...form,
                TYPE: createFormLatestType(),
                ...latestKeys
            })
        ];

        try {
            await batchWriteAll({
                table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert form data into regular table.",
                ex.code || "CREATE_FORM_ERROR",
                {
                    revisionKeys,
                    latestKeys,
                    form
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
                data: getESDataForLatestRevision(form),
                TYPE: createFormType(),
                ...latestKeys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert form data into Elasticsearch table.",
                ex.code || "CREATE_FORM_ERROR",
                {
                    latestKeys,
                    form
                }
            );
        }
        return form;
    };

    const createFormFrom = async (
        params: FormBuilderStorageOperationsCreateFormFromParams
    ): Promise<FbForm> => {
        const { form, original, latest } = params;

        const revisionKeys = {
            PK: createFormPartitionKey(form),
            SK: createRevisionSortKey(form.version)
        };

        const latestKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestSortKey()
        };

        const items = [
            entity.putBatch({
                ...form,
                ...revisionKeys,
                TYPE: createFormType()
            }),
            entity.putBatch({
                ...form,
                ...latestKeys,
                TYPE: createFormLatestType()
            })
        ];

        try {
            await batchWriteAll({
                table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not create form data in the regular table, from existing form.",
                ex.code || "CREATE_FORM_FROM_ERROR",
                {
                    revisionKeys,
                    latestKeys,
                    original,
                    form,
                    latest
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
                data: getESDataForLatestRevision(form),
                TYPE: createFormLatestType(),
                ...latestKeys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not create form in the Elasticsearch table, from existing form.",
                ex.code || "CREATE_FORM_FROM_ERROR",
                {
                    latestKeys,
                    form,
                    latest,
                    original
                }
            );
        }
        return form;
    };

    const updateForm = async (
        params: FormBuilderStorageOperationsUpdateFormParams
    ): Promise<FbForm> => {
        const { form, original } = params;

        const revisionKeys = {
            PK: createFormPartitionKey(form),
            SK: createRevisionSortKey(form.id)
        };
        const latestKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestSortKey()
        };

        const { formId, tenant, locale } = form;

        const latestForm = await getForm({
            where: {
                formId,
                tenant,
                locale,
                latest: true
            }
        });
        const isLatestForm = latestForm ? latestForm.id === form.id : false;

        const items = [
            entity.putBatch({
                ...form,
                TYPE: createFormType(),
                ...revisionKeys
            })
        ];
        if (isLatestForm) {
            items.push(
                entity.putBatch({
                    ...form,
                    TYPE: createFormLatestType(),
                    ...latestKeys
                })
            );
        }
        try {
            await batchWriteAll({
                table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update form data in the regular table.",
                ex.code || "UPDATE_FORM_ERROR",
                {
                    revisionKeys,
                    latestKeys,
                    original,
                    form,
                    latestForm
                }
            );
        }
        /**
         * No need to go further if its not latest form.
         */
        if (!isLatestForm) {
            return form;
        }

        try {
            const { index } = configurations.es({
                tenant: form.tenant,
                locale: form.locale
            });
            await esEntity.put({
                index,
                data: getESDataForLatestRevision(form),
                TYPE: createFormLatestType(),
                ...latestKeys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update form data in the Elasticsearch table.",
                ex.code || "UPDATE_FORM_ERROR",
                {
                    latestKeys,
                    form,
                    latestForm,
                    original
                }
            );
        }
        return form;
    };

    const getForm = async (
        params: FormBuilderStorageOperationsGetFormParams
    ): Promise<FbForm | null> => {
        const { where } = params;
        const { id, formId, latest, published, version, tenant, locale } = where;
        if (latest && published) {
            throw new WebinyError("Cannot have both latest and published params.");
        }
        let sortKey: string;
        if (latest) {
            sortKey = createLatestSortKey();
        } else if (published && !version) {
            /**
             * Because of the specifics how DynamoDB works, we must not load the published record if version is sent.
             */
            sortKey = createLatestPublishedSortKey();
        } else if (id || version) {
            sortKey = createRevisionSortKey(version || id);
        } else {
            throw new WebinyError(
                "Missing parameter to create a sort key.",
                "MISSING_WHERE_PARAMETER",
                {
                    where
                }
            );
        }

        const keys = {
            PK: createFormPartitionKey({
                tenant,
                locale,
                id: (formId || id) as string
            }),
            SK: sortKey
        };

        try {
            const result = await entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(entity, result.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get form by keys.",
                ex.code || "GET_FORM_ERROR",
                {
                    keys
                }
            );
        }
    };

    const listForms = async (
        params: FormBuilderStorageOperationsListFormsParams
    ): Promise<FormBuilderStorageOperationsListFormsResponse> => {
        const { sort, limit, where, after } = params;

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

        let response: ElasticsearchSearchResponse<FbForm>;
        try {
            response = await elasticsearch.search(query);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could list forms.",
                ex.code || "LIST_FORMS_ERROR",
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

    const listFormRevisions = async (
        params: FormBuilderStorageOperationsListFormRevisionsParams
    ): Promise<FbForm[]> => {
        const { where: initialWhere, sort } = params;
        const { id, formId, tenant, locale } = initialWhere;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createFormPartitionKey({
                tenant,
                locale,
                id: (id || formId) as string
            }),
            options: {
                beginsWith: "REV#"
            }
        };

        let items: FbForm[] = [];
        try {
            items = await queryAll<FbForm>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not query forms by given params.",
                ex.code || "QUERY_FORMS_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }
        const where: Partial<FormBuilderStorageOperationsListFormRevisionsParamsWhere> = {
            ...initialWhere,
            id: undefined,
            formId: undefined
        };
        const filteredItems = filterItems({
            plugins,
            items,
            where,
            fields: formDynamoDbFields
        });
        if (!sort || sort.length === 0) {
            return filteredItems;
        }
        return sortItems({
            items: filteredItems,
            sort,
            fields: formDynamoDbFields
        });
    };

    const deleteForm = async (
        params: FormBuilderStorageOperationsDeleteFormParams
    ): Promise<FbForm> => {
        const { form } = params;
        let items: any[];
        /**
         * This will find all form and submission records.
         */
        const queryAllParams = {
            entity,
            partitionKey: createFormPartitionKey(form),
            options: {
                gte: " "
            }
        };
        try {
            items = await queryAll<DbRecord>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not query forms and submissions by given params.",
                ex.code || "QUERY_FORM_AND_SUBMISSIONS_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const deleteItems = items.map(item => {
            return entity.deleteBatch({
                PK: item.PK,
                SK: item.SK
            });
        });
        try {
            await batchWriteAll({
                table,
                items: deleteItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete form and it's submissions.",
                ex.code || "DELETE_FORM_AND_SUBMISSIONS_ERROR"
            );
        }

        const latestKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestSortKey()
        };
        try {
            await esEntity.delete(latestKeys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete latest form record from Elasticsearch.",
                ex.code || "DELETE_FORM_ERROR",
                {
                    latestKeys
                }
            );
        }
        return form;
    };
    /**
     * We need to:
     * - delete current revision
     * - get previously published revision and update the record if it exists or delete if it does not
     * - update latest record if current one is the latest
     */
    const deleteFormRevision = async (
        params: FormBuilderStorageOperationsDeleteFormRevisionParams
    ): Promise<FbForm> => {
        const { form, revisions, previous } = params;

        const revisionKeys = {
            PK: createFormPartitionKey(form),
            SK: createRevisionSortKey(form.id)
        };

        const latestKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestSortKey()
        };

        const latestForm = revisions[0];
        const latestPublishedForm = revisions.find(rev => rev.published === true);

        const isLatest = latestForm ? latestForm.id === form.id : false;
        const isLatestPublished = latestPublishedForm ? latestPublishedForm.id === form.id : false;

        const items = [entity.deleteBatch(revisionKeys)];
        let esDataItem = undefined;

        if (isLatest || isLatestPublished) {
            /**
             * Sort out the latest published record.
             */
            if (isLatestPublished) {
                const previouslyPublishedForm = revisions
                    .filter(f => !!f.publishedOn && f.version !== form.version)
                    .sort((a, b) => {
                        return (
                            new Date(b.publishedOn as string).getTime() -
                            new Date(a.publishedOn as string).getTime()
                        );
                    })
                    .shift();
                if (previouslyPublishedForm) {
                    items.push(
                        entity.putBatch({
                            ...previouslyPublishedForm,
                            PK: createFormPartitionKey(previouslyPublishedForm),
                            SK: createLatestPublishedSortKey(),
                            TYPE: createFormLatestPublishedType()
                        })
                    );
                } else {
                    items.push(
                        entity.deleteBatch({
                            PK: createFormPartitionKey(form),
                            SK: createLatestPublishedSortKey()
                        })
                    );
                }
            }
            /**
             * Sort out the latest record.
             */
            if (isLatest && previous) {
                items.push(
                    entity.putBatch({
                        ...previous,
                        ...latestKeys,
                        TYPE: createFormLatestType()
                    })
                );

                const { index } = configurations.es({
                    tenant: previous.tenant,
                    locale: previous.locale
                });

                esDataItem = {
                    index,
                    ...latestKeys,
                    data: getESDataForLatestRevision(previous)
                };
            }
        }
        /**
         * Now save the batch data.
         */
        try {
            await batchWriteAll({
                table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete form revision from regular table.",
                ex.code || "DELETE_FORM_REVISION_ERROR",
                {
                    form,
                    latestForm,
                    revisionKeys,
                    latestKeys
                }
            );
        }
        /**
         * And then the Elasticsearch data, if any.
         */
        if (!esDataItem) {
            return form;
        }
        try {
            await esEntity.put(esDataItem);
            return form;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete form from to the Elasticsearch table.",
                ex.code || "DELETE_FORM_REVISION_ERROR",
                {
                    form,
                    latestForm,
                    revisionKeys,
                    latestKeys
                }
            );
        }
    };

    /**
     * We need to save form in:
     * - regular form record
     * - latest published form record
     * - latest form record - if form is latest one
     * - elasticsearch latest form record
     */
    const publishForm = async (
        params: FormBuilderStorageOperationsPublishFormParams
    ): Promise<FbForm> => {
        const { form, original } = params;

        const revisionKeys = {
            PK: createFormPartitionKey(form),
            SK: createRevisionSortKey(form.version)
        };

        const latestKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestSortKey()
        };

        const latestPublishedKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestPublishedSortKey()
        };

        const { locale, tenant, formId } = form;

        const latestForm = await getForm({
            where: {
                formId,
                tenant,
                locale,
                latest: true
            }
        });

        const isLatestForm = latestForm ? latestForm.id === form.id : false;
        /**
         * Update revision and latest published records
         */
        const items = [
            entity.putBatch({
                ...form,
                ...revisionKeys,
                TYPE: createFormType()
            }),
            entity.putBatch({
                ...form,
                ...latestPublishedKeys,
                TYPE: createFormLatestPublishedType()
            })
        ];
        /**
         * Update the latest form as well
         */
        if (isLatestForm) {
            items.push(
                entity.putBatch({
                    ...form,
                    ...latestKeys,
                    TYPE: createFormLatestType()
                })
            );
        }

        try {
            await batchWriteAll({
                table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not publish form.",
                ex.code || "PUBLISH_FORM_ERROR",
                {
                    form,
                    original,
                    latestForm,
                    revisionKeys,
                    latestKeys,
                    latestPublishedKeys
                }
            );
        }
        if (!isLatestForm) {
            return form;
        }
        const { index } = configurations.es({
            tenant: form.tenant,
            locale: form.locale
        });
        const esData = getESDataForLatestRevision(form);
        try {
            await esEntity.put({
                ...latestKeys,
                index,
                TYPE: createFormLatestType(),
                data: esData
            });
            return form;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not publish form to the Elasticsearch.",
                ex.code || "PUBLISH_FORM_ERROR",
                {
                    form,
                    original,
                    latestForm,
                    revisionKeys,
                    latestKeys,
                    latestPublishedKeys
                }
            );
        }
    };

    /**
     * We need to:
     * - update form revision record
     * - if latest published (LP) is current form, find the previously published record and update LP if there is some previously published, delete otherwise
     * - if is latest update the Elasticsearch record
     */
    const unpublishForm = async (
        params: FormBuilderStorageOperationsUnpublishFormParams
    ): Promise<FbForm> => {
        const { form, original } = params;

        const revisionKeys = {
            PK: createFormPartitionKey(form),
            SK: createRevisionSortKey(form.version)
        };

        const latestKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestSortKey()
        };

        const latestPublishedKeys = {
            PK: createFormPartitionKey(form),
            SK: createLatestPublishedSortKey()
        };

        const { formId, tenant, locale } = form;

        const latestForm = await getForm({
            where: {
                formId,
                tenant,
                locale,
                latest: true
            }
        });

        const latestPublishedForm = await getForm({
            where: {
                formId,
                tenant,
                locale,
                published: true
            }
        });

        const isLatest = latestForm ? latestForm.id === form.id : false;
        const isLatestPublished = latestPublishedForm ? latestPublishedForm.id === form.id : false;

        const items = [
            entity.putBatch({
                ...form,
                ...revisionKeys,
                TYPE: createFormType()
            })
        ];
        let esData: any = undefined;
        if (isLatest) {
            esData = getESDataForLatestRevision(form);
        }
        /**
         * In case previously published revision exists, replace current one with that one.
         * And if it does not, delete the record.
         */
        if (isLatestPublished) {
            const revisions = await listFormRevisions({
                where: {
                    formId,
                    tenant,
                    locale,
                    version_not: form.version,
                    publishedOn_not: null
                },
                sort: ["savedOn_DESC"]
            });

            const previouslyPublishedRevision = revisions.shift();
            if (previouslyPublishedRevision) {
                items.push(
                    entity.putBatch({
                        ...previouslyPublishedRevision,
                        ...latestPublishedKeys,
                        TYPE: createFormLatestPublishedType()
                    })
                );
            } else {
                items.push(entity.deleteBatch(latestPublishedKeys));
            }
        }

        try {
            await batchWriteAll({
                table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not unpublish form.",
                ex.code || "UNPUBLISH_FORM_ERROR",
                {
                    form,
                    original,
                    latestForm,
                    revisionKeys,
                    latestKeys,
                    latestPublishedKeys
                }
            );
        }
        /**
         * No need to go further in case of non-existing Elasticsearch data.
         */
        if (!esData) {
            return form;
        }
        const { index } = configurations.es({
            tenant: form.tenant,
            locale: form.locale
        });
        try {
            await esEntity.put({
                ...latestKeys,
                index,
                TYPE: createFormLatestType(),
                data: esData
            });
            return form;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not unpublish form from the Elasticsearch.",
                ex.code || "UNPUBLISH_FORM_ERROR",
                {
                    form,
                    original,
                    latestForm,
                    revisionKeys,
                    latestKeys,
                    latestPublishedKeys
                }
            );
        }
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
