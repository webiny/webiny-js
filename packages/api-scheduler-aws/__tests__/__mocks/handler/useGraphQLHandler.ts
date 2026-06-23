import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature, GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RegisterExtensionPlugin } from "@webiny/handler";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerSchedulerExtension } from "@webiny/api-scheduler";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { RootTenantInitializer } from "./mocks/RootTenantInitializer";
import {
    CANCEL_SCHEDULED_ACTION,
    GET_SCHEDULED_ACTION,
    GET_TARGET_SCHEDULED_ACTION,
    LIST_SCHEDULED_ACTION,
    SCHEDULE_ACTION,
    type ICancelScheduledActionMutationResponse,
    type ICancelScheduledActionMutationVariables,
    type ICreateScheduledActionMutationVariables,
    type IGetScheduledActionQueryResponse,
    type IGetScheduledActionQueryVariables,
    type IGetTargetScheduledActionQueryResponse,
    type IListScheduledActionsQueryResponse,
    type IListScheduledActionsQueryVariables,
    type IScheduleActionMutationResponse
} from "./graphql.js";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface UseGraphQLHandlerParams {
    getScheduleClient: (config?: SchedulerClientConfig) => Pick<SchedulerClient, "send">;
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    plugins?: any[];
}

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useGraphQLHandler = (params: UseGraphQLHandlerParams) => {
    const { permissions, identity, plugins: extraPlugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const resolvedIdentity = identity ?? defaultIdentity;
    const resolvedPermissions = (permissions ?? [{ name: "*" }]) as SecurityPermission[];

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, resolvedIdentity);
            container.registerInstance(TestPermissions, resolvedPermissions);
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());
            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            const schedulerPlugins = registerSchedulerExtension();
            processLegacyPlugins(
                container,
                schedulerPlugins.filter(p => p instanceof RegisterExtensionPlugin)
            );
            const schedulerContextPlugins = schedulerPlugins.filter(
                p => !(p instanceof RegisterExtensionPlugin)
            );

            container.registerInstance(SchedulerService, new VoidSchedulerService());

            container.registerFactory(GraphQLContextEnhancer, () => ({
                async enhance(ctx: Record<string, any>): Promise<void> {
                    for (const plugin of schedulerContextPlugins) {
                        if (typeof (plugin as any).apply === "function") {
                            await (plugin as any).apply(ctx);
                        }
                    }
                    for (const plugin of extraPlugins) {
                        if (typeof (plugin as any).apply === "function") {
                            await (plugin as any).apply(ctx);
                        }
                    }
                }
            }));

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
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
        return [response.body, response];
    };

    const createQuery =
        <TVariables, TResponse>(query: string) =>
        (variables: TVariables) =>
            invoke({ body: { query, variables: variables as any } }) as Promise<[TResponse, any]>;

    const createMutation =
        <TVariables, TResponse>(mutation: string) =>
        (variables: TVariables) =>
            invoke({
                body: { query: mutation, variables: variables as any }
            }) as Promise<[TResponse, any]>;

    return {
        handler,
        invoke,
        scheduleAction: createMutation<
            ICreateScheduledActionMutationVariables,
            IScheduleActionMutationResponse
        >(SCHEDULE_ACTION),
        cancelScheduledAction: createMutation<
            ICancelScheduledActionMutationVariables,
            ICancelScheduledActionMutationResponse
        >(CANCEL_SCHEDULED_ACTION),
        getScheduledAction: createQuery<
            IGetScheduledActionQueryVariables,
            IGetScheduledActionQueryResponse
        >(GET_SCHEDULED_ACTION),
        getTargetScheduledAction: createQuery<
            IGetScheduledActionQueryVariables,
            IGetTargetScheduledActionQueryResponse
        >(GET_TARGET_SCHEDULED_ACTION),
        listScheduledActions: createQuery<
            IListScheduledActionsQueryVariables,
            IListScheduledActionsQueryResponse
        >(LIST_SCHEDULED_ACTION)
    };
};
