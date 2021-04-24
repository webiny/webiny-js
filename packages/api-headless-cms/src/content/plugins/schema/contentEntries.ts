import { Response } from "@webiny/handler-graphql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { CmsContentEntry, CmsContext } from "../../../types";
import { getEntryTitle } from "../utils/getEntryTitle";

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    if (!context.cms.MANAGE) {
        return null;
    }

    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type CmsContentEntry {
                    id: ID
                    modelId: ID
                    status: String
                    title: String
                }

                type CmsSearchContentEntriesResponse {
                    data: [CmsContentEntry]
                    error: CmsError
                }

                type CmsGetContentEntryResponse {
                    data: CmsContentEntry
                    error: CmsError
                }

                extend type Query {
                    # Search content entries for given content models using the query string.
                    searchContentEntries(
                        modelIds: [ID!]!
                        query: String!
                    ): CmsSearchContentEntriesResponse

                    # Get content entry meta data for given content model and content entry.
                    getContentEntry(modelId: ID!, entryId: ID!): CmsGetContentEntryResponse
                }
            `,
            resolvers: {
                Query: {
                    async searchContentEntries(_, args, context) {
                        const { modelIds, query } = args;
                        const models = await context.cms.models.list();

                        const getters = models
                            .filter(model => modelIds.includes(model.modelId))
                            .map(async model => {
                                const modelManager = await context.cms.getModel(model.modelId);
                                const [items] = await modelManager.listLatest({
                                    where: { [`${model.titleFieldId}_contains`]: query }
                                });

                                return items.map((entry: CmsContentEntry) => ({
                                    id: entry.id,
                                    modelId: entry.modelId,
                                    status: entry.status,
                                    title: getEntryTitle(model, entry)
                                }));
                            });

                        const entries = await Promise.all(getters).then(results =>
                            results.reduce((result, item) => result.concat(item), [])
                        );

                        return new Response(entries);
                    },
                    async getContentEntry(_, args, context) {
                        const { modelId, entryId } = args;
                        const models = await context.cms.models.list();
                        const model = models.find(m => m.modelId === modelId);

                        const [entry] = await context.cms.entries.getByIds(model, [entryId]);

                        return new Response({
                            id: entry.id,
                            modelId: entry.modelId,
                            status: entry.status,
                            title: getEntryTitle(model, entry)
                        });
                    }
                }
            }
        }
    };
};

export default plugin;
