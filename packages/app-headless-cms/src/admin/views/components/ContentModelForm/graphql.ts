import upperFirst from "lodash/upperFirst";
import gql from "graphql-tag";
import pluralize from "pluralize";
import { getPlugins } from "@webiny/plugins";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

const CONTENT_META_FIELDS = /* GraphQL */ `
    title
    publishedOn
    version
    locked
    status
`;

const createFieldsList = contentModel => {
    const fields = contentModel.fields.map(field => {
        const fieldPlugin = getPlugins<CmsEditorFieldTypePlugin>("cms-editor-field-type").find(
            item => item.field.type === field.type
        );

        const { graphql } = fieldPlugin.field;

        if (graphql && graphql.queryField) {
            return `${field.fieldId} ${graphql.queryField}`;
        }

        return field.fieldId;
    });

    return fields.join("\n");
};

export const createReadQuery = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsEntriesGet${ucFirstModelId}($revision: ID!) {
            content: get${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    ${createFieldsList(model)}
                    savedOn
                    meta {
                        ${CONTENT_META_FIELDS}
                        revisions {
                            id
                            savedOn
                            meta {
                                ${CONTENT_META_FIELDS}
                            }
                        }
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createListQuery = model => {
    const ucFirstPluralizedModelId = upperFirst(pluralize(model.modelId));
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsEntriesList${ucFirstPluralizedModelId}($where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $limit: Int, $after: String) {
            content: list${ucFirstPluralizedModelId}(
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                data {
                    id
                    savedOn
                    meta {
                        ${CONTENT_META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createDeleteMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsEntriesDelete${ucFirstModelId}($revision: ID!) {
            content: delete${ucFirstModelId}(revision: $revision) {
                data
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createCreateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsEntriesCreate${ucFirstModelId}($data: ${ucFirstModelId}Input!) {
            content: create${ucFirstModelId}(data: $data) {
                data {
                    id
                    savedOn
                    ${createFieldsList(model)}
                    meta {
                        ${CONTENT_META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createCreateFromMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsCreate${ucFirstModelId}From($revision: ID!, $data: ${ucFirstModelId}Input) {
            content: create${ucFirstModelId}From(revision: $revision, data: $data) {
                data {
                    id
                    savedOn
                    ${createFieldsList(model)}
                    meta {
                        ${CONTENT_META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }`;
};

export const createUpdateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsUpdate${ucFirstModelId}($revision: ID!, $data: ${ucFirstModelId}Input!) {
            content: update${ucFirstModelId}(revision: $revision, data: $data) {
                data {
                    id
                    ${createFieldsList(model)}
                    savedOn
                    meta { 
                        ${CONTENT_META_FIELDS} 
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createPublishMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsPublish${ucFirstModelId}($revision: ID!) {
            content: publish${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    meta {
                        ${CONTENT_META_FIELDS}
                        revisions {
                            id
                            savedOn
                            meta {
                                ${CONTENT_META_FIELDS}
                            }
                        }
                    }
                }
                error ${ERROR_FIELD}
            }
        }`;
};

export const createUnpublishMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsUnpublish${ucFirstModelId}($revision: ID!) {
            content: unpublish${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    meta {
                        ${CONTENT_META_FIELDS}
                        revisions {
                            id
                            savedOn
                            meta {
                                ${CONTENT_META_FIELDS}
                            }
                        }
                    }
                }
                error ${ERROR_FIELD}
            }
        }`;
};
