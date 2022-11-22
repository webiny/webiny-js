import { createWcpContext } from "@webiny/api-wcp";
import { getIntrospectionQuery } from "graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createHandler } from "@webiny/handler-aws/gateway";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createPermissions, until, sleep, PermissionsArg, createDummyLocales } from "./helpers";
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
import { Plugin, PluginCollection, PluginsContainer } from "@webiny/plugins/types";

/**
 * Unfortunately at we need to import the api-i18n-ddb package manually
 */
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { getStorageOperations } from "./storageOperations";
import { HeadlessCmsStorageOperations } from "~/types";
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
import { ContextPlugin } from "@webiny/api";
import { TestContext } from "./types";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "~/index";
import graphQLHandlerPlugins from "@webiny/handler-graphql";

export interface CreateHeadlessCmsAppParams {
    storageOperations: HeadlessCmsStorageOperations;
}
export interface GraphQLHandlerParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: string;
}

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params: GraphQLHandlerParams = {}) => {
    const ops = getStorageOperations({
        plugins: params.storageOperationPlugins || []
    });

    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const {
        permissions,
        identity,
        plugins = [],
        topPlugins = [],
        path,
        setupTenancyAndSecurityGraphQL
    } = params;

    const app = createHeadlessCmsContext({
        storageOperations: ops.storageOperations
    });

    const handlerPlugins = [
        topPlugins,
        createWcpContext(),
        ...ops.plugins,
        ...createTenancyAndSecurity({
            setupGraphQL: setupTenancyAndSecurityGraphQL,
            permissions: createPermissions(permissions),
            identity
        }),
        {
            type: "context",
            name: "context-security-tenant",
            async apply(context) {
                context.security.getApiKeyByToken = async (
                    token: string
                ): Promise<ApiKey | null> => {
                    if (!token || token !== "aToken") {
                        return null;
                    }
                    const apiKey = "a1234567890";
                    return {
                        id: apiKey,
                        name: apiKey,
                        tenant: tenant.id,
                        // @ts-ignore
                        permissions: identity?.permissions || [],
                        token,
                        createdBy: {
                            id: "test",
                            displayName: "test",
                            type: "admin"
                        },
                        description: "test",
                        createdOn: new Date().toISOString(),
                        webinyVersion: context.WEBINY_VERSION
                    };
                };
            }
        } as ContextPlugin<TestContext>,
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" }),
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        createDummyLocales(),
        mockLocalesPlugins(),
        ...app,
        createHeadlessCmsGraphQL(),
        plugins,
        graphQLHandlerPlugins()
    ];

    const handler = createHandler({
        plugins: handlerPlugins,
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
        tenant,
        identity,
        plugins: new PluginsContainer(handlerPlugins),
        storageOperations: ops.storageOperations,
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
