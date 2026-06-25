import type { Container } from "@webiny/di";
import { PluginsContainer } from "@webiny/plugins";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "./engine/index.js";
import type { IGraphQLContextualSchema } from "./engine/index.js";
import type { GraphQLSchema } from "graphql";

/**
 * Runs legacy ContextPlugins (those with an `apply(ctx)` method) inside the
 * contextual-schema phase so that DI services (TenantContext, IdentityContext, etc.)
 * are fully initialised when they execute.
 *
 * Registration order matters: call this BEFORE any contextual schema that depends
 * on what these plugins set (e.g. ctx.db).
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
