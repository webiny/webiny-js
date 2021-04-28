import WebinyError from "@webiny/error";
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
    createBasePartitionKey,
    decodePaginationCursor,
    encodePaginationCursor
} from "../../utils";
import { entryToStorageTransform } from "@webiny/api-headless-cms/transformers";
import { Entity, Table } from "dynamodb-toolbox";
import { getDocumentClient, getTable } from "../helpers";
import { createFilters } from "./filters";
import { queryOptions as DDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";

export const TYPE_ENTRY = "cms.entry";
export const TYPE_ENTRY_LATEST = TYPE_ENTRY + ".l";
export const TYPE_ENTRY_PUBLISHED = TYPE_ENTRY + ".p";

interface ConstructorArgs {
    context: CmsContext;
}

interface GetSingleDynamoDBItemArgs {
    partitionKey: string;
    value: any;
    op?: "eq" | "lt" | "lte" | "gt" | "gte" | "between" | "beginsWith";
    order?: string;
}

/**
 * We do not use transactions in this storage operations implementation due to their cost.
 */
export default class CmsContentEntryDynamo implements CmsContentEntryStorageOperations {
    private readonly _context: CmsContext;
    private readonly _partitionKey: string;
    private readonly _dataLoaders: DataLoadersHandler;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        return this._partitionKey;
    }

    public constructor({ context }: ConstructorArgs) {
        this._context = context;
        this._partitionKey = `${createBasePartitionKey(this.context)}#CME`;
        this._dataLoaders = new DataLoadersHandler(context, this);

        this._table = new Table({
            name: configurations.db().table || getTable(context),
            partitionKey: "PK",
            sortKey: "SK",
            DocumentClient: getDocumentClient(context)
        });

        this._entity = new Entity({
            name: "ContentEntry",
            table: this._table,
            attributes: {
                PK: {
                    partitionKey: true
                },
                SK: {
                    sortKey: true
                },
                TYPE: {
                    type: "string"
                },
                webinyVersion: {
                    type: "string"
                },
                entryId: {
                    type: "string"
                },
                id: {
                    type: "string"
                },
                createdBy: {
                    type: "map"
                },
                ownedBy: {
                    type: "map"
                },
                createdOn: {
                    type: "string"
                },
                savedOn: {
                    type: "string"
                },
                modelId: {
                    type: "string"
                },
                locale: {
                    type: "string"
                },
                publishedOn: {
                    type: "string"
                },
                version: {
                    type: "number"
                },
                locked: {
                    type: "boolean"
                },
                status: {
                    type: "string"
                },
                values: {
                    type: "map"
                }
            }
        });
    }

    public async create(
        model: CmsContentModel,
        { data }: CmsContentEntryStorageOperationsCreateArgs
    ): Promise<CmsContentEntry> {
        const storageEntry = await entryToStorageTransform(this.context, model, data);

        const partitionKey = this.getPartitionKey(data.id);
        const items = [
            // Create main entry item
            this._entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: this.getSortKeyRevision(data.version),
                TYPE: TYPE_ENTRY
            }),
            // Create latest entry item
            this._entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: this.getSortKeyLatest(),
                TYPE: TYPE_ENTRY_LATEST
            })
        ];

        try {
            await this._table.batchWrite(items);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert data into the DynamoDB.",
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
        const {
            originalEntryRevision: originalEntry,
            data,
            latestEntryRevision: latestEntry
        } = args;

        const storageEntry = await entryToStorageTransform(this.context, model, data);
        const partitionKey = this.getPartitionKey(storageEntry.id);

        const items = [
            // Create main entry item
            this._entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: this.getSortKeyRevision(storageEntry.version),
                TYPE: TYPE_ENTRY
            }),
            // Update latest entry item
            this._entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: this.getSortKeyLatest(),
                TYPE: TYPE_ENTRY_LATEST
            })
        ];
        try {
            await this._table.batchWrite(items);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    originalEntry,
                    latestEntry,
                    data,
                    storageEntry
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
        const { entry } = args;
        const partitionKey = this.getPartitionKey(entry.id);

        const results = await this._entity.query(partitionKey, {
            gte: " "
        });

        const keys = results.Items.map(item => ({
            PK: partitionKey,
            SK: item.SK
        }));
        try {
            await this._table.batchWrite(keys.map(key => this._entity.deleteBatch(key)));
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete the entry.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    partitionKey,
                    keys
                }
            );
        }
    }

    public async deleteRevision(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsDeleteRevisionArgs
    ): Promise<void> {
        const {
            entryRevisionToDelete,
            entryRevisionToSetAsLatest,
            publishedEntryRevision,
            latestEntryRevision
        } = args;
        const partitionKey = this.getPartitionKey(entryRevisionToDelete.id);

        const items = [
            this._entity.deleteBatch({
                PK: partitionKey,
                SK: this.getSortKeyRevision(entryRevisionToDelete.id)
            })
        ];
        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedEntryRevision && entryRevisionToDelete.id === publishedEntryRevision.id) {
            items.push(
                this._entity.deleteBatch({
                    PK: partitionKey,
                    SK: this.getSortKeyPublished()
                })
            );
        }
        if (entryRevisionToSetAsLatest) {
            items.push(
                this._entity.putBatch({
                    ...entryRevisionToSetAsLatest,
                    PK: partitionKey,
                    SK: this.getSortKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST
                })
            );
        }
        try {
            await this._table.batchWrite(items);
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

    public async list(
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsListArgs
    ): Promise<CmsContentEntryStorageOperationsListResponse> {
        const { limit, where, after } = args;

        const filters = createFilters({
            context: this.context,
            model,
            where
        });

        let items: CmsContentEntry[] = [];

        const scanner = async (previousResults, items) => {
            let result;
            if (!previousResults && items.length === 0) {
                result = await this._entity.scan({
                    filters
                });
            } else if (previousResults && typeof previousResults.next === "function") {
                result = await previousResults.next();
            } else {
                return null;
            }
            if (!result || !result.Items || !Array.isArray(result.Items)) {
                throw new WebinyError(
                    "Error when scanning for content entries - no result.",
                    "SCAN_ERROR",
                    {
                        filters
                    }
                );
            }
            return result;
        };
        try {
            let previousResults = undefined;
            let results;
            while ((results = await scanner(previousResults, items))) {
                items.push(...results.Items);
                previousResults = results;
            }
            // const result = await this._entity.scan({
            //     filters,
            //     limit: limit + 1,
            // });
            // if (!result || !result.Items || !Array.isArray(result.items)) {
            //     throw new WebinyError(
            //         "Error when scanning for content entries - no result",
            //         "SCAN_ERROR",
            //         {
            //             filters,
            //         }
            //     );
            // }
            // items.push(...result.Items);
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code || "SCAN_ERROR", {
                error: ex,
                filters
            });
        }

        const hasMoreItems = items.length > limit;
        const start = decodePaginationCursor(after) || 0;
        if (hasMoreItems) {
            items = items.slice(start, limit);
        }

        const cursor = items.length > 0 ? encodePaginationCursor(start + limit) : null;
        return {
            hasMoreItems,
            totalCount: items.length,
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

        // const { db } = this.context;

        const partitionKey = this.getPartitionKey(originalEntry.id);

        // const items = [
        //     this._entity.putBatch({
        //         PK: primaryKey,
        //         SK: this.getSortKeyRevision(originalEntry.version),
        //         ...originalEntry,
        //         ...data
        //     }),
        // ];

        // const batch = db.batch();

        // batch.update({
        //     ...configurations.db(),
        //     query: {
        //         PK: primaryKey,
        //         SK: this.getSortKeyRevision(originalEntry.version)
        //     },
        //     data
        // });

        // if (latestEntry.id === originalEntry.id) {
        //
        //     batch.update({
        //         ...configurations.esDb(),
        //         query: {
        //             PK: primaryKey,
        //             SK: this.getSortKeyLatest()
        //         },
        //         data: {
        //             PK: primaryKey,
        //             SK: this.getSortKeyLatest(),
        //             index: esIndex,
        //             data: getESLatestEntryData(this.context, esDoc)
        //         }
        //     });
        // }
        try {
            await this._entity.update({
                PK: partitionKey,
                SK: this.getSortKeyRevision(originalEntry.version),
                ...data
            });
            return {
                ...originalEntry,
                ...data
            };
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
        // const { db } = this.context;
        const {
            entry,
            // originalEntryRevision,
            latestEntryRevision: latestEntry,
            publishedEntryRevision: publishedEntry
        } = args;

        const partitionKey = this.getPartitionKey(entry.id);

        // const readBatch = db
        //     .batch()
        //     .read({
        //         ...configurations.esDb(),
        //         query: {
        //             PK: primaryKey,
        //             SK: this.getSortKeyLatest()
        //         }
        //     })
        //     .read({
        //         ...configurations.esDb(),
        //         query: {
        //             PK: primaryKey,
        //             SK: this.getSortKeyPublished()
        //         }
        //     });
        // let latestESEntryData: CmsContentEntry | undefined;
        // let publishedESEntryData: CmsContentEntry | undefined;
        // try {
        //     [[[latestESEntryData]], [[publishedESEntryData]]] = await readBatch.execute();
        // } catch (ex) {
        //     throw new WebinyError(
        //         ex.message || "Could not read Elasticsearch latest or published data.",
        //         ex.code || "PUBLISH_BATCH_READ",
        //         {
        //             latest: {
        //                 PK: primaryKey,
        //                 SK: this.getSortKeyLatest()
        //             },
        //             published: {
        //                 PK: primaryKey,
        //                 SK: this.getSortKeyPublished()
        //             }
        //         }
        //     );
        // }

        const items = [
            this._entity.putBatch({
                ...entry,
                PK: partitionKey,
                SK: this.getSortKeyRevision(entry.version)
            })
        ];

        // const batch = db.batch();
        //
        // batch.update({
        //     ...configurations.db(),
        //     query: {
        //         PK: partitionKey,
        //         SK: this.getSortKeyRevision(entry.version),
        //     },
        //     data: entry
        // });

        // const es = configurations.es(this.context, model);

        if (publishedEntry) {
            /**
             * If there is a `published` entry already, we need to set it to `unpublished`. We need to
             * execute two updates: update the previously published entry's status and the published entry record.
             * DynamoDB does not support `batchUpdate` - so here we load the previously published
             * entry's data to update its status within a batch operation. If, hopefully,
             * they introduce a true update batch operation, remove this `read` call.
             */
            // const [[previouslyPublishedStorageEntry]] = await db.read<CmsContentEntry>({
            //     ...configurations.db(),
            //     query: {
            //         PK: partitionKey,
            //         SK: this.getSortKeyRevision(publishedEntry.version)
            //     }
            // });

            // previouslyPublishedStorageEntry.status = CONTENT_ENTRY_STATUS.UNPUBLISHED;

            items.push(
                this._entity.putBatch({
                    ...publishedEntry,
                    PK: partitionKey,
                    SK: this.getSortKeyRevision(publishedEntry.version),
                    TYPE: TYPE_ENTRY,
                    status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                })
            );
            // batch
            //     .update({
            //         /**
            //          * Update currently published entry (unpublish it)
            //          */
            //         ...configurations.db(),
            //         query: {
            //             PK: partitionKey,
            //             SK: this.getSortKeyRevision(publishedEntry.version)
            //         },
            //         data: previouslyPublishedStorageEntry
            //     })
            //     .update({
            //         /**
            //          * Update the helper item in DB with the new published entry ID
            //          */
            //         ...configurations.db(),
            //         query: {
            //             PK: partitionKey,
            //             SK: this.getSortKeyPublished()
            //         },
            //         data: {
            //             PK: partitionKey,
            //             SK: this.getSortKeyPublished(),
            //             ...getEntryData(this.context, publishedEntry),
            //             ...getEntryData(this.context, entry)
            //         }
            //     });
        } else {
            items.push(
                this._entity.putBatch({
                    PK: partitionKey,
                    SK: this.getSortKeyPublished(),
                    TYPE: TYPE_ENTRY_PUBLISHED
                })
            );
            // batch.create({
            //     ...configurations.db(),
            //     data: {
            //         PK: partitionKey,
            //         SK: this.getSortKeyPublished(),
            //         TYPE: TYPE_ENTRY_PUBLISHED,
            //         ...getEntryData(this.context, entry)
            //     }
            // });
        }

        /**
         * If we are publishing the latest revision, let's also update the latest revision's status in ES.
         */
        // if (latestEntry && latestEntry.id === entry.id) {
        //     batch.update({
        //         ...configurations.esDb(),
        //         query: {
        //             PK: partitionKey,
        //             SK: this.getSortKeyLatest()
        //         },
        //         data: {
        //             ...latestESEntryData,
        //             data: {
        //                 ...((latestESEntryData as any).data || {}),
        //                 status: CONTENT_ENTRY_STATUS.PUBLISHED,
        //                 locked: true,
        //                 publishedOn: entry.publishedOn
        //             }
        //         }
        //     });
        // }

        // const preparedEntryData = prepareEntryToIndex({
        //     context: this.context,
        //     model,
        //     originalEntry: await entryFromStorageTransform(this.context, model, entry),
        //     storageEntry: entry
        // });
        // /**
        //  * Update the published revision entry in ES.
        //  */
        // const esData = {
        //     PK: partitionKey,
        //     SK: this.getSortKeyPublished(),
        //     index: es.index,
        //     data: getESPublishedEntryData(this.context, preparedEntryData)
        // };

        // if (publishedESEntryData) {
        //     batch.update({
        //         ...configurations.esDb(),
        //         query: {
        //             PK: partitionKey,
        //             SK: this.getSortKeyPublished()
        //         },
        //         data: esData
        //     });
        // } else {
        //     batch.create({
        //         ...configurations.esDb(),
        //         data: esData
        //     });
        // }

        /**
         * Finally, execute batch
         */
        try {
            await this._table.batchWrite(items);
            this._dataLoaders.clearAllEntryRevisions(model, entry);
            return entry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute the publishing batch.",
                ex.code || "PUBLISH_ERROR",
                {
                    entry,
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
        // const { db } = this.context;
        const { entry, latestEntryRevision: latestEntry } = args;

        const partitionKey = this.getPartitionKey(entry.id);

        const items = [
            this._entity.deleteBatch({
                PK: partitionKey,
                SK: this.getSortKeyPublished()
            }),
            this._entity.putBatch({
                PK: partitionKey,
                SK: this.getSortKeyRevision(entry.version),
                entry
            })
        ];

        // const batch = db
        //     .batch()
        //     .delete({
        //         ...configurations.db(),
        //         query: {
        //             PK: primaryKey,
        //             SK: this.getSortKeyPublished()
        //         }
        //     })
        //     .delete({
        //         ...configurations.esDb(),
        //         query: {
        //             PK: primaryKey,
        //             SK: this.getSortKeyPublished()
        //         }
        //     })
        //     .update({
        //         ...configurations.db(),
        //         query: {
        //             PK: primaryKey,
        //             SK: this.getSortKeyRevision(entry.version)
        //         },
        //         data: entry
        //     });
        /**
         * If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
         */
        if (latestEntry.id === entry.id) {
            items.push(
                this._entity.putBatch({
                    PK: partitionKey,
                    SK: this.getSortKeyLatest(),
                    entry
                })
            );
            // const es = configurations.es(this.context, model);
            //
            // batch.update({
            //     ...configurations.esDb(),
            //     query: {
            //         PK: primaryKey,
            //         SK: this.getSortKeyLatest()
            //     },
            //     data: {
            //         PK: primaryKey,
            //         SK: this.getSortKeyLatest(),
            //         index: es.index,
            //         data: getESLatestEntryData(this.context, entry)
            //     }
            // });
        }

        try {
            await this._table.batchWrite(items);
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
        // const { db } = this.context;
        const {
            entry,
            originalEntryRevision: originalEntry,
            latestEntryRevision: latestEntry
        } = args;

        const partitionKey = this.getPartitionKey(entry.id);

        const items = [
            this._entity.putBatch({
                ...entry,
                PK: partitionKey,
                SK: this.getSortKeyRevision(entry.version)
            })
        ];

        // const batch = db.batch().update({
        //     ...configurations.db(),
        //     query: {
        //         PK: partitionKey,
        //         SK: this.getSortKeyRevision(entry.version)
        //     },
        //     data: entry
        // });

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        if (latestEntry.id === entry.id) {
            items.push(
                this._entity.putBatch({
                    ...entry,
                    PK: partitionKey,
                    SK: this.getSortKeyLatest(),
                    TYPE: TYPE_ENTRY_LATEST
                })
            );
            // const es = configurations.es(this.context, model);
            // batch.update({
            //     ...configurations.esDb(),
            //     query: {
            //         PK: partitionKey,
            //         SK: this.getSortKeyLatest()
            //     },
            //     data: {
            //         PK: partitionKey,
            //         SK: this.getSortKeyLatest(),
            //         index: es.index,
            //         data: getESLatestEntryData(this.context, entry)
            //     }
            // });
        }

        try {
            await this._table.batchWrite(items);
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
        // const { db } = this.context;
        const {
            entry,
            originalEntryRevision: originalEntry,
            latestEntryRevision: latestEntry
        } = args;

        const partitionKey = this.getPartitionKey(entry.id);

        const items = [
            this._entity.putBatch({
                ...entry,
                PK: partitionKey,
                SK: this.getSortKeyRevision(entry.version)
            })
        ];

        // const batch = db.batch().update({
        //     ...configurations.db(),
        //     query: {
        //         PK: partitionKey,
        //         SK: this.getSortKeyRevision(entry.version)
        //     },
        //     data: entry
        // });

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        if (latestEntry.id === entry.id) {
            items.push(
                this._entity.putBatch({
                    ...entry,
                    TYPE: TYPE_ENTRY_LATEST,
                    PK: partitionKey,
                    SK: this.getSortKeyLatest()
                })
            );
            // const es = configurations.es(this.context, model);
            // batch.update({
            //     query: {
            //         PK: partitionKey,
            //         SK: this.getSortKeyLatest()
            //     },
            //     data: {
            //         PK: partitionKey,
            //         SK: this.getSortKeyLatest(),
            //         index: es.index,
            //         data: getESLatestEntryData(this.context, entry)
            //     }
            // });
        }

        try {
            await this._table.batchWrite(items);
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
            partitionKey: this.getPartitionKey(id),
            value: this.getSortKeyRevision(id)
        });
    }

    public async getPublishedRevisionByEntryId(
        model: CmsContentModel,
        entryId: string
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            partitionKey: this.getPartitionKey(entryId),
            value: this.getSortKeyPublished()
        });
    }

    public async getLatestRevisionByEntryId(
        model: CmsContentModel,
        entryId: string
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            partitionKey: this.getPartitionKey(entryId),
            value: this.getSortKeyLatest()
        });
    }

    public async getPreviousRevision(
        model: CmsContentModel,
        entryId: string,
        version: number
    ): Promise<CmsContentEntry | null> {
        return this.getSingleDynamoDbItem({
            partitionKey: this.getPartitionKey(entryId),
            op: "lt",
            value: this.getSortKeyRevision(version),
            order: "DESC"
        });
    }

    private async getSingleDynamoDbItem(
        args: GetSingleDynamoDBItemArgs
    ): Promise<CmsContentEntry | null> {
        const { partitionKey, op = "eq", value, order = "ASC" } = args;
        const queryOptions: DDBToolboxQueryOptions = {
            [op]: value,
            reverse: order === "DESC",
            limit: 1
        };

        try {
            const result = await this._entity.query(partitionKey, queryOptions);
            if (!result || Array.isArray(result.Items) === false) {
                throw new WebinyError(
                    "Error when querying for content entries - no result.",
                    "QUERY_ERROR",
                    {
                        partitionKey,
                        queryOptions
                    }
                );
            }
            if (result.Items.length === 0) {
                return null;
            }
            return result.items.shift();
            // const [entries] = await db.read<CmsContentEntry>({
            //     ...configurations.db(),
            //     query,
            //     sort,
            //     limit: 1
            // });
            // if (entries.length === 0) {
            //     return null;
            // }
            // return entries.shift();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read from the DynamoDB.",
                ex.code || "DDB_READ_ERROR",
                {
                    partitionKey,
                    queryOptions
                }
            );
        }
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
     * Gets a secondary key in form of REV#version from:
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
