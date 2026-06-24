import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLContextEnhancer, GraphQLEngineFeature } from "@webiny/handler-graphql";
import { HeadlessCmsFeature } from "~/index";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "~/types";
import type { PermissionsArg } from "./helpers";
import { createPermissions } from "./helpers";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TestIdentity, TestAuthenticator } from "~tests/testHelpers/mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "~tests/testHelpers/mocks/TestAuthorizer";
import { RootTenantInitializer } from "~tests/testHelpers/handlers/RootTenantInitializer";
import { AuthTriggerHandler } from "~tests/testHelpers/handlers/AuthTriggerHandler";
import { CmsEndpointAccessDecorator } from "~tests/testHelpers/handlers/CmsEndpointAccessDecorator";
import { defaultIdentity } from "~tests/testHelpers/tenancySecurity";
import { processLegacyPlugins } from "~tests/testHelpers/bridgeLegacyPlugins";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";

export interface CreateHandlerCoreParams {
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    path?: string;
    extraPlugins?: any[];
}

export const createHandlerCore = (params: CreateHandlerCoreParams = {}) => {
    const tenant = { id: "root", name: "Root", parent: null };
    const { identity = defaultIdentity, permissions, extraPlugins = [] } = params;

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
            container.registerDecorator(CmsEndpointAccessDecorator);
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

            const allExtraPlugins: any[] = [];
            for (const p of [cmsStorage.plugins].flat(Infinity as 1)) {
                if (p && typeof (p as any).apply !== "function" && typeof p !== "function") {
                    allExtraPlugins.push(p);
                }
            }
            for (const p of extraPlugins) {
                allExtraPlugins.push(...[p].flat());
            }

            HeadlessCmsFeature.register(container, {
                type: "manage",
                extraPlugins: allExtraPlugins
            });
            GraphQLEngineFeature.register(container);
        }
    });

    return {
        handler,
        tenant,
        identity,
        capturedCtx,
        storageOperations: cmsStorage.storageOperations
    };
};
