import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLContextualSchema, GraphQLEngineFeature } from "@webiny/handler-graphql";
import { buildSchema } from "graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { Extension } from "~/api/Extension.js";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./handlers/AuthTriggerHandler";
import { RootTenantInitializer } from "./handlers/RootTenantInitializer";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const defaultIdentity: IdentityData = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

const defaultPermissions: SecurityPermission[] = [{ name: "*" }];

export const useHandler = () => {
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

            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });

            processLegacyPlugins(container, cmsStorage.plugins);

            HeadlessCmsFeature.register(container, { type: "manage" });

            Extension.register(container);

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

    return {
        handler: async () => {
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
            return capturedCtx.value!;
        }
    };
};
