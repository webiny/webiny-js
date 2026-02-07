import type { CmsContext } from "~/types/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { ContextPlugin } from "@webiny/api";
import { createGetEntryResolver } from "./getEntryResolver.js";
import { createListEntriesResolver } from "./listEntriesResolver.js";
import { createCreateEntryResolver, createUpdateEntryResolver } from "./mutationResolvers.js";
import {
    createDeleteEntryResolver,
    createPublishEntryResolver,
    createUnpublishEntryResolver
} from "./lifecycleResolvers.js";

export const createCmsSdkSchema = () => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        const cmsSdkPlugin = createCmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type CmsSdkEntry {
                    id: ID!
                    entryId: String!
                }

                type CmsSdkEntryResponse {
                    data: CmsSdkEntry
                    error: CmsError
                }

                type CmsSdkListMeta {
                    cursor: String
                    hasMoreItems: Boolean
                    totalCount: Int
                }

                type CmsSdkListResponse {
                    data: [CmsSdkEntry!]
                    meta: CmsSdkListMeta
                    error: CmsError
                }

                type CmsSdkDeleteResponse {
                    data: Boolean
                    error: CmsError
                }

                type CmsSdkQuery {
                    getEntry(modelId: String!, where: JSON!, fields: [String!]): CmsSdkEntryResponse!
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
            `,
            resolvers: {
                Query: {
                    cms: () => ({})
                },
                Mutation: {
                    cms: () => ({})
                },
                CmsSdkQuery: {
                    getEntry: createGetEntryResolver(),
                    listEntries: createListEntriesResolver()
                },
                CmsSdkMutation: {
                    createEntry: createCreateEntryResolver(),
                    updateEntry: createUpdateEntryResolver(),
                    deleteEntry: createDeleteEntryResolver(),
                    publishEntry: createPublishEntryResolver(),
                    unpublishEntry: createUnpublishEntryResolver()
                }
            }
        });

        cmsSdkPlugin.name = "headless-cms.graphql.schema.sdk";

        context.plugins.register(cmsSdkPlugin);
    });

    plugin.name = "headless-cms.graphql.createCmsSdkSchema";

    return plugin;
};
