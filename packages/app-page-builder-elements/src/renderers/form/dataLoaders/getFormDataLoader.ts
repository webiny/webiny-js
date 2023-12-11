import { FormData } from "./../types";
import { fetchData } from "./fetchData";
import { GET_PUBLISHED_FORM } from "./graphql";

export interface CreateGetFormDataLoaderParams {
    apiUrl: string;
    query?: string;
    includeHeaders?: Record<string, any>;
}

export interface GetFormDataLoaderVariables {
    formId?: string;
}

export type GetFormDataLoaderResult = FormData;

export type GetFormDataLoader = (params: {
    variables: GetFormDataLoaderVariables;
    headers?: Record<string, any>;
}) => GetFormDataLoaderResult | Promise<GetFormDataLoaderResult>;

export const createGetFormDataLoader = (
    params: CreateGetFormDataLoaderParams
): GetFormDataLoader => {
    const { apiUrl, query = GET_PUBLISHED_FORM, includeHeaders = {} } = params;
    return ({ variables, headers = {} }) => {
        return fetchData({
            apiUrl,
            query,
            includeHeaders: { ...includeHeaders, ...headers },
            variables
        }).then(response => {
            return response.data.formBuilder.getPublishedForm.data as FormData;
        });
    };
};
