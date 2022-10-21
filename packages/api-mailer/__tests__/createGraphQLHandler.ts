import { getIntrospectionQuery } from "graphql";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createHandler } from "@webiny/handler-aws/gateway";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createPermissions, until, sleep, PermissionsArg } from "./context/helpers";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
/**
 * Unfortunately at we need to import the api-i18n-ddb package manually
 */
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createTenancyAndSecurity } from "./context/tenancySecurity";
import { createMailer } from "~/index";
import { ContextPlugin } from "@webiny/api";
import { MailerContext } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import createGraphQLHandlerPlugins from "@webiny/handler-graphql";
import { GET_SETTINGS_QUERY, SAVE_SETTINGS_MUTATION } from "./graphql/settings";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";

interface ContextTenantParams {
    tenant: Pick<Tenant, "id" | "name" | "parent">;
    identity?: SecurityIdentity;
}
export const contextSecurity = ({
    tenant,
    identity
}: ContextTenantParams): ContextPlugin<MailerContext>[] => {
    return [
        new ContextPlugin<MailerContext>(async context => {
            context.security.getApiKeyByToken = async (token: string): Promise<ApiKey | null> => {
                if (!token || token !== "aToken") {
                    return null;
                }
                const apiKey = "a1234567890";
                return {
                    id: apiKey,
                    name: apiKey,
                    tenant: tenant.id,
                    permissions: identity?.["permissions"] || [],
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
        })
    ];
};

export interface CreateGraphQLHandlerParams {
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export const createGraphQLHandler = (params?: CreateGraphQLHandlerParams) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const { permissions, identity, plugins = [] } = params || {};

    const handler = createHandler({
        plugins: [
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            createGraphQLHandlerPlugins(),
            ...createTenancyAndSecurity({
                permissions: [...createPermissions(permissions)],
                identity
            }),
            contextSecurity({ tenant, identity }),
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            /**
             * for the page builder we must define the current locale and type
             * we can do that via the CmsParametersPlugin
             */
            new CmsParametersPlugin(async context => {
                const locale = context.i18n.getContentLocale()?.code || "en-US";
                return {
                    type: "read",
                    locale
                };
            }),
            mockLocalesPlugins(),
            /**
             * We're using ddb-only storageOperations here because current jest setup doesn't allow
             * usage of more than one storageOperations at a time with the help of --keyword flag.
             */
            createHeadlessCmsContext({
                storageOperations: createHeadlessCmsStorageOperations({
                    documentClient
                })
            }),
            ...createMailer(),
            plugins
        ],
        http: {
            debug: true
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: "/graphql",
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
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        async getSettings() {
            return invoke({ body: { query: GET_SETTINGS_QUERY } });
        },
        async saveSettings(variables: Record<string, any>) {
            return invoke({ body: { query: SAVE_SETTINGS_MUTATION, variables } });
        }
    };
};
