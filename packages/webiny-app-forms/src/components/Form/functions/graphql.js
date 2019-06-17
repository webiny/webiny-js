import gql from "graphql-tag";

export const SAVE_FORM_VIEW = gql`
    mutation SaveFormView($id: ID!) {
        forms {
            saveFormView(id: $id) {
                error {
                    message
                }
            }
        }
    }
`;

export const SAVE_FORM_SUBMISSION = gql`
    mutation SaveFormView($id: ID!, $data: JSON!, $meta: JSON!) {
        forms {
            saveFormSubmission(id: $id, data: $data, meta: $meta) {
                error {
                    message
                }
            }
        }
    }
`;
