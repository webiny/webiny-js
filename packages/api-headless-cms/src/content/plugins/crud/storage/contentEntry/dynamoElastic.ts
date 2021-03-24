import {
    CmsContentEntry,
    CmsContentEntryStorageOperations,
    CmsContentEntryStorageOperationsCreateArgs,
    CmsContentEntryStorageOperationsCreateRevisionFromArgs,
    CmsContentEntryStorageOperationsDeleteArgs,
    CmsContentEntryStorageOperationsGetArgs,
    CmsContentEntryStorageOperationsListArgs,
    CmsContentEntryStorageOperationsListResponse,
    CmsContentEntryStorageOperationsPublishArgs,
    CmsContentEntryStorageOperationsRequestChangesArgs,
    CmsContentEntryStorageOperationsRequestReviewArgs,
    CmsContentEntryStorageOperationsUnpublishArgs,
    CmsContentEntryStorageOperationsUpdateArgs,
    CmsContentModel,
    CmsContext
} from "../../../../../types";

import WebinyError from "@webiny/error";
import * as utils from "../../../../../utils";
import {
    createElasticsearchLimit,
    createElasticsearchQueryBody,
    extractEntriesFromIndex,
    prepareEntryToIndex
} from "../../contentEntry/es";
import { entryFromStorageTransform, entryToStorageTransform } from "../../../utils/entryStorage";
import cloneDeep from "lodash/cloneDeep";
import omit from "lodash/omit";
import { STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "../../contentEntry.crud";
// import * as dataLoaders from "./dataLoaders";

export const TYPE_ENTRY = "cms.entry";
export const TYPE_ENTRY_LATEST = TYPE_ENTRY + ".l";
export const TYPE_ENTRY_PUBLISHED = TYPE_ENTRY + ".p";

const extractPrimaryId = (id: string): string => {
    if (id.includes("#") === false) {
        return id;
    }
    return id.split("#").shift();
};
const extractEntryPrimaryId = (entry: CmsContentEntry): string => {
    return extractPrimaryId(entry.id);
};

const getEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...omit(entry, ["PK", "SK", "published", "latest"]),
        webinyVersion: context.WEBINY_VERSION
    };
};

const getESLatestEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...getEntryData(context, entry),
        entryId: extractEntryPrimaryId(entry),
        latest: true,
        __type: TYPE_ENTRY_LATEST
    };
};

const getESPublishedEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...getEntryData(context, entry),
        entryId: extractEntryPrimaryId(entry),
        published: true,
        __type: TYPE_ENTRY_PUBLISHED
    };
};

interface ConstructorArgs {
    context: CmsContext;
    basePrimaryKey: string;
}

/**
 * This implementation is not a general driver to fetch from DDB/Elastic.
 * Use some other implementation for general-use purpose.
 */
export default class CmsContentEntryCrudDynamoElastic implements CmsContentEntryStorageOperations {
    private readonly _context: CmsContext;
    private readonly _primaryKey: string;

    private get context(): CmsContext {
        return this._context;
    }

    public constructor({ context, basePrimaryKey }: ConstructorArgs) {
        this._context = context;
        this._primaryKey = `${basePrimaryKey}#CME`;
    }

    public async create(
        model: CmsContentModel,
        { data }: CmsContentEntryStorageOperationsCreateArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;

        const storageEntry = await entryToStorageTransform(this.context, model, data);

        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            originalEntry: cloneDeep(data),
            storageEntry: cloneDeep(storageEntry)
        });

        const { index: esIndex } = utils.defaults.es(this.context, model);

        const batch = db
            .batch()
            // Create main entry item
            .create({
                ...utils.defaults.db(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyRevision(data.version),
                    TYPE: TYPE_ENTRY,
                    ...storageEntry
                }
            })
            // Create "latest" entry item
            .create({
                ...utils.defaults.db(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST,
                    ...storageEntry
                }
            })
            .create({
                ...utils.defaults.esDb(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyLatest(),
                    index: esIndex,
                    data: getESLatestEntryData(this.context, esEntry)
                }
            });

        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert data into the DynamoDB",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry: data
                }
            );
        }

        return storageEntry;
    }

    public async createRevisionFrom(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsCreateRevisionFromArgs
    ) {
        const { db } = this.context;

        const {
            originalEntryRevision: originalEntry,
            data,
            latestEntryRevision: latestEntry
        } = args;

        const storageData = await entryToStorageTransform(this.context, model, data);

        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            originalEntry: cloneDeep(data),
            storageEntry: cloneDeep(storageData)
        });
        const { index: esIndex } = utils.defaults.es(this.context, model);

        const primaryKey = this.getPrimaryKey(storageData.id);
        const batch = db.batch();
        batch
            // Create main entry item
            .create({
                ...utils.defaults.db(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(storageData.version),
                    TYPE: TYPE_ENTRY,
                    ...getEntryData(this.context, storageData)
                }
            })
            // Update "latest" entry item
            .update({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST,
                    ...getEntryData(this.context, storageData)
                }
            })
            .update({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    index: esIndex,
                    data: getESLatestEntryData(this.context, esEntry)
                }
            });
        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    originalEntry,
                    latestEntry,
                    data,
                    esEntry
                }
            );
        }
        // There are no modifications on the entry created so just return the data.
        return data;
    }

    public async delete(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsDeleteArgs
    ): Promise<boolean> {
        const { db } = this.context;
        const { entry } = args;

        const primaryKey = this.getPrimaryKey(entry.id);

        const [dbItems] = await db.read<CmsContentEntry>({
            ...utils.defaults.db(),
            query: {
                PK: primaryKey,
                SK: { $gte: " " }
            }
        });
        // Load ES entries to delete
        const [esDbItems] = await db.read({
            ...utils.defaults.esDb(),
            query: {
                PK: primaryKey,
                SK: { $gte: " " }
            }
        });

        // Delete all items from DB and ES DB
        await Promise.all([
            utils.paginateBatch(dbItems, 25, async items => {
                await db
                    .batch()
                    .delete(
                        ...items.map((item: any) => ({
                            ...utils.defaults.db(),
                            query: {
                                PK: item.PK,
                                SK: item.SK
                            }
                        }))
                    )
                    .execute();
            }),
            utils.paginateBatch(esDbItems, 25, async items => {
                await db
                    .batch()
                    .delete(
                        ...items.map((item: any) => ({
                            ...utils.defaults.esDb(),
                            query: {
                                PK: item.PK,
                                SK: item.SK
                            }
                        }))
                    )
                    .execute();
            })
        ]);
        return true;
    }

    public async deleteRevision(model: CmsContentModel, entry: CmsContentEntry): Promise<void> {
        const { db } = this.context;

        const primaryKey = this.getPrimaryKey(entry.id);

        const batch = db.batch();
        batch
            .delete({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(entry.id)
                }
            })
            .delete({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(entry.id)
                }
            });
        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entry
            });
        }
    }

    public async publishRevision(model: CmsContentModel, entry: CmsContentEntry): Promise<void> {
        const { db } = this.context;

        const primaryKey = this.getPrimaryKey(entry.id);

        const storageEntry = await entryToStorageTransform(this.context, model, entry);
        const esConfig = utils.defaults.es(this.context, model);

        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            originalEntry: cloneDeep(entry),
            storageEntry: cloneDeep(storageEntry)
        });

        const batch = db.batch();
        batch
            // first we delete existing published entries
            .delete({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            })
            .delete({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            })
            // then we create new one
            .create({
                ...utils.defaults.db(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished(),
                    TYPE: TYPE_ENTRY_PUBLISHED,
                    ...storageEntry
                }
            })
            .create({
                ...utils.defaults.esDb(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished(),
                    index: esConfig.index,
                    data: getESPublishedEntryData(this.context, esEntry)
                }
            });
        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entry,
                esConfig,
                storageEntry,
                esEntry
            });
        }
    }

    public async unpublishRevision(model: CmsContentModel, entry: CmsContentEntry): Promise<void> {
        const { db } = this.context;

        const primaryKey = this.getPrimaryKey(entry.id);

        const batch = db.batch();
        batch
            .delete({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            })
            .delete({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            });
        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entry
            });
        }
    }

    public async setRevisionAsLatest(
        model: CmsContentModel,
        entry: CmsContentEntry
    ): Promise<void> {
        const { db } = this.context;

        const primaryKey = this.getPrimaryKey(entry.id);

        const storageEntry = await entryToStorageTransform(this.context, model, entry);
        const esConfig = utils.defaults.es(this.context, model);

        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            originalEntry: cloneDeep(entry),
            storageEntry: cloneDeep(storageEntry)
        });

        const batchDelete = db.batch();
        batchDelete
            // first we delete existing latest entries
            .delete(
                {
                    ...utils.defaults.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest()
                    }
                },
                {
                    ...utils.defaults.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest()
                    }
                }
            );
        // then we create new one
        const batchCreate = db
            .batch()
            .create({
                ...utils.defaults.db(),
                data: {
                    ...storageEntry,
                    TYPE: TYPE_ENTRY_LATEST
                }
            })
            .create({
                ...utils.defaults.esDb(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    index: esConfig.index,
                    data: getESLatestEntryData(this.context, esEntry)
                }
            });
        try {
            await batchDelete.execute();
            await batchCreate.execute();
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entry,
                esConfig,
                storageEntry,
                esEntry
            });
        }
    }

    public async get(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsGetArgs
    ): Promise<CmsContentEntry | null> {
        const { items } = await this.list(model, {
            ...(args || {}),
            limit: 1
        });
        if (items.length === 0) {
            return null;
        }
        return items.shift();
    }
    /**
     * Implemented search via the Elasticsearch.
     */
    public async list(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsListArgs
    ): Promise<CmsContentEntryStorageOperationsListResponse> {
        const { elasticSearch } = this.context;
        const limit = createElasticsearchLimit(args.limit, 50);
        const body = createElasticsearchQueryBody({
            model,
            args: {
                ...(args || {}),
                limit
            },
            context: this.context,
            parentObject: "values"
        });

        let response;
        const esConfig = utils.defaults.es(this.context, model);
        try {
            response = await elasticSearch.search({
                ...esConfig,
                body
            });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                esConfig,
                body
            });
        }

        const { hits, total } = response.body.hits;
        const items = extractEntriesFromIndex({
            context: this.context,
            model,
            entries: hits.map(item => item._source)
        });

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            // Remove the last item from results, we don't want to include it.
            items.pop();
        }
        // Cursor is the `sort` value of the last item in the array.
        // https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
        const cursor =
            items.length > 0 ? utils.encodeElasticsearchCursor(hits[items.length - 1].sort) : null;
        return {
            hasMoreItems,
            totalCount: total.value,
            cursor,
            items
        };
    }
    public async update(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsUpdateArgs
    ): Promise<CmsContentEntry> {
        const {
            originalEntryRevision: originalEntry,
            data,
            latestEntryRevision: latestEntry
        } = args;

        const { db } = this.context;

        const primaryKey = this.getPrimaryKey(originalEntry.id);

        const batch = db.batch();

        batch.update({
            ...utils.defaults.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(originalEntry.version)
            },
            data
        });

        // are these full id or just generated ones without the version?
        if (latestEntry.id === originalEntry.id) {
            // prepare the entry for indexing
            const esEntry = prepareEntryToIndex({
                context: this.context,
                model,
                originalEntry: cloneDeep(originalEntry),
                storageEntry: cloneDeep(data)
            });
            const esDoc = {
                ...esEntry,
                savedOn: data.savedOn
            };

            const { index: esIndex } = utils.defaults.es(this.context, model);

            batch.update({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    index: esIndex,
                    data: getESLatestEntryData(this.context, esDoc)
                }
            });
        }
        try {
            await batch.execute();
            return data;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry.",
                ex.code || "UPDATE_ERROR",
                {
                    error: ex,
                    originalEntry,
                    data,
                    latestEntry
                }
            );
        }
    }

    public async publish(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsPublishArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;
        const {
            entry,
            latestEntryRevision: latestEntry,
            publishedEntryRevision: publishedEntry
        } = args;

        const primaryKey = this.getPrimaryKey(entry.id);

        const readBatch = db
            .batch()
            .read({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                }
            })
            .read({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            });
        let latestESEntryData: CmsContentEntry | undefined;
        let publishedESEntryData: CmsContentEntry | undefined;
        try {
            [[[latestESEntryData]], [[publishedESEntryData]]] = await readBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read Elasticsearch latest or published data.",
                ex.code || "PUBLISH_BATCH_READ",
                {
                    latest: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest()
                    },
                    published: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyPublished()
                    }
                }
            );
        }

        const batch = db.batch();

        batch.update({
            ...utils.defaults.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(entry.version)
            },
            data: entry
        });

        const es = utils.defaults.es(this.context, model);

        if (publishedEntry) {
            // If there is a `published` entry already, we need to set it to `unpublished`. We need to
            // execute two updates: update the previously published entry's status and the published
            // entry record (PK_ENTRY_PUBLISHED()).

            // DynamoDB does not support `batchUpdate` - so here we load the previously published
            // entry's data to update its status within a batch operation. If, hopefully,
            // they introduce a true update batch operation, remove this `read` call.
            const [[previouslyPublishedStorageEntry]] = await db.read<CmsContentEntry>({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(publishedEntry.version)
                }
            });

            previouslyPublishedStorageEntry.status = STATUS_UNPUBLISHED;

            batch
                .update({
                    // Update currently published entry (unpublish it)
                    ...utils.defaults.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyRevision(publishedEntry.version)
                    },
                    data: previouslyPublishedStorageEntry
                })
                .update({
                    // Update the helper item in DB with the new published entry ID
                    ...utils.defaults.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyPublished()
                    },
                    data: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyPublished(),
                        ...getEntryData(this.context, publishedEntry),
                        ...getEntryData(this.context, entry)
                    }
                });
        } else {
            batch.create({
                ...utils.defaults.db(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished(),
                    TYPE: TYPE_ENTRY_PUBLISHED,
                    ...getEntryData(this.context, entry)
                }
            });
        }

        // If we are publishing the latest revision, let's also update the latest revision's status in ES.
        if (latestEntry && latestEntry.id === entry.id) {
            batch.update({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    ...latestESEntryData,
                    data: {
                        ...((latestESEntryData as any).data || {}),
                        status: STATUS_PUBLISHED,
                        locked: true,
                        publishedOn: entry.publishedOn
                    }
                }
            });
        }

        const preparedEntryData = prepareEntryToIndex({
            context: this.context,
            model,
            originalEntry: await entryFromStorageTransform(this.context, model, entry),
            storageEntry: entry
        });
        // Update the published revision entry in ES.
        const esData = {
            PK: primaryKey,
            SK: this.getSecondaryKeyPublished(),
            index: es.index,
            data: getESPublishedEntryData(this.context, preparedEntryData)
        };

        if (publishedESEntryData) {
            batch.update({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                },
                data: esData
            });
        } else {
            batch.create({
                ...utils.defaults.esDb(),
                data: esData
            });
        }

        // Finally, execute batch
        try {
            await batch.execute();
            return entry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute the publishing batch.",
                ex.code || "PUBLISH_ERROR",
                {
                    entry,
                    esData,
                    latestEntry,
                    publishedEntry
                }
            );
        }
    }

    public async unpublish(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsUnpublishArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;
        const { entry, latestEntryRevision: latestEntry } = args;

        const primaryKey = this.getPrimaryKey(entry.id);

        const batch = db
            .batch()
            .delete({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            })
            .delete({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            })
            .update({
                ...utils.defaults.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(entry.version)
                },
                data: entry
            });
        // If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
        if (latestEntry.id === entry.id) {
            const es = utils.defaults.es(this.context, model);

            batch.update({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    index: es.index,
                    data: getESLatestEntryData(this.context, entry)
                }
            });
        }

        try {
            await batch.execute();
            return entry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute unpublish batch.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    latestEntry
                }
            );
        }
    }

    public async requestChanges(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsRequestChangesArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;
        const {
            entry,
            originalEntryRevision: originalEntry,
            latestEntryRevision: latestEntry
        } = args;

        const primaryKey = this.getPrimaryKey(entry.id);

        const batch = db.batch().update({
            ...utils.defaults.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(entry.version)
            },
            data: entry
        });

        // If we updated the latest version, then make sure the changes are propagated to ES too.
        if (latestEntry.id === entry.id) {
            // Index file in "Elastic Search"
            const es = utils.defaults.es(this.context, model);
            batch.update({
                ...utils.defaults.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    index: es.index,
                    data: getESLatestEntryData(this.context, entry)
                }
            });
        }

        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute the request changes batch.",
                ex.code || "REQUEST_CHANGES_ERROR",
                {
                    entry,
                    originalEntry
                }
            );
        }
        return entry;
    }

    public async requestReview(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsRequestReviewArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;
        const {
            entry,
            originalEntryRevision: originalEntry,
            latestEntryRevision: latestEntry
        } = args;

        const primaryKey = this.getPrimaryKey(entry.id);

        const batch = db.batch().update({
            ...utils.defaults.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(entry.version)
            },
            data: entry
        });

        // If we updated the latest version, then make sure the changes are propagated to ES too.
        if (latestEntry.id === entry.id) {
            // Index file in "Elastic Search"
            const es = utils.defaults.es(this.context, model);
            batch.update({
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest(),
                    index: es.index,
                    data: getESLatestEntryData(this.context, entry)
                }
            });
        }

        try {
            await batch.execute();
            return entry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute request review batch.",
                ex.code || "REQUEST_REVIEW_ERROR",
                {
                    entry,
                    latestEntry,
                    originalEntry
                }
            );
        }
    }

    public async getAllRevisionsByIds(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        if (ids.length === 0) {
            return [];
        }
        const { db } = this.context;
        const batch = db.batch();
        for (const id of ids) {
            batch.read({
                ...utils.defaults.db(),
                query: {
                    PK: this.getPrimaryKey(id),
                    SK: {
                        $startsWith: "REV#"
                    }
                },
                sort: {
                    SK: -1
                }
            });
        }
        try {
            const results = await batch.execute();
            return results.map(items => {
                if (items.length === 0) {
                    return null;
                } else if (Array.isArray(items[0])) {
                    return items[0][0];
                }
                throw new WebinyError(
                    "Could not map results of the getAllRevisionsByIds batch request.",
                    "MAP_RESULT_ITEMS_ERROR",
                    {
                        ids
                    }
                );
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read multiple entries.",
                ex.code || "GET_ALL_REVISIONS_BY_IDS_ERROR",
                {
                    ids
                }
            );
        }
    }

    public async getByIds(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        if (ids.length === 0) {
            return [];
        }
        const { db } = this.context;
        const batch = db.batch();
        for (const id of ids) {
            // const [uniqueId, version] = id.split("#");
            batch.read({
                ...utils.defaults.db(),
                query: {
                    PK: this.getPrimaryKey(id),
                    SK: this.getSecondaryKeyRevision(id)
                }
            });
        }
        try {
            const results = await batch.execute();
            return results.map(items => {
                if (items.length === 0) {
                    return null;
                } else if (Array.isArray(items[0])) {
                    return items[0][0];
                }
                throw new WebinyError(
                    "Could not map results of the getByIds batch request.",
                    "MAP_RESULT_ITEMS_ERROR",
                    {
                        ids
                    }
                );
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read multiple entries.",
                ex.code || "GET_BY_IDS_ERROR",
                {
                    ids
                }
            );
        }
    }

    public async getPublishedByIds(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        if (ids.length === 0) {
            return [];
        }
        const { db } = this.context;
        const batch = db.batch();
        for (const id of ids) {
            batch.read({
                ...utils.defaults.db(),
                query: {
                    PK: this.getPrimaryKey(id),
                    SK: this.getSecondaryKeyPublished()
                },
                limit: 1
            });
        }
        try {
            const results = await batch.execute();
            return results.map(items => {
                if (items.length === 0) {
                    return null;
                } else if (Array.isArray(items[0])) {
                    return items[0][0];
                }
                throw new WebinyError(
                    "Could not map results of the getPublishedByIds batch request.",
                    "MAP_RESULT_ITEMS_ERROR",
                    {
                        ids
                    }
                );
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read multiple entries.",
                ex.code || "GET_BY_IDS_ERROR",
                {
                    ids
                }
            );
        }
    }

    public async getLatestByIds(
        model: CmsContentModel,
        ids: readonly string[]
    ): Promise<CmsContentEntry[]> {
        if (ids.length === 0) {
            return [];
        }
        const { db } = this.context;
        const batch = db.batch();
        for (const id of ids) {
            batch.read({
                ...utils.defaults.db(),
                query: {
                    PK: this.getPrimaryKey(id),
                    SK: this.getSecondaryKeyLatest()
                },
                limit: 1
            });
        }
        try {
            const results = await batch.execute();
            return results.map(items => {
                if (items.length === 0) {
                    return null;
                } else if (Array.isArray(items[0])) {
                    return items[0][0];
                }
                throw new WebinyError(
                    "Could not map results of the getLatestByIds batch request.",
                    "MAP_RESULT_ITEMS_ERROR",
                    {
                        ids
                    }
                );
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read multiple entries.",
                ex.code || "GET_BY_IDS_ERROR",
                {
                    ids
                }
            );
        }
    }

    public async getRevisions(model: CmsContentModel, id: string): Promise<CmsContentEntry[]> {
        const { db } = this.context;
        try {
            const [items] = await db.read<CmsContentEntry>({
                ...utils.defaults.db(),
                query: {
                    PK: this.getPrimaryKey(id),
                    SK: { $beginsWith: "REV#" }
                }
            });
            return items;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read from the database.",
                ex.code || "GET_REVISIONS_ERROR",
                {
                    id
                }
            );
        }
    }

    public async getRevisionById(
        model: CmsContentModel,
        id: string
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            PK: this.getPrimaryKey(id),
            SK: this.getSecondaryKeyRevision(id)
        });
    }

    public async getPublishedRevisionByEntryId(
        model: CmsContentModel,
        entryId: string
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            PK: this.getPrimaryKey(entryId),
            SK: this.getSecondaryKeyPublished()
        });
    }

    public async getLatestRevisionByEntryId(
        model: CmsContentModel,
        entryId: string
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            PK: this.getPrimaryKey(entryId),
            SK: this.getSecondaryKeyLatest()
        });
    }

    public async getPreviousRevision(
        model: CmsContentModel,
        entryId: string,
        version: number
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem(
            {
                PK: this.getPrimaryKey(entryId),
                SK: {
                    $lt: this.getSecondaryKeyRevision(version)
                }
            },
            {
                SK: -1
            }
        );
    }

    private async getSingleDynamoDbItem(
        query: { PK: string; SK: string | object },
        sort?: { SK: -1 | 1 }
    ): Promise<CmsContentEntry | null> {
        const { db } = this.context;
        let entry;
        try {
            const [entries] = await db.read<CmsContentEntry>({
                ...utils.defaults.db(),
                query,
                sort,
                limit: 1
            });
            if (entries.length === 0) {
                return null;
            }
            entry = entries.shift();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read from the DynamoDB.",
                ex.code || "DDB_READ_ERROR",
                {
                    query,
                    sort
                }
            );
        }
        return entry;
    }

    private getPrimaryKey(id: string): string {
        /**
         * If ID includes # it means it is composed of ID and VERSION.
         * We need ID only so extract it.
         */
        if (id.includes("#")) {
            id = id.split("#").shift();
        }
        return `${this._primaryKey}#${id}`;
    }
    /**
     * Gets a secondary key in form of REV#version from:
     *   id#0003
     *   0003
     *   3
     */
    private getSecondaryKeyRevision(version: string | number) {
        if (typeof version === "string" && version.includes("#") === true) {
            version = version.split("#").pop();
        }
        return `REV#${utils.zeroPad(version)}`;
    }

    private getSecondaryKeyLatest(): string {
        return "L";
    }

    private getSecondaryKeyPublished(): string {
        return "P";
    }
}
