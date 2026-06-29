import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import type { Container } from "@webiny/di";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { HeadlessCmsFeature } from "~/HeadlessCmsFeature.js";
import type { HeadlessCmsStorageOperations } from "~/types/types.js";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator.js";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer.js";
import { AuthTriggerHandler } from "./handlers/AuthTriggerHandler.js";
import { RootTenantInitializer } from "./handlers/RootTenantInitializer.js";
import { processLegacyPlugins } from "./processLegacyPlugins.js";

const DEFAULT_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export interface CmsTestHandlerParams {
    /** Identity for the request. `undefined` → a default admin; `null` → anonymous. */
    identity?: IdentityData | null;
    permissions?: SecurityPermission[];
    testProjectLicense?: DecryptedWcpProjectLicense;
    /**
     * Register the consuming package's own features here (e.g. AcoFeature, FileModel, plus its own
     * getStorageOps presets via processLegacyPlugins). Runs in the request phase AFTER ApiCore + CMS
     * storage + HeadlessCmsFeature, and BEFORE the GraphQL engine — i.e. before any initializer or
     * resolver, the same window the real app handler uses.
     */
    features?: (container: Container) => void | Promise<void>;
}

export interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    body: { query: string; variables?: Record<string, any> };
    headers?: Record<string, string>;
}

/**
 * Shared integration test handler that wires the real CMS base (ApiCore + HeadlessCms + GraphQL
 * engine + the CMS manage route) the same way the AWS app handler does — auth via Test
 * authenticator/authorizer, root tenant seeded, storage via getStorageOps. Consuming packages add
 * their own features through `params.features` and build their SDKs on top of `invoke`/`invokeCms`.
 */
export const createCmsTestHandler = (params: CmsTestHandlerParams = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const identity = params.identity === undefined ? DEFAULT_IDENTITY : params.identity;
    const permissions = params.permissions === undefined ? [{ name: "*" }] : params.permissions;

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, identity);
            container.registerInstance(TestPermissions, { list: permissions });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(
                params.testProjectLicense ?? createTestWcpLicense()
            );

            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense });

            // CMS storage preset must be registered before HeadlessCmsFeature builds storage.
            processLegacyPlugins(container, cmsStorage.plugins);

            HeadlessCmsFeature.register(container, { type: "manage" });

            await params.features?.(container);

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: { "x-tenant": "root", "content-type": "application/json", ...headers },
            body
        });
        return [response.body, response] as const;
    };

    const invokeCms = async ({
        httpMethod = "POST",
        type = "manage",
        body,
        headers = {}
    }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: `/cms/${type}`,
            headers: { "x-tenant": "root", "content-type": "application/json", ...headers },
            body
        });
        return [response.body, response] as const;
    };

    return { handler, invoke, invokeCms };
};
