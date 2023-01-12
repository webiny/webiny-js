import { FormData } from "./../types";
import { fetchData } from "./fetchData";

const GET_PUBLISHED_FORM = /* GraphQL */ `
    query GetPublishedForm($revision: ID, $parent: ID) {
        formBuilder {
            getPublishedForm(revision: $revision, parent: $parent) {
                data {
                    id
                    fields {
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
                    }
                    layout
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
                        termsOfServiceMessage {
                            enabled
                            message
                            errorMessage
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

export interface CreateGetFormDataLoaderParams {
    apiUrl: string;
    query?: string;
    includeHeaders?: Record<string, any>;
}

export interface GetFormDataLoaderVariables {
    revision?: string;
    parent?: string;
}

export type GetFormDataLoaderResult = FormData;

export type GetFormDataLoader = (params: {
    variables: GetFormDataLoaderVariables;
}) => Promise<GetFormDataLoaderResult>;

export const createGetFormDataLoader = (
    params: CreateGetFormDataLoaderParams
): GetFormDataLoader => {
    const { apiUrl, query = GET_PUBLISHED_FORM, includeHeaders = {} } = params;
    return ({ variables }) => {
        return fetchData({ apiUrl, query, includeHeaders, variables }).then(response => {
            return response.data.formBuilder.getPublishedForm.data as FormData;
        });
    };
};
