import * as FILE_GQL from "../graphql/file.js";
import * as SETTINGS_GQL from "~tests/graphql/fileManagerSettings.js";

interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface InvokeCallable {
    (params: InvokeParams): Promise<any>;
}

export const createFileManagerSdk = (invoke: InvokeCallable) => {
    return {
        async createFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: FILE_GQL.CREATE_FILE(fields), variables } });
        },
        async updateFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: FILE_GQL.UPDATE_FILE(fields), variables } });
        },
        async createFiles(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: FILE_GQL.CREATE_FILES(fields), variables } });
        },
        async deleteFile(variables: Record<string, any>) {
            return invoke({ body: { query: FILE_GQL.DELETE_FILE, variables } });
        },
        async getFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: FILE_GQL.GET_FILE(fields), variables } });
        },
        async listFiles(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: FILE_GQL.LIST_FILES(fields), variables } });
        },
        async listTags(variables = {}) {
            return invoke({ body: { query: FILE_GQL.LIST_TAGS, variables } });
        },
        async getSettings(variables = {}) {
            return invoke({ body: { query: SETTINGS_GQL.GET_SETTINGS, variables } });
        },
        async updateSettings(variables: Record<string, any>) {
            return invoke({ body: { query: SETTINGS_GQL.UPDATE_SETTINGS, variables } });
        }
    };
};
