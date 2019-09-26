// @flow
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

const SETTINGS_FIELDS = /* GraphQL */ `
    {
        reCaptcha {
            enabled
            settings {
                enabled
                siteKey
                secretKey
            }
            errorMessage {
                ${I18N_FIELDS}
            }
        }
        layout {
            renderer
        }
        successMessage {
            ${I18N_FIELDS}
        }
        submitButtonLabel {
            ${I18N_FIELDS}
        }
        termsOfServiceMessage {
            enabled
            message {
                ${I18N_FIELDS}
            }
            errorMessage {
                ${I18N_FIELDS}
            }
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
            }
        }
    }
`;
