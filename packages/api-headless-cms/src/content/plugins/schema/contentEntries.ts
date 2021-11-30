import { Response } from "@webiny/handler-graphql";
import { CmsEntry, CmsContext, CmsModel } from "~/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { getEntryTitle } from "~/content/plugins/utils/getEntryTitle";

interface EntriesByModel {
    [key: string]: string[];
}

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
                async searchContentEntries(_, args, context) {
                    const { modelIds, query, limit = 10 } = args;
                    const models = await context.cms.listModels();

                    const getters = models
                        .filter(model => modelIds.includes(model.modelId))
                        .map(async model => {
                            const latest = query === "__latest__";
                            const modelManager = await context.cms.getModelManager(model.modelId);
                            const [items] = await modelManager.listLatest({
                                limit,
                                where: latest
                                    ? undefined
                                    : { [`${model.titleFieldId}_contains`]: query }
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
                async getContentEntry(_, args, context) {
                    const { modelId, id } = args.entry;
                    const models = await context.cms.listModels();
                    const model = models.find(m => m.modelId === modelId);

                    if (!model) {
                        return new NotAuthorizedResponse({ data: { modelId } });
                    }

                    const [entry] = await context.cms.getEntriesByIds(model, [id]);

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
                    const models = await context.cms.listModels();

                    const modelsMap: Record<string, CmsModel> = models.reduce(
                        (collection, model) => {
                            collection[model.modelId] = model;
                            return collection;
                        },
                        {}
                    );

                    const entriesByModel: EntriesByModel = args.entries.reduce(
                        (collection, ref) => {
                            if (!collection[ref.modelId]) {
                                collection[ref.modelId] = [];
                            } else if (collection[ref.modelId].includes(ref.id) === true) {
                                return collection;
                            }
                            collection[ref.modelId].push(ref.id);
                            return collection;
                        },
                        {} as EntriesByModel
                    );

                    const getters: Promise<CmsEntry[]>[] = [];

                    for (const modelId in entriesByModel) {
                        if (entriesByModel.hasOwnProperty(modelId) === false) {
                            continue;
                        }
                        const references = entriesByModel[modelId];
                        if (Array.isArray(references) === false || references.length === 0) {
                            continue;
                        }
                        const model = modelsMap[modelId];
                        if (!model) {
                            continue;
                        }

                        const p = context.cms.getEntriesByIds(model, references);

                        getters.push(p);
                    }

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
