import { fetchData } from "./fetchData";

export const LOG_FORM_VIEW = /* GraphQL */ `
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
