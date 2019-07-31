import gql from "graphql-tag";

export const FORMS_SETTINGS = /* GraphQL */ `
    {
        settings {
            forms {
                reCaptcha {
                    enabled
                    siteKey
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
            settings {
                enabled
                siteKey 
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
        }
    }
`;

export const getPublishedForm = gql`
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
