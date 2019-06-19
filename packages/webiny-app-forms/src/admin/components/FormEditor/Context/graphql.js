// @flow
import gql from "graphql-tag";

const settingsField = /* GraphQL */ `
    {
        layout {
            renderer
        }
        successMessage {
            value
            values {
                locale
                value
            }
        }
        submitButtonLabel {
            value
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
                    fields
                    layout
                    settings ${settingsField}
                    triggers
                    revisions {
                        id
                        name
                        published
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
                    fields
                    layout
                    settings ${settingsField}
                    triggers
                }
            }
        }
    }
`;
