import { Response } from "@webiny/handler-graphql";
import { CmsContentEntry, CmsContext } from "~/types";
import { getEntryTitle } from "../utils/getEntryTitle";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

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

                    // Group entries by modelId
                    const entriesByModel = args.entries.reduce((acc, ref) => {
                        // Check if requested modelId is in the list of models this user is allowed to access.
                        if (!models.some(m => m.modelId === ref.modelId)) {
                            return acc;
                        }

                        if (!acc[ref.modelId]) {
                            acc[ref.modelId] = [];
                        }
                        acc[ref.modelId].push(ref.entryId);
                        return acc;
                    }, {});

                    const getters = Object.keys(entriesByModel).map(async modelId => {
                        const model = models.find(m => m.modelId === modelId);

                        const entries = await context.cms.entries.getByIds(
                            model,
                            entriesByModel[modelId]
                        );

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
                        await Promise.all(getters).then(results => {
                            return results.reduce((result, item) => result.concat(item), []);
                        })
                    );
                }
            }
        }
    });
};

export default plugin;
