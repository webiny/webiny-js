import * as FOLDER_GQL from "~tests/graphql/folder.gql.js";
import * as FILTER_GQL from "~tests/graphql/filter.gql.js";

interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    locale?: string;
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface InvokeCallable {
    (params: InvokeParams): Promise<any>;
}

export const createAcoSdk = (invoke: InvokeCallable) => {
    return {
        async createFolder(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: FOLDER_GQL.CREATE_FOLDER(fields), variables } });
        },
        async updateFolder(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: FOLDER_GQL.UPDATE_FOLDER(fields), variables } });
        },
        async deleteFolder(variables = {}) {
            return invoke({ body: { query: FOLDER_GQL.DELETE_FOLDER, variables } });
        },
        async listFolders(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: FOLDER_GQL.LIST_FOLDERS(fields), variables } });
        },
        async getFolder(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: FOLDER_GQL.GET_FOLDER(fields), variables } });
        },
        async createFilter(variables = {}) {
            return invoke({ body: { query: FILTER_GQL.CREATE_FILTER, variables } });
        },
        async updateFilter(variables = {}) {
            return invoke({ body: { query: FILTER_GQL.UPDATE_FILTER, variables } });
        },
        async deleteFilter(variables = {}) {
            return invoke({ body: { query: FILTER_GQL.DELETE_FILTER, variables } });
        },
        async listFilters(variables = {}) {
            return invoke({ body: { query: FILTER_GQL.LIST_FILTERS, variables } });
        },
        async getFilter(variables = {}) {
            return invoke({ body: { query: FILTER_GQL.GET_FILTER, variables } });
        }
    };
};
