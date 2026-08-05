import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type {
    IGraphQLSchemaFactory,
    GraphQLSchemaFactory as GQLSchemaFactory
} from "@webiny/api-graphql/graphql/abstractions.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";

class WebsiteBuilderPageSchemaFactoryImpl implements IGraphQLSchemaFactory {
    constructor(private featureFlags: FeatureFlags.Interface) {}

    async execute(
        builder: GQLSchemaFactory.SchemaBuilder
    ): Promise<GQLSchemaFactory.SchemaBuilder> {
        if (!this.featureFlags.get().isWorkflowsEnabled()) {
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
    dependencies: [FeatureFlags]
});
