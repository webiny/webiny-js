import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type {
    IGraphQLSchemaFactory,
    GraphQLSchemaFactory as GQLSchemaFactory
} from "@webiny/api-graphql/graphql/abstractions.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";

// Only registered when advancedPublishingWorkflow is licensed (WebsiteBuilderWorkflowsFeature gates
// on the flag at register time), so no per-request license guard is needed here.
class WebsiteBuilderPageSchemaFactoryImpl implements IGraphQLSchemaFactory {
    async execute(
        builder: GQLSchemaFactory.SchemaBuilder
    ): Promise<GQLSchemaFactory.SchemaBuilder> {
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
    dependencies: []
});
