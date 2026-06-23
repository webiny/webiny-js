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
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createHeadlessCmsScheduleContext } from "~/context.js";
import { createHandlerCore } from "./plugins";
import type { CreateHandlerCoreParams } from "./plugins";
import { defaultIdentity } from "./tenancySecurity";

export const useHandler = <C extends CmsContext>(params: CreateHandlerCoreParams) => {
    const core = createHandlerCore(params);
    const legacyPlugins = ([...core.plugins, createHeadlessCmsScheduleContext()] as any[]).flat(
        Infinity as 1
    );

    const buildContext = async (): Promise<C> => {
        const container = new Container();
        container.registerInstance(RequestContainer, container);
        container.registerInstance(Request, { headers: { "x-tenant": "root" } });
        CompressionFeature.register(container);
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
