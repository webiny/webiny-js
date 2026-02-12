import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class CmsMutationTypeDefs implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type CmsMutation {
                createEntry(modelId: ID!, data: JSON!, fields: [String!]!): CmsEntryResponse!
                updateEntryRevision(modelId: ID!, revisionId: ID!, data: JSON!, fields: [String!]!): CmsEntryResponse!
                deleteEntryRevision(modelId: ID!, revisionId: ID!, permanent: Boolean): CmsDeleteResponse!
                publishEntryRevision(modelId: ID!, revisionId: ID!, fields: [String!]!): CmsEntryResponse!
                unpublishEntryRevision(modelId: ID!, revisionId: ID!, fields: [String!]!): CmsEntryResponse!
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
