import gql from "graphql-tag";

export const FIELDS_FIELDS = `
    id
    fieldId
    type
    label
    placeholderText
    helpText  
    predefinedValues {
        enabled
        values {
            label
            value
        }
    }
    multipleValues 
    renderer {
        name
    }
    validation {
        name
        settings
        message
    }
    listValidation {
        name
        settings
        message
    }
    settings
`;

export const MODEL_FIELDS = `
    name
    group {
        id
        name
    }
    description
    modelId
    savedOn
    titleFieldId
    lockedFields
    layout
    fields {
        ${FIELDS_FIELDS}
    }
`;

export const GET_CONTENT_MODEL = gql`
    query CmsGetContentModel($modelId: ID!) {
        getContentModel(modelId: $modelId) {
            data {
                ${MODEL_FIELDS}
            }
            error {
                code
                message
                data
            }
        }
    }
`;

export const UPDATE_CONTENT_MODEL = gql`
    mutation CmsUpdateContentModel($modelId: ID!, $data: CmsContentModelUpdateInput!) {
        updateContentModel(modelId: $modelId, data: $data) {
            data {
                ${MODEL_FIELDS}
            }
            error {
                code
                message
                data
            }
        }
    }
`;
