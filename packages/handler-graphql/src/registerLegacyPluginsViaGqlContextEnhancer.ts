import type { Container } from "@webiny/di";
import { PluginsContainer } from "@webiny/plugins";
import { PluginsContainerAbstraction } from "@webiny/api";
import { GraphQLContextEnhancer } from "./engine/index.js";
import type { IGraphQLContextEnhancer } from "./engine/index.js";

/**
 * Escape hatch for legacy plugin-based code that hasn't been migrated to createFeature() yet.
 *
 * Accepts any plugin array (same shape as the old createHandler({ plugins: [...] })) and
 * applies them via a GraphQLContextEnhancer so they still receive the context object.
 *
 * Usage in createLambdaHandler request callback:
 *   registerLegacyPluginsViaGqlContextEnhancer(container, extensions());
 *   registerLegacyPluginsViaGqlContextEnhancer(container, [myPlugin(), anotherPlugin()]);
 */
export function registerLegacyPluginsViaGqlContextEnhancer(
    container: Container,
    plugins: any | any[]
): void {
    const flat = [plugins].flat(Infinity as 1).filter(Boolean);
    let initialized = false;

    const enhancer: IGraphQLContextEnhancer = {
        async enhance(ctx: Record<string, any>): Promise<void> {
            if (initialized) {
                return;
            }
            initialized = true;

            // Legacy plugins assume ctx.plugins exists (they call ctx.plugins.register() directly).
            // Mirror the contract of the old createHandler which always initialised PluginsContainer.
            if (!ctx.plugins) {
                ctx.plugins = new PluginsContainer([]);
            }

            // Register in DI so DI-native code (e.g. GraphQLEngineImpl) can resolve it.
            container.registerInstance(PluginsContainerAbstraction, ctx.plugins);

            for (const plugin of flat) {
                if (typeof plugin.apply === "function") {
                    await plugin.apply(ctx);
                } else if (ctx.plugins) {
                    ctx.plugins.register(plugin);
                }
            }
        }
    };

    container.registerInstance(GraphQLContextEnhancer, enhancer);
}
