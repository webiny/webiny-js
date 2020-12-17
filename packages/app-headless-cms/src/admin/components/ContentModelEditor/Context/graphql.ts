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
            values
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
    query CmsGetContentModel($id: ID!) {
        getContentModel(id: $id) {
            data {
                id
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
    mutation CmsUpdateContentModel($id: ID!, $data: CmsContentModelUpdateInput!) {
        updateContentModel(id: $id, data: $data) {
            data {
                id
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
