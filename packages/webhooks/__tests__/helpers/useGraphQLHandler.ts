import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
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
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface UseGraphQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    plugins?: any[];
}

interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
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

const defaultPermissions: SecurityPermission[] = [
    { name: "webhooks.webhook", rwd: "rwd" },
    { name: "*" }
];

export const useGraphQLHandler = (params?: UseGraphQLHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps("cms");

    const resolvedIdentity = params?.identity ?? defaultIdentity;
    const resolvedPermissions = (params?.permissions ?? defaultPermissions) as SecurityPermission[];

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
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            NoopTaskServiceFeature.register(container);
            TestWebhookProviderFeature.register(container);
            Extension.register(container);
            processLegacyPlugins(container, params?.plugins ?? []);

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams): Promise<[T, any]> => {
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
        return [response.body as unknown as T, response];
    };

    return {
        invoke,
        noopTaskService
    };
};
