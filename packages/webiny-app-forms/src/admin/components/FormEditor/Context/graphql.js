// @flow
import gql from "graphql-tag";

const i18nFields = `
    values {
        value
        locale
    }
`;

export const fieldsFields = `
        _id
        fieldId
        type
        label {
            ${i18nFields}
        }
        placeholderText {
            ${i18nFields}
        }
        helpText {
            ${i18nFields}
        }
        defaultValue
        validation
        settings
`;

const settingsField = /* GraphQL */ `
    {
        layout {
            renderer
        }
        successMessage {
            values {
                locale
                value
            }
        }
        submitButtonLabel {
            values {
                locale
                value
            }
        }
    }
`;

export const getForm = gql`
    query GetForm($id: ID!) {
        forms {
            getForm(id: $id) {
                data {
                    id
                    name
                    version
                    fields {
                        ${fieldsFields}
                    }
                    layout
                    settings ${settingsField}
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

export const updateRevision = gql`
    mutation UpdateForm($id: ID!, $data: UpdateFormInput!) {
        forms {
            updateRevision(id: $id, data: $data) {
                data {
                    id
                    name
                    version
                    fields {
                        ${fieldsFields}
                    }
                    layout
                    settings ${settingsField}
                    triggers
                }
            }
        }
    }
`;
