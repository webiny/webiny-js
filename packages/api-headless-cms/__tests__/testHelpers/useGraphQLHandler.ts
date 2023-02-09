import { getIntrospectionQuery } from "graphql";
import { createHandler } from "@webiny/handler-aws/gateway";
import { until, sleep } from "./helpers";
import { INSTALL_MUTATION, IS_INSTALLED_QUERY, UPGRADE_MUTATION } from "./graphql/settings";
import {
    CREATE_CONTENT_MODEL_GROUP_MUTATION,
    DELETE_CONTENT_MODEL_GROUP_MUTATION,
    GET_CONTENT_MODEL_GROUP_QUERY,
    LIST_CONTENT_MODEL_GROUP_QUERY,
    UPDATE_CONTENT_MODEL_GROUP_MUTATION
} from "./graphql/contentModelGroup";
import {
    CREATE_CONTENT_MODEL_FROM_MUTATION,
    CREATE_CONTENT_MODEL_MUTATION,
    DELETE_CONTENT_MODEL_MUTATION,
    GET_CONTENT_MODEL_QUERY,
    LIST_CONTENT_MODELS_QUERY,
    UPDATE_CONTENT_MODEL_MUTATION
} from "./graphql/contentModel";
import { PluginsContainer } from "@webiny/plugins/types";

import {
    GET_CONTENT_ENTRIES_QUERY,
    GET_CONTENT_ENTRY_QUERY,
    GET_LATEST_CONTENT_ENTRY_QUERY,
    GET_LATEST_CONTENT_ENTRIES_QUERY,
    GET_PUBLISHED_CONTENT_ENTRIES_QUERY,
    GET_PUBLISHED_CONTENT_ENTRY_QUERY,
    SEARCH_CONTENT_ENTRIES_QUERY,
    SearchContentEntriesVariables
} from "./graphql/contentEntry";
import { createHandlerCore, CreateHandlerCoreParams } from "~tests/testHelpers/plugins";

export type GraphQLHandlerParams = CreateHandlerCoreParams;

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params: GraphQLHandlerParams = {}) => {
    const { identity, path } = params;

    const core = createHandlerCore(params);

    const handler = createHandler({
        plugins: core.plugins,
        http: {
            debug: false
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                /**
                 * If no path defined, use /graphql as we want to make request to main api
                 */
                path: path ? `/cms/${path}` : "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as any,
            {} as any
        );
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body || "{}"), response];
    };

    return {
        until,
        sleep,
        handler,
        invoke,
        tenant: core.tenant,
        identity,
        plugins: new PluginsContainer(core.plugins),
        storageOperations: core.storageOperations,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        // settings
        async isInstalledQuery({ headers = {} } = {}) {
            return invoke({ body: { query: IS_INSTALLED_QUERY }, headers });
        },
        async installMutation() {
            return invoke({ body: { query: INSTALL_MUTATION } });
        },
        async upgradeMutation(version: string) {
            return invoke({
                body: {
                    query: UPGRADE_MUTATION,
                    variables: {
                        version
                    }
                }
            });
        },
        // content model group
        async createContentModelGroupMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        },
        async getContentModelGroupQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_MODEL_GROUP_QUERY, variables } });
        },
        async updateContentModelGroupMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        },
        async deleteContentModelGroupMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        },
        async listContentModelGroupsQuery() {
            return invoke({ body: { query: LIST_CONTENT_MODEL_GROUP_QUERY } });
        },
        // content models definitions
        async getContentModelQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_MODEL_QUERY, variables } });
        },
        async listContentModelsQuery(variables: Record<string, any> = {}) {
            return invoke({ body: { query: LIST_CONTENT_MODELS_QUERY, variables } });
        },
        async createContentModelMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL_MUTATION, variables } });
        },
        async createContentModelFromMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL_FROM_MUTATION, variables } });
        },
        async updateContentModelMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CONTENT_MODEL_MUTATION, variables } });
        },
        async deleteContentModelMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CONTENT_MODEL_MUTATION, variables } });
        },
        async getContentEntry(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_ENTRY_QUERY, variables } });
        },
        async getLatestContentEntry(variables: Record<string, any>) {
            return invoke({ body: { query: GET_LATEST_CONTENT_ENTRY_QUERY, variables } });
        },
        async getPublishedContentEntry(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PUBLISHED_CONTENT_ENTRY_QUERY, variables } });
        },
        async getContentEntries(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_ENTRIES_QUERY, variables } });
        },
        async getLatestContentEntries(variables: Record<string, any>) {
            return invoke({ body: { query: GET_LATEST_CONTENT_ENTRIES_QUERY, variables } });
        },
        async getPublishedContentEntries(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PUBLISHED_CONTENT_ENTRIES_QUERY, variables } });
        },
        async searchContentEntries(variables: SearchContentEntriesVariables) {
            return invoke({ body: { query: SEARCH_CONTENT_ENTRIES_QUERY, variables } });
        }
    };
};
