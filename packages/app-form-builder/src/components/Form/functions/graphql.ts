import gql from "graphql-tag";
import { FbErrorResponse } from "~/types";

/**
 * ########################
 * Save Form View Mutation
 */
export interface SaveFormViewMutationResponse {
    formBuilder: {
        saveFormView: {
            error?: FbErrorResponse;
        };
    };
}
export interface SaveFormViewMutationVariables {
    revision: string;
}
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

/**
 * ########################
 * Create Form Submission Mutation
 */
export interface CreateFormSubmissionMutationResponse {
    formBuilder: {
        createFormSubmission: {
            error?: FbErrorResponse;
        };
    };
}
export interface CreateFormSubmissionMutationVariables {
    revision: string;
    data: Record<string, string>;
    meta: Record<string, string>;
    reCaptchaResponseToken: string;
}
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
