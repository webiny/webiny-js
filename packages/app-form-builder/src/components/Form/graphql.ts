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
    query GetPublishedForm($id: ID, $parent: ID) {
        formBuilder {
            getPublishedForm(revision: $id, parent: $parent) {
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
