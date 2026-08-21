/**
 * Real-app integration guard for the Languages api extension registration path: the generated
 * extensions.ts wraps it in createRegisterExtensionPlugin(ctx => registerExtension(ctx.container,
 * Extension)) dispatched via registerExtensions (how the real app handler applies generated
 * extensions, at register time), NOT a direct Extension.register(container). If the wbyLanguage
 * model resolves, the indirection works.
 */
import { describe, expect, it } from "vitest";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { GraphQLContextualSchema, GraphQLEngineFeature } from "@webiny/api-graphql";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { registerExtensions } from "@webiny/handler";
import { registerExtension } from "@webiny/project/utils/registerExtension.js";
import { buildSchema } from "graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { Extension } from "~/api/Extension.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
import { processLegacyPlugins } from "./utils/bridgeLegacyPlugins";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const defaultIdentity: IdentityData = { id: "12345678", type: "admin", displayName: "John Doe" };
const defaultPermissions: SecurityPermission[] = [{ name: "*" }];

describe("Languages api extension — registered via the app indirection", () => {
    it("registers the wbyLanguage model through registerExtension + RequestContextInitializer", async () => {
        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const cmsStorage = getStorageOps("cms");

        const capturedCtx: { value?: Record<string, any> } = {};

        const handler = createTestHttpHandler({
            root: container => {
                container.registerInstance(TestIdentity, defaultIdentity);
                container.registerInstance(TestPermissions, { list: defaultPermissions });
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

                // The app path: NOT Extension.register(container) directly. registerExtensions is
                // how the real app handler dispatches generated extensions (register-time).
                await registerExtensions(container, [
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
});
