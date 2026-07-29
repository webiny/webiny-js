/**
 * Guards the Languages model on the CMS MANAGE route (/cms/manage = createCmsRoute, NOT the main
 * /graphql engine), registered the way the app does it — via registerExtensions at register() time.
 *
 * The second test pins the regression: a model-listing initializer (like AcoInitializer) caches the
 * per-request model set, so if extensions registered AFTER it (the old post-auth-initializer path),
 * wbyLanguage was silently absent. registerExtensions runs at register() time, before initializers,
 * so the model is present when the list is first built/cached.
 */
import { describe, expect, it } from "vitest";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { createRegisterExtensionPlugin, registerExtensions } from "@webiny/handler";
import { registerExtension } from "@webiny/project/utils/registerExtension.js";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { Extension } from "~/api/Extension.js";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
import { processLegacyPlugins } from "./utils/bridgeLegacyPlugins";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const defaultIdentity: IdentityData = { id: "12345678", type: "admin", displayName: "John Doe" };
const defaultPermissions: SecurityPermission[] = [{ name: "*" }];

const GET_MODEL = /* GraphQL */ `
    query GetModel($modelId: ID!) {
        getContentModel(modelId: $modelId) {
            data {
                modelId
                name
            }
            error {
                message
                code
            }
        }
    }
`;

describe("Languages model via the CMS manage route (createCmsRoute)", () => {
    it("getContentModel('wbyLanguage') resolves through /cms/manage", async () => {
        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const cmsStorage = getStorageOps("cms");

        const handler = createTestHttpHandler({
            root: container => {
                container.registerInstance(TestIdentity, defaultIdentity);
                container.registerInstance(TestPermissions, { list: defaultPermissions });
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

                // The real app path: extensions applied at register() time via registerExtensions.
                await registerExtensions(container, [
                    createRegisterExtensionPlugin(ctx => {
                        registerExtension(ctx.container, Extension);
                    })
                ]);
            }
        });

        const response = await handler({
            method: "POST",
            path: "/cms/manage",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                authorization: "Bearer test-token"
            },
            body: { query: GET_MODEL, variables: { modelId: "wbyLanguage" } }
        });

        const body = typeof response.body === "string" ? JSON.parse(response.body) : response.body;
        const result = body?.data?.getContentModel;

        expect(result?.error).toBeNull();
        expect(result?.data?.modelId).toBe("wbyLanguage");
    });

    it("REPRO: an earlier initializer that lists models (like ACO) must NOT hide wbyLanguage", async () => {
        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const cmsStorage = getStorageOps("cms");

        const handler = createTestHttpHandler({
            root: container => {
                container.registerInstance(TestIdentity, defaultIdentity);
                container.registerInstance(TestPermissions, { list: defaultPermissions });
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

                // Simulate AcoInitializer: a RequestContextInitializer (registered BEFORE the
                // languages extension) that lists models and thereby caches the model list.
                container.registerInstance(RequestContextInitializer, {
                    init: async () => {
                        await container.resolve(ListModelsUseCase).execute();
                    }
                });

                // Languages applied at register() time — BEFORE the model-listing initializer above
                // runs (initializers run at request-handle time), so its model survives the cache.
                await registerExtensions(container, [
                    createRegisterExtensionPlugin(ctx => {
                        registerExtension(ctx.container, Extension);
                    })
                ]);
            }
        });

        const response = await handler({
            method: "POST",
            path: "/cms/manage",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                authorization: "Bearer test-token"
            },
            body: { query: GET_MODEL, variables: { modelId: "wbyLanguage" } }
        });

        const body = typeof response.body === "string" ? JSON.parse(response.body) : response.body;
        const result = body?.data?.getContentModel;

        expect(result?.data?.modelId).toBe("wbyLanguage");
    });
});
