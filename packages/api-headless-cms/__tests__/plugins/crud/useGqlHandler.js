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
    CREATE_ENVIRONMENT_QUERY,
    DELETE_ENVIRONMENT_QUERY,
    GET_ENVIRONMENT_QUERY,
    LIST_ENVIRONMENT_QUERY,
    UPDATE_ENVIRONMENT_QUERY
} from "./graphql/environment";

const createGetPermissions = permissions => {
    return () => {
        if (!permissions) {
            return [
                {
                    name: "*"
                }
            ];
        }
        return permissions;
    };
};

const createAuthenticate = identity => {
    return () => {
        if (!identity) {
            return new SecurityIdentity({
                id: "1234567890",
                displayName: "userName123",
                login: "login",
                type: "type"
            });
        }
        return identity;
    };
};

export const useGqlHandler = ({ permissions, identity } = {}) => {
    const handler = createHandler(
        dbPlugins({
            table: "HeadlessCms",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
                    sslEnabled: false,
                    region: "local"
                })
            })
        }),
        elasticSearch({ endpoint: `http://localhost:9201` }),
        apolloServerPlugins(),
        securityPlugins(),
        i18nContext,
        i18nContentPlugins(),
        mockLocalesPlugins(),
        cmsPlugins(),
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
            node: "http://localhost:9201"
        }),
        sleep: (ms = 333) => {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        },
        handler,
        invoke,
        // environment
        async createEnvironmentQuery(variables) {
            return invoke({ body: { query: CREATE_ENVIRONMENT_QUERY, variables } });
        },
        async getEnvironmentQuery(variables) {
            return invoke({ body: { query: GET_ENVIRONMENT_QUERY, variables } });
        },
        async updateEnvironmentQuery(variables) {
            return invoke({ body: { query: UPDATE_ENVIRONMENT_QUERY, variables } });
        },
        async deleteEnvironmentQuery(variables) {
            return invoke({ body: { query: DELETE_ENVIRONMENT_QUERY, variables } });
        },
        async listEnvironmentQuery() {
            return invoke({ body: { query: LIST_ENVIRONMENT_QUERY } });
        }
    };
};
