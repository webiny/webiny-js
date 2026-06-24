import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature, GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { BackgroundTasksFeature } from "~/api/BackgroundTasksFeature.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { TenantFromHeaderInitializer } from "./mocks/TenantFromHeaderInitializer";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ApiKeyProvider } from "@webiny/api-core/features/security/apiKeys/shared/abstractions.js";
import {
    createAbortTaskMutation,
    createGetTaskQuery,
    createListTasksQuery,
    createTriggerTaskMutation,
    type IAbortTaskResponse,
    type IAbortTaskVariables,
    type IGetTaskResponse,
    type IGetTaskVariables,
    type ITriggerTaskResponse,
    type ITriggerTaskVariables
} from "~tests/helpers/graphql/tasks";
import { createListTaskLogsQuery } from "~tests/helpers/graphql/logs";
import {
    createGetSettingsQuery,
    createUpdateSettingsMutation,
    type IGetSettingsResponse,
    type IUpdateSettingsResponse,
    type IUpdateSettingsVariables
} from "~tests/helpers/graphql/settings";
import { createListDefinitionsQuery } from "./graphql/definitions";

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface UseHandlerParams {
    plugins?: any[];
}

const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const defaultPermissions: SecurityPermission[] = [
    { name: "task.entry", rwd: "rwd" },
    { name: "*" }
];

export const useGraphQLHandler = (params?: UseHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, defaultIdentity);
            container.registerInstance(TestPermissions, defaultPermissions);
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(TenantFromHeaderInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());
            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            BackgroundTasksFeature.register(container);

            container.registerFactory(ApiKeyProvider, () => ({
                async getByToken(token: string) {
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
                        createdBy: { id: "test", displayName: "test", type: "admin" },
                        description: "test",
                        createdOn: new Date().toISOString()
                    };
                },
                async getBySlug(_slug: string) {
                    return null;
                }
            }));

            // Factory runs after HeadlessCmsContextEnhancer (class registration),
            // so ctx.plugins is available here for legacy plugin registration.
            container.registerFactory(GraphQLContextEnhancer, () => ({
                async enhance(ctx: Record<string, any>): Promise<void> {
                    if (ctx.plugins) {
                        ctx.plugins.register(createMockTaskServicePlugin());
                    }
                    if (params?.plugins?.length) {
                        const flat = [params.plugins].flat(Infinity as 1).filter(Boolean) as any[];
                        for (const plugin of flat) {
                            if (typeof plugin.apply === "function") {
                                await plugin.apply(ctx);
                            } else if (ctx.plugins) {
                                ctx.plugins.register(plugin);
                            }
                        }
                    }
                }
            }));

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T = Record<string, any>>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams): Promise<T> => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                authorization: "Bearer test-token",
                ...headers
            },
            body
        });
        return response.body as T;
    };

    return {
        invoke,
        listDefinitions: async () => {
            return invoke({ body: { query: createListDefinitionsQuery() } });
        },
        triggerTask: async (variables: ITriggerTaskVariables) => {
            return invoke<ITriggerTaskResponse>({
                body: { query: createTriggerTaskMutation(), variables }
            });
        },
        abortTask: async (variables: IAbortTaskVariables) => {
            return invoke<IAbortTaskResponse>({
                body: { query: createAbortTaskMutation(), variables }
            });
        },
        getTask: async (variables: IGetTaskVariables) => {
            return invoke<IGetTaskResponse>({
                body: { query: createGetTaskQuery(), variables }
            });
        },
        listTasks: async (variables: Record<string, any> = {}) => {
            return invoke({ body: { query: createListTasksQuery(), variables } });
        },
        listTaskLogsQuery: (variables: Record<string, any> = {}) => {
            return invoke({ body: { query: createListTaskLogsQuery(), variables } });
        },
        getSettings: async () => {
            return invoke<IGetSettingsResponse>({ body: { query: createGetSettingsQuery() } });
        },
        updateSettings: async (variables: IUpdateSettingsVariables) => {
            return invoke<IUpdateSettingsResponse>({
                body: { query: createUpdateSettingsMutation(), variables }
            });
        }
    };
};
