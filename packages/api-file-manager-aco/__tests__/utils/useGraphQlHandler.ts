import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { AcoFeature } from "@webiny/api-aco";
import { FileManagerAppFeature } from "@webiny/api-file-manager";
import { createAcoSdk } from "../../../api-aco/__tests__/utils/createAcoSdk.js";
import { createFileManagerSdk } from "../../../api-file-manager/__tests__/utils/createFileManagerSdk.js";
import { FileManagerAcoFeature } from "~/index.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { RootTenantInitializer } from "./mocks/RootTenantInitializer";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    plugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const defaultIdentity: IdentityData = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const apiAcoStorage = getStorageOps<any>("aco");
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
            const wcpLicense = await loadWcpLicense(
                params.testProjectLicense ?? createTestWcpLicense()
            );

            ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
            processLegacyPlugins(container, apiAcoStorage.plugins);
            processLegacyPlugins(container, cmsStorage.plugins);

            HeadlessCmsFeature.register(container, { type: "manage" });
            AcoFeature.register(container);
            FileManagerAppFeature.register(container);
            FileManagerAcoFeature.register(container);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
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

    const fm = createFileManagerSdk(invoke as any);
    const aco = createAcoSdk(invoke as any);

    return {
        params,
        handler,
        invoke,
        fm,
        aco,
        introspect: () => {
            return invoke({ body: { query: getIntrospectionQuery() } });
        }
    };
};
