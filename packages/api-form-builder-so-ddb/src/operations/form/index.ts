import WebinyError from "@webiny/error";
import {
    FbForm,
    FormBuilderStorageOperationsGetFormParams,
    FormBuilderStorageOperationsListFormRevisionsParams,
    FormBuilderStorageOperationsListFormRevisionsParamsWhere,
    FormBuilderStorageOperationsUnpublishFormParams,
    FormBuilderStorageOperationsUpdateFormParams
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import { PluginsContainer } from "@webiny/plugins";
import {
    FormBuilderFormCreateGSIPartitionKeyParams,
    FormBuilderFormCreatePartitionKeyParams,
    FormBuilderFormStorageOperations
} from "~/types";
import { FormDynamoDbFieldPlugin } from "~/plugins/FormDynamoDbFieldPlugin";
import { get } from "@webiny/db-dynamodb/utils/get";

interface Keys {
    PK: string;
    SK: string;
}

interface FormLatestSortKeyParams {
    id?: string;
    formId?: string;
}

interface GsiKeys {
    GSI1_PK: string;
    GSI1_SK: string;
}

export interface CreateFormStorageOperationsParams {
    entity: Entity<any>;
    table: Table;
    plugins: PluginsContainer;
}

export const createFormStorageOperations = (
    params: CreateFormStorageOperationsParams
): FormBuilderFormStorageOperations => {
    const { entity, table, plugins } = params;

    const formDynamoDbFields = plugins.byType<FormDynamoDbFieldPlugin>(
        FormDynamoDbFieldPlugin.type
    );

    const createFormPartitionKey = (params: FormBuilderFormCreatePartitionKeyParams): string => {
        const { tenant, locale } = params;

        return `T#${tenant}#L#${locale}#FB#F`;
    };

    const createFormLatestPartitionKey = (
        params: FormBuilderFormCreatePartitionKeyParams
    ): string => {
        return `${createFormPartitionKey(params)}#L`;
    };

    const createFormLatestPublishedPartitionKey = (
        params: FormBuilderFormCreatePartitionKeyParams
    ): string => {
        return `${createFormPartitionKey(params)}#LP`;
    };

    const createFormGSIPartitionKey = (
        params: FormBuilderFormCreateGSIPartitionKeyParams
    ): string => {
        const { tenant, locale, id: targetId } = params;
        const { id } = parseIdentifier(targetId);

        return `T#${tenant}#L#${locale}#FB#F#${id}`;
    };

    const createRevisionSortKey = ({ id }: { id: string }): string => {
        return `${id}`;
    };

    const createFormLatestSortKey = ({ id, formId }: FormLatestSortKeyParams): string => {
        const value = parseIdentifier(id || formId);
        return value.id;
    };

    const createLatestPublishedSortKey = ({ id, formId }: FormLatestSortKeyParams): string => {
        const value = parseIdentifier(id || formId);
        return value.id;
    };

    const createGSISortKey = (version: number) => {
        return `${version}`;
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

    const createRevisionKeys = (form: FbForm): Keys => {
        return {
            PK: createFormPartitionKey(form),
            SK: createRevisionSortKey(form)
        };
    };

    const createLatestKeys = (form: FbForm): Keys => {
        return {
            PK: createFormLatestPartitionKey(form),
            SK: createFormLatestSortKey(form)
        };
    };

    const createLatestPublishedKeys = (form: FbForm): Keys => {
        return {
            PK: createFormLatestPublishedPartitionKey(form),
            SK: createLatestPublishedSortKey(form)
        };
    };

    const createGSIKeys = (form: FbForm): GsiKeys => {
        return {
            GSI1_PK: createFormGSIPartitionKey(form),
            GSI1_SK: createGSISortKey(form.version)
        };
    };

    const createForm = () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    const createFormFrom = async () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    const updateForm = async (
        params: FormBuilderStorageOperationsUpdateFormParams
    ): Promise<FbForm> => {
        const { form, original } = params;

        const revisionKeys = createRevisionKeys(form);
        const latestKeys = createLatestKeys(form);
        const gsiKeys = createGSIKeys(form);

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
                ...revisionKeys,
                ...gsiKeys,
                TYPE: createFormType()
            })
        ];
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
                ex.message || "Could not update form data in the table.",
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

        return form;
    };

    const getForm = async (
        params: FormBuilderStorageOperationsGetFormParams
    ): Promise<FbForm | null> => {
        const { where } = params;
        const { id, formId, latest, published, version } = where;
        if (latest && published) {
            throw new WebinyError("Cannot have both latest and published params.");
        }
        let partitionKey: string;
        let sortKey: string;
        if (latest) {
            partitionKey = createFormLatestPartitionKey(where);
            sortKey = createFormLatestSortKey(where);
        } else if (published && !version) {
            /**
             * Because of the specifics how DynamoDB works, we must not load the published record if version is sent.
             */
            partitionKey = createFormLatestPublishedPartitionKey(where);
            sortKey = createLatestPublishedSortKey(where);
        } else if (id || version) {
            partitionKey = createFormPartitionKey(where);
            sortKey = createRevisionSortKey({
                id:
                    id ||
                    createIdentifier({
                        id: formId as string,
                        version: version as number
                    })
            });
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
            PK: partitionKey,
            SK: sortKey
        };

        try {
            const item = await get<FbForm>({ entity, keys });
            return cleanupItem(entity, item);
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

    const listForms = () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    const listFormRevisions = async (
        params: FormBuilderStorageOperationsListFormRevisionsParams
    ): Promise<FbForm[]> => {
        const { where: initialWhere, sort } = params;
        const { id, formId, tenant, locale } = initialWhere;

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createFormGSIPartitionKey({
                tenant,
                locale,
                id: formId || id
            }),
            options: {
                index: "GSI1",
                gte: " "
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
            ...initialWhere
        };
        /**
         * We need to remove conditions so we do not filter by them again.
         */
        delete where.id;
        delete where.formId;
        delete where.tenant;
        delete where.locale;

        const filteredItems = filterItems({
            plugins,
            items,
            where,
            fields: formDynamoDbFields
        });
        return sortItems({
            items: filteredItems,
            sort,
            fields: formDynamoDbFields
        });
    };

    const deleteForm = async () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    const deleteFormRevision = async () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
    };

    const publishForm = async () => {
        throw new Error(
            "api-form-builder-ddb does not implement the Form Builder storage operations."
        );
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

        const revisionKeys = createRevisionKeys(form);
        const latestKeys = createLatestKeys(form);
        const latestPublishedKeys = createLatestPublishedKeys(form);
        const gsiKeys = createGSIKeys(form);

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
                ...gsiKeys,
                TYPE: createFormType()
            })
        ];

        if (isLatest) {
            entity.putBatch({
                ...form,
                ...latestKeys,
                TYPE: createFormLatestType()
            });
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
            return form;
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
