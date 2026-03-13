import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class CmsQueryTypeDefs implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type CmsQuery {
                getEntry(
                    modelId: ID!
                    where: JSON!
                    fields: [String!]!
                    preview: Boolean
                ): CmsEntryResponse!
                listEntries(
                    modelId: ID!
                    where: JSON
                    sort: JSON
                    limit: Int
                    after: String
                    search: String
                    fields: [String!]!
                    preview: Boolean
                ): CmsListResponse!
            }

            extend type Query {
                cms: CmsQuery!
            }
        `);

        return builder;
    }
}

export const CmsQueryTypeDefsImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: CmsQueryTypeDefs,
    dependencies: []
});
