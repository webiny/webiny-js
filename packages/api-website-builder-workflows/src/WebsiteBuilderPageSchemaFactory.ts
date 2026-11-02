import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";

/**
 * `WbPage.system.workflow` on `/graphql` (R102): the stored `system.workflow` of a page revision
 * (spec 4.5). Website Builder's resolvers return the page with its `system`, so no resolver is
 * needed. Only registered with the advancedPublishingWorkflow license (WebsiteBuilderWorkflowsFeature
 * gates on the flag at register time), so no per-request license guard is needed here.
 */
class WebsiteBuilderPageSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey(
        "api-website-builder-workflows/WebsiteBuilderPageSchemaFactoryImpl"
    );

    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type WbPageSystemWorkflow {
                workflowId: String
                reviewState: String
                stepId: String
                stepName: String
                stepState: String
            }

            extend type WbPageSystem {
                workflow: WbPageSystemWorkflow
            }
        `);

        return builder;
    }
}

export const WebsiteBuilderPageSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WebsiteBuilderPageSchemaFactoryImpl,
    dependencies: []
});
