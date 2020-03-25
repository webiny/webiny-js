import gql from "graphql-tag";

const I18N_FIELDS = `
    values {
        value
        locale
    }
`;

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        name
        label {
            ${I18N_FIELDS}
        }
        placeholderText {
            ${I18N_FIELDS}
        }
        helpText {
            ${I18N_FIELDS}
        }  
        options {
            label {
                ${I18N_FIELDS}
            }
            value
        }
        validation {
            name
            settings
            message {
                ${I18N_FIELDS}
            }
        }
        settings
`;

export const GET_CONTENT_MODEL = gql`
    query GetContentModel($id: ID!) {
        cms {
            getContentModel(id: $id) {
                data {
                    id
                    title
                    description
                    modelId
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    layout
                }
            }
        }
    }
`;

export const UPDATE_CONTENT_MODEL = gql`
    mutation UpdateContentModel($id: ID!, $data: CmsContentModelInput!) {
        cms {
            updateContentModel(id: $id, data: $data) {
                data {
                    id
                    title
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    layout
                }
            }
        }
    }
`;
