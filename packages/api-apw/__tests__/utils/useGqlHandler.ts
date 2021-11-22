import { introspectionQuery } from "graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { createHandler } from "@webiny/handler-aws";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createPermissions, until, sleep, PermissionsArg } from "./helpers";
import { GET_WORKFLOW_QUERY } from "./graphql/workflow";
import { Plugin, PluginCollection } from "@webiny/plugins/types";

/**
 * Unfortunately at we need to import the api-i18n-ddb package manually
 */
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { getStorageOperations } from "./storageOperations";

export interface GQLHandlerCallableParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path: string;
}

export const useGqlHandler = (params: GQLHandlerCallableParams) => {
    const ops = getStorageOperations({
        plugins: params.storageOperationPlugins || []
    });

    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const { permissions, identity, plugins = [], path, setupTenancyAndSecurityGraphQL } = params;

    const handler = createHandler({
        plugins: [
            ...ops.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: setupTenancyAndSecurityGraphQL,
                permissions: createPermissions(permissions),
                identity
            }),
            {
                type: "context",
                name: "context-security-tenant",
                apply(context) {
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
                            permissions: identity.permissions || [],
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
            },
            {
                type: "context",
                name: "context-path-parameters",
                apply(context) {
                    if (!context.http) {
                        context.http = {
                            request: {
                                path: {
                                    parameters: null
                                }
                            }
                        };
                    } else if (!context.http.request.path) {
                        context.http.request.path = {
                            parameters: null
                        };
                    }
                    context.http.request.path.parameters = { key: path };
                }
            },
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            i18nContentPlugins(),
            mockLocalesPlugins(),
            plugins
        ],
        http: { debug: true }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });
        if (httpMethod === "OPTIONS" && !response.body) {
            return [null, response];
        }
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        until,
        sleep,
        handler,
        invoke,
        async introspect() {
            return invoke({ body: { query: introspectionQuery } });
        },
        // workflow
        async getWorkflowQuery(variables: Record<string, any>) {
            return invoke({ body: GET_WORKFLOW_QUERY, variables });
        }
        // content model group
        // async createContentModelGroupMutation(variables: Record<string, any>) {
        //     return invoke({ body: { query: CREATE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        // },
        // async getContentModelGroupQuery(variables: Record<string, any>) {
        //     return invoke({ body: { query: GET_CONTENT_MODEL_GROUP_QUERY, variables } });
        // },
        // async updateContentModelGroupMutation(variables: Record<string, any>) {
        //     return invoke({ body: { query: UPDATE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        // },
        // async deleteContentModelGroupMutation(variables: Record<string, any>) {
        //     return invoke({ body: { query: DELETE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        // },
        // async listContentModelGroupsQuery() {
        //     return invoke({ body: { query: LIST_CONTENT_MODEL_GROUP_QUERY } });
        // },
    };
};
