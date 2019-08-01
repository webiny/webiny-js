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

export const CREATE_FORM_SUBMISSION = gql`
    mutation CreateFormSubmission($id: ID!, $data: JSON!, $meta: JSON!, $reCaptchaResponseToken: String) {
        forms {
            createFormSubmission(id: $id, data: $data, meta: $meta, reCaptchaResponseToken: $reCaptchaResponseToken) {
                error {
                    message
                    data
                }
            }
        }
    }
`;
