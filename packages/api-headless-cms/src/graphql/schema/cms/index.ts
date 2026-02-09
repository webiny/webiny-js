import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { ContextPlugin } from "@webiny/api";
import { createGetEntryResolver } from "./getEntryResolver.js";
import { createListEntriesResolver } from "./listEntriesResolver.js";
import { createCreateEntryResolver } from "./createEntryResolver.js";
import { createUpdateEntryResolver } from "./updateEntryResolver.js";
import { createDeleteEntryResolver } from "./deleteEntryResolver.js";
import { createPublishEntryResolver } from "./publishEntryResolver.js";
import { createUnpublishEntryResolver } from "./unpublishEntryResolver.js";

class CmsSchema implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type CmsEntryResponse {
                data: JSON
                error: CmsError
            }

            type CmsListMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            type CmsListResponse {
                data: [JSON!]
                meta: CmsListMeta
                error: CmsError
            }

            type CmsDeleteResponse {
                data: Boolean
                error: CmsError
            }

            type CmsQuery {
                getEntry(
                    modelId: ID!
                    where: JSON!
                    fields: [String!]
                    preview: Boolean
                ): CmsEntryResponse!
                listEntries(
                    modelId: ID!
                    where: JSON
                    sort: JSON
                    limit: Int
                    after: String
                    include: [String!]
                    exclude: [String!]
                    excludeType: [String!]
                    fields: [String!]
                    preview: Boolean
                ): CmsListResponse!
            }

            type CmsMutation {
                createEntry(modelId: ID!, values: JSON!): CmsEntryResponse!
                updateEntry(modelId: ID!, id: ID!, values: JSON!): CmsEntryResponse!
                deleteEntry(modelId: ID!, id: ID!, permanent: Boolean): CmsDeleteResponse!
                publishEntry(modelId: ID!, id: ID!): CmsEntryResponse!
                unpublishEntry(modelId: ID!, id: ID!): CmsEntryResponse!
            }

            extend type Query {
                cms: CmsQuery!
            }

            extend type Mutation {
                cms: CmsMutation!
            }
        `);

        builder.addResolver({
            path: "Query.cms",
            resolver() {
                return () => ({});
            }
        });

        builder.addResolver({
            path: "Mutation.cms",
            resolver() {
                return () => ({});
            }
        });

        builder.addResolver({
            path: "CmsQuery.getEntry",
            resolver: createGetEntryResolver
        });

        builder.addResolver({
            path: "CmsQuery.listEntries",
            resolver: createListEntriesResolver
        });

        builder.addResolver({
            path: "CmsMutation.createEntry",
            resolver: createCreateEntryResolver
        });

        builder.addResolver({
            path: "CmsMutation.updateEntry",
            resolver: createUpdateEntryResolver
        });

        builder.addResolver({
            path: "CmsMutation.deleteEntry",
            resolver: createDeleteEntryResolver
        });

        builder.addResolver({
            path: "CmsMutation.publishEntry",
            resolver: createPublishEntryResolver
        });

        builder.addResolver({
            path: "CmsMutation.unpublishEntry",
            resolver: createUnpublishEntryResolver
        });

        return builder;
    }
}

const CmsSchemaImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: CmsSchema,
    dependencies: []
});

export const createCmsSchema = () => {
    const plugin = new ContextPlugin(async context => {
        context.container.register(CmsSchemaImpl);
    });

    plugin.name = "headless-cms.graphql.createCmsSchema";

    return plugin;
};
