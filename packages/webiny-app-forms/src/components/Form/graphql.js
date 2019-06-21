import gql from "graphql-tag";

export const getForm = gql`
    query GetForm($id: ID!) {
        forms {
            getForm(id: $id) {
                data {
                    id
                    fields
                    layout
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
