import gql from "graphql-tag";

export const SAVE_FORM_VIEW = gql`
    mutation SaveFormView($revision: ID!) {
        formBuilder {
            saveFormView(revision: $revision) {
                error {
                    message
                }
            }
        }
    }
`;

export const CREATE_FORM_SUBMISSION = gql`
    mutation CreateFormSubmission(
        $revision: ID!
        $data: JSON!
        $meta: JSON!
        $reCaptchaResponseToken: String
    ) {
        formBuilder {
            createFormSubmission(
                revision: $revision
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
