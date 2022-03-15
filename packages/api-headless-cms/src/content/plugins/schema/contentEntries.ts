import { Response } from "@webiny/handler-graphql";
import { CmsEntry, CmsContext, CmsModel, CmsEntryListWhere } from "~/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { getEntryTitle } from "~/content/plugins/utils/getEntryTitle";

interface EntriesByModel {
    [key: string]: string[];
}
const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    if (!context.cms.MANAGE) {
        return new GraphQLSchemaPlugin({
            typeDefs: "",
            resolvers: {}
        });
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
                id: ID!
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
                async searchContentEntries(_, args: any, context) {
                    const { modelIds, query, limit = 10 } = args;
                    const models = await context.cms.listModels();

                    const getters = models
                        .filter(model => modelIds.includes(model.modelId))
                        .map(async model => {
                            const latest = query === "__latest__";
                            const modelManager = await context.cms.getModelManager(model.modelId);
                            const where: CmsEntryListWhere = {
                                tenant: model.tenant
                            };
                            if (!latest) {
                                where[`${model.titleFieldId}_contains`] = query;
                            }
                            const [items] = await modelManager.listLatest({
                                limit,
                                where
                            });

                            return items.map((entry: CmsEntry) => ({
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
                async getContentEntry(_, args: any, context) {
                    const { modelId, id } = args.entry;
                    const models = await context.cms.listModels();
                    const model = models.find(m => m.modelId === modelId);

                    if (!model) {
                        return new NotAuthorizedResponse({ data: { modelId } });
                    }

                    const result = await context.cms.getEntriesByIds(model, [id]);

                    const [entry] = result;

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
                async getContentEntries(_, args: any, context) {
                    const models = await context.cms.listModels();

                    const modelsMap = models.reduce((collection, model) => {
                        collection[model.modelId] = model;
                        return collection;
                    }, {} as Record<string, CmsModel>);

                    const argsEntries = args.entries as Pick<CmsEntry, "id" | "modelId">[];

                    const entriesByModel = argsEntries.reduce((collection, ref) => {
                        if (!collection[ref.modelId]) {
                            collection[ref.modelId] = [];
                        } else if (collection[ref.modelId].includes(ref.id)) {
                            return collection;
                        }
                        collection[ref.modelId].push(ref.id);
                        return collection;
                    }, {} as EntriesByModel);

                    const getters: Promise<CmsEntry[]>[] = Object.keys(entriesByModel).map(
                        async modelId => {
                            return context.cms.getEntriesByIds(
                                modelsMap[modelId],
                                entriesByModel[modelId]
                            );
                        }
                    );

                    if (getters.length === 0) {
                        return new Response([]);
                    }

                    const results = await Promise.all(getters);

                    const entries = results.reduce((collection, items) => {
                        return collection.concat(
                            items.map(item => {
                                const model = modelsMap[item.modelId];

                                return {
                                    id: item.id,
                                    model: {
                                        modelId: model.modelId,
                                        name: model.name
                                    },
                                    status: item.status,
                                    title: getEntryTitle(model, item)
                                };
                            })
                        );
                    }, [] as any[]);

                    return new Response(entries);
                }
            }
        }
    });
};

export default plugin;
