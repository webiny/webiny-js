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
        settings
`;

export const GET_CONTENT_MODEL = gql`
    query CmsGetContentModel($modelId: ID!) {
        getContentModel(modelId: $modelId) {
            data {
                name
                description
                modelId
                titleFieldId
                lockedFields
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

export const UPDATE_CONTENT_MODEL = gql`
    mutation CmsUpdateContentModel($modelId: ID!, $data: CmsContentModelUpdateInput!) {
        updateContentModel(modelId: $modelId, data: $data) {
            data {
                modelId
                name
                titleFieldId
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
