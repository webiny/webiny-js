import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { PluginsContainer } from "@webiny/plugins";
import { Request } from "@webiny/handler";
import { CmsParametersPlugin } from "@webiny/api-headless-cms/plugins/CmsParametersPlugin.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { Benchmark } from "@webiny/api/Benchmark.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createWebsiteBuilderScheduleContext } from "~/context.js";
import { PageModelPlugin } from "@webiny/api-website-builder/domain/page/page.model.js";
import { RedirectModelPlugin } from "@webiny/api-website-builder/domain/redirect/redirect.model.js";
import { SchedulePrivateModel } from "@webiny/api-scheduler/domain/SchedulePrivateModel.js";
import { createHandlerCore } from "./plugins";
import type { CreateHandlerCoreParams } from "./plugins";
import { defaultIdentity } from "./tenancySecurity";

export const useHandler = <C extends ApiCoreContext>(params: CreateHandlerCoreParams) => {
    const core = createHandlerCore(params);
    const legacyPlugins = ([...core.plugins, createWebsiteBuilderScheduleContext()] as any[]).flat(
        Infinity as 1
    );

    const buildContext = async (): Promise<C> => {
        const container = new Container();
        container.registerInstance(RequestContainer, container);
        container.registerInstance(Request, { headers: { "x-tenant": "root" } });
        CompressionFeature.register(container);
        // Pre-register all model plugins before the first GetModelUseCase call populates
        // ModelCache. Without this, models registered later in the legacy plugin chain
        // (modelsPlugin, extensionPlugin) would be absent from the cache.
        container.register(PageModelPlugin);
        container.register(RedirectModelPlugin);
        container.register(SchedulePrivateModel);
        registerLegacyPluginsViaGqlContextEnhancer(container, legacyPlugins);

        const ctx: Record<string, any> = { container, plugins: new PluginsContainer() };
        ctx.benchmark = new Benchmark();
        ctx.plugins.register(new CmsParametersPlugin(async () => ({ type: "manage" })));
        for (const enhancer of container.resolveAll(GraphQLContextEnhancer)) {
            await enhancer.enhance(ctx);
        }
        return ctx as unknown as C;
    };

    return {
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        elasticsearch: createTestOpenSearchClient(),
        handler: buildContext
    };
};
