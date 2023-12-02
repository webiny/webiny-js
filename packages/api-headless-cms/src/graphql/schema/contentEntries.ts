import WebinyError from "@webiny/error";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContext, CmsEntry, CmsEntryListWhere, CmsIdentity, CmsModel } from "~/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { getEntryTitle } from "~/utils/getEntryTitle";
import { CmsGraphQLSchemaPlugin } from "~/plugins";
import { getEntryDescription } from "~/utils/getEntryDescription";
import { getEntryImage } from "~/utils/getEntryImage";
import { entryFieldFromStorageTransform } from "~/utils/entryStorage";
import { Resolvers } from "@webiny/handler-graphql/types";
import { ENTRY_META_FIELDS } from "~/constants";

interface EntriesByModel {
    [key: string]: string[];
}

type GetContentEntryType = "latest" | "published" | "exact";

const createDate = (date: string | null): Date | null => {
    if (!date) {
        return null;
    }

    try {
        return new Date(date);
    } catch {
        return new Date();
    }
};

interface CmsEntryRecord {
    id: string;
    entryId: string;
    model: {
        modelId: string;
        name: string;
    };
    status: string;
    title: string;
    description?: string | null;
    image?: string | null;

    /**
     * 🚫 Deprecated meta fields below.
     * Will be fully removed in one of the next releases.
     */
    createdBy: CmsIdentity;
    modifiedBy?: CmsIdentity | null;

    /**
     * We can use the number since it is an internal field.
     * Created via Date.parse() method.
     */
    createdOn: Date;
    savedOn: Date;

    /**
     * 🆕 New meta fields below.
     * Users are encouraged to use these instead of the deprecated ones above.
     */

    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn?: Date | string;
    revisionSavedOn?: Date | string;
    revisionModifiedOn?: Date | string | null;
    revisionCreatedBy?: CmsIdentity;
    revisionModifiedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity;

    /**
     * Entry-level meta fields. 👇
     */
    entryCreatedOn?: Date | string;
    entrySavedOn?: Date | string;
    entryModifiedOn?: Date | string | null;
    entryCreatedBy?: CmsIdentity;
    entryModifiedBy?: CmsIdentity | null;
    entrySavedBy?: CmsIdentity;

    wbyAco_location?: {
        folderId?: string | null;
    };
}

const createCmsEntryRecord = (model: CmsModel, entry: CmsEntry): CmsEntryRecord => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        model: {
            modelId: model.modelId,
            name: model.name
        },
        status: entry.status,
        title: getEntryTitle(model, entry),
        description: getEntryDescription(model, entry),
        image: getEntryImage(model, entry),

        /**
         * 🚫 Deprecated meta fields below.
         * Will be fully removed in one of the next releases.
         */
        createdBy: entry.createdBy,
        modifiedBy: entry.modifiedBy,
        createdOn: createDate(entry.createdOn)!,
        savedOn: createDate(entry.savedOn)!,

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: createDate(entry.revisionCreatedOn)!,
        revisionSavedOn: createDate(entry.revisionSavedOn)!,
        revisionModifiedOn: createDate(entry.revisionModifiedOn),
        revisionCreatedBy: entry.revisionCreatedBy,
        revisionModifiedBy: entry.revisionModifiedBy,
        revisionSavedBy: entry.revisionSavedBy,

        /**
         * Entry-level meta fields. 👇
         */
        entryCreatedOn: createDate(entry.revisionCreatedOn)!,
        entrySavedOn: createDate(entry.revisionSavedOn)!,
        entryModifiedOn: createDate(entry.revisionModifiedOn),
        entryCreatedBy: entry.entryCreatedBy,
        entryModifiedBy: entry.entryModifiedBy,
        entrySavedBy: entry.entrySavedBy,

        wbyAco_location: {
            folderId: entry.location?.folderId || null
        }
    };
};

interface FetchMethod {
    (model: CmsModel, ids: string[]): Promise<CmsEntry[]>;
}

const getFetchMethod = (type: GetContentEntryType, context: CmsContext): FetchMethod => {
    if (!getContentEntriesMethods[type]) {
        throw new WebinyError(
            `Unknown getContentEntries method "${type}". Could not fetch content entries.`,
            "UNKNOWN_METHOD_ERROR",
            {
                type
            }
        );
    }
    const methodName = getContentEntriesMethods[type] as GetContentEntryMethods;
    if (!context.cms[methodName]) {
        throw new WebinyError(
            `Unknown context.cms method "${methodName}". Could not fetch content entries.`,
            "UNKNOWN_METHOD_ERROR",
            {
                type,
                methodName
            }
        );
    }

    return context.cms[methodName];
};

/**
 * Function to get the list of content entries depending on latest, published or exact GraphQL queries.
 */
interface GetContentEntriesParams {
    args: {
        entries: Pick<CmsEntry, "id" | "modelId">[];
    };
    context: CmsContext;
    type: GetContentEntryType;
}

enum GetContentEntryMethods {
    getLatestEntriesByIds = "getLatestEntriesByIds",
    getPublishedEntriesByIds = "getPublishedEntriesByIds",
    getEntriesByIds = "getEntriesByIds"
}

const getContentEntriesMethods = {
    latest: "getLatestEntriesByIds",
    published: "getPublishedEntriesByIds",
    exact: "getEntriesByIds"
};
const getContentEntries = async (
    params: GetContentEntriesParams
): Promise<Response | ErrorResponse> => {
    const { args, context, type } = params;

    const method = getFetchMethod(type, context);

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

    const getters: Promise<CmsEntry[]>[] = Object.keys(entriesByModel).map(async modelId => {
        return method(modelsMap[modelId], entriesByModel[modelId]);
    });

    if (getters.length === 0) {
        return new Response([]);
    }

    try {
        const results = await Promise.all(getters);

        const entries = results
            .reduce<CmsEntryRecord[]>((collection, items) => {
                return collection.concat(
                    items.map(item => {
                        const model = modelsMap[item.modelId];

                        return createCmsEntryRecord(model, item);
                    })
                );
            }, [])
            .filter(Boolean);

        return new Response(entries);
    } catch (ex) {
        return new ErrorResponse(ex);
    }
};

/**
 * Function to fetch a single content entry depending on latest, published or exact GraphQL query.
 */
interface GetContentEntryParams {
    args: {
        entry: Pick<CmsEntry, "id" | "modelId">;
    };
    context: CmsContext;
    type: "latest" | "published" | "exact";
}

const getContentEntry = async (
    params: GetContentEntryParams
): Promise<Response<CmsEntryRecord | null> | NotAuthorizedResponse> => {
    const { args, context, type } = params;
    if (!getContentEntriesMethods[type]) {
        throw new WebinyError(
            `Unknown getContentEntry method "${type}". Could not fetch content entry.`,
            "UNKNOWN_METHOD_ERROR",
            {
                args,
                type
            }
        );
    }

    const method = getFetchMethod(type, context);

    const { modelId, id } = args.entry;
    const models = await context.cms.listModels();
    const model = models.find(m => m.modelId === modelId);

    if (!model) {
        return new NotAuthorizedResponse({
            data: {
                modelId
            }
        });
    }

    const result = await method(model, [id]);

    const entry = result.shift();
    if (!entry) {
        return new Response(null);
    }

    return new Response(createCmsEntryRecord(model, entry));
};
/**
 * As we support description field, we need to transform the value from storage.
 */
const createResolveDescription = (): Resolvers<CmsContext> => {
    return async (parent, _, context) => {
        const models = await context.cms.listModels();
        const model = models.find(({ modelId }) => {
            return parent.model.modelId === modelId;
        });
        if (!model) {
            return null;
        }
        const field = model.fields.find(f => f.fieldId === model.descriptionFieldId);
        if (!field) {
            return null;
        }
        const value = parent.description || parent[field.fieldId];
        if (!value) {
            return null;
        }
        return entryFieldFromStorageTransform({
            context,
            model,
            field,
            value
        });
    };
};

interface Params {
    context: CmsContext;
}

export const createContentEntriesSchema = ({
    context
}: Params): CmsGraphQLSchemaPlugin<CmsContext> => {
    if (!context.cms.MANAGE) {
        const plugin = new CmsGraphQLSchemaPlugin({
            typeDefs: "",
            resolvers: {}
        });
        plugin.name = `headless-cms.graphql.schema.${context.cms.type}.empty`;
        return plugin;
    }

    const deprecatedOnByMetaFields = [
        `createdBy: CmsIdentity! @deprecated(reason: "Use 'entryCreatedBy'.")`,
        `ownedBy: CmsIdentity! @deprecated(reason: "Use 'entryCreatedBy'.")`,
        `modifiedBy: CmsIdentity @deprecated(reason: "Use 'entryModifiedBy'.")`,
        `published: CmsPublishedContentEntry`,
        `createdOn: DateTime! @deprecated(reason: "Use 'entryCreatedOn'.")`,
        `savedOn: DateTime! @deprecated(reason: "Use 'entrySavedOn'.")`
    ].join("\n");

    const onByMetaFields = ENTRY_META_FIELDS.map(field => {
        const nullable = field.includes("Modified") ? "" : "!";
        const fieldType = field.endsWith("On") ? "DateTime" : "CmsIdentity";

        return `${field}: ${fieldType}${nullable}`;
    }).join("\n");

    const plugin = new CmsGraphQLSchemaPlugin({
        // Had to remove /* GraphQL */ because prettier would not format the code correctly.
        typeDefs: `
            type CmsModelMeta {
                modelId: String!
                name: String!
            }

            type CmsPublishedContentEntry {
                id: ID!
                entryId: String!
                title: String
                description: String
                image: String
            }

            type CmsContentEntry {
                id: ID!
                entryId: String!
                model: CmsModelMeta!
                status: String!
                title: String!
                description: String
                image: String
                
                ${deprecatedOnByMetaFields}
                ${onByMetaFields}
            
                wbyAco_location: WbyAcoLocation
            }

            type CmsContentEntriesResponse {
                data: [CmsContentEntry!]
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
                    query: String
                    fields: [String!]
                    limit: Int
                ): CmsContentEntriesResponse!

                # Get content entry meta data
                getContentEntry(entry: CmsModelEntryInput!): CmsContentEntryResponse!

                getLatestContentEntry(entry: CmsModelEntryInput!): CmsContentEntryResponse!
                getPublishedContentEntry(entry: CmsModelEntryInput!): CmsContentEntryResponse!

                # Get content entries meta data
                getContentEntries(entries: [CmsModelEntryInput!]!): CmsContentEntriesResponse!
                getLatestContentEntries(entries: [CmsModelEntryInput!]!): CmsContentEntriesResponse!
                getPublishedContentEntries(
                    entries: [CmsModelEntryInput!]!
                ): CmsContentEntriesResponse!
            }
        `,
        resolvers: {
            CmsContentEntry: {
                published: async (parent, _, context) => {
                    try {
                        const models = await context.cms.listModels();
                        const model = models.find(({ modelId }) => {
                            return parent.model.modelId === modelId;
                        });
                        if (!model) {
                            return null;
                        }
                        const [entry] = await context.cms.getPublishedEntriesByIds(model, [
                            parent.id
                        ]);
                        if (!entry) {
                            return null;
                        }
                        return createCmsEntryRecord(model, entry);
                    } catch (ex) {
                        return null;
                    }
                },
                description: createResolveDescription()
            },
            CmsPublishedContentEntry: {
                description: createResolveDescription()
            },
            Query: {
                async searchContentEntries(_, args: any, context) {
                    const { modelIds, fields, query, limit = 10 } = args;
                    const models = await context.cms.listModels();

                    const getters = models
                        .filter(model => modelIds.includes(model.modelId))
                        .map(async model => {
                            const modelManager = await context.cms.getEntryManager(model.modelId);
                            const where: CmsEntryListWhere = {};

                            const [items] = await modelManager.listLatest({
                                limit,
                                where,
                                search: !!query ? query : undefined,
                                fields: fields || []
                            });

                            return items.map((entry: CmsEntry) => {
                                return createCmsEntryRecord(model, entry);
                            });
                        });

                    try {
                        const entries = await Promise.all(getters).then(results =>
                            results.reduce((result, item) => result.concat(item), [])
                        );

                        return new Response(
                            entries
                                .sort((a, b) => b.savedOn.getTime() - a.savedOn.getTime())
                                .slice(0, limit)
                        );
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                },
                async getContentEntry(_, args: any, context) {
                    return getContentEntry({
                        args,
                        context,
                        type: "exact"
                    });
                },
                async getLatestContentEntry(_, args: any, context) {
                    return getContentEntry({
                        args,
                        context,
                        type: "latest"
                    });
                },
                async getPublishedContentEntry(_, args: any, context) {
                    return getContentEntry({
                        args,
                        context,
                        type: "published"
                    });
                },
                async getContentEntries(_, args: any, context) {
                    return getContentEntries({
                        args,
                        context,
                        type: "exact"
                    });
                },
                async getLatestContentEntries(_, args: any, context) {
                    return getContentEntries({
                        args,
                        context,
                        type: "latest"
                    });
                },
                async getPublishedContentEntries(_, args: any, context) {
                    return getContentEntries({
                        args,
                        context,
                        type: "published"
                    });
                }
            }
        }
    });

    plugin.name = `headless-cms.graphql.schema.${context.cms.type}.content-entries`;

    return plugin;
};
