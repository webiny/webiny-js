import gql from "graphql-tag";

const i18nFields = `
    values {
        value
        locale
    }
`;

export const fieldsFields = `
        id
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

export const getForm = gql`
    query GetForm($id: ID!) {
        forms {
            getForm(id: $id) {
                data {
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
                }
                error {
                    message
                }
            }
        }
    }
`;
