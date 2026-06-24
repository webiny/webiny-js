import { Container } from "@webiny/di";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { GraphQLSchema } from "graphql";
import { LegacyContext as SecurityLegacyContext } from "~/legacy/security/LegacyContext.js";
import { LegacyContext as TenancyLegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { LegacyWcpContext } from "~/legacy/wcp/LegacyWcpContext.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { loadWcpLicense } from "~/legacy/wcp/context.js";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";

export class ApiCoreInitializerImpl implements IGraphQLContextualSchema {
    private initialized = false;

    constructor(private container: Container) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        if (!this.initialized) {
            this.initialized = true;
            const license = await loadWcpLicense();
            WcpFeature.register(this.container, license);

            ctx.security = new SecurityLegacyContext(this.container);
            ctx.tenancy = new TenancyLegacyContext(this.container);
            ctx.wcp = new LegacyWcpContext(this.container);
        }
        return makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });
    }
}

export const ApiCoreContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: ApiCoreInitializerImpl,
    dependencies: [RequestContainer]
});
