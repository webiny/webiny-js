import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { registerLegacyPlugins } from "@webiny/handler-graphql";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/index.js";
import type { CreateHandlerCoreParams } from "./plugins.js";
import { createHandlerCore } from "./plugins.js";
import { defaultIdentity } from "./tenancySecurity.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";

export interface HandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

export interface UseContextHandlerParams extends CreateHandlerCoreParams {
    debug?: boolean;
}
export const useContextHandler = <C extends CmsContext = CmsContext>(
    params: UseContextHandlerParams = {}
) => {
    const core = createHandlerCore(params);

    const { elasticsearchClient } = getElasticsearchClient({ name: "testing-ddb-es" });

    return {
        plugins: core.plugins,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        elasticsearch: elasticsearchClient,
        context: async (_input?: HandlerEvent): Promise<C> => {
            const root = new Container();
            const child = root.createChildContainer();
            child.registerInstance(RequestContainer, child);

            registerLegacyPlugins(child, core.plugins);

            const ctx: Record<string, any> = { container: child };
            const enhancers = child.resolveAll(GraphQLContextEnhancer);
            for (const enhancer of enhancers) {
                await enhancer.enhance(ctx);
            }

            return ctx as unknown as C;
        }
    };
};
