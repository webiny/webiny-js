import { until } from "@webiny/project-utils/testing/helpers/until";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { FileManagerAppFeature } from "~/FileManagerAppFeature";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
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

            FileManagerAppFeature.register(container);
            // DI-native plugins are plain `container => {}` functions (e.g. file lifecycle event
            // subscribers); call them directly.
            for (const plugin of [plugins].flat(Infinity as 1).filter(Boolean)) {
                (plugin as (container: any) => void)(container);
            }
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
