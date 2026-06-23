import { Container } from "@webiny/di";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { LegacyContext as SecurityLegacyContext } from "~/legacy/security/LegacyContext.js";
import { LegacyContext as TenancyLegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { LegacyWcpContext } from "~/legacy/wcp/LegacyWcpContext.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { loadWcpLicense } from "~/legacy/wcp/context.js";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";

export class ApiCoreContextEnhancerImpl implements IGraphQLContextEnhancer {
    constructor(private container: Container) {}

    async enhance(ctx: Record<string, any>): Promise<void> {
        // Load (or refresh from cache) the WCP license and re-register WcpFeature in the
        // child (request) container so the real license is available to all other enhancers.
        const license = await loadWcpLicense();
        WcpFeature.register(this.container, license);

        ctx.security = new SecurityLegacyContext(this.container);
        ctx.tenancy = new TenancyLegacyContext(this.container);
        ctx.wcp = new LegacyWcpContext(this.container);
    }
}

export const ApiCoreContextEnhancer = GraphQLContextEnhancer.createImplementation({
    implementation: ApiCoreContextEnhancerImpl,
    dependencies: [RequestContainer]
});
