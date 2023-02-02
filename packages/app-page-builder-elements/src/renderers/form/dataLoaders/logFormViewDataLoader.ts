import { fetchData } from "./fetchData";
import { LOG_FORM_VIEW } from "./graphql";

export interface CreateLogFormViewDataLoaderParams {
    apiUrl: string;
    query?: string;
    includeHeaders?: Record<string, any>;
}

export interface LogFormViewDataLoaderVariables {
    revision?: string;
    parent?: string;
}

export type LogFormViewDataLoaderResult = {
    error: string;
};

export type LogFormViewDataLoader = (params: {
    variables: LogFormViewDataLoaderVariables;
}) => Promise<LogFormViewDataLoaderResult>;

export const createLogFormViewDataLoader = (
    params: CreateLogFormViewDataLoaderParams
): LogFormViewDataLoader => {
    const { apiUrl, query = LOG_FORM_VIEW, includeHeaders = {} } = params;
    return ({ variables }) => {
        return fetchData({ apiUrl, query, includeHeaders, variables }).then(response => {
            return response.data.formBuilder.saveFormView;
        });
    };
};
