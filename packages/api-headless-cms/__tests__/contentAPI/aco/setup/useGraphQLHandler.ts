import { getIntrospectionQuery } from "graphql";
import type { CreateHandlerCoreParams } from "./plugins";
import { createHandlerCore } from "./plugins";
import { createGroupPlugin, createModelPlugin } from "./model";
import type { CmsModel } from "~/types";
import { GET_MODEL_QUERY } from "./graphql/contentModel";
import type {
    CreateEntryInputVariables,
    GetEntryInputVariables,
    GetEntryResult,
    UpdateEntryInputVariables,
    CreateEntryResult,
    UpdateEntryResult,
    UpdateEntryLocationVariables,
    UpdateEntryLocationResult,
    ListEntriesInputVariables,
    ListEntriesResult
} from "./graphql/contentEntry";
import {
    CREATE_ENTRY_MUTATION,
    GET_ENTRY_QUERY,
    UPDATE_ENTRY_MUTATION,
    UPDATE_ENTRY_LOCATION_MUTATION,
    LIST_ENTRIES_QUERY
} from "./graphql/contentEntry";
import { createUpdateLocationGraphQl } from "./updateLocationGraphQlPlugin";

export type GraphQLHandlerParams = Omit<CreateHandlerCoreParams, "extraPlugins">;

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params: GraphQLHandlerParams = {}) => {
    const { path } = params;

    const group = createGroupPlugin();
    const model = createModelPlugin();

    const core = createHandlerCore({
        ...params,
        extraPlugins: [group, model, ...createUpdateLocationGraphQl()]
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams = {}): Promise<[T, any]> => {
        const response = await core.handler({
            method: httpMethod,
            path: path ? `/cms/${path}` : "/graphql",
            headers: {
                ["x-tenant"]: "root",
                ["Content-Type"]: "application/json",
                ...headers
            },
            body
        });
        return [response.body as T, response];
    };

    return {
        handler: core.handler,
        invoke,
        tenant: core.tenant,
        identity: core.identity,
        storageOperations: core.storageOperations,
        model: model.contentModel as CmsModel,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        async getContentModelQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_MODEL_QUERY, variables } });
        },
        async getEntry(variables: GetEntryInputVariables) {
            return invoke<GetEntryResult>({ body: { query: GET_ENTRY_QUERY, variables } });
        },
        async listEntries(variables: ListEntriesInputVariables) {
            return invoke<ListEntriesResult>({ body: { query: LIST_ENTRIES_QUERY, variables } });
        },
        async createEntry(variables: CreateEntryInputVariables) {
            return invoke<CreateEntryResult>({
                body: { query: CREATE_ENTRY_MUTATION, variables }
            });
        },
        async updateEntry(variables: UpdateEntryInputVariables) {
            return invoke<UpdateEntryResult>({
                body: { query: UPDATE_ENTRY_MUTATION, variables }
            });
        },
        async updateEntryLocation(variables: UpdateEntryLocationVariables) {
            return invoke<UpdateEntryLocationResult>({
                body: { query: UPDATE_ENTRY_LOCATION_MUTATION, variables }
            });
        }
    };
};
