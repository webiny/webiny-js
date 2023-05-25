import gql from "graphql-tag";
import { AcoModel, AcoModelField } from "~/types";
import { plugins } from "@webiny/plugins";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;
interface CreateFieldsListParams {
    model: AcoModel;
    fields: AcoModelField[];
}

const defaultFields = ["id", "createdOn", "savedOn", "createdBy {id type displayName}"];

const createFieldsList = ({ model, fields }: CreateFieldsListParams): string => {
    const fieldPlugins: Record<string, any> = plugins
        .byType("cms-editor-field-type")
        .reduce((acc: any, item: any) => ({ ...acc, [item.field.type]: item.field }), {});

    return fields
        .reduce<string[]>(
            (collection, field) => {
                if (!fieldPlugins[field.type]) {
                    console.log(`Unknown field plugin for field type "${field.type}".`);
                    return collection;
                }
                const { graphql } = fieldPlugins[field.type];

                if (graphql && graphql.queryField) {
                    const { queryField } = graphql;
                    const selection =
                        typeof queryField === "string" ? queryField : queryField({ model, field });

                    collection.push(`${field.fieldId} ${selection}`);
                    return collection;
                }

                collection.push(field.fieldId);

                return collection;
            },
            [...defaultFields]
        )
        .join("\n");
};

const createAppFields = (model: AcoModel) => {
    return createFieldsList({
        model,
        fields: model.fields
    });
};

const LIST_META_FIELD = /* GraphQL */ `
    {
        cursor
        totalCount
        hasMoreItems
    }
`;

export const createCreateRecord = (model: AcoModel) => {
    const { singularApiName } = model;
    return gql`
        mutation Create${singularApiName}($data: ${singularApiName}CreateInput!) {
            search {
                createRecord: create${singularApiName}(data: $data) {
                    data {
                        ${createAppFields(model)}
                    }
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const createListRecords = (model: AcoModel) => {
    const { singularApiName, pluralApiName } = model;
    return gql`
        query List${pluralApiName}($where: ${singularApiName}ListWhereInput, $limit: Int, $after: String, $sort: [${singularApiName}ListSorter!], $search: String) {
            search {
                listRecords: list${pluralApiName}(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                    data {
                        ${createAppFields(model)}
                    }
                    meta ${LIST_META_FIELD}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const createGetRecord = (model: AcoModel) => {
    const { singularApiName } = model;
    return gql`
        query Get${singularApiName}($id: ID!) {
            search {
                getRecord: get${singularApiName}(id: $id) {
                    data {
                        ${createAppFields(model)}
                    }
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const createUpdateRecord = (model: AcoModel) => {
    const { singularApiName } = model;
    return gql`
        mutation Update${singularApiName}($id: ID!, $data: ${singularApiName}UpdateInput!) {
            search {
                updateRecord: update${singularApiName}(id: $id, data: $data) {
                    data {
                        ${createAppFields(model)}
                    }
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const createDeleteRecord = (model: AcoModel) => {
    const { singularApiName } = model;
    return gql`
        mutation Delete${singularApiName}($id: ID!) {
            search {
                deleteRecord: delete${singularApiName}(id: $id) {
                    data
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const createListTags = (model: AcoModel) => {
    const { pluralApiName } = model;
    return gql`
        query List${pluralApiName}Tags($where: AcoSearchRecordTagListWhereInput) {
            search {
                listTags: list${pluralApiName}Tags(where: $where) {
                    data {
                        tag
                    }
                    meta ${LIST_META_FIELD}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};
