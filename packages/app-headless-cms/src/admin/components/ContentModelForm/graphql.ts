import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";
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
                        title {
                            value
                        }
                        published
                        version
                        locked
                        parent
                        status
                        revisions {
                            id
                            meta {
                                version
                                status
                                locked
                                published
                                title {
                                    value
                                }
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query list${pluralize(
            ucFirstModelId
        )}($where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $limit: Int, $after: String, $before: String) {
            list${pluralize(ucFirstModelId)}(
                where: $where
                sort: $sort
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    ${createFieldsList(model)}
                    createdBy {
                        firstName
                        lastName
                    }
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
        mutation delete${ucFirstModelId}($id: ID) {
            content: delete${ucFirstModelId}(where: { id: $id }) {
                data
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createCreateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation create${ucFirstModelId}($data: ${ucFirstModelId}Input!) {
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

export const createUpdateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation update${ucFirstModelId}($id: ID!, $data: ${ucFirstModelId}Input!) {
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
                    published
                    status
                    locked
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
                    published
                    status
                    locked
                }
            }
            error ${ERROR_FIELD}
        }
        }`;
};

export const createCreateFromMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation Create${ucFirstModelId}From($revision: ID!, $data: ${ucFirstModelId}Input!) {
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
