import apolloServerPlugins from "@webiny/handler-graphql";
import cmsPlugins from "@webiny/api-headless-cms/plugins";
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

type GQLHandlerCallableArgsType = {
    permissions?: PermissionsArgType[];
    identity?: SecurityIdentity;
};

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9201";

export const useGqlHandler = (args?: GQLHandlerCallableArgsType) => {
    const tenant = { id: "root", name: "Root", parent: null };
    const { permissions, identity } = args || {};

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
        apolloServerPlugins(),
        securityPlugins(),
        i18nContext,
        i18nContentPlugins(),
        mockLocalesPlugins(),
        cmsPlugins(),
        {
            type: "context",
            apply(context) {
                context.security.getTenant = () => {
                    return tenant;
                };
            }
        },
        {
            type: "security-authorization",
            name: "security-authorization",
            getPermissions: createGetPermissions(permissions)
        },
        {
            type: "security-authentication",
            authenticate: createAuthenticate(identity)
        }
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
        }
    };
};
