import type { Container } from "@webiny/di";
import { PluginsContainer } from "@webiny/plugins";
import { GraphQLContextInitializer } from "./engine/index.js";
import type { IGraphQLContextInitializer } from "./engine/index.js";

/**
 * Runs legacy ContextPlugins (those with an `apply(ctx)` method) as a per-request initializer, so
 * DI services (TenantContext, IdentityContext, the CMS facade, etc.) are fully initialised when
 * they execute. Initializers run after context enhancers and before contextual schemas, so this
 * also runs before any contextual schema that depends on what these plugins set (e.g. ctx.db).
 */
export function registerLegacyPluginsViaGqlContextualSchema(
    container: Container,
    plugins: any | any[]
): void {
    const flat = [plugins].flat(Infinity as 1).filter(Boolean);
    let initialized = false;

    const initializer: IGraphQLContextInitializer = {
        async init(ctx: Record<string, any>): Promise<void> {
            if (initialized) {
                return;
            }
            initialized = true;

            if (!ctx.plugins) {
                ctx.plugins = new PluginsContainer([]);
            }

            for (const plugin of flat) {
                if (typeof plugin.apply === "function") {
                    await plugin.apply(ctx);
                } else if (ctx.plugins) {
                    ctx.plugins.register(plugin);
                }
            }
        }
    };

    container.registerInstance(GraphQLContextInitializer, initializer);
}
