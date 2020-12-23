import gql from "graphql-tag";

export const SAVE_FORM_VIEW = gql`
    mutation SaveFormView($id: ID!) {
        formBuilder {
            saveFormView(id: $id) {
                error {
                    message
                }
            }
        }
    }
`;

export const CREATE_FORM_SUBMISSION = gql`
    mutation CreateFormSubmission(
        $form: ID!
        $data: JSON!
        $meta: JSON!
        $reCaptchaResponseToken: String
    ) {
        formBuilder {
            createFormSubmission(
                form: $form
                data: $data
                meta: $meta
                reCaptchaResponseToken: $reCaptchaResponseToken
            ) {
                error {
                    message
                    data
                }
            }
        }
    }
`;
