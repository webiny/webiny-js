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
    query GetForm($id: ID!) {
        forms {
            getForm(id: $id) {
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
                    revisions {
                        id
                        name
                        published
                        locked
                        status
                        version
                    }
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_REVISION = gql`
    mutation UpdateForm($id: ID!, $data: UpdateFormInput!) {
        forms {
            updateRevision(id: $id, data: $data) {
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
