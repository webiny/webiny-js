import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { GraphQLContextEnhancer, GraphQLEngineFeature } from "@webiny/handler-graphql";
import { getTestOpenSearchClient } from "@webiny/api-opensearch/testing/index.js";
import type { CreateHandlerCoreParams } from "./plugins.js";
import { createHandlerCore } from "./plugins.js";
import { defaultIdentity } from "./tenancySecurity.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import type { Container } from "@webiny/di";

export interface HandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

export interface UseContextHandlerParams extends CreateHandlerCoreParams {
    debug?: boolean;
    /** Called after core setup to register DI-native features (e.g. WorkflowsFeature). */
    features?: (container: Container) => void;
}
export const useContextHandler = <C extends CmsContext = CmsContext>(
    params: UseContextHandlerParams = {}
) => {
    const core = createHandlerCore(params);

    const opensearchClient = getTestOpenSearchClient();

    return {
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        opensearch: opensearchClient,
        context: async (_input?: HandlerEvent): Promise<C> => {
            const capturedCtx: { value?: Record<string, any> } = {};

            const handler = createTestHttpHandler({
                root: () => {},
                request: async container => {
                    await core.setup(container, core.legacyPlugins);
                    registerLegacyPluginsViaGqlContextEnhancer(container, core.legacyPlugins);
                    container.registerInstance(GraphQLContextEnhancer, {
                        enhance(ctx: Record<string, any>) {
                            capturedCtx.value = ctx;
                        }
                    });
                    params.features?.(container);
                    GraphQLEngineFeature.register(container);
                }
            });

            await handler({
                method: "POST",
                path: "/graphql",
                headers: {
                    "x-tenant": "root",
                    "content-type": "application/json"
                },
                body: { query: "{ __typename }" }
            });

            return capturedCtx.value as unknown as C;
        }
    };
};
