import {
    FbForm,
    FormBuilderFormStorageOperations,
    FormBuilderStorageOperationsCreateFormParams,
    FormBuilderStorageOperationsDeleteFormParams,
    FormBuilderStorageOperationsGetFormParams,
    FormBuilderStorageOperationsListFormRevisionsParams,
    FormBuilderStorageOperationsListFormsParams,
    FormBuilderStorageOperationsListFormsResponse,
    FormBuilderStorageOperationsPublishFormParams,
    FormBuilderStorageOperationsUnpublishFormParams,
    FormBuilderStorageOperationsUpdateFormParams
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import {
    queryAll,
    QueryAllParams,
    queryOne,
    QueryOneParams
} from "@webiny/db-dynamodb/utils/query";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import configurations from "~/configurations";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import fields from "./fields";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";

export type DbRecord<T = any> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};

export interface Params {
    entity: Entity<any>;
    esEntity: Entity<any>;
    table: Table;
    elasticsearch: Client;
}

const getFormId = (id: string): string => {
    if (id.includes("#") === false) {
        return id;
    }
    return id.split("#").shift();
};

const getFormVersion = (id: string): number => {
    if (id.includes("#") === false) {
        return Number(id);
    }
    return Number(id.split("#").pop());
};

const zeroPad = (version: number) => `${version}`.padStart(4, "0");

type FbFormElastic = Omit<FbForm, "triggers" | "fields" | "settings" | "layout" | "stats"> & {
    __type: string;
};

const getESDataForLatestRevision = (form: FbForm): FbFormElastic => ({
    __type: "fb.form",
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

export interface CreatePartitionKeyParams {
    tenant: string;
    locale: string;
    id: string;
}

export const createFormStorageOperations = (params: Params): FormBuilderFormStorageOperations => {
    const { entity, esEntity, table } = params;

    const dynamoDbValueFilterPlugins: ValueFilterPlugin[] = dynamoDbValueFilters();

    const formDynamoDbFields = fields();

    const createPartitionKey = (params: CreatePartitionKeyParams): string => {
        const { tenant, locale, id } = params;
        return `T#${tenant}#L#${locale}#FB#F#${getFormId(id)}`;
    };

    const createRevisionSortKey = (value: string | number): string => {
        const version = typeof value === "number" ? Number(value) : getFormVersion(value);
        return `REV#${zeroPad(version)}`;
    };

    const createLatestSortKey = (): string => {
        return "L";
    };

    const createPublishedSortKey = (): string => {
        return "P";
    };

    const createSubmissionSortKey = (id: string): string => {
        return `FS#${id}`;
    };

    const createFormType = (): string => {
        return "fb.form";
    };

    const createFormLatestType = (): string => {
        return "fb.form.latest";
    };

    const createFormLatestPublished = (): string => {
        return "fb.form.latestPublished";
    };

    const createSubmissionType = () => {
        return "fb.formSubmission";
    };

    const createForm = async (
        params: FormBuilderStorageOperationsCreateFormParams
    ): Promise<FbForm> => {
        const { form } = params;

        const revisionKeys = {
            PK: createPartitionKey(form),
            SK: createRevisionSortKey(form.id)
        };
        const latestKeys = {
            PK: createPartitionKey(form),
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
                tenant: form.tenant
            });
            await esEntity.put({
                index,
                data: getESDataForLatestRevision(form),
                TYPE: createFormLatestType(),
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

    const updateForm = async (
        params: FormBuilderStorageOperationsUpdateFormParams
    ): Promise<FbForm> => {
        const { form, original } = params;

        const revisionKeys = {
            PK: createPartitionKey(form),
            SK: createRevisionSortKey(form.id)
        };
        const latestKeys = {
            PK: createPartitionKey(form),
            SK: createLatestSortKey()
        };

        const latestForm = await getForm({
            where: {
                formId: form.formId,
                latest: true,
                tenant: form.tenant,
                locale: form.locale
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
                    TYPE: createLatestSortKey(),
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
                tenant: form.tenant
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
                ex.code || "UDPATE_FORM_ERROR",
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

    const getForm = async (params: FormBuilderStorageOperationsGetFormParams): Promise<FbForm> => {
        const { where } = params;
        const { id, formId, latest, published, version, tenant, locale } = where;
        if (latest && published) {
            throw new WebinyError("Cannot have both latest and published params.");
        }
        let sortKey: string;
        if (latest) {
            sortKey = createLatestSortKey();
        } else if (published) {
            sortKey = createPublishedSortKey();
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
            PK: createPartitionKey({
                tenant,
                locale,
                id: formId || id
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
    ): Promise<FormBuilderStorageOperationsListFormsResponse> => {};

    const listFormRevisions = async (
        params: FormBuilderStorageOperationsListFormRevisionsParams
    ): Promise<FbForm[]> => {
        const { where: initialWhere, sort } = params;
        const { id, formId, tenant, locale } = initialWhere;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                tenant,
                locale,
                id: id || formId
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
        const where = {
            ...initialWhere,
            id: undefined,
            formId: undefined
        };
        const filteredItems = filterItems({
            /**
             * At the moment we need to send the plugins like this because plugins are extracted from the context.plugins.
             * When we implement sending only plugins that we require, we will change this as well.
             */
            context: {
                plugins: {
                    byType: (type: string) => {
                        if (type !== ValueFilterPlugin.type) {
                            throw new WebinyError(
                                "No other plugins are required in the filtering.",
                                "MALFORMED_TYPE",
                                {
                                    type
                                }
                            );
                        }
                        return dynamoDbValueFilterPlugins;
                    }
                }
            } as any,
            items,
            where,
            fields: formDynamoDbFields
        });
        if (Array.isArray(sort) === false || sort.length === 0) {
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
            partitionKey: createPartitionKey(form),
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
            PK: createPartitionKey(form),
            SK: createLatestSortKey()
        };
        try {
            await esEntity.deleteBatch(latestKeys);
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

    const deleteFormRevision = async (
        params: FormBuilderStorageOperationsDeleteFormParams
    ): Promise<FbForm> => {
        const { form } = params;

        const { tenant, locale } = form;

        const latestForm = await getForm({
            where: {
                formId: form.formId,
                latest: true,
                tenant,
                locale
            }
        });
        const publishedForm = await getForm({
            where: {
                formId: form.formId,
                published: true,
                tenant,
                locale
            }
        });
        const isLatest = latestForm ? latestForm.id === form.id : false;
        const isPublished = publishedForm ? publishedForm.id === form.id : false;

        const items = [
            entity.deleteBatch({
                PK: createPartitionKey(form),
                SK: createRevisionSortKey(form.id)
            })
        ];
        let esItemData = undefined;
        if (isLatest) {
            const queryPreviousFormParams: QueryOneParams = {
                entity,
                partitionKey: createPartitionKey(form),
                options: {
                    lte: createRevisionSortKey(form.id)
                }
            };
            const previousFormRecord = await queryOne<DbRecord<FbForm>>(queryPreviousFormParams);
            if (!previousFormRecord) {
                return await deleteForm({
                    form
                });
            }
            const previousForm = cleanupItem<FbForm>(entity, previousFormRecord);
            const latestKeys = {
                PK: createPartitionKey(previousForm),
                SK: createLatestSortKey()
            };
            items.push(
                entity.putBatch({
                    ...previousForm,
                    TYPE: createFormLatestType(),
                    ...latestKeys
                })
            );
            esItemData = getESDataForLatestRevision(previousForm);
        }
        if (isPublished) {
        }
    };

    const publishForm = async (
        params: FormBuilderStorageOperationsPublishFormParams
    ): Promise<FbForm> => {};

    const unpublishForm = async (
        params: FormBuilderStorageOperationsUnpublishFormParams
    ): Promise<FbForm> => {};

    return {
        createForm,
        listForms,
        listFormRevisions,
        getForm,
        deleteForm,
        deleteFormRevision,
        publishForm,
        unpublishForm,
        updateForm
    };
};
