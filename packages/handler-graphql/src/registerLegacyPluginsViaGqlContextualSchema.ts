import type { Container } from "@webiny/di";
import { PluginsContainer } from "@webiny/plugins";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";

/**
 * Runs legacy ContextPlugins (those with an `apply(ctx)` method) as a per-request initializer, so
 * DI services (TenantContext, IdentityContext, the CMS facade, etc.) are fully initialised when
 * they execute. Initializers run after context enhancers and before contextual schemas, so this
 * also runs before any contextual schema that depends on what these plugins set (e.g. ctx.db).
 *
 * Legacy `GraphQLSchemaPlugin`s (`type === "graphql-schema"`) are bridged to the DI GraphQL engine
 * via `CoreGraphQLSchemaFactory`, so their typeDefs/resolvers actually reach the composed schema
 * instead of being dropped into the no-longer-read `ctx.plugins` bag.
 */
export function registerLegacyPluginsViaGqlContextualSchema(
    container: Container,
    plugins: any | any[]
): void {
    const flat = [plugins].flat(Infinity as 1).filter(Boolean);
    let initialized = false;

    const initializer: IRequestContextInitializer = {
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
                } else if (plugin?.type === "graphql-schema" && plugin.schema) {
                    if (typeof plugin.isApplicable === "function" && !plugin.isApplicable(ctx)) {
                        continue;
                    }
                    const { schema } = plugin;
                    ctx.container.registerInstance(CoreGraphQLSchemaFactory, {
                        async execute(builder: any) {
                            if (schema.typeDefs) {
                                builder.addTypeDefs(schema.typeDefs);
                            }
                            if (schema.resolvers) {
                                builder.addLegacyResolvers(schema.resolvers);
                            }
                            if (schema.resolverDecorators) {
                                for (const [path, decorators] of Object.entries(
                                    schema.resolverDecorators
                                )) {
                                    for (const decorator of decorators as any[]) {
                                        builder.addResolverDecorator(path, decorator);
                                    }
                                }
                            }
                            return builder;
                        }
                    });
                } else if (ctx.plugins) {
                    ctx.plugins.register(plugin);
                }
            }
        }
    };

    container.registerInstance(RequestContextInitializer, initializer);
}
