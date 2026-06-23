import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import {
    registerLegacyPluginsViaGqlContextEnhancer,
    GraphQLEngineFeature
} from "@webiny/handler-graphql";
import { processLegacyPlugins } from "./bridgeLegacyPlugins.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import { createWebsiteBuilder } from "~/index.js";
import { createIdentity } from "./identity.js";
import { getIntrospectionQuery } from "graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createWbSdk } from "~tests/utils/createWbSdk.js";
import { createContextPlugin } from "@webiny/api";
import { InvalidateCloudfrontCacheTaskDefinition } from "@webiny/api-file-manager-s3/features/FlushCache/InvalidateCacheTask.js";
import { createBackgroundTasks } from "~tests/mocks/mockBackgroundTasks.js";
import { PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = params.testProjectLicense || createTestWcpLicense();

    const handler = createTestHttpHandler({
        root: () => {},
        request: async container => {
            const wcpLicense = await loadWcpLicense(testProjectLicense);
            ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });
            // Register model plugins before enhancers so HeadlessCmsContextEnhancerImpl
            // and the WB contextPlugin can find them via ModelsProvider.
            container.register(PageModelPlugin);
            container.register(RedirectModelPlugin);
            registerLegacyPluginsViaGqlContextEnhancer(container, [
                // createTenancyAndSecurity FIRST: sets ctx.tenancy / ctx.security before
                // createWebsiteBuilder's contextPlugin calls GetModelUseCase (which needs the tenant).
                ...createTenancyAndSecurity({
                    permissions,
                    identity: identity === undefined ? createIdentity() : identity
                }),
                createBackgroundTasks(),
                createContextPlugin(context => {
                    context.container.register(InvalidateCloudfrontCacheTaskDefinition);
                }),
                createWebsiteBuilder(),
                plugins
            ]);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "Content-Type": "application/json",
                ...headers
            },
            body
        });
        return [response.body, response];
    };

    const wb = createWbSdk(invoke);

    return {
        until,
        params,
        handler,
        invoke,
        wb,
        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        }
    };
};
