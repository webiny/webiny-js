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
        validation
        settings
`;

const SETTINGS_FIELDS = /* GraphQL */ `
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
