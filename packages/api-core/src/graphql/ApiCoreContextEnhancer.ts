import { Container } from "@webiny/di";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { LegacyContext as SecurityLegacyContext } from "~/legacy/security/LegacyContext.js";
import { LegacyContext as TenancyLegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { LegacyWcpContext } from "~/legacy/wcp/LegacyWcpContext.js";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";

class ApiCoreContextEnhancerImpl implements IGraphQLContextEnhancer {
    constructor(private container: Container) {}

    enhance(ctx: Record<string, any>): void {
        ctx.security = new SecurityLegacyContext(this.container);
        ctx.tenancy = new TenancyLegacyContext(this.container);
        ctx.wcp = new LegacyWcpContext(this.container);
    }
}

export const ApiCoreContextEnhancer = GraphQLContextEnhancer.createImplementation({
    implementation: ApiCoreContextEnhancerImpl,
    dependencies: [RequestContainer]
});
