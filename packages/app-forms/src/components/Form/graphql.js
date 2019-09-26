import gql from "graphql-tag";

export const FORMS_SETTINGS = /* GraphQL */ `
    {
        settings {
            forms {
                reCaptcha {
                    enabled
                    siteKey
                    secretKey
                }
            }
        }
    }
`;

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        label {
            value
        }
        placeholderText {
            value
        }
        helpText {
            value
        }
        options {
            label {
                value
            }
            value
        }
        validation {
            name
            settings
            message {
                value
            }
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
            errorMessage {
                value
            }
            settings {
                enabled
                siteKey
                secretKey
            }
        }
        layout {
            renderer
        }
        successMessage {
            value
        }
        submitButtonLabel {
            value
        } 
        termsOfServiceMessage {
            enabled
            message {
                value
            }
            errorMessage {
                value
            }
        }
    }
`;

export const GET_PUBLISHED_FORM = gql`
    query GetPublishedForm($id: ID, $parent: ID) {
        forms {
            getPublishedForm(id: $id, parent: $parent) {
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
