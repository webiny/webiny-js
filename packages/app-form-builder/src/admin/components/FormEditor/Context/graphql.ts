import gql from "graphql-tag";

const ERROR_FIELDS = `
    {
        message
        code
        data
    }
`;

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        name
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

const SETTINGS_FIELDS = /* GraphQL */ `
    {
        reCaptcha {
            enabled
            settings {
                enabled
                siteKey
                secretKey
            }
            errorMessage
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

export const GET_FORM = gql`
    query FbGetForm($revision: ID!) {
        formBuilder {
            getForm(revision: $revision) {
                data {
                    id
                    name
                    version
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    layout
                    settings ${SETTINGS_FIELDS}
                    triggers
                    published
                    locked
                    status
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_REVISION = gql`
    mutation UpdateForm($revision: ID!, $data: FbUpdateFormInput!) {
        formBuilder {
            updateRevision(revision: $revision, data: $data) {
                data {
                    id
                    name
                    version
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    layout
                    settings ${SETTINGS_FIELDS}
                    triggers
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;
