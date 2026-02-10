import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class CmsMutationTypeDefs implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type CmsMutation {
                createEntry(modelId: ID!, values: JSON!, fields: [String!]): CmsEntryResponse!
                updateEntry(modelId: ID!, id: ID!, values: JSON!, fields: [String!]): CmsEntryResponse!
                deleteEntry(modelId: ID!, id: ID!, permanent: Boolean): CmsDeleteResponse!
                publishEntry(modelId: ID!, id: ID!, fields: [String!]): CmsEntryResponse!
                unpublishEntry(modelId: ID!, id: ID!, fields: [String!]): CmsEntryResponse!
            }

            extend type Mutation {
                cms: CmsMutation!
            }
        `);

        return builder;
    }
}

export const CmsMutationTypeDefsImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: CmsMutationTypeDefs,
    dependencies: []
});
