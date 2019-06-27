import gql from "graphql-tag";

export const fieldsFields = `
        id
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
        defaultValue
        validation
        settings
`;

export const dataFields = `
    id
    fields {
        ${fieldsFields}
    }
    layout
    triggers
    settings {
        layout {
            renderer
        }
        successMessage {
            value
        }
        submitButtonLabel {
            value
        }
    }
`;

export const getForm = gql`
    query GetForm($id: ID!) {
        forms {
            getForm(id: $id) {
                data {
                    ${dataFields}
                }
                error {
                    message
                }
            }
        }
    }
`;

export const getPublishedForm = gql`
    query GetPublishedForm($id: ID!) {
        forms {
            getPublishedForm(id: $id) {
                data {
                    ${dataFields}
                }
                error {
                    message
                }
            }
        }
    }
`;
