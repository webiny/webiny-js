import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { PluginsContainer } from "@webiny/plugins";
import { Request } from "@webiny/handler";
import { CmsParametersPlugin } from "@webiny/api-headless-cms/plugins/CmsParametersPlugin.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { Benchmark } from "@webiny/api/Benchmark.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createBackgroundTaskContext } from "@webiny/background-tasks/api";
import { createCmsExtension } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import type { PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createIdentity, createPermissions } from "./helpers";
import { createElasticsearchBackgroundTasks } from "~/index";
import type { Context } from "~/types";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = (params?: UseHandlerParams) => {
    const { plugins: initialPlugins = [] } = params || {};
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const legacyPlugins = [
        createApiCore({ storageOperations: apiCoreStorage.storageOperations }),
        ...cmsStorage.plugins,
        ...createTenancyAndSecurity({
            permissions: createPermissions(),
            identity: createIdentity()
        }),
        createCmsExtension(),
        graphQLHandlerPlugins(),
        ...createBackgroundTaskContext(),
        ...createElasticsearchBackgroundTasks(),
        ...(initialPlugins as any[])
    ].flat(Infinity as 1);

    const buildContext = async (): Promise<Context> => {
        const container = new Container();
        container.registerInstance(RequestContainer, container);
        container.registerInstance(Request, { headers: { "x-tenant": "root" } });
        CompressionFeature.register(container);
        registerLegacyPluginsViaGqlContextEnhancer(container, legacyPlugins);

        const ctx: Record<string, any> = { container, plugins: new PluginsContainer() };
        // Pre-seed benchmark and CMS type before context plugins run:
        // createContextPlugin() builds context.cms with closures that use context.benchmark,
        // and it runs before CmsParametersPlugin instances are registered.
        ctx.benchmark = new Benchmark();
        ctx.plugins.register(new CmsParametersPlugin(async () => ({ type: "manage" })));
        for (const enhancer of container.resolveAll(GraphQLContextEnhancer)) {
            await enhancer.enhance(ctx);
        }
        return ctx as unknown as Context;
    };

    return {
        rawHandle: buildContext
    };
};
