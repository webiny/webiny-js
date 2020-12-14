import dbPlugins from "@webiny/handler-db";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import i18nContext from "@webiny/api-i18n/plugins/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import securityPlugins from "@webiny/api-security/authenticator";
import { createHandler } from "@webiny/handler-aws";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { mockLocalesPlugins } from "@webiny/api-i18n/testing";
import { SecurityIdentity } from "@webiny/api-security";
import { Client } from "@elastic/elasticsearch";
import {
    CREATE_ENVIRONMENT_MUTATION,
    DELETE_ENVIRONMENT_MUTATION,
    GET_ENVIRONMENT_QUERY,
    LIST_ENVIRONMENT_QUERY,
    UPDATE_ENVIRONMENT_MUTATION
} from "./graphql/environment";
import {
    CREATE_ENVIRONMENT_ALIAS_MUTATION,
    DELETE_ENVIRONMENT_ALIAS_MUTATION,
    GET_ENVIRONMENT_ALIAS_QUERY,
    LIST_ENVIRONMENT_ALIAS_QUERY,
    UPDATE_ENVIRONMENT_ALIAS_MUTATION
} from "./graphql/environmentAlias";
import { createAuthenticate, createGetPermissions, PermissionsArgType } from "./helpers";
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

import { INTROSPECTION } from "./graphql/schema";

export type GQLHandlerCallableArgsType = {
    permissions?: PermissionsArgType[];
    identity?: SecurityIdentity;
    plugins?: any[];
    path: string;
};

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9201";

export const useGqlHandler = (args?: GQLHandlerCallableArgsType) => {
    const tenant = { id: "root", name: "Root", parent: null };
    const { permissions, identity, plugins = [], path } = args || {};

    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: "local"
    });
    const handler = createHandler(
        dbPlugins({
            table: "HeadlessCms",
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        elasticSearch({ endpoint: `http://localhost:${ELASTICSEARCH_PORT}` }),
        {
            type: "context",
            apply(context) {
                if (!context.security) {
                    context.security = {};
                }
                context.security.getTenant = () => {
                    return tenant;
                };
            }
        },
        {
            type: "context",
            name: "context-path-parameters",
            apply(context) {
                if (!context.http) {
                    context.http = {
                        path: {
                            parameters: null
                        }
                    };
                } else if (!context.http.path) {
                    context.http.path = {
                        parameters: null
                    };
                }
                context.http.path.parameters = { key: path };
            }
        },
        securityPlugins(),
        i18nContext,
        i18nContentPlugins(),
        mockLocalesPlugins(),
        {
            type: "security-authorization",
            name: "security-authorization",
            getPermissions: createGetPermissions(permissions)
        },
        {
            type: "security-authentication",
            authenticate: createAuthenticate(identity)
        },
        {
            type: "context",
            apply(context) {
                if (context.environment) {
                    return;
                }
                context.environment = {
                    slug: "production"
                };
            }
        },
        plugins
    );

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
        elasticSearch: new Client({
            node: `http://localhost:${ELASTICSEARCH_PORT}`
        }),
        documentClient,
        sleep: (ms = 333) => {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        },
        handler,
        invoke,
        async introspect() {
            return invoke({ body: { query: INTROSPECTION } });
        },
        // environment
        async createEnvironmentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_ENVIRONMENT_MUTATION, variables } });
        },
        async getEnvironmentQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_ENVIRONMENT_QUERY, variables } });
        },
        async updateEnvironmentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_ENVIRONMENT_MUTATION, variables } });
        },
        async deleteEnvironmentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_ENVIRONMENT_MUTATION, variables } });
        },
        async listEnvironmentsQuery() {
            return invoke({ body: { query: LIST_ENVIRONMENT_QUERY } });
        },
        // environment alias
        async createEnvironmentAliasMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_ENVIRONMENT_ALIAS_MUTATION, variables } });
        },
        async getEnvironmentAliasQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_ENVIRONMENT_ALIAS_QUERY, variables } });
        },
        async updateEnvironmentAliasMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_ENVIRONMENT_ALIAS_MUTATION, variables } });
        },
        async deleteEnvironmentAliasMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_ENVIRONMENT_ALIAS_MUTATION, variables } });
        },
        async listEnvironmentAliasesQuery() {
            return invoke({ body: { query: LIST_ENVIRONMENT_ALIAS_QUERY } });
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
