import gql from "graphql-tag";

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        label
        placeholderText
        helpText
        options {
            label
            value
        }
        validation {
            name
            settings
            message
        }
        settings
`;

export const DATA_FIELDS = `
    id
    parent
    fields {
        ${FIELDS_FIELDS}
    }
    layout
    triggers
    settings {
        reCaptcha {
            enabled
            errorMessage
            settings {
                enabled
                siteKey
                secretKey
            }
        }
        layout {
            renderer
        }
        successMessage
        submitButtonLabel 
        termsOfServiceMessage {
            enabled
            message
            errorMessage
        }
    }
`;

export const GET_PUBLISHED_FORM = gql`
    query GetPublishedForm($id: ID, $parent: ID, $version: Int, $slug: String) {
        forms {
            getPublishedForm(id: $id, parent: $parent, version: $version, slug: $slug) {
                data {
                    ${DATA_FIELDS}
                }
                error {
                    message
                }
            }
        }
    }
`;
