import { fetchData } from "./fetchData";

export const CREATE_FORM_SUBMISSION = /* GraphQL */ `
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

export interface CreateSubmitFormDataLoaderParams {
    apiUrl: string;
    query?: string;
    includeHeaders?: Record<string, any>;
}

export interface SubmitFormDataLoaderVariables {
    revision: string;
    reCaptchaResponseToken: string;
    data: any;
    meta: { ip: string };
}

export type SubmitFormDataLoaderResult = {
    error: {
        message: string;
        data: any;
    };
};

export type SubmitFormDataLoader = (params: {
    variables: SubmitFormDataLoaderVariables;
}) => Promise<SubmitFormDataLoaderResult>;

export const createSubmitFormDataLoader = (
    params: CreateSubmitFormDataLoaderParams
): SubmitFormDataLoader => {
    const { apiUrl, query = CREATE_FORM_SUBMISSION, includeHeaders = {} } = params;
    return ({ variables }) => {
        return fetchData({ apiUrl, query, includeHeaders, variables }).then(response => {
            return response.data.formBuilder.createFormSubmission;
        });
    };
};
