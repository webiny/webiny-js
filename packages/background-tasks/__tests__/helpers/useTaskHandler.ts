import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import {
    GraphQLEngineFeature,
    GraphQLContextualSchema,
    registerLegacyPluginsViaGqlContextualSchema
} from "@webiny/handler-graphql";
import { buildSchema } from "graphql";
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
import { TaskRunner } from "~/api/runner/index.js";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation.js";
import { timerFactory } from "@webiny/handler-aws/utils/index.js";
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

export const useTaskHandler = (params?: UseTaskHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    let capturedCtx: any = null;

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

            registerLegacyPluginsViaGqlContextualSchema(container, [
                createMockTaskServicePlugin(),
                ...(params?.plugins ?? [])
            ]);
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

            const runner = new TaskRunner(
                capturedCtx,
                timerFactory({ getRemainingTimeInMillis: () => 1_000_000 }),
                new TaskEventValidation()
            );
            return runner.run(event);
        }
    };
};
