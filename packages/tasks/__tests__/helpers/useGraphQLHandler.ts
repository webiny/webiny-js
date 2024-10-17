import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createDummyLocales, createIdentity, createPermissions } from "./helpers";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createApiGatewayHandler } from "@webiny/handler-aws";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext, createBackgroundTaskGraphQL } from "~/index";
import { createListDefinitionsQuery } from "./graphql/definitions";
import { ApiKey } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { Context } from "~tests/types";
import { createListTasksQuery } from "~tests/helpers/graphql/tasks";
import { createListTaskLogsQuery } from "~tests/helpers/graphql/logs";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

const tenant = {
    id: "root",
    name: "Root",
    parent: null
};

export const useGraphQLHandler = (params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const handler = createApiGatewayHandler({
        plugins: [
            createWcpContext(),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: false,
                permissions: createPermissions(),
                identity: createIdentity()
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
                            permissions: [],
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
            } as ContextPlugin<Context>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            graphQLHandlerPlugins(),
            createBackgroundTaskContext(),
            createBackgroundTaskGraphQL(),
            createMockTaskServicePlugin(),
            ...plugins
        ]
    });

    const invoke = async <T = Record<string, any>>({
        httpMethod = "POST",
        body,
        headers = {},
        ...rest
    }: InvokeParams): Promise<T> => {
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
            } as unknown as APIGatewayEvent,
            {} as unknown as LambdaContext
        );
        // The first element is the response body, and the second is the raw response.
        return JSON.parse(response.body || "{}");
    };

    return {
        invoke,
        /**
         * Definitions
         */
        listDefinitions: async () => {
            return invoke({
                body: {
                    query: createListDefinitionsQuery()
                }
            });
        },
        /**
         * Tasks
         */
        listTasks: async (variables: Record<string, any> = {}) => {
            return invoke({
                body: {
                    query: createListTasksQuery(),
                    variables
                }
            });
        },
        /**
         * Logs
         */
        listTaskLogsQuery: (variables: Record<string, any> = {}) => {
            return invoke({
                body: {
                    query: createListTaskLogsQuery(),
                    variables
                }
            });
        }
    };
};
