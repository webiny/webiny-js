/**
 * Two real-app integration guards exercised through a full request handler:
 *
 * 1. The Languages api extension registration path — the generated extensions.ts wraps it in
 *    createRegisterExtensionPlugin(ctx => registerExtension(ctx.container, Extension)) funnelled
 *    through registerLegacyPluginsViaGqlContextualSchema, i.e. registration happens inside a
 *    RequestContextInitializer at request time, NOT a direct Extension.register(container). If the
 *    wbyLanguage model resolves, the indirection works.
 *
 * 2. The CMS AccessControl request-time overwrite — another feature (e.g. WebsiteBuilderFeature's
 *    redirect-route bootstrap) may register a permissive *stub* AccessControl via registerInstance
 *    before auth. HeadlessCmsFeature must overwrite it post-auth with the real, security-aware
 *    AccessControl (registerInstance beats registerFactory; the overwrite runs after the stub).
 *    Regression guard for "this.accessControl.canAccessEntry is not a function".
 */
import { describe, expect, it } from "vitest";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import {
    GraphQLContextualSchema,
    GraphQLEngineFeature,
    registerLegacyPluginsViaGqlContextualSchema
} from "@webiny/handler-graphql";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { registerExtension } from "@webiny/project/utils/registerExtension.js";
import { buildSchema } from "graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { Extension } from "~/api/Extension.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { TestIdentity, TestAuthenticator } from "./utils/mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./utils/mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./utils/handlers/AuthTriggerHandler";
import { RootTenantInitializer } from "./utils/handlers/RootTenantInitializer";
import { processLegacyPlugins } from "./utils/bridgeLegacyPlugins";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const defaultIdentity: IdentityData = { id: "12345678", type: "admin", displayName: "John Doe" };
const defaultPermissions: SecurityPermission[] = [{ name: "*" }];

describe("Languages api extension — registered via the app indirection", () => {
    it("registers the wbyLanguage model through registerExtension + RequestContextInitializer", async () => {
        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

        const capturedCtx: { value?: Record<string, any> } = {};

        const handler = createTestHttpHandler({
            root: container => {
                container.registerInstance(TestIdentity, defaultIdentity);
                container.registerInstance(TestPermissions, defaultPermissions);
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

                // The app path: NOT Extension.register(container) directly.
                registerLegacyPluginsViaGqlContextualSchema(container, [
                    createRegisterExtensionPlugin(ctx => {
                        registerExtension(ctx.container, Extension);
                    })
                ]);

                const STUB_SCHEMA = buildSchema("type Query { _empty: String }");
                container.registerInstance(GraphQLContextualSchema, {
                    async build(ctx: Record<string, any>) {
                        capturedCtx.value = ctx;
                        return STUB_SCHEMA;
                    }
                });

                GraphQLEngineFeature.register(container);
            }
        });

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

        const ctx = capturedCtx.value!;
        const getModel = ctx.container.resolve(GetModelUseCase);
        const result = await getModel.execute(LANGUAGE_MODEL_ID);

        expect(result.isOk()).toBe(true);
    });

    it("real AccessControl wins over a pre-auth permissive stub (canAccessEntry present)", async () => {
        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

        const capturedCtx: { value?: Record<string, any> } = {};

        const handler = createTestHttpHandler({
            root: container => {
                container.registerInstance(TestIdentity, defaultIdentity);
                container.registerInstance(TestPermissions, defaultPermissions);
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

                // Simulate WebsiteBuilderFeature's pre-auth bypass: a permissive stub WITHOUT
                // canAccessEntry, registered via registerInstance after the CMS feature. Without the
                // CMS request-time overwrite this stub would shadow the real AccessControl.
                container.registerInstance(AccessControl, {
                    canAccessModel: async () => true,
                    canAccessGroup: async () => true
                } as any);

                const STUB_SCHEMA = buildSchema("type Query { _empty: String }");
                container.registerInstance(GraphQLContextualSchema, {
                    async build(ctx: Record<string, any>) {
                        capturedCtx.value = ctx;
                        return STUB_SCHEMA;
                    }
                });

                GraphQLEngineFeature.register(container);
            }
        });

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

        const ctx = capturedCtx.value!;
        const accessControl = ctx.container.resolve(AccessControl);

        // The real, security-aware AccessControl (which has canAccessEntry) must win over the stub.
        expect(typeof accessControl.canAccessEntry).toBe("function");
    });
});
