import type { Container } from "@webiny/di";
import { GraphQLContextEnhancer } from "./engine/index.js";
import type { IGraphQLContextEnhancer } from "./engine/index.js";

/**
 * Escape hatch for legacy plugin-based code that hasn't been migrated to createFeature() yet.
 *
 * Accepts any plugin array (same shape as the old createHandler({ plugins: [...] })) and
 * applies them via a GraphQLContextEnhancer so they still receive the context object.
 *
 * Usage in createLambdaHandler request callback:
 *   registerLegacyPlugins(container, extensions());
 *   registerLegacyPlugins(container, [myPlugin(), anotherPlugin()]);
 */
export function registerLegacyPlugins(container: Container, plugins: any | any[]): void {
    const flat = [plugins].flat(Infinity as 1).filter(Boolean);
    let initialized = false;

    const enhancer: IGraphQLContextEnhancer = {
        async enhance(ctx: Record<string, any>): Promise<void> {
            if (initialized) {
                return;
            }
            initialized = true;

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
