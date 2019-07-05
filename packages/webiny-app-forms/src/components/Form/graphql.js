import gql from "graphql-tag";

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
        validation
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
