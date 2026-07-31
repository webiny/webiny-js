import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { SchedulerFeature } from "@webiny/api-scheduler";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
import { registerSchedulerAwsExtension } from "~/context.js";
import type { Container } from "@webiny/di";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    CANCEL_SCHEDULED_ACTION,
    GET_SCHEDULED_ACTION,
    GET_TARGET_SCHEDULED_ACTION,
    type ICancelScheduledActionMutationResponse,
    type ICancelScheduledActionMutationVariables,
    type ICreateScheduledActionMutationVariables,
    type IGetScheduledActionQueryResponse,
    type IGetScheduledActionQueryVariables,
    type IGetTargetScheduledActionQueryResponse,
    type IListScheduledActionsQueryResponse,
    type IListScheduledActionsQueryVariables,
    type IScheduleActionMutationResponse,
    LIST_SCHEDULED_ACTION,
    SCHEDULE_ACTION
} from "./graphql.js";

export interface CreateHandlerCoreParams {
    getScheduleClient: (config?: SchedulerClientConfig) => Pick<SchedulerClient, "send">;
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    plugins?: Array<(container: Container) => void>;
}

const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useGraphQLHandler = (params: CreateHandlerCoreParams) => {
    const { permissions, identity } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps("cms");

    const resolvedIdentity = identity ?? defaultIdentity;
    const resolvedPermissions = (permissions ?? [{ name: "*" }]) as SecurityPermission[];

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, resolvedIdentity);
            container.registerInstance(TestPermissions, { list: resolvedPermissions });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });
            SchedulerFeature.register(container);
            registerSchedulerAwsExtension(container, {
                getClient: config => params.getScheduleClient(config)
            });

            if (params.plugins) {
                for (const plugin of params.plugins) {
                    plugin(container);
                }
            }

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async (body: { query: string; variables?: Record<string, any> }) => {
        const response = await handler({
            method: "POST",
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                authorization: "Bearer test-token"
            },
            body
        });

        const parsed = typeof response.body === "string" ? JSON.parse(response.body) : response.body;
        return [parsed, response] as const;
    };

    const createQuery = <TVariables, TResponse>(query: string) => {
        return async (variables: TVariables) => {
            return invoke({ query, variables: variables as Record<string, any> }) as Promise<
                readonly [TResponse, any]
            >;
        };
    };

    const createMutation = <TVariables, TResponse>(mutation: string) => {
        return async (variables: TVariables) => {
            return invoke({ query: mutation, variables: variables as Record<string, any> }) as Promise<
                readonly [TResponse, any]
            >;
        };
    };

    return {
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
