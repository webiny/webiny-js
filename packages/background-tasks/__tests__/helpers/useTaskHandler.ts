import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature, GraphQLContextualSchema } from "@webiny/api-graphql";
import { buildSchema } from "graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { BackgroundTasksFeature } from "~/api/BackgroundTasksFeature.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { createMockTaskService } from "~tests/mocks/taskTriggerTransportPlugin";
import { TaskService } from "~/api/domain/TaskService.js";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { TenantFromHeaderInitializer } from "./mocks/TenantFromHeaderInitializer";
import { TaskRunner } from "~/api/runner/index.js";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation.js";
import type { Timer } from "~/api/abstractions/Timer.js";
import type { ITaskRawEvent } from "~/api/handler/types";
import type { IResponseResult } from "~/api/response/abstractions/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface UseTaskHandlerParams {
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

const mockTimer: Timer.Interface = {
    getRemainingMilliseconds: () => 1_000_000,
    getRemainingSeconds: () => 1_000
};

export const useTaskHandler = (params?: UseTaskHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps("cms");

    let capturedCtx: any = null;

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, defaultIdentity);
            container.registerInstance(TestPermissions, { list: defaultPermissions });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(TenantFromHeaderInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            BackgroundTasksFeature.register(container);

            container.registerInstance(TaskService, createMockTaskService());
            // DI-native plugins are plain `container => {}` functions; call them directly.
            for (const plugin of [...(params?.plugins || [])].flat(Infinity as 1).filter(Boolean)) {
                (plugin as (container: any) => void)(container);
            }
            const STUB_SCHEMA = buildSchema("type Query { _empty: String }");
            container.registerInstance(GraphQLContextualSchema, {
                async build(ctx: Record<string, any>) {
                    capturedCtx = ctx;
                    return STUB_SCHEMA;
                }
            });

            GraphQLEngineFeature.register(container);
        }
    });

    return {
        handle: async (event: ITaskRawEvent): Promise<IResponseResult> => {
            capturedCtx = null;
            await handler({
                method: "POST",
                path: "/graphql",
                headers: {
                    "x-tenant": event.tenant || "root",
                    "content-type": "application/json",
                    authorization: "Bearer test-token"
                },
                body: { query: "{ __typename }" }
            });

            const runner = new TaskRunner(capturedCtx, mockTimer, new TaskEventValidation());
            return runner.run(event);
        }
    };
};
