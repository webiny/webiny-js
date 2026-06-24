import type { Container } from "@webiny/di";
import { PluginsContainer } from "@webiny/plugins";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "./engine/index.js";
import type { IGraphQLContextualSchema } from "./engine/index.js";
import type { GraphQLSchema } from "graphql";

/**
 * Contextual-schema variant of registerLegacyPluginsViaGqlContextEnhancer.
 *
 * Use this instead of the enhancer variant when the plugins include ContextPlugins
 * that need ctx.tenancy / ctx.security (set by ApiCoreFeature) to be available.
 * Because contextual schemas run sequentially after all enhancers, and after
 * ApiCoreFeature sets ctx.security / ctx.tenancy, these plugins will have a
 * fully initialised context when they run.
 *
 * Registration order matters: call this AFTER ApiCoreFeature.register() but
 * BEFORE any contextual schema that depends on what these plugins set (e.g. ctx.db).
 */
export function registerLegacyPluginsViaGqlContextualSchema(
    container: Container,
    plugins: any | any[]
): void {
    const flat = [plugins].flat(Infinity as 1).filter(Boolean);
    let initialized = false;

    const schema: IGraphQLContextualSchema = {
        async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
            if (initialized) {
                return makeExecutableSchema({
                    typeDefs: "type Query\ntype Mutation",
                    assumeValidSDL: true
                });
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

            return makeExecutableSchema({
                typeDefs: "type Query\ntype Mutation",
                assumeValidSDL: true
            });
        }
    };

    container.registerInstance(GraphQLContextualSchema, schema);
}
