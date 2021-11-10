import { Response } from "@webiny/handler-graphql";
import { CmsContentEntry, CmsContext } from "~/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { getEntryTitle } from "~/content/plugins/utils/getEntryTitle";

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    if (!context.cms.MANAGE) {
        return null;
    }

    return new GraphQLSchemaPlugin<CmsContext>({
        typeDefs: /* GraphQL */ `
            type CmsModelMeta {
                modelId: String
                name: String
            }

            type CmsContentEntry {
                id: ID
                model: CmsModelMeta
                status: String
                title: String
            }

            type CmsContentEntriesResponse {
                data: [CmsContentEntry]
                error: CmsError
            }

            type CmsContentEntryResponse {
                data: CmsContentEntry
                error: CmsError
            }

            input CmsModelEntryInput {
                modelId: ID!
                entryId: ID!
            }

            extend type Query {
                # Search content entries for given content models using the query string.
                searchContentEntries(
                    modelIds: [ID!]!
                    query: String!
                    limit: Int
                ): CmsContentEntriesResponse

                # Get content entry meta data
                getContentEntry(entry: CmsModelEntryInput!): CmsContentEntryResponse

                # Get content entries meta data
                getContentEntries(entries: [CmsModelEntryInput!]!): CmsContentEntriesResponse
            }
        `,
        resolvers: {
            Query: {
                async searchContentEntries(_, args, context) {
                    const { modelIds, query, limit = 10 } = args;
                    const models = await context.cms.models.list();

                    const getters = models
                        .filter(model => modelIds.includes(model.modelId))
                        .map(async model => {
                            const latest = query === "__latest__";
                            const modelManager = await context.cms.getModel(model.modelId);
                            const [items] = await modelManager.listLatest({
                                limit,
                                where: latest
                                    ? undefined
                                    : { [`${model.titleFieldId}_contains`]: query }
                            });

                            return items.map((entry: CmsContentEntry) => ({
                                id: entry.id,
                                model: {
                                    modelId: model.modelId,
                                    name: model.name
                                },
                                status: entry.status,
                                title: getEntryTitle(model, entry),
                                // We need `savedOn` to sort entries from latest to oldest
                                savedOn: entry.savedOn
                            }));
                        });

                    const entries = await Promise.all(getters).then(results =>
                        results.reduce((result, item) => result.concat(item), [])
                    );

                    return new Response(
                        entries
                            .sort((a, b) => Date.parse(b.savedOn) - Date.parse(a.savedOn))
                            .slice(0, limit)
                    );
                },
                async getContentEntry(_, args, context) {
                    const { modelId, entryId } = args.entry;
                    const models = await context.cms.models.list();
                    const model = models.find(m => m.modelId === modelId);

                    if (!model) {
                        return new NotAuthorizedResponse({ data: { modelId } });
                    }

                    const [entry] = await context.cms.entries.getByIds(model, [entryId]);

                    return new Response({
                        id: entry.id,
                        model: {
                            modelId: model.modelId,
                            name: model.name
                        },
                        status: entry.status,
                        title: getEntryTitle(model, entry)
                    });
                },
                async getContentEntries(_, args, context) {
                    const models = await context.cms.models.list();
                    const entriesByModel = args.entries.map((ref, index) => {
                        return {
                            entryId: ref.entryId,
                            modelId: ref.modelId,
                            index
                        };
                    });

                    const getters = entriesByModel.map(async ({ modelId, entryId }) => {
                        // Get model manager, to get access to CRUD methods
                        const model = models.find(m => m.modelId === modelId);
                        const entries = await context.cms.entries.getByIds(model, [entryId]);
                        return entries.map(entry => ({
                            id: entry.id,
                            model: {
                                modelId: model.modelId,
                                name: model.name
                            },
                            status: entry.status,
                            title: getEntryTitle(model, entry)
                        }));
                    });
                    return new Response(
                        await Promise.all(getters).then((results: any[]) => {
                            return results.reduce((result, item) => result.concat(item), []);
                        })
                    );
                }
            }
        }
    });
};

export default plugin;
