import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type {
    IGraphQLSchemaFactory,
    GraphQLSchemaFactory as GQLSchemaFactory
} from "@webiny/api-graphql/graphql/abstractions.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";

class WebsiteBuilderPageSchemaFactoryImpl implements IGraphQLSchemaFactory {
    constructor(private wcpContext: WcpContext.Interface) {}

    async execute(
        builder: GQLSchemaFactory.SchemaBuilder
    ): Promise<GQLSchemaFactory.SchemaBuilder> {
        // WCP-gated, per-tenant: `system` is only exposed on WbPage when the workflows license
        // allows it. The base /graphql schema is rebuilt per request (post-auth), so the gate is
        // evaluated per tenant. (Previously this was a GraphQLSchemaPlugin with `isApplicable`,
        // routed into the no-longer-read ctx.plugins bag, so it never actually reached the schema.)
        if (!this.wcpContext.canUseWorkflows()) {
            return builder;
        }

        builder.addTypeDefs(/* GraphQL */ `
            extend type WbPage {
                system: CmsEntrySystem
            }
        `);
        builder.addLegacyResolvers({
            WbPage: {
                system: (page: WbPage) => page.system
            }
        });

        return builder;
    }
}

export const WebsiteBuilderPageSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WebsiteBuilderPageSchemaFactoryImpl,
    dependencies: [WcpContext]
});
