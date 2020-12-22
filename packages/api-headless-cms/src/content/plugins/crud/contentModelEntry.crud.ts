import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { NotFoundError } from "@webiny/handler-graphql";
import Error from "@webiny/error";
import {
    CmsContentModelEntryContextType,
    CmsContentModelEntryListWhereType,
    CmsContentModelEntryPermissionType,
    CmsContentModelEntryType,
    CmsContentModelType,
    CmsContext,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import * as utils from "../../../utils";
import { entryModelValidationFactory } from "./contentModelEntry/entryModelValidationFactory";
import {
    createElasticSearchParams,
    createElasticSearchLimit
} from "./contentModelEntry/elasticSearchHelpers";
import { createRevisionsDataLoader } from "./contentModelEntry/dataLoaders";
import { createCmsPK } from "../../../utils";
import { SecurityPermission } from "@webiny/api-security/types";

const TYPE_ENTRY = "cms.entry";
const TYPE_ENTRY_LATEST = TYPE_ENTRY + ".l";
const TYPE_ENTRY_PUBLISHED = TYPE_ENTRY + ".p";

const STATUS_DRAFT = "draft";
const STATUS_PUBLISHED = "published";
const STATUS_UNPUBLISHED = "unpublished";
const STATUS_CHANGES_REQUESTED = "changesRequested";
const STATUS_REVIEW_REQUESTED = "reviewRequested";

const createElasticSearchData = ({ values, ...entry }: CmsContentModelEntryType) => {
    return {
        ...entry,
        values: {
            // Keep "values" as a nested object to avoid collisions between
            // system and user-defined properties
            ...values
        }
    };
};

const getESLatestEntryData = (entry: CmsContentModelEntryType) => {
    return { ...createElasticSearchData(entry), latest: true, __type: TYPE_ENTRY_LATEST };
};

const getESPublishedEntryData = (entry: CmsContentModelEntryType) => {
    return { ...createElasticSearchData(entry), published: true, __type: TYPE_ENTRY_PUBLISHED };
};

type FetchAllowedEntryModelIdListArgsType = {
    context: CmsContext;
    permission: SecurityPermission<CmsContentModelEntryPermissionType>;
    where?: CmsContentModelEntryListWhereType;
};

const fetchAllowedEntryModelIdList = async (
    args: FetchAllowedEntryModelIdListArgsType
): Promise<string[] | undefined> => {
    const { context, permission, where } = args;
    const locale = context.cms.getLocale().code;
    // we can filter by modelId_in, modelId, modelId_not and modelId_not_in
    let whereModelIdIn: string[] | undefined = where.modelId_in;
    if (where.modelId) {
        whereModelIdIn = [where.modelId];
    }
    let whereModelNotIn: string[] | undefined = where.modelId_not_in;
    if (where.modelId_not) {
        whereModelNotIn = [where.modelId_not];
    }
    // filter out models immediately
    const models = (await context.cms.models.list()).filter(model => {
        if (!whereModelIdIn && !whereModelNotIn) {
            return true;
        } else if (whereModelNotIn && whereModelNotIn.includes(model.modelId)) {
            return false;
        }
        return whereModelIdIn.includes(model.modelId);
    });
    const { models: permissionModels, groups: permissionGroups } = permission;
    // when no models or groups just filter by where_in if it exists
    if (!permissionModels && !permissionModels) {
        return models.map(model => model.modelId);
    }
    // if there are models in permissions
    // we use modelId to check if it is allowed to user
    if (permissionModels) {
        const allowedModels = permissionModels[locale] || [];
        return models
            .filter(model => allowedModels.includes(model.modelId))
            .map(model => model.modelId);
    }
    // there is a possibility that there is nothing allowed in groups locale property
    // happens when user selects group access pattern but does not select any group
    const allowedGroups = permissionGroups[locale] || [];
    return models
        .filter(model => allowedGroups.includes(model.group.id))
        .map(model => model.modelId);
};

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-entry",
    async apply(context) {
        const { db, elasticSearch, security } = context;

        const PK_ENTRY = () => `${createCmsPK(context)}#CME`;
        const PK_ENTRY_LATEST = () => PK_ENTRY() + "#L";
        const PK_ENTRY_PUBLISHED = () => PK_ENTRY + "#P";

        const loaders = {
            revisions: createRevisionsDataLoader(context, { PK_ENTRY })
        };

        const checkPermissions = (check: {
            rwd?: string;
            rcpu?: string;
        }): Promise<CmsContentModelEntryPermissionType> => {
            return utils.checkPermissions(context, "cms.manage.contentModelEntry", check);
        };

        const entries: CmsContentModelEntryContextType = {
            get: async (model, args) => {
                const [[item]] = await context.cms.entries.list(model, {
                    ...args,
                    limit: 1
                });
                if (!item) {
                    throw new NotFoundError(`Entry not found!`);
                }
                return item;
            },
            list: async (model: CmsContentModelType, args = {}, options = {}) => {
                const permission = await checkPermissions({ rwd: "r" });

                const limit = createElasticSearchLimit(args.limit, 50);

                // Possibly only get records which are owned by current user
                const ownedBy = permission.own ? context.security.getIdentity().id : undefined;

                // fetch only models that user can access
                const allowedModels = await fetchAllowedEntryModelIdList({
                    context,
                    permission,
                    where: args.where
                });

                const body = createElasticSearchParams({
                    model,
                    args: {
                        ...args,
                        where: {
                            ...(args.where || {}),
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            modelId_in: allowedModels,
                            // we need to unset everything that has to do with filtering by modelId
                            // since we already put all filtered modelId's to modelId_in
                            modelId: undefined,
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            modelId_not_in: undefined,
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            modelId_not: undefined
                        },
                        limit
                    },
                    context,
                    ownedBy,
                    parentObject: "values",
                    options
                });

                const response = await elasticSearch.search({
                    ...utils.defaults.es(context),
                    body
                });

                const { hits, total } = response.body.hits;
                const items = hits.map(item => item._source);

                const hasMoreItems = items.length > limit;
                if (hasMoreItems) {
                    // Remove the last item from results, we don't want to include it.
                    items.pop();
                }

                // Cursor is the `sort` value of the last item in the array.
                // https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
                const meta = {
                    hasMoreItems,
                    totalCount: total.value,
                    cursor:
                        items.length > 0
                            ? utils.encodeElasticSearchCursor(hits[items.length - 1].sort)
                            : null
                };

                return [items, meta];
            },
            listLatest: async function(model) {
                await checkPermissions({ rwd: "r" });
                return context.cms.entries.list(
                    model,
                    {
                        limit: 1000,
                        sort: ["savedOn_DESC"]
                    },
                    {
                        type: TYPE_ENTRY_LATEST
                    }
                );
                /*
                const permission = await checkPermissions({ rwd: "r" });
                const locale = context.cms.getLocale();

                const must: any = [
                    { term: { "__type.keyword": TYPE_ENTRY_LATEST } },
                    { term: { "modelId.keyword": model.modelId } },
                    { term: { "locale.keyword": locale.code } }
                ];

                // Only get records which are owned by current user.
                if (permission.own === true) {
                    const identity = context.security.getIdentity();
                    must.push({
                        term: { "ownedBy.id.keyword": identity.id }
                    });
                }

                const body = {
                    query: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        constant_score: {
                            filter: { bool: { must } }
                        }
                    },
                    sort: [
                        {
                            savedOn: {
                                order: "desc",
                                // eslint-disable-next-line @typescript-eslint/camelcase
                                unmapped_type: "date"
                            }
                        }
                    ],
                    size: 1000
                };

                // Get "latest" form revisions from Elasticsearch.
                const response = await elasticSearch.search({
                    ...utils.defaults.es(context),
                    body
                });

                const { hits, total } = response.body.hits;
                const items = hits.map(item => item._source);

                const meta = {
                    hasMoreItems: false,
                    totalCount: total.value,
                    cursor: null
                };

                return [items, meta];
                // */
            },
            listPublished: async function(model) {
                await checkPermissions({ rwd: "r" });

                return context.cms.entries.list(
                    model,
                    {
                        limit: 1000,
                        sort: ["savedOn_DESC"]
                    },
                    {
                        type: TYPE_ENTRY_PUBLISHED
                    }
                );
                // const locale = context.cms.getLocale();
                //
                // const must: any = [
                //     { term: { "__type.keyword": TYPE_ENTRY_PUBLISHED } },
                //     { term: { "modelId.keyword": model.modelId } },
                //     { term: { "locale.keyword": locale.code } }
                // ];
                //
                // const body = {
                //     query: {
                //         // eslint-disable-next-line @typescript-eslint/camelcase
                //         constant_score: {
                //             filter: { bool: { must } }
                //         }
                //     },
                //     sort: [
                //         {
                //             savedOn: {
                //                 order: "desc",
                //                 // eslint-disable-next-line @typescript-eslint/camelcase
                //                 unmapped_type: "date"
                //             }
                //         }
                //     ],
                //     size: 1000
                // };
                //
                // // Get "published" form revisions from Elasticsearch.
                // const response = await elasticSearch.search({
                //     ...utils.defaults.es(context),
                //     body
                // });
                //
                // const { hits, total } = response.body.hits;
                // const items = hits.map(item => item._source);
                //
                // const meta = {
                //     hasMoreItems: false,
                //     totalCount: total.value,
                //     cursor: null
                // };
                //
                // return [items, meta];
            },
            async create(model, data) {
                await checkPermissions({ rwd: "w" });

                const validation = await entryModelValidationFactory(context, model);
                await validation.validate(data);

                const identity = security.getIdentity();
                const locale = context.cms.getLocale();

                const uniqueId = mdbid();
                const version = 1;
                const id = `${uniqueId}#${utils.zeroPad(version)}`;

                const owner = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };

                const entry: CmsContentModelEntryType = {
                    id,
                    modelId: model.modelId,
                    locale: locale.code,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    createdBy: owner,
                    ownedBy: owner,
                    version,
                    locked: false,
                    status: STATUS_DRAFT,
                    values: data
                };

                await db
                    .batch()
                    // Create main entry item
                    .create({
                        ...utils.defaults.db,
                        data: {
                            PK: PK_ENTRY(),
                            SK: id,
                            TYPE: DbItemTypes.CMS_CONTENT_MODEL_ENTRY,
                            ...entry
                        }
                    })
                    // Create "latest" entry item
                    .create({
                        ...utils.defaults.db,
                        data: {
                            PK: PK_ENTRY_LATEST(),
                            SK: uniqueId,
                            TYPE: TYPE_ENTRY_LATEST,
                            id
                        }
                    })
                    .execute();

                await elasticSearch.create({
                    ...utils.defaults.es(context),
                    id: `CME#L#${uniqueId}`,
                    body: getESLatestEntryData(entry)
                });

                return entry;
            },
            async createRevisionFrom(model, sourceId) {
                await checkPermissions({ rwd: "w" });

                // Entries are identified by a common parent ID + Revision number
                const [uniqueId] = sourceId.split("#");

                const [[[entry]], [[latestEntry]]] = await db
                    .batch()
                    .read({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY(), SK: sourceId }
                    })
                    .read({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY_LATEST(), SK: uniqueId }
                    })
                    .execute();

                if (!entry) {
                    throw new NotFoundError(
                        `Entry "${sourceId}" of model "${model.modelId}" was not found.`
                    );
                }

                const identity = security.getIdentity();
                const version = parseInt(latestEntry.id.split("#")[1]) + 1;
                const id = `${uniqueId}#${utils.zeroPad(version)}`;

                const newEntry: CmsContentModelEntryType = {
                    id,
                    version,
                    modelId: entry.modelId,
                    locale: entry.locale,
                    savedOn: new Date().toISOString(),
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    },
                    ownedBy: entry.ownedBy,
                    locked: false,
                    publishedOn: null,
                    status: STATUS_DRAFT,
                    values: { ...entry.values }
                };

                await db
                    .batch()
                    // Create main entry item
                    .create({
                        ...utils.defaults.db,
                        data: {
                            PK: PK_ENTRY(),
                            SK: id,
                            TYPE: DbItemTypes.CMS_CONTENT_MODEL_ENTRY,
                            ...newEntry
                        }
                    })
                    // Update "latest" entry item
                    .update({
                        ...utils.defaults.db,
                        data: {
                            PK: PK_ENTRY_LATEST(),
                            SK: uniqueId,
                            TYPE: TYPE_ENTRY_LATEST,
                            id
                        }
                    })
                    .execute();

                await elasticSearch.index({
                    ...utils.defaults.es(context),
                    id: `CME#L#${uniqueId}`,
                    body: getESLatestEntryData(newEntry)
                });

                return newEntry;
            },
            async update(model, id, data) {
                // TODO: @pavel check the UI to see if this `data` is an object with user-defined fields
                const permission = await checkPermissions({ rwd: "w" });

                const [uniqueId] = id.split("#");

                const [[[entry]], [[latestEntry]]] = await db
                    .batch()
                    .read({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY(), SK: id }
                    })
                    .read({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY_LATEST(), SK: uniqueId }
                    })
                    .execute();

                if (!entry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }

                if (entry.locked) {
                    throw new Error(`Cannot update entry because it's locked.`);
                }

                utils.checkOwnership(context, permission, entry, "ownedBy");

                const validation = await entryModelValidationFactory(context, model);
                await validation.validate(data);

                const updatedEntry: Partial<CmsContentModelEntryType> = {
                    values: data,
                    savedOn: new Date().toISOString()
                };

                await db.update({
                    ...utils.defaults.db,
                    query: { PK: PK_ENTRY(), SK: id },
                    data: updatedEntry
                });

                if (latestEntry.id === id) {
                    // Index file in "Elastic Search"
                    await elasticSearch.update({
                        ...utils.defaults.es(context),
                        id: `CME#L#${uniqueId}`,
                        body: {
                            doc: updatedEntry
                        }
                    });
                }

                return {
                    ...entry,
                    ...updatedEntry
                };
            },
            async delete(model, id) {
                const permission = await checkPermissions({ rwd: "d" });

                const [uniqueId] = id.split("#");

                const [[[entry]], [[latestEntryData]], [[publishedEntryData]]] = await db
                    .batch()
                    .read({
                        ...utils.defaults.db,
                        query: {
                            PK: PK_ENTRY(),
                            SK: id
                        }
                    })
                    .read({
                        ...utils.defaults.db,
                        query: {
                            PK: PK_ENTRY_LATEST(),
                            SK: uniqueId
                        }
                    })
                    .read({
                        ...utils.defaults.db,
                        query: {
                            PK: PK_ENTRY_PUBLISHED(),
                            SK: uniqueId
                        }
                    })
                    .execute();

                if (!entry) {
                    throw new NotFoundError(`Entry "${id}" was not found!`);
                }

                utils.checkOwnership(context, permission, entry, "ownedBy");

                // Delete entry from DB
                const batch = db.batch().delete({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_ENTRY(),
                        SK: id
                    }
                });

                const es = utils.defaults.es(context);
                const esOperations = [];

                const isLatest = latestEntryData ? latestEntryData.id === id : false;
                const isPublished = publishedEntryData ? publishedEntryData.id === id : false;

                // If the entry is published, remove published data, both from DB and ES.
                if (isPublished) {
                    batch.delete({
                        ...utils.defaults.db,
                        query: {
                            PK: PK_ENTRY_PUBLISHED(),
                            SK: uniqueId
                        }
                    });

                    esOperations.push({
                        delete: { _id: `CME#P#${uniqueId}`, _index: es.index }
                    });
                }

                // If the entry is "latest", assign the previously latest entry as the new latest.
                // Updates must be made on both DB and ES side.
                if (isLatest) {
                    const [[prevLatestEntry]] = await db.read<CmsContentModelEntryType>({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY(), SK: { $lt: id } },
                        sort: { SK: -1 },
                        limit: 1
                    });

                    // Update latest entry data.
                    batch.update({
                        ...utils.defaults.db,
                        query: {
                            PK: PK_ENTRY_LATEST(),
                            SK: uniqueId
                        },
                        data: {
                            ...latestEntryData,
                            id: prevLatestEntry.id
                        }
                    });

                    // Update the latest revision entry in ES.
                    esOperations.push(
                        { index: { _id: `CME#L#${uniqueId}`, _index: es.index } },
                        getESLatestEntryData(prevLatestEntry)
                    );
                }

                // Execute DB operations
                await batch.execute();

                // If the entry was neither published nor latest, we shouldn't have any operations to execute.
                if (esOperations.length) {
                    await elasticSearch.bulk({ body: esOperations });
                }
            },
            async listRevisions(id) {
                const [uniqueId] = id.split("#");

                return loaders.revisions.load(uniqueId);
            },
            async publish(model, id) {
                const permission = await checkPermissions({ rcpu: "p" });

                const [uniqueId] = id.split("#");

                const [[[entry]], [[latestEntryData]], [[publishedEntryData]]] = await db
                    .batch()
                    .read({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY(), SK: id }
                    })
                    .read({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY_LATEST(), SK: uniqueId }
                    })
                    .read({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY_PUBLISHED(), SK: uniqueId }
                    })
                    .execute();

                if (!entry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }

                utils.checkOwnership(context, permission, entry, "ownedBy");

                // Change entry to "published"
                entry.status = STATUS_PUBLISHED;
                entry.locked = true;
                entry.publishedOn = new Date().toISOString();

                const batch = db.batch();

                batch.update({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_ENTRY(),
                        SK: id
                    },
                    data: entry
                });

                if (publishedEntryData) {
                    // If there is a `published` entry already, we need to set it to `unpublished`. We need to
                    // execute two updates: update the previously published entry's status and the published
                    // entry record (PK_PAGE_PUBLISHED()).

                    // DynamoDB does not support `batchUpdate` - so here we load the previously published
                    // entry's data to update its status within a batch operation. If, hopefully,
                    // they introduce a true update batch operation, remove this `read` call.

                    const [[previouslyPublishedEntry]] = await db.read<CmsContentModelEntryType>({
                        ...utils.defaults.db,
                        query: { PK: PK_ENTRY(), SK: publishedEntryData.id }
                    });

                    previouslyPublishedEntry.status = STATUS_UNPUBLISHED;

                    batch
                        .update({
                            // Update currently published entry (unpublish it)
                            ...utils.defaults.db,
                            query: {
                                PK: PK_ENTRY(),
                                SK: publishedEntryData.id
                            },
                            data: previouslyPublishedEntry
                        })
                        .update({
                            // Update the helper item in DB with the new published entry ID
                            ...utils.defaults.db,
                            query: {
                                PK: PK_ENTRY_PUBLISHED(),
                                SK: uniqueId
                            },
                            data: {
                                ...publishedEntryData,
                                id: entry.id
                            }
                        });
                } else {
                    batch.create({
                        ...utils.defaults.db,
                        data: {
                            PK: PK_ENTRY_PUBLISHED(),
                            SK: uniqueId,
                            TYPE: TYPE_ENTRY_PUBLISHED,
                            id: entry.id
                        }
                    });
                }

                // Finally, execute batch
                await batch.execute();

                // Update data in ES.
                const esOperations = [];
                const es = utils.defaults.es(context);

                // If we are publishing the latest revision, let's also update the latest revision's status in ES.
                if (latestEntryData && latestEntryData.id === id) {
                    esOperations.push(
                        { update: { _id: `CME#L#${uniqueId}`, _index: es.index } },
                        {
                            doc: {
                                status: STATUS_PUBLISHED,
                                locked: true,
                                publishedOn: entry.publishedOn
                            }
                        }
                    );
                }

                // Update the published revision entry in ES.
                esOperations.push(
                    { index: { _id: `CME#P#${uniqueId}`, _index: es.index } },
                    getESPublishedEntryData(entry)
                );

                await elasticSearch.bulk({ body: esOperations });

                return entry;
            },
            requestChanges(
                model: CmsContentModelType,
                id: string
            ): Promise<CmsContentModelEntryType> {
                return Promise.resolve(undefined);
            },
            requestReview(
                model: CmsContentModelType,
                id: string
            ): Promise<CmsContentModelEntryType> {
                return Promise.resolve(undefined);
            },
            unpublish(model: CmsContentModelType, id: string): Promise<CmsContentModelEntryType> {
                return Promise.resolve(undefined);
            }
        };

        context.cms = {
            ...(context.cms || ({} as any)),
            entries
        };
    }
});
