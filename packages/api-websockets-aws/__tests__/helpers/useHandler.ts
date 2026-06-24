import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import {
    GraphQLEngineFeature,
    GraphQLContextualSchema,
    registerLegacyPluginsViaGqlContextualSchema
} from "@webiny/handler-graphql";
import { buildSchema } from "graphql";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { WebsocketsFeature } from "@webiny/api-websockets/features/feature.js";
import { WebsocketsGraphQLFactoryFeature } from "@webiny/api-websockets/graphql/feature.js";
import { createWebsocketsRoutePlugins } from "@webiny/api-websockets/runner/routes/index.js";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { RootTenantInitializer } from "./mocks/RootTenantInitializer";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    plugins?: any[];
}

const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const defaultPermissions: SecurityPermission[] = [
    { name: "task.entry", rwd: "rwd" },
    { name: "*" }
];

export const useHandler = (params?: UseHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const websocketsStorage = getStorageOps("websockets");

    const resolvedIdentity = params?.identity ?? defaultIdentity;
    const resolvedPermissions = (params?.permissions ?? defaultPermissions) as SecurityPermission[];

    let capturedCtx: any = null;

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
            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            processLegacyPlugins(container, websocketsStorage.plugins);
            WebsocketsFeature.register(container);
            WebsocketsGraphQLFactoryFeature.register(container);

            registerLegacyPluginsViaGqlContextualSchema(container, [
                ...createWebsocketsRoutePlugins(),
                ...(params?.plugins ?? [])
            ]);
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
        }
    };
};
