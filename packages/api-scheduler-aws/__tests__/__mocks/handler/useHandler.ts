import { createTestHttpHandler } from "@webiny/api-kernel-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { WcpLicenseLoader } from "@webiny/api-core/features/wcp/WcpLicenseLoader.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import { SchedulerFeature } from "@webiny/api-scheduler";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { TestTenantScopesFeature, createTenantScopedChild } from "@webiny/api-core-testing";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NullLogger } from "@webiny/api-core/features/logger/index.js";
import type { Container } from "@webiny/di";

export interface UseHandlerParams {
    getScheduleClient: (config?: SchedulerClientConfig) => Pick<SchedulerClient, "send">;
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    /** Runs in every tenant scope, after the features: registrations every tenant needs. */
    setup?: (container: Container) => void;
}

const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useHandler = (params: UseHandlerParams) => {
    const { permissions, identity } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps("cms");

    const resolvedIdentity = identity ?? defaultIdentity;
    const resolvedPermissions = (permissions ?? [{ name: "*" }]) as SecurityPermission[];

    // The request's own scope (the root tenant's): the first scope the request builds.
    let capturedCtx: any = null;

    /*
     * Requests run the way the API runs them: the request container is tenant-neutral, and the
     * request continues in the scope of its `x-tenant` header's tenant. Work in another tenant
     * (`TenantScopes.withTenant()`) builds that tenant's scope the same way.
     */
    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, resolvedIdentity);
            container.registerInstance(TestPermissions, { list: resolvedPermissions });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            TestTenantScopesFeature.register(container);
        },
        child: createTenantScopedChild({
            request: async container => {
                await WcpLicenseLoader.load(createTestWcpLicense());
                registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
                container.registerInstance(Logger, new NullLogger());
            },
            scope: container => {
                const wcpLicense = WcpLicenseLoader.getCached();
                ApiCoreFeature.register(container, { wcpLicense, tenantScope: true });
                processLegacyPlugins(container, cmsStorage.plugins);
                HeadlessCmsFeature.register(container, { type: "manage" });

                SchedulerFeature.register(container);
                params.setup?.(container);

                capturedCtx ??= { container };

                GraphQLEngineFeature.register(container);
            }
        })
    });

    return {
        handler: async () => {
            capturedCtx = null;
            await handler({
                method: "POST",
                path: "/graphql",
                headers: {
                    "x-tenant": "root",
                    "content-type": "application/json",
                    authorization: "Bearer test-token"
                },
                body: { query: "{ __typename }" }
            });
            return capturedCtx;
        }
    };
};
