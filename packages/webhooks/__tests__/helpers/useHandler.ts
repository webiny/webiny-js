import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature, GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { Extension } from "~/api/Extension.js";
import { NoopTaskServiceFeature, noopTaskService } from "./NoopTaskService.js";
import { TestWebhookProviderFeature } from "./TestWebhookProvider.js";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { RootTenantInitializer } from "./mocks/RootTenantInitializer";
import { BuildParam } from "@webiny/api-core/features/buildParams/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    encryptionPassphrase?: string;
}

const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const defaultPermissions: SecurityPermission[] = [
    { name: "webhooks.webhook", rwd: "rwd" },
    { name: "*" }
];

function createEncryptionBuildParam(passphrase: string) {
    class EncryptionPassphraseBuildParam implements BuildParam.Interface {
        public readonly key = "EncryptionPassphrase";
        public readonly value = passphrase;
    }

    return BuildParam.createImplementation({
        implementation: EncryptionPassphraseBuildParam,
        dependencies: []
    });
}

export const useHandler = (params?: UseHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const resolvedIdentity = params?.identity ?? defaultIdentity;
    const resolvedPermissions = (params?.permissions ?? defaultPermissions) as SecurityPermission[];

    let capturedCtx: any = null;

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

            if (params?.encryptionPassphrase) {
                container.register(createEncryptionBuildParam(params.encryptionPassphrase));
            }

            NoopTaskServiceFeature.register(container);
            TestWebhookProviderFeature.register(container);
            Extension.register(container);

            container.registerFactory(GraphQLContextEnhancer, () => ({
                async enhance(ctx: Record<string, any>): Promise<void> {
                    capturedCtx = ctx;
                }
            }));

            GraphQLEngineFeature.register(container);
        }
    });

    return {
        handle: async () => {
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
        },
        noopTaskService
    };
};
