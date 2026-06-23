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

export interface UseRawHandlerParams {
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

export const useRawHandler = <C = any>(params?: UseRawHandlerParams) => {
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
                    capturedCtx = ctx;
                }
            }));

            GraphQLEngineFeature.register(container);
        }
    });

    return {
        handle: async (payload?: Record<string, any>): Promise<C> => {
            capturedCtx = null;
            await handler({
                method: "POST",
                path: "/graphql",
                headers: {
                    "x-tenant": "root",
                    ...(payload?.headers ?? {}),
                    "content-type": "application/json",
                    authorization: "Bearer test-token"
                },
                body: { query: "{ __typename }" }
            });
            return capturedCtx as C;
        }
    };
};
