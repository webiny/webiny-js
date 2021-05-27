import WebinyError from "@webiny/error";
import lodashCloneDeep from "lodash.clonedeep";
import lodashOmit from "lodash.omit";
import { DataLoadersHandler } from "./dataLoaders";
import {
    CmsContentEntry,
    CmsContentEntryStorageOperations,
    CmsContentEntryStorageOperationsCreateArgs,
    CmsContentEntryStorageOperationsCreateRevisionFromArgs,
    CmsContentEntryStorageOperationsDeleteArgs,
    CmsContentEntryStorageOperationsDeleteRevisionArgs,
    CmsContentEntryStorageOperationsGetArgs,
    CmsContentEntryStorageOperationsListArgs,
    CmsContentEntryStorageOperationsListResponse,
    CmsContentEntryStorageOperationsPublishArgs,
    CmsContentEntryStorageOperationsRequestChangesArgs,
    CmsContentEntryStorageOperationsRequestReviewArgs,
    CmsContentEntryStorageOperationsUnpublishArgs,
    CmsContentEntryStorageOperationsUpdateArgs,
    CmsContentModel,
    CmsContext,
    CONTENT_ENTRY_STATUS
} from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";
import { zeroPad } from "@webiny/api-headless-cms/utils";
import {
    createElasticsearchLimit,
    createElasticsearchQueryBody,
    extractEntriesFromIndex,
    prepareEntryToIndex
} from "../../helpers";
import { createBasePartitionKey, encodeElasticsearchCursor, paginateBatch } from "../../utils";
import {
    entryToStorageTransform,
    entryFromStorageTransform
} from "@webiny/api-headless-cms/transformers";

export const TYPE_ENTRY = "cms.entry";
export const TYPE_ENTRY_LATEST = TYPE_ENTRY + ".l";
export const TYPE_ENTRY_PUBLISHED = TYPE_ENTRY + ".p";

const getEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...lodashOmit(entry, ["PK", "SK", "published", "latest"]),
        TYPE: TYPE_ENTRY,
        __type: TYPE_ENTRY
    };
};

const getESLatestEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...getEntryData(context, entry),
        latest: true,
        TYPE: TYPE_ENTRY_LATEST,
        __type: TYPE_ENTRY_LATEST
    };
};

const getESPublishedEntryData = (context: CmsContext, entry: CmsContentEntry) => {
    return {
        ...getEntryData(context, entry),
        published: true,
        TYPE: TYPE_ENTRY_PUBLISHED,
        __type: TYPE_ENTRY_PUBLISHED
    };
};

interface ConstructorArgs {
    context: CmsContext;
}

/**
 * This implementation is not a general driver to fetch from DDB/Elastic.
 * Use some other implementation for general-use purpose.
 */
export default class CmsContentEntryDynamoElastic implements CmsContentEntryStorageOperations {
    private readonly _context: CmsContext;
    private _partitionKey: string;
    private readonly _dataLoaders: DataLoadersHandler;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        if (!this._partitionKey) {
            this._partitionKey = `${createBasePartitionKey(this.context)}#CME`;
        }
        return this._partitionKey;
    }

    public constructor({ context }: ConstructorArgs) {
        this._context = context;
        this._dataLoaders = new DataLoadersHandler(context, this);
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
            originalEntry: lodashCloneDeep(data),
            storageEntry: lodashCloneDeep(storageEntry)
        });

        const { index: esIndex } = configurations.es(this.context, model);

        const batch = db
            .batch()
            /**
             * Create main entry item
             */
            .create({
                ...configurations.db(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyRevision(data.version),
                    TYPE: TYPE_ENTRY,
                    ...storageEntry
                }
            })
            /**
             * Create "latest" entry item
             */
            .create({
                ...configurations.db(),
                data: {
                    PK: this.getPrimaryKey(data.id),
                    SK: this.getSecondaryKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST,
                    ...storageEntry
                }
            })
            .create({
                ...configurations.esDb(),
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
            originalEntry: lodashCloneDeep(data),
            storageEntry: lodashCloneDeep(storageData)
        });
        const { index: esIndex } = configurations.es(this.context, model);

        const primaryKey = this.getPrimaryKey(storageData.id);
        const batch = db.batch();
        batch
            /**
             * Create main entry item
             */
            .create({
                ...configurations.db(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(storageData.version),
                    TYPE: TYPE_ENTRY,
                    ...getEntryData(this.context, storageData)
                }
            })
            /**
             * Update "latest" entry item
             */
            .update({
                ...configurations.db(),
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
            /**
             * Update the "latest" entry item in the Elasticsearch
             */
            .update({
                ...configurations.esDb(),
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
        /**
         * There are no modifications on the entry created so just return the data.
         */
        return data;
    }

    public async delete(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsDeleteArgs
    ): Promise<void> {
        const { db } = this.context;
        const { entry } = args;

        const primaryKey = this.getPrimaryKey(entry.id);

        const [dbItems] = await db.read<CmsContentEntry>({
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: { $gte: " " }
            }
        });
        /**
         * Load ES entries to delete
         */
        const [esDbItems] = await db.read({
            ...configurations.esDb(),
            query: {
                PK: primaryKey,
                SK: { $gte: " " }
            }
        });

        /**
         * Delete all items from DB and ES DB
         */
        await Promise.all([
            paginateBatch(dbItems, 25, async items => {
                await db
                    .batch()
                    .delete(
                        ...items.map((item: any) => ({
                            ...configurations.db(),
                            query: {
                                PK: item.PK,
                                SK: item.SK
                            }
                        }))
                    )
                    .execute();
            }),
            paginateBatch(esDbItems, 25, async items => {
                await db
                    .batch()
                    .delete(
                        ...items.map((item: any) => ({
                            ...configurations.esDb(),
                            query: {
                                PK: item.PK,
                                SK: item.SK
                            }
                        }))
                    )
                    .execute();
            })
        ]);
    }

    public async deleteRevision(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsDeleteRevisionArgs
    ): Promise<void> {
        const { db } = this.context;
        const {
            entryRevisionToDelete,
            entryRevisionToSetAsLatest,
            publishedEntryRevision,
            latestEntryRevision
        } = args;

        const primaryKey = this.getPrimaryKey(entryRevisionToDelete.id);
        const esConfig = configurations.es(this.context, model);
        /**
         * We need to delete all existing records of the given entry revision.
         */
        const batch = db.batch();
        /**
         * Delete records of given entry revision.
         */
        batch
            .delete({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(entryRevisionToDelete.id)
                }
            })
            .delete({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(entryRevisionToDelete.id)
                }
            });
        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedEntryRevision && entryRevisionToDelete.id === publishedEntryRevision.id) {
            batch
                .delete({
                    ...configurations.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyPublished()
                    }
                })
                .delete({
                    ...configurations.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyPublished()
                    }
                });
        }
        if (entryRevisionToSetAsLatest) {
            const originalEntry = await entryFromStorageTransform(
                this.context,
                model,
                entryRevisionToSetAsLatest
            );

            const esEntry = prepareEntryToIndex({
                context: this.context,
                model,
                originalEntry: lodashCloneDeep(originalEntry),
                storageEntry: lodashCloneDeep(entryRevisionToSetAsLatest)
            });
            /**
             * In the end we need to set the new latest entry
             */
            batch
                .update({
                    ...configurations.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest()
                    },
                    data: {
                        ...entryRevisionToSetAsLatest,
                        TYPE: TYPE_ENTRY_LATEST
                    }
                })
                .update({
                    ...configurations.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest()
                    },
                    data: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyLatest(),
                        index: esConfig.index,
                        data: getESLatestEntryData(this.context, esEntry)
                    }
                });
        }
        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entryRevisionToDelete,
                entryRevisionToSetAsLatest,
                publishedEntryRevision,
                latestEntryRevision
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
        const esConfig = configurations.es(this.context, model);
        try {
            response = await elasticSearch.search({
                ...esConfig,
                body
            });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code || "ELASTICSEARCH_ERROR", {
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
            /**
             * Remove the last item from results, we don't want to include it.
             */
            items.pop();
        }
        /**
         * Cursor is the `sort` value of the last item in the array.
         * https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
         */
        const cursor =
            items.length > 0 ? encodeElasticsearchCursor(hits[items.length - 1].sort) : null;
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
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(originalEntry.version)
            },
            data: {
                ...data,
                SK: this.getSecondaryKeyRevision(originalEntry.version)
            }
        });

        if (latestEntry.id === originalEntry.id) {
            /**
             * First we update the regular DynamoDB table
             */
            batch.update({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    ...data,
                    TYPE: TYPE_ENTRY_LATEST,
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                }
            });
            /**
             * And then update the Elasticsearch table to propagate changes to the Elasticsearch
             */
            const esEntry = prepareEntryToIndex({
                context: this.context,
                model,
                originalEntry: lodashCloneDeep(originalEntry),
                storageEntry: lodashCloneDeep(data)
            });
            const esDoc = {
                ...esEntry,
                savedOn: data.savedOn
            };

            const { index: esIndex } = configurations.es(this.context, model);

            batch.update({
                ...configurations.esDb(),
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
            this._dataLoaders.clearAllEntryRevisions(model);
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
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                }
            })
            .read({
                ...configurations.esDb(),
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
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(entry.version)
            },
            data: entry
        });

        const es = configurations.es(this.context, model);

        if (publishedEntry) {
            /**
             * If there is a `published` entry already, we need to set it to `unpublished`. We need to
             * execute two updates: update the previously published entry's status and the published entry record.
             * DynamoDB does not support `batchUpdate` - so here we load the previously published
             * entry's data to update its status within a batch operation. If, hopefully,
             * they introduce a true update batch operation, remove this `read` call.
             */
            const [[previouslyPublishedStorageEntry]] = await db.read<CmsContentEntry>({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(publishedEntry.version)
                }
            });

            previouslyPublishedStorageEntry.status = CONTENT_ENTRY_STATUS.UNPUBLISHED;

            batch
                .update({
                    /**
                     * Update currently published entry (unpublish it)
                     */
                    ...configurations.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSecondaryKeyRevision(publishedEntry.version)
                    },
                    data: {
                        ...previouslyPublishedStorageEntry,
                        savedOn: entry.savedOn
                    }
                })
                .update({
                    /**
                     * Update the helper item in DB with the new published entry ID
                     */
                    ...configurations.db(),
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
                ...configurations.db(),
                data: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished(),
                    TYPE: TYPE_ENTRY_PUBLISHED,
                    ...getEntryData(this.context, entry)
                }
            });
        }

        /**
         * If we are publishing the latest revision, let's also update the latest revision's status in ES.
         */
        if (latestEntry && latestEntry.id === entry.id) {
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyLatest()
                },
                data: {
                    ...latestESEntryData,
                    data: {
                        ...((latestESEntryData as any).data || {}),
                        status: CONTENT_ENTRY_STATUS.PUBLISHED,
                        locked: true,
                        savedOn: entry.savedOn,
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
        /**
         * Update the published revision entry in ES.
         */
        const esData = {
            PK: primaryKey,
            SK: this.getSecondaryKeyPublished(),
            index: es.index,
            data: getESPublishedEntryData(this.context, preparedEntryData)
        };

        if (publishedESEntryData) {
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                },
                data: esData
            });
        } else {
            batch.create({
                ...configurations.esDb(),
                data: esData
            });
        }

        /**
         * Finally, execute batch
         */
        try {
            await batch.execute();
            this._dataLoaders.clearAllEntryRevisions(model, entry);
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
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            })
            .delete({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyPublished()
                }
            })
            .update({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSecondaryKeyRevision(entry.version)
                },
                data: entry
            });
        /**
         * If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
         */
        if (latestEntry.id === entry.id) {
            const es = configurations.es(this.context, model);

            batch.update({
                ...configurations.esDb(),
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
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(entry.version)
            },
            data: entry
        });

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        if (latestEntry.id === entry.id) {
            const es = configurations.es(this.context, model);
            batch.update({
                ...configurations.esDb(),
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
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSecondaryKeyRevision(entry.version)
            },
            data: entry
        });

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        if (latestEntry.id === entry.id) {
            const es = configurations.es(this.context, model);
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
        try {
            return await this._dataLoaders.getAllEntryRevisions(model, ids);
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
        try {
            return await this._dataLoaders.getRevisionById(model, ids);
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
        try {
            return await this._dataLoaders.getPublishedRevisionByEntryId(model, ids);
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
        try {
            return await this._dataLoaders.getLatestRevisionByEntryId(model, ids);
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
        try {
            return await this._dataLoaders.getAllEntryRevisions(model, [id]);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read multiple entries.",
                ex.code || "GET_ALL_REVISIONS_BY_IDS_ERROR",
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
                ...configurations.db(),
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

    public getPrimaryKey(id: string): string {
        /**
         * If ID includes # it means it is composed of ID and VERSION.
         * We need ID only so extract it.
         */
        if (id.includes("#")) {
            id = id.split("#").shift();
        }
        return `${this.partitionKey}#${id}`;
    }
    /**
     * Gets a secondary key in form of REV#version from:
     *   id#0003
     *   0003
     *   3
     */
    public getSecondaryKeyRevision(version: string | number) {
        if (typeof version === "string" && version.includes("#") === true) {
            version = version.split("#").pop();
        }
        return `REV#${zeroPad(version)}`;
    }

    public getSecondaryKeyLatest(): string {
        return "L";
    }

    public getSecondaryKeyPublished(): string {
        return "P";
    }
}
