import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLContextEnhancer, GraphQLEngineFeature } from "@webiny/handler-graphql";
import { HeadlessCmsFeature } from "~/index";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "~/types";
import type { PermissionsArg } from "~tests/testHelpers/helpers";
import { createPermissions } from "~tests/testHelpers/helpers";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TestIdentity, TestAuthenticator } from "~tests/testHelpers/mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "~tests/testHelpers/mocks/TestAuthorizer";
import { RootTenantInitializer } from "~tests/testHelpers/handlers/RootTenantInitializer";
import { AuthTriggerHandler } from "~tests/testHelpers/handlers/AuthTriggerHandler";
import { defaultIdentity } from "~tests/testHelpers/tenancySecurity";
import { processLegacyPlugins } from "~tests/testHelpers/bridgeLegacyPlugins";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";

export interface CmsHandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

export type UseHandlerParams = {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    topPlugins?: any[];
    plugins?: any[];
    bottomPlugins?: any[];
    path?: string;
};

export const useHandler = (params: UseHandlerParams = {}) => {
    const {
        identity = defaultIdentity,
        permissions,
        plugins = [],
        topPlugins = [],
        bottomPlugins = []
    } = params;
    const allPlugins = [
        ...[topPlugins].flat(Infinity as 1),
        ...[plugins].flat(Infinity as 1),
        ...[bottomPlugins].flat(Infinity as 1)
    ];

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const resolvedPermissions = createPermissions(permissions);

    const documentClient = getDocumentClient();
    const dbDriver = new DynamoDbDriver({ documentClient });

    const capturedCtx: { value?: Record<string, any> } = {};

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, identity);
            container.registerInstance(TestPermissions, resolvedPermissions);
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());

            container.registerInstance(GraphQLContextEnhancer, {
                enhance(ctx: Record<string, any>) {
                    ctx.db = { driver: dbDriver };
                }
            });

            container.registerInstance(GraphQLContextEnhancer, {
                enhance(ctx: Record<string, any>) {
                    capturedCtx.value = ctx;
                }
            });

            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });

            processLegacyPlugins(container, cmsStorage.plugins);

            const extraCmsPlugins: any[] = [];
            for (const p of [cmsStorage.plugins].flat(Infinity as 1)) {
                if (p && typeof (p as any).apply !== "function" && typeof p !== "function") {
                    extraCmsPlugins.push(p);
                }
            }
            for (const plugin of allPlugins) {
                if (typeof plugin === "function" && !plugin.prototype) {
                    await (plugin as (container: any) => void)(container);
                } else {
                    extraCmsPlugins.push(...[plugin].flat());
                }
            }

            HeadlessCmsFeature.register(container, {
                type: "manage",
                extraPlugins: extraCmsPlugins
            });
            GraphQLEngineFeature.register(container);
        }
    });

    const tenant = { id: "root", name: "Root", parent: null };

    return {
        tenant,
        identity: identity || defaultIdentity,
        handler: async (_payload: CmsHandlerEvent) => {
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
