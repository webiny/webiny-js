import gql from "graphql-tag";
import { FbErrorResponse, FbFormModel } from "~/types";

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        label
        placeholderText
        helpText
        options {
            label
            value
        }
        validation {
            name
            settings
            message
        }
        settings
`;

export const DATA_FIELDS = `
    id
    fields {
        ${FIELDS_FIELDS}
    }
    steps {
        title
        layout
    }
    triggers
    settings {
        reCaptcha {
            enabled
            errorMessage
            settings {
                enabled
                siteKey
                secretKey
            }
        }
        layout {
            renderer
        }
        successMessage
        submitButtonLabel 
        fullWidthSubmitButton
        termsOfServiceMessage {
            enabled
            message
            errorMessage
        }
    }
`;
/**
 * ################
 * Get Published Form Query
 */
export interface GetPublishedFormQueryResponse {
    formBuilder: {
        getPublishedForm: {
            data: FbFormModel | null;
            error?: FbErrorResponse;
        };
    };
}
export interface GetPublishedFormQueryVariables {
    revision?: string;
    parent?: string;
}
export const GET_PUBLISHED_FORM = gql`
    query GetPublishedForm($revision: ID, $parent: ID) {
        formBuilder {
            getPublishedForm(revision: $revision, parent: $parent) {
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
