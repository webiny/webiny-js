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
    createElasticsearchQueryBody,
    extractEntriesFromIndex,
    prepareEntryToIndex
} from "../../helpers";
import { createBasePartitionKey, paginateBatch } from "~/utils";
import { Client } from "@elastic/elasticsearch";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { encodeCursor } from "@webiny/api-elasticsearch/cursors";
import { compress, decompress } from "@webiny/api-elasticsearch/compression";

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

const getESLatestEntryData = async (context: CmsContext, entry: CmsContentEntry) => {
    return compress(context, {
        ...getEntryData(context, entry),
        latest: true,
        TYPE: TYPE_ENTRY_LATEST,
        __type: TYPE_ENTRY_LATEST
    });
};

const getESPublishedEntryData = async (context: CmsContext, entry: CmsContentEntry) => {
    return compress(context, {
        ...getEntryData(context, entry),
        published: true,
        TYPE: TYPE_ENTRY_PUBLISHED,
        __type: TYPE_ENTRY_PUBLISHED
    });
};

interface ElasticsearchTableItem {
    PK: string;
    SK: string;
    index: string;
    data: any;
}

interface ConstructorArgs {
    context: CmsContext;
}

/**
 * This implementation is not a general driver to fetch from DDB/Elastic.
 * Use some other implementation for general-use purpose.
 */
export default class CmsContentEntryDynamoElastic implements CmsContentEntryStorageOperations {
    private readonly context: CmsContext;
    private readonly _dataLoaders: DataLoadersHandler;
    private _esClient: Client;

    private get esClient(): Client {
        if (this._esClient) {
            return this._esClient;
        }
        const ctx = this.context as Partial<ElasticsearchContext>;
        if (!ctx.elasticsearch) {
            throw new WebinyError("Missing Elasticsearch client on the context");
        }
        this._esClient = ctx.elasticsearch as Client;
        return this._esClient;
    }

    private get partitionKey(): string {
        return `${createBasePartitionKey(this.context)}#CME`;
    }

    public constructor({ context }: ConstructorArgs) {
        this.context = context;
        this._dataLoaders = new DataLoadersHandler(context, this);
    }

    public async create(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsCreateArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;

        const { entry, storageEntry } = args;

        // const storageEntry = await entryToStorageTransform(this.context, model, data);

        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            storageEntry: lodashCloneDeep(storageEntry)
        });

        const { index: esIndex } = configurations.es(this.context, model);

        const esLatestData = await getESLatestEntryData(this.context, esEntry);
        const batch = db
            .batch()
            /**
             * Create main entry item
             */
            .create({
                ...configurations.db(),
                data: {
                    PK: this.getPartitionKey(entry.id),
                    SK: this.getSortKeyRevision(entry.version),
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
                    PK: this.getPartitionKey(entry.id),
                    SK: this.getSortKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST,
                    ...storageEntry
                }
            })
            .create({
                ...configurations.esDb(),
                data: {
                    PK: this.getPartitionKey(entry.id),
                    SK: this.getSortKeyLatest(),
                    index: esIndex,
                    data: esLatestData
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
                    entry,
                    storageEntry,
                    esEntry
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

        const { originalEntry, entry, storageEntry } = args;

        const esEntry = prepareEntryToIndex({
            context: this.context,
            model,
            storageEntry: lodashCloneDeep(storageEntry)
        });
        const { index: esIndex } = configurations.es(this.context, model);

        const primaryKey = this.getPartitionKey(storageEntry.id);
        const batch = db.batch();

        const esLatestData = await getESLatestEntryData(this.context, esEntry);
        batch
            /**
             * Create main entry item
             */
            .create({
                ...configurations.db(),
                data: {
                    PK: primaryKey,
                    SK: this.getSortKeyRevision(storageEntry.version),
                    TYPE: TYPE_ENTRY,
                    ...getEntryData(this.context, storageEntry)
                }
            })
            /**
             * Update "latest" entry item
             */
            .update({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST,
                    ...getEntryData(this.context, storageEntry)
                }
            })
            /**
             * Update the "latest" entry item in the Elasticsearch
             */
            .update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest(),
                    index: esIndex,
                    data: esLatestData
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
                    entry,
                    storageEntry,
                    esEntry
                }
            );
        }
        /**
         * There are no modifications on the entry created so just return the data.
         */
        return storageEntry;
    }

    public async delete(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsDeleteArgs
    ): Promise<void> {
        const { db } = this.context;
        const { entry } = args;

        const primaryKey = this.getPartitionKey(entry.id);

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
        const [esDbItems] = await db.read<CmsContentEntry>({
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
        const { entryToDelete, entryToSetAsLatest, storageEntryToSetAsLatest } = args;

        const primaryKey = this.getPartitionKey(entryToDelete.id);
        const esConfig = configurations.es(this.context, model);
        /**
         * We need published entry to delete it if necessary.
         */
        const publishedStorageEntry = await this.getPublishedRevisionByEntryId(
            model,
            entryToDelete.id
        );
        /**
         * We need to delete all existing records of the given entry revision.
         */
        const batch = db.batch();
        /**
         * Delete records of given entry revision.
         */
        batch.delete({
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSortKeyRevision(entryToDelete.id)
            }
        });
        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry && entryToDelete.id === publishedStorageEntry.id) {
            batch
                .delete({
                    ...configurations.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSortKeyPublished()
                    }
                })
                .delete({
                    ...configurations.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSortKeyPublished()
                    }
                });
        }
        if (entryToSetAsLatest) {
            const esEntry = prepareEntryToIndex({
                context: this.context,
                model,
                storageEntry: lodashCloneDeep(storageEntryToSetAsLatest)
            });

            const esLatestData = await getESLatestEntryData(this.context, esEntry);
            /**
             * In the end we need to set the new latest entry
             */
            batch
                .update({
                    ...configurations.db(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSortKeyLatest()
                    },
                    data: {
                        ...storageEntryToSetAsLatest,
                        TYPE: TYPE_ENTRY_LATEST
                    }
                })
                .update({
                    ...configurations.esDb(),
                    query: {
                        PK: primaryKey,
                        SK: this.getSortKeyLatest()
                    },
                    data: {
                        PK: primaryKey,
                        SK: this.getSortKeyLatest(),
                        index: esConfig.index,
                        data: esLatestData
                    }
                });
        }
        try {
            await batch.execute();
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entryToDelete,
                entryToSetAsLatest,
                storageEntryToSetAsLatest
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
        const limit = createLimit(args.limit, 50);
        const body = createElasticsearchQueryBody({
            model,
            args: {
                ...(args || {}),
                limit
            },
            context: this.context,
            parentPath: "values"
        });

        let response;
        const esConfig = configurations.es(this.context, model);
        try {
            response = await this.esClient.search({
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
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) : null;
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
            originalEntry,
            entry,
            storageEntry
            // latestEntry
        } = args;

        const { db } = this.context;

        const primaryKey = this.getPartitionKey(originalEntry.id);

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const latestStorageEntry = await this.getLatestRevisionByEntryId(model, originalEntry.id);

        const batch = db.batch();

        batch.update({
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSortKeyRevision(originalEntry.version)
            },
            data: {
                ...storageEntry,
                SK: this.getSortKeyRevision(originalEntry.version)
            }
        });
        /**
         * If the latest entry is the one being updated, we need to create a new latest entry records.
         */
        if (latestStorageEntry.id === originalEntry.id) {
            /**
             * First we update the regular DynamoDB table
             */
            batch.update({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    ...storageEntry,
                    TYPE: TYPE_ENTRY_LATEST,
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                }
            });
            /**
             * And then update the Elasticsearch table to propagate changes to the Elasticsearch
             */
            const esEntry = prepareEntryToIndex({
                context: this.context,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });
            const esDoc = {
                ...esEntry,
                savedOn: storageEntry.savedOn
            };

            const { index: esIndex } = configurations.es(this.context, model);

            const esLatestData = await getESLatestEntryData(this.context, esDoc);
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest(),
                    index: esIndex,
                    data: esLatestData
                }
            });
        }
        try {
            await batch.execute();
            this._dataLoaders.clearAllEntryRevisions(model);
            return storageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry.",
                ex.code || "UPDATE_ERROR",
                {
                    error: ex,
                    originalEntry,
                    entry,
                    storageEntry,
                    latestStorageEntry
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
            storageEntry
            // latestEntry,
            // publishedEntry
        } = args;

        /**
         * We need currently published entry to check if need to remove it.
         */
        const publishedStorageEntry = await this.getPublishedRevisionByEntryId(model, entry.id);

        const primaryKey = this.getPartitionKey(entry.id);

        const readBatch = db
            .batch()
            .read({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                }
            })
            .read({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyPublished()
                }
            });
        let latestESEntryData: ElasticsearchTableItem | undefined;
        let publishedESEntryData: ElasticsearchTableItem | undefined;
        try {
            [[[latestESEntryData]], [[publishedESEntryData]]] = await readBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read Elasticsearch latest or published data.",
                ex.code || "PUBLISH_BATCH_READ",
                {
                    latest: {
                        PK: primaryKey,
                        SK: this.getSortKeyLatest()
                    },
                    published: {
                        PK: primaryKey,
                        SK: this.getSortKeyPublished()
                    }
                }
            );
        }

        const batch = db.batch();

        batch.update({
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSortKeyRevision(entry.version)
            },
            data: {
                ...storageEntry,
                SK: this.getSortKeyRevision(entry.version)
            }
        });

        const es = configurations.es(this.context, model);

        if (publishedStorageEntry) {
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
                    SK: this.getSortKeyRevision(publishedStorageEntry.version)
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
                        SK: this.getSortKeyRevision(publishedStorageEntry.version)
                    },
                    data: {
                        ...previouslyPublishedStorageEntry,
                        SK: this.getSortKeyRevision(publishedStorageEntry.version),
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
                        SK: this.getSortKeyPublished()
                    },
                    data: {
                        ...getEntryData(this.context, storageEntry),
                        PK: primaryKey,
                        SK: this.getSortKeyPublished()
                    }
                });
        } else {
            batch.create({
                ...configurations.db(),
                data: {
                    ...getEntryData(this.context, storageEntry),
                    PK: primaryKey,
                    SK: this.getSortKeyPublished(),
                    TYPE: TYPE_ENTRY_PUBLISHED
                }
            });
        }

        /**
         * We need the latest entry to check if it neds to be updated as well in the Elasticsearch.
         */
        const latestStorageEntry = await this.getLatestRevisionByEntryId(model, entry.id);

        /**
         * If we are publishing the latest revision, let's also update the latest revision's status in ES.
         */
        if (latestStorageEntry && latestStorageEntry.id === entry.id) {
            /**
             * Need to decompress the data from Elasticsearch DynamoDB table.
             */
            const latestEsEntryDataDecompressed = await decompress(
                this.context,
                latestESEntryData.data
            );
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    ...latestESEntryData,
                    SK: this.getSortKeyLatest(),
                    data: {
                        ...latestEsEntryDataDecompressed,
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
            storageEntry: lodashCloneDeep(storageEntry)
        });
        /**
         * Update the published revision entry in ES.
         */
        const esLatestData = await getESPublishedEntryData(this.context, preparedEntryData);
        const esData = {
            PK: primaryKey,
            SK: this.getSortKeyPublished(),
            index: es.index,
            data: esLatestData
        };

        if (publishedESEntryData) {
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyPublished()
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
                    latestStorageEntry,
                    publishedStorageEntry
                }
            );
        }
    }

    public async unpublish(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsUnpublishArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;
        const { entry, storageEntry } = args;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const latestStorageEntry = await this.getLatestRevisionByEntryId(model, entry.id);

        const primaryKey = this.getPartitionKey(entry.id);

        const batch = db
            .batch()
            .delete({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyPublished()
                }
            })
            .delete({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyPublished()
                }
            })
            .update({
                ...configurations.db(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyRevision(entry.version)
                },
                data: {
                    ...storageEntry,
                    SK: this.getSortKeyRevision(entry.version)
                }
            });
        /**
         * If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
         */
        if (latestStorageEntry.id === entry.id) {
            const es = configurations.es(this.context, model);

            const preparedEntryData = prepareEntryToIndex({
                context: this.context,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });

            const esLatestData = await getESLatestEntryData(this.context, preparedEntryData);
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest(),
                    index: es.index,
                    data: esLatestData
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
                    latestStorageEntry
                }
            );
        }
    }

    public async requestChanges(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsRequestChangesArgs
    ): Promise<CmsContentEntry> {
        const { db } = this.context;
        const { entry, storageEntry, originalEntry } = args;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const latestStorageEntry = await this.getLatestRevisionByEntryId(model, entry.id);

        const primaryKey = this.getPartitionKey(entry.id);

        const batch = db.batch().update({
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSortKeyRevision(entry.version)
            },
            data: {
                ...storageEntry,
                SK: this.getSortKeyRevision(entry.version)
            }
        });

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        if (latestStorageEntry.id === entry.id) {
            const es = configurations.es(this.context, model);

            const preparedEntryData = prepareEntryToIndex({
                context: this.context,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });

            const esLatestData = await getESLatestEntryData(this.context, preparedEntryData);
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest(),
                    index: es.index,
                    data: esLatestData
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
        const { entry, storageEntry, originalEntry } = args;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const latestStorageEntry = await this.getLatestRevisionByEntryId(model, entry.id);

        const primaryKey = this.getPartitionKey(entry.id);

        const batch = db.batch().update({
            ...configurations.db(),
            query: {
                PK: primaryKey,
                SK: this.getSortKeyRevision(entry.version)
            },
            data: {
                ...storageEntry,
                SK: this.getSortKeyRevision(entry.version)
            }
        });

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        if (latestStorageEntry.id === entry.id) {
            const es = configurations.es(this.context, model);

            const preparedEntryData = prepareEntryToIndex({
                context: this.context,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });

            const esLatestData = await getESLatestEntryData(this.context, preparedEntryData);
            batch.update({
                ...configurations.esDb(),
                query: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest()
                },
                data: {
                    PK: primaryKey,
                    SK: this.getSortKeyLatest(),
                    index: es.index,
                    data: esLatestData
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
                    latestStorageEntry,
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
            PK: this.getPartitionKey(id),
            SK: this.getSortKeyRevision(id)
        });
    }

    public async getPublishedRevisionByEntryId(
        model: CmsContentModel,
        entryId: string
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            PK: this.getPartitionKey(entryId),
            SK: this.getSortKeyPublished()
        });
    }

    public async getLatestRevisionByEntryId(
        model: CmsContentModel,
        entryId: string
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            PK: this.getPartitionKey(entryId),
            SK: this.getSortKeyLatest()
        });
    }

    public async getPreviousRevision(
        model: CmsContentModel,
        entryId: string,
        version: number
    ): Promise<CmsContentEntry | null> {
        const entry = await this.getSingleDynamoDbItem(
            {
                PK: this.getPartitionKey(entryId),
                SK: {
                    $lt: this.getSortKeyRevision(version)
                }
            },
            {
                SK: -1
            }
        );
        /**
         * When there are no lower versions from the given one, it seems that random one is taken.
         * So just make sure that fetched entry version is not greater or equal to requested one.
         */
        if (!entry || entry.version >= version) {
            return null;
        }
        /**
         * We need this due to possibly getting latest or published if given revision does not exist
         */
        if ((entry as any).TYPE !== TYPE_ENTRY) {
            return null;
        }
        return entry;
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

    public getPartitionKey(id: string): string {
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
     * Gets a sort key in form of REV#version from:
     *   id#0003
     *   0003
     *   3
     */
    public getSortKeyRevision(version: string | number) {
        if (typeof version === "string" && version.includes("#") === true) {
            version = version.split("#").pop();
        }
        return `REV#${zeroPad(version)}`;
    }

    public getSortKeyLatest(): string {
        return "L";
    }

    public getSortKeyPublished(): string {
        return "P";
    }
}
