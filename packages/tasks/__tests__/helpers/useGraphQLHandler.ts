import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createIdentity, createPermissions } from "./helpers";
import { createApiGatewayHandler } from "@webiny/handler-aws";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext, createBackgroundTaskGraphQL } from "~/index";
import { createListDefinitionsQuery } from "./graphql/definitions";
import type { ContextPlugin } from "@webiny/api";
import type { Context } from "~tests/types";
import {
    createAbortTaskMutation,
    createGetTaskQuery,
    createListTasksQuery,
    createTriggerTaskMutation,
    type IAbortTaskResponse,
    IAbortTaskVariables,
    type IGetTaskResponse,
    type IGetTaskVariables,
    type ITriggerTaskResponse,
    type ITriggerTaskVariables
} from "~tests/helpers/graphql/tasks";
import { createListTaskLogsQuery } from "~tests/helpers/graphql/logs";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";
import type { ApiKey } from "@webiny/api-core/types/security.js";
import { createApiCore } from "@webiny/api-core";
import apiKeyAuthentication from "@webiny/api-core/legacy/security/plugins/apiKeyAuthentication.js";
import apiKeyAuthorization from "@webiny/api-core/legacy/security/plugins/apiKeyAuthorization.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

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

export const useGraphQLHandler = (params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createApiGatewayHandler({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations
            }),
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
                            slug: `slug-${apiKey}`,
                            permissions: [],
                            token,
                            createdBy: {
                                id: "test",
                                displayName: "test",
                                type: "admin"
                            },
                            description: "test",
                            createdOn: new Date().toISOString()
                        };
                    };
                }
            } as ContextPlugin<Context>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
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
        triggerTask: async (variables: ITriggerTaskVariables) => {
            return invoke<ITriggerTaskResponse>({
                body: {
                    query: createTriggerTaskMutation(),
                    variables
                }
            });
        },
        abortTask: async (variables: IAbortTaskVariables) => {
            return invoke<IAbortTaskResponse>({
                body: {
                    query: createAbortTaskMutation(),
                    variables
                }
            });
        },
        getTask: async (variables: IGetTaskVariables) => {
            return invoke<IGetTaskResponse>({
                body: {
                    query: createGetTaskQuery(),
                    variables
                }
            });
        },
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
