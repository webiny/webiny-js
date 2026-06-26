import { until } from "@webiny/project-utils/testing/helpers/until";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import {
    GraphQLEngineFeature,
    registerLegacyPluginsViaGqlContextualSchema
} from "@webiny/handler-graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { FileManagerAppFeature } from "~/FileManagerAppFeature";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { RootTenantInitializer } from "./mocks/RootTenantInitializer";
import { createFileManagerSdk } from "./createFileManagerSdk";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface HandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
    plugins?: any[];
}

export const defaultIdentity: IdentityData = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export default (params: HandlerParams = {}) => {
    const { identity, permissions, plugins = [] } = params;

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
            ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            FileManagerAppFeature.register(container);
            // Bridge test-supplied legacy ContextPlugins (e.g. file lifecycle event subscribers)
            // so their apply(ctx) runs per request and registers their DI instances before resolvers.
            registerLegacyPluginsViaGqlContextualSchema(container, plugins);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({
        httpMethod = "POST",
        body,
        headers = {}
    }: {
        httpMethod?: "POST";
        body: { query: string; variables?: Record<string, any> };
        headers?: Record<string, string>;
    }) => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                ...headers
            },
            body
        });
        return [response.body, response];
    };

    const sdk = createFileManagerSdk(invoke as any);

    return {
        until,
        handler,
        invoke,
        identity: resolvedIdentity,
        ...sdk
    };
};
