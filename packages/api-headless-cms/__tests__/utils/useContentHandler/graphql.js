import upperFirst from "lodash/upperFirst";

const I18N_FIELD = /* GraphQL */ `
    {
        values {
            value
            locale
        }
    }
`;

const READ_I18N_FIELD = /* GraphQL */ `
    {
        value
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

const I18N_FIELD_WITH_CONTENT = /* GraphQL */ `
    {
        values {
            value {
                id
                meta {
                    title {
                        value
                    }
                }
            }
            locale
        }
    }
`;

const READ_I18N_FIELD_WITH_CONTENT = /* GraphQL */ `
    {
        value {
            id
            meta {
                title {
                    value
                }
            }
        }
    }
`;

const createFieldsList = (contentModel, type = "manage") => {
    if (type === "manage") {
        const fields = contentModel.fields.map(field => {
            if (field.type === "ref") {
                return `${field.fieldId} ${I18N_FIELD_WITH_CONTENT}`;
            }

            return `${field.fieldId} ${I18N_FIELD}`;
        });

        return fields.join("\n");
    }

    const fields = contentModel.fields.map(field => {
        if (field.type === "ref") {
            return `${field.fieldId} ${READ_I18N_FIELD_WITH_CONTENT}`;
        }

        return `${field.fieldId}`;
    });

    return fields.join("\n");
};

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        label ${I18N_FIELD}
        placeholderText ${I18N_FIELD}
        helpText ${I18N_FIELD}
        predefinedValues {
            enabled
            values {
                values {
                    locale
                    value
                }
            }
        }
        multipleValues 
        renderer {
            name
        }
        validation {
            name
            settings
            message ${I18N_FIELD}
        }
        settings
`;

export const CREATE_CONTENT_MODEL = /* GraphQL */ `
    mutation CreateContentModel($data: CmsContentModelInput!) {
        content: createContentModel(data: $data) {
            data {
                id
                name
                modelId
                titleFieldId
                lockedFields
                fields {
                    ${FIELDS_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
    }
`;

export const UPDATE_CONTENT_MODEL = /* GraphQL */ `
    mutation UpdateContentModel($id: ID!, $data: CmsContentModelInput!) {
        content: updateContentModel(id: $id, data: $data) {
            data {
                id
                name
                titleFieldId
                lockedFields
                fields {
                    ${FIELDS_FIELDS}
                }
                layout
            }
            error ${ERROR_FIELD}
        }
    }
`;

export const DELETE_CONTENT_MODEL = /* GraphQL */ `
    mutation HeadlessCmsDeleteContentModel($id: ID!) {
        content: deleteContentModel(id: $id) {
            data
            error ${ERROR_FIELD}
        }
    }
`;

export const GET_CONTENT_MODEL = /* GraphQL */ `
    query GetContentModel($id: ID!) {
        content: getContentModel(id: $id) {
            data {
                id
                name
                titleFieldId
                indexes {
                    fields
                }
                lockedFields
                fields {
                    _id
                    fieldId
                    multipleValues
                }
                layout
            }
            error {
                code
                message
                data
            }
        }
    }
`;
export const GET_CONTENT_MODEL_BY_MODEL_ID = /* GraphQL */ `
    query getContentByModelId($modelId: String) {
        content: getContentModel(where: { modelId: $modelId }) {
            data {
                id
                modelId
                pluralizedModelId
                name
                pluralizedName
                fields {
                    ${FIELDS_FIELDS}
                }
                layout
            }
            error {
                code
                message
                data
            }
        }
    }
`;

export const createReadQuery = (model, type = "manage") => {
    const ucFirstModelId = upperFirst(model.modelId);

    if (type === "manage") {
        return /* GraphQL */ `
        query get${ucFirstModelId}($id: ID!) {
            content: get${ucFirstModelId}(where: { id: $id }) {
            data {
                id
                ${createFieldsList(model, type)}
                savedOn
                meta {
                    ${CONTENT_META_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
        }
    `;
    }

    return /* GraphQL */ `
        query get${ucFirstModelId}($locale: String, $where: ${ucFirstModelId}GetWhereInput!) {
            content: get${ucFirstModelId}(where: $where, locale: $locale) {
                data {
                    id
                    ${createFieldsList(model, type)}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createListRevisionsQuery = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return /* GraphQL */ `
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

export const createListQuery = (model, type = "manage") => {
    const ucFirstPluralizedModelId = upperFirst(model.pluralizedModelId);
    const ucFirstModelId = upperFirst(model.modelId);

    if (type === "manage") {
        return /* GraphQL */ `
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
    }

    return /* GraphQL */ `
        query list${ucFirstPluralizedModelId}($locale: String, $where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $limit: Int, $after: String, $before: String) {
            content: list${ucFirstPluralizedModelId}(
                locale: $locale
                where: $where
                sort: $sort
                limit: $limit
                after: $after
                before: $before
                ) {
                    data {
                        id
                        savedOn
                        ${createFieldsList(model, type)}
                    }
                    meta {
                        cursors {
                            next
                            previous
                        }
                        totalCount
                    }
                    error ${ERROR_FIELD}
                }
            }
    `;
};

export const createDeleteMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return /* GraphQL */ `
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

    return /* GraphQL */ `
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

    return /* GraphQL */ `
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

    return /* GraphQL */ `
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

    return /* GraphQL */ `
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

    return /* GraphQL */ `
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
