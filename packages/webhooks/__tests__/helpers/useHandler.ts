import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature, GraphQLContextualSchema } from "@webiny/api-graphql";
import { buildSchema } from "graphql";
import { WcpLicenseLoader } from "@webiny/api-core/features/wcp/WcpLicenseLoader.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { Extension } from "~/api/Extension.js";
import { NoopTaskServiceFeature, noopTaskService } from "./NoopTaskService.js";
import { TestWebhookProviderFeature } from "./TestWebhookProvider.js";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
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
    const cmsStorage = getStorageOps("cms");

    const resolvedIdentity = params?.identity ?? defaultIdentity;
    const resolvedPermissions = (params?.permissions ?? defaultPermissions) as SecurityPermission[];

    let capturedCtx: any = null;

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, resolvedIdentity);
            container.registerInstance(TestPermissions, { list: resolvedPermissions });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        child: async container => {
            if (params?.encryptionPassphrase) {
                container.register(createEncryptionBuildParam(params.encryptionPassphrase));
            }

            const wcpLicense = await WcpLicenseLoader.load(createTestWcpLicense());
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            NoopTaskServiceFeature.register(container);
            TestWebhookProviderFeature.register(container);
            Extension.register(container);

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
