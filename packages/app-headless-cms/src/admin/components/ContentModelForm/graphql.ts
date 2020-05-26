import upperFirst from "lodash/upperFirst";
import gql from "graphql-tag";

const I18N_FIELD = /* GraphQL */ `
    {
        values {
            value
            locale
        }
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

const CONTENT_META_FIELDS = /* GraphQL */ `
    title {
        value
    }
    published
    version
    locked
    parent
    status
`;

const createFieldsList = contentModel => {
    const fields = contentModel.fields.map(field => {
        return `${field.fieldId} ${I18N_FIELD}`;
    });

    return fields.join("\n");
};

export const createReadQuery = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query get${ucFirstModelId}($id: ID!) {
            content: get${ucFirstModelId}(where: { id: $id }) {
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

export const createListRevisionsQuery = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query List${ucFirstModelId}Revisions($id: ID!) {
            content: get${ucFirstModelId}(where: { id: $id }) {
                data {
                    id
                    meta {
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
    const ucFirstPluralizedModelId = upperFirst(model.pluralizedModelId);
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query list${ucFirstPluralizedModelId}($where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $limit: Int, $after: String, $before: String) {
            content: list${ucFirstPluralizedModelId}(
                where: $where
                sort: $sort
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    savedOn
                    meta {
                        title {
                            value
                        }
                        published
                        version
                        parent
                        status
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
        mutation Delete${ucFirstModelId}($revision: ID!) {
            content: delete${ucFirstModelId}(where: { id: $revision }) {
                data
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createCreateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation Create${ucFirstModelId}($data: ${ucFirstModelId}Input!) {
            content: create${ucFirstModelId}(data: $data) {
                data {
                    id
                    ${createFieldsList(model)}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createCreateFromMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation Create${ucFirstModelId}From($revision: ID!, $data: ${ucFirstModelId}Input) {
            content: create${ucFirstModelId}From(revision: $revision, data: $data) {
                data {
                    id
                    meta {
                        published
                        status
                        locked
                    }
                }
                error ${ERROR_FIELD}
            }
        }`;
};

export const createUpdateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation Update${ucFirstModelId}($id: ID!, $data: ${ucFirstModelId}Input!) {
            content: update${ucFirstModelId}(where: { id: $id }, data: $data) {
                data {
                    id
                    ${createFieldsList(model)}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createPublishMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation Publish${ucFirstModelId}($revision: ID!) {
            content: publish${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    meta {
                        ${CONTENT_META_FIELDS}
                        revisions {
                            id
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
        mutation Unpublish${ucFirstModelId}($revision: ID!) {
            content: unpublish${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    meta {
                        ${CONTENT_META_FIELDS}
                        revisions {
                            id
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
