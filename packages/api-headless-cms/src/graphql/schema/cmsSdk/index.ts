import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createGetEntryResolver } from "./getEntryResolver.js";
import { createListEntriesResolver } from "./listEntriesResolver.js";
import { createCreateEntryResolver } from "./createEntryResolver.js";
import { createUpdateEntryResolver } from "./updateEntryResolver.js";
import { createDeleteEntryResolver } from "./deleteEntryResolver.js";
import { createPublishEntryResolver } from "./publishEntryResolver.js";
import { createUnpublishEntryResolver } from "./unpublishEntryResolver.js";

class CmsSdkSchema implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type CmsSdkEntryResponse {
                data: JSON
                error: CmsError
            }

            type CmsSdkListMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            type CmsSdkListResponse {
                data: [JSON!]
                meta: CmsSdkListMeta
                error: CmsError
            }

            type CmsSdkDeleteResponse {
                data: Boolean
                error: CmsError
            }

            type CmsSdkQuery {
                getEntry(modelId: String!, where: JSON!, fields: [String!], preview: Boolean): CmsSdkEntryResponse!
                listEntries(
                    modelId: String!
                    where: JSON
                    sort: JSON
                    limit: Int
                    after: String
                    include: [String!]
                    exclude: [String!]
                    excludeType: [String!]
                    fields: [String!]
                    preview: Boolean
                ): CmsSdkListResponse!
            }

            type CmsSdkMutation {
                createEntry(modelId: String!, values: JSON!): CmsSdkEntryResponse!
                updateEntry(modelId: String!, id: ID!, values: JSON!): CmsSdkEntryResponse!
                deleteEntry(modelId: String!, id: ID!, permanent: Boolean): CmsSdkDeleteResponse!
                publishEntry(modelId: String!, id: ID!): CmsSdkEntryResponse!
                unpublishEntry(modelId: String!, id: ID!): CmsSdkEntryResponse!
            }

            extend type Query {
                cms: CmsSdkQuery!
            }

            extend type Mutation {
                cms: CmsSdkMutation!
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
            path: "CmsSdkQuery.getEntry",
            resolver() {
                return createGetEntryResolver();
            }
        });

        builder.addResolver({
            path: "CmsSdkQuery.listEntries",
            resolver() {
                return createListEntriesResolver();
            }
        });

        builder.addResolver({
            path: "CmsSdkMutation.createEntry",
            resolver() {
                return createCreateEntryResolver();
            }
        });

        builder.addResolver({
            path: "CmsSdkMutation.updateEntry",
            resolver() {
                return createUpdateEntryResolver();
            }
        });

        builder.addResolver({
            path: "CmsSdkMutation.deleteEntry",
            resolver() {
                return createDeleteEntryResolver();
            }
        });

        builder.addResolver({
            path: "CmsSdkMutation.publishEntry",
            resolver() {
                return createPublishEntryResolver();
            }
        });

        builder.addResolver({
            path: "CmsSdkMutation.unpublishEntry",
            resolver() {
                return createUnpublishEntryResolver();
            }
        });

        return builder;
    }
}

export const createCmsSdkSchema = () => {
    return CoreGraphQLSchemaFactory.createImplementation({
        implementation: CmsSdkSchema,
        dependencies: []
    });
};
