import { Container } from "@webiny/di";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { GraphQLSchema } from "graphql";
import { LegacyContext as SecurityLegacyContext } from "~/legacy/security/LegacyContext.js";
import { LegacyContext as TenancyLegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { LegacyWcpContext } from "~/legacy/wcp/LegacyWcpContext.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { loadWcpLicense } from "~/legacy/wcp/context.js";
import type { IGraphQLContextEnhancer, IGraphQLContextualSchema } from "@webiny/handler-graphql";

export class ApiCoreInitializerImpl implements IGraphQLContextEnhancer, IGraphQLContextualSchema {
    private initialized = false;

    constructor(private container: Container) {}

    // Runs during the enhancer phase so that ctx.security / ctx.tenancy / ctx.wcp are
    // available to all legacy ContextPlugins that run in the same buildContext() pass.
    async enhance(ctx: Record<string, any>): Promise<void> {
        await this._maybeInitialize(ctx);
    }

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        await this._maybeInitialize(ctx);
        return makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });
    }

    private async _maybeInitialize(ctx: Record<string, any>): Promise<void> {
        if (!this.initialized) {
            this.initialized = true;
            // Load (or refresh from cache) the WCP license and re-register WcpFeature in the
            // request container so the real license is available to all features.
            const license = await loadWcpLicense();
            WcpFeature.register(this.container, license);

            ctx.security = new SecurityLegacyContext(this.container);
            ctx.tenancy = new TenancyLegacyContext(this.container);
            ctx.wcp = new LegacyWcpContext(this.container);
        }
    }
}

export const ApiCoreContextEnhancer = GraphQLContextEnhancer.createImplementation({
    implementation: ApiCoreInitializerImpl,
    dependencies: [RequestContainer]
});

export const ApiCoreContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: ApiCoreInitializerImpl,
    dependencies: [RequestContainer]
});
