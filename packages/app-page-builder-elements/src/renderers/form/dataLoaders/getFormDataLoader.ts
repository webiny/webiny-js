import { FormData } from "./../types";
import { fetchData } from "./fetchData";
import { GET_PUBLISHED_FORM } from "./graphql";

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
