import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { ApiCoreContext, ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createContextPlugin } from "@webiny/api";
import { InvalidateCloudfrontCacheTaskDefinition } from "@webiny/api-file-manager-s3/features/FlushCache/InvalidateCacheTask.js";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import { createWebsiteBuilder } from "~/index.js";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createIdentity } from "./identity.js";
import { createBackgroundTasks } from "~tests/mocks/mockBackgroundTasks.js";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import {
    GraphQLContextEnhancer,
    GraphQLEngineFeature,
    registerLegacyPluginsViaGqlContextEnhancer
} from "@webiny/handler-graphql";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins.js";
import { PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    const capturedCtx: { value?: Record<string, any> } = {};

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
            LanguagesExtension.register(container);
            registerLegacyPluginsViaGqlContextEnhancer(container, [
                // createTenancyAndSecurity FIRST: sets ctx.tenancy / ctx.security before
                // createWebsiteBuilder's contextPlugin calls GetModelUseCase (which needs the tenant).
                ...createTenancyAndSecurity({
                    permissions,
                    identity: identity === undefined ? createIdentity() : identity
                }),
                createBackgroundTasks(),
                createContextPlugin(ctx => {
                    ctx.container.register(InvalidateCloudfrontCacheTaskDefinition);
                }),
                createWebsiteBuilder(),
                plugins
            ]);

            container.registerInstance(GraphQLContextEnhancer, {
                enhance(ctx: Record<string, any>) {
                    capturedCtx.value = ctx;
                }
            });

            GraphQLEngineFeature.register(container);
        }
    });

    return {
        handler: async (): Promise<ApiCoreContext> => {
            await handler({
                method: "POST",
                path: "/graphql",
                headers: {
                    "x-tenant": "root",
                    "content-type": "application/json"
                },
                body: { query: "{ __typename }" }
            });
            return capturedCtx.value as unknown as ApiCoreContext;
        }
    };
};
