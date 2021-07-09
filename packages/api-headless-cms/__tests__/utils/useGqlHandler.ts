import { introspectionQuery  } from "graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
import apiKeyAuthentication from "@webiny/api-security-admin-users/authentication/apiKey";
import apiKeyAuthorization from "@webiny/api-security-admin-users/authorization/apiKey";
import { createHandler } from "@webiny/handler-aws";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createIdentity, createPermissions, until, PermissionsArg } from "./helpers";
import { INSTALL_MUTATION, IS_INSTALLED_QUERY } from "./graphql/settings";
import {
    CREATE_CONTENT_MODEL_GROUP_MUTATION,
    DELETE_CONTENT_MODEL_GROUP_MUTATION,
    GET_CONTENT_MODEL_GROUP_QUERY,
    LIST_CONTENT_MODEL_GROUP_QUERY,
    UPDATE_CONTENT_MODEL_GROUP_MUTATION
} from "./graphql/contentModelGroup";
import {
    CREATE_CONTENT_MODEL_MUTATION,
    DELETE_CONTENT_MODEL_MUTATION,
    GET_CONTENT_MODEL_QUERY,
    LIST_CONTENT_MODELS_QUERY,
    UPDATE_CONTENT_MODEL_MUTATION
} from "./graphql/contentModel";

import { ApiKey } from "@webiny/api-security-admin-users/types";

export interface GQLHandlerCallableArgs {
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: any[];
    path: string;
}

export const useGqlHandler = (args?: GQLHandlerCallableArgs) => {
    // @ts-ignore
    const storageOperationsPlugins = __getStorageOperationsPlugins();
    if (typeof storageOperationsPlugins !== "function") {
        throw new Error(`There is no global "storageOperationsPlugins" function.`);
    }
    const tenant = { id: "root", name: "Root", parent: null };
    const { permissions, identity, plugins = [], path } = args || {};

    const handler = createHandler({
        plugins: [
            storageOperationsPlugins(),
            tenancyPlugins(),
            {
                type: "context",
                name: "context-security-tenant",
                apply(context) {
                    if (!context.security) {
                        context.security = {};
                    }
                    context.tenancy.getCurrentTenant = () => {
                        return tenant;
                    };
                    context.security.apiKeys = {
                        getApiKeyByToken: async (token: string): Promise<ApiKey | null> => {
                            if (!token || token !== "aToken") {
                                return null;
                            }
                            const apiKey = "a1234567890";
                            return {
                                id: apiKey,
                                name: apiKey,
                                permissions: identity.permissions || [],
                                token,
                                createdBy: {
                                    id: "test",
                                    displayName: "test",
                                    type: "admin"
                                },
                                description: "test",
                                createdOn: new Date().toISOString()
                            };
                        }
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
            securityPlugins(),
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nContentPlugins(),
            mockLocalesPlugins(),
            {
                type: "security-authorization",
                name: "security-authorization",
                getPermissions: context => {
                    const { headers = {} } = context.http || {};
                    if (
                        headers["Authorization"] ||
                        headers["authorization"] ||
                        (identity && identity.type === "api-key")
                    ) {
                        return;
                    }
                    return createPermissions(permissions);
                }
            },
            {
                type: "security-authentication",
                authenticate: async context => {
                    const { headers = {} } = context.http || {};
                    if (
                        headers["Authorization"] ||
                        headers["authorization"] ||
                        (identity && identity.type === "api-key")
                    ) {
                        return;
                    }
                    return createIdentity(identity);
                }
            },
            {
                type: "context",
                apply(context) {
                    context.cms = {
                        ...(context.cms || {}),
                        getLocale: () => ({
                            code: "en-US"
                        }),
                        locale: "en-US"
                    };
                }
            },
            //
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
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        until,
        sleep: (ms = 333) => {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        },
        handler,
        invoke,
        async introspect() {
            return invoke({ body: { query: introspectionQuery } });
        },
        // settings
        async isInstalledQuery() {
            return invoke({ body: { query: IS_INSTALLED_QUERY } });
        },
        async installMutation() {
            return invoke({ body: { query: INSTALL_MUTATION } });
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
        async updateContentModelMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CONTENT_MODEL_MUTATION, variables } });
        },
        async deleteContentModelMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CONTENT_MODEL_MUTATION, variables } });
        }
    };
};
