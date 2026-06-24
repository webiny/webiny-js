import { type Container, createFeature } from "@webiny/feature/api";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import type { GraphQLSchema } from "graphql";
import { createHcmsTasks } from "./index.js";

// GraphQLContextualSchema is used here not to contribute schema content but for its
// build(ctx) timing guarantee: it runs after all IGraphQLContextEnhancer.enhance() calls,
// so ctx.cms is already set when ContextPlugins from createHcmsTasks() call ctx.cms.listModels().
class HcmsTasksInitializerImpl implements IGraphQLContextualSchema {
    private readonly plugins = createHcmsTasks().flat(Infinity as 1);
    private initialized = false;

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        if (!this.initialized) {
            this.initialized = true;

            for (const plugin of this.plugins) {
                if (plugin && typeof (plugin as any).apply === "function") {
                    await (plugin as any).apply(ctx);
                } else if (ctx.plugins) {
                    ctx.plugins.register(plugin);
                }
            }
        }

        return makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });
    }
}

const HcmsTasksInitializer = GraphQLContextualSchema.createImplementation({
    implementation: HcmsTasksInitializerImpl,
    dependencies: []
});

export const HcmsTasksFeature = createFeature({
    name: "HcmsTasks",
    register(container: Container) {
        container.register(HcmsTasksInitializer);
    }
});
