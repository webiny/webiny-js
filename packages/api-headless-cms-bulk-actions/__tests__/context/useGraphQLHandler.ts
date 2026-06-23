import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLContextEnhancer, GraphQLEngineFeature } from "@webiny/handler-graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { HeadlessCmsContextualSchema } from "@webiny/api-headless-cms/HeadlessCmsContextualSchema.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL
} from "@webiny/background-tasks/api";
import { createHcmsBulkActions } from "~/index";
import { createIdentity, createPermissions } from "~tests/context/helpers";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { RootTenantInitializer } from "./handlers/RootTenantInitializer";
import { AuthTriggerHandler } from "./handlers/AuthTriggerHandler";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";

export interface UseGQLHandlerParams {
    identity?: IdentityData;
    permissions?: SecurityPermission[];
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
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

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const resolvedIdentity = params.identity ?? createIdentity();
    const resolvedPermissions = params.permissions ?? (createPermissions() as SecurityPermission[]);

    const extraCmsPlugins = ([plugins] as any[]).flat(Infinity as 1).filter(Boolean);

    // createBackgroundTaskContext/GraphQL and createHcmsBulkActions call ctx.tenancy/ctx.security
    // during enhance. Factory registrations run after class registrations in resolveAll, so they
    // run after ApiCoreContextEnhancerImpl which sets those properties.
    const latePlugins = [
        createBackgroundTaskContext(),
        createBackgroundTaskGraphQL(),
        createHcmsBulkActions()
    ]
        .flat(Infinity as 1)
        .filter(Boolean);

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
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, {
                type: "manage",
                extraPlugins: extraCmsPlugins
            });
            container.register(HeadlessCmsContextualSchema);

            container.registerFactory(GraphQLContextEnhancer, () => ({
                async enhance(ctx: Record<string, any>): Promise<void> {
                    for (const plugin of latePlugins) {
                        if (typeof (plugin as any).apply === "function") {
                            await (plugin as any).apply(ctx);
                        } else if (ctx.plugins) {
                            ctx.plugins.register(plugin);
                        }
                    }
                }
            }));

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                ["x-tenant"]: "root",
                ["content-type"]: "application/json",
                ...headers
            },
            body
        });
        return [response.body, response];
    };

    const introspect = async () => {
        return invoke({
            body: {
                query: getIntrospectionQuery()
            }
        });
    };

    return {
        params,
        until,
        handler,
        invoke,
        introspect
    };
};
