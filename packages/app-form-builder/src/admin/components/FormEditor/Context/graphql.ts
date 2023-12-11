import gql from "graphql-tag";
import { FbErrorResponse, FbFormModel, FbUpdateFormInput } from "~/types";

const ERROR_FIELDS = `
    {
        message
        code
        data
    }
`;

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        name
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

const SETTINGS_FIELDS = /* GraphQL */ `
    {
        reCaptcha {
            enabled
            settings {
                enabled
                siteKey
                secretKey
            }
            errorMessage
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
 * ####################
 * Get Form Query
 */
export interface GetFormQueryResponse {
    formBuilder: {
        getForm: {
            data: FbFormModel | null;
            error: FbErrorResponse | null;
        };
    };
}
export interface GetFormQueryVariables {
    revision: string;
}
export const GET_FORM = gql`
    query FbGetForm($revision: ID!) {
        formBuilder {
            getForm(revision: $revision) {
                data {
                    id
                    name
                    version
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    steps {
                        title
                        layout
                    }
                    settings ${SETTINGS_FIELDS}
                    triggers
                    status
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;
/**
 * ####################
 * Update Form Revision Mutation
 */
export interface UpdateFormRevisionMutationResponse {
    formBuilder: {
        updateRevision: {
            data: FbFormModel | null;
            error: FbErrorResponse | null;
        };
    };
}
export interface UpdateFormRevisionMutationVariables {
    revision: string;
    data: FbUpdateFormInput;
}
export const UPDATE_REVISION = gql`
    mutation UpdateForm($revision: ID!, $data: FbUpdateFormInput!) {
        formBuilder {
            updateRevision(revision: $revision, data: $data) {
                data {
                    id
                    name
                    version
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    steps {
                        title
                        layout
                    }
                    settings ${SETTINGS_FIELDS}
                    triggers
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;
