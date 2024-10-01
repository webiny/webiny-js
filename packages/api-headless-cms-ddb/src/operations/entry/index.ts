import WebinyError from "@webiny/error";
import { DataLoadersHandler } from "./dataLoaders";
import {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryUniqueValue,
    CmsModel,
    CmsStorageEntry,
    CONTENT_ENTRY_STATUS,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import {
    createGSIPartitionKey,
    createGSISortKey,
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "~/operations/entry/keys";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import {
    DbItem,
    queryAll,
    QueryAllParams,
    queryOne,
    QueryOneParams
} from "@webiny/db-dynamodb/utils/query";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { PluginsContainer } from "@webiny/plugins";
import { decodeCursor, encodeCursor } from "@webiny/utils/cursor";
import { zeroPad } from "@webiny/utils/zeroPad";
import { StorageOperationsCmsModelPlugin, StorageTransformPlugin } from "@webiny/api-headless-cms";
import { FilterItemFromStorage } from "./filtering/types";
import { createFields } from "~/operations/entry/filtering/createFields";
import { filter, sort } from "~/operations/entry/filtering";
import { WriteRequest } from "@webiny/aws-sdk/client-dynamodb";
import { CmsEntryStorageOperations } from "~/types";
import {
    isDeletedEntryMetaField,
    isEntryLevelEntryMetaField,
    isRestoredEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants";

const createType = (): string => {
    return "cms.entry";
};
const createLatestType = (): string => {
    return `${createType()}.l`;
};
const createPublishedType = (): string => {
    return `${createType()}.p`;
};

interface ConvertStorageEntryParams {
    storageEntry: CmsStorageEntry;
    model: StorageOperationsCmsModel;
}

const convertToStorageEntry = (params: ConvertStorageEntryParams): CmsStorageEntry => {
    const { model, storageEntry } = params;

    const values = model.convertValueKeyToStorage({
        fields: model.fields,
        values: storageEntry.values
    });
    return {
        ...storageEntry,
        values
    };
};

const convertFromStorageEntry = (params: ConvertStorageEntryParams): CmsStorageEntry => {
    const { model, storageEntry } = params;

    const values = model.convertValueKeyFromStorage({
        fields: model.fields,
        values: storageEntry.values
    });
    return {
        ...storageEntry,
        values
    };
};

const MAX_LIST_LIMIT = 1000000;

export interface CreateEntriesStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const { entity, plugins } = params;

    let storageOperationsCmsModelPlugin: StorageOperationsCmsModelPlugin | undefined;
    const getStorageOperationsCmsModelPlugin = () => {
        if (storageOperationsCmsModelPlugin) {
            return storageOperationsCmsModelPlugin;
        }
        storageOperationsCmsModelPlugin = plugins.oneByType<StorageOperationsCmsModelPlugin>(
            StorageOperationsCmsModelPlugin.type
        );
        return storageOperationsCmsModelPlugin;
    };

    const getStorageOperationsModel = (model: CmsModel): StorageOperationsCmsModel => {
        const plugin = getStorageOperationsCmsModelPlugin();
        return plugin.getModel(model);
    };

    const dataLoaders = new DataLoadersHandler({
        entity
    });

    const createStorageTransformCallable = (
        model: StorageOperationsCmsModel
    ): FilterItemFromStorage => {
        // Cache StorageTransformPlugin to optimize execution.
        const storageTransformPlugins = plugins
            .byType<StorageTransformPlugin>(StorageTransformPlugin.type)
            .reduce((collection, plugin) => {
                collection[plugin.fieldType] = plugin;
                return collection;
            }, {} as Record<string, StorageTransformPlugin>);

        return (field, value) => {
            const plugin: StorageTransformPlugin = storageTransformPlugins[field.type];
            if (!plugin) {
                return value;
            }
            return plugin.fromStorage({
                model,
                field,
                value,
                getStoragePlugin(fieldType: string): StorageTransformPlugin {
                    return storageTransformPlugins[fieldType] || storageTransformPlugins["*"];
                },
                plugins
            });
        };
    };

    const create: CmsEntryStorageOperations["create"] = async (initialModel, params) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const isPublished = entry.status === "published";

        const locked = isPublished ? true : entry.locked;

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });
        /**
         * We need to:
         *  - create new main entry item
         *  - create new or update the latest entry item
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                locked,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            }),
            entity.putBatch({
                ...storageEntry,
                locked,
                PK: partitionKey,
                SK: createLatestSortKey(),
                TYPE: createLatestType(),
                GSI1_PK: createGSIPartitionKey(model, "L"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        ];

        /**
         * We need to create published entry if
         */
        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    PK: partitionKey,
                    SK: createPublishedSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "P"),
                    GSI1_SK: createGSISortKey(storageEntry)
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert data into the DynamoDB.",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }

        return initialStorageEntry;
    };

    const createRevisionFrom: CmsEntryStorageOperations["createRevisionFrom"] = async (
        initialModel,
        params
    ) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const storageEntry = convertToStorageEntry({
            storageEntry: initialStorageEntry,
            model
        });

        /**
         * We need to:
         *  - create the main entry item
         *  - update the latest entry item to the current one
         *  - if the entry's status was set to "published":
         *      - update the published entry item to the current one
         *      - unpublish previously published revision (if any)
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(storageEntry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createLatestSortKey(),
                TYPE: createLatestType(),
                GSI1_PK: createGSIPartitionKey(model, "L"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        ];

        const isPublished = entry.status === "published";
        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createPublishedSortKey(),
                    TYPE: createPublishedType(),
                    GSI1_PK: createGSIPartitionKey(model, "P"),
                    GSI1_SK: createGSISortKey(storageEntry)
                })
            );

            // Unpublish previously published revision (if any).
            const [publishedRevisionStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId(
                {
                    model,
                    ids: [entry.id]
                }
            );

            if (publishedRevisionStorageEntry) {
                items.push(
                    entity.putBatch({
                        ...publishedRevisionStorageEntry,
                        PK: partitionKey,
                        SK: createRevisionSortKey(publishedRevisionStorageEntry),
                        TYPE: createType(),
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED,
                        GSI1_PK: createGSIPartitionKey(model, "A"),
                        GSI1_SK: createGSISortKey(publishedRevisionStorageEntry)
                    })
                );
            }
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
        /**
         * There are no modifications on the entry created so just return the data.
         */
        return initialStorageEntry;
    };

    const update: CmsEntryStorageOperations["update"] = async (initialModel, params) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const isPublished = entry.status === "published";
        const locked = isPublished ? true : entry.locked;

        const items = [];

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });
        /**
         * We need to:
         *  - update the current entry
         *  - update the latest entry if the current entry is the latest one
         */
        items.push(
            entity.putBatch({
                ...storageEntry,
                locked,
                PK: partitionKey,
                SK: createRevisionSortKey(storageEntry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        );

        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    PK: partitionKey,
                    SK: createPublishedSortKey(),
                    TYPE: createPublishedType(),
                    GSI1_PK: createGSIPartitionKey(model, "P"),
                    GSI1_SK: createGSISortKey(storageEntry)
                })
            );
        }

        /**
         * We need the latest entry to update it as well if necessary.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (latestStorageEntry) {
            const updatingLatestRevision = latestStorageEntry.id === entry.id;
            if (updatingLatestRevision) {
                items.push(
                    entity.putBatch({
                        ...storageEntry,
                        locked,
                        PK: partitionKey,
                        SK: createLatestSortKey(),
                        TYPE: createLatestType(),
                        GSI1_PK: createGSIPartitionKey(model, "L"),
                        GSI1_SK: createGSISortKey(entry)
                    })
                );
            } else {
                /**
                 * If not updating latest revision, we still want to update the latest revision's
                 * entry-level meta fields to match the current revision's entry-level meta fields.
                 */
                const updatedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                /**
                 * First we update the regular DynamoDB table. Two updates are needed:
                 * - one for the actual revision record
                 * - one for the latest record
                 */
                items.push(
                    entity.putBatch({
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields,
                        PK: partitionKey,
                        SK: createRevisionSortKey(latestStorageEntry),
                        TYPE: createType(),
                        GSI1_PK: createGSIPartitionKey(model, "A"),
                        GSI1_SK: createGSISortKey(latestStorageEntry)
                    })
                );

                items.push(
                    entity.putBatch({
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields,
                        PK: partitionKey,
                        SK: createLatestSortKey(),
                        TYPE: createLatestType(),
                        GSI1_PK: createGSIPartitionKey(model, "L"),
                        GSI1_SK: createGSISortKey(latestStorageEntry)
                    })
                );
            }
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry.",
                ex.code || "UPDATE_ERROR",
                {
                    error: ex,
                    entry,
                    latestStorageEntry
                }
            );
        }
    };

    const move: CmsEntryStorageOperations["move"] = async (initialModel, id, folderId) => {
        /**
         * We need to:
         * - load all the revisions of the entry, including published and latest
         * - update all the revisions (published and latest ) of the entry with new folderId
         */
        const model = getStorageOperationsModel(initialModel);
        /**
         * First we need to load all the revisions and published / latest entry.
         */
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                id,
                locale: model.locale,
                tenant: model.tenant
            }),
            options: {
                gte: " "
            }
        };
        const records = await queryAll<CmsEntry>(queryAllParams);
        /**
         * Then create the batch writes for the DynamoDB, with the updated folderId.
         */
        const items = records.map(item => {
            return entity.putBatch({
                ...item,
                location: {
                    ...item.location,
                    folderId
                }
            });
        });
        /**
         * And finally write it...
         */
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw WebinyError.from(ex, {
                message: "Could not move records to a new folder.",
                data: {
                    id,
                    folderId
                }
            });
        }
    };

    const moveToBin: CmsEntryStorageOperations["moveToBin"] = async (initialModel, params) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        /**
         * First we need to load all the revisions and published / latest entries.
         */
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            options: {
                gte: " "
            }
        };

        let records: DbItem<CmsEntry>[] = [];
        try {
            records = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all records.",
                ex.code || "LOAD_ALL_RECORDS_ERROR",
                {
                    error: ex,
                    id: entry.id
                }
            );
        }

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });

        /**
         * Let's pick the `deleted` meta fields from the storage entry.
         */
        const updatedDeletedMetaFields = pickEntryMetaFields(storageEntry, isDeletedEntryMetaField);

        /**
         * Then create the batch writes for the DynamoDB, with the updated data.
         */
        const items = records.map(record => {
            return entity.putBatch({
                ...record,
                ...updatedDeletedMetaFields,
                wbyDeleted: storageEntry.wbyDeleted,
                location: storageEntry.location,
                binOriginalFolderId: storageEntry.binOriginalFolderId
            });
        });
        /**
         * And finally write it...
         */
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not move the entry to the bin.",
                ex.code || "MOVE_ENTRY_TO_BIN_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
    };

    const deleteEntry: CmsEntryStorageOperations["delete"] = async (initialModel, params) => {
        const { entry } = params;
        const id = entry.id || entry.entryId;
        const model = getStorageOperationsModel(initialModel);

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                id,
                locale: model.locale,
                tenant: model.tenant
            }),
            options: {
                gte: " "
            }
        };

        let records: DbItem<CmsEntry>[] = [];
        try {
            records = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all records.",
                ex.code || "LOAD_ALL_RECORDS_ERROR",
                {
                    error: ex,
                    id
                }
            );
        }
        const items = records.map(item => {
            return entity.deleteBatch({
                PK: item.PK,
                SK: item.SK
            });
        });

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete the entry.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    partitionKey: queryAllParams.partitionKey,
                    id
                }
            );
        }
    };

    const restoreFromBin: CmsEntryStorageOperations["restoreFromBin"] = async (
        initialModel,
        params
    ) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        /**
         * First we need to load all the revisions and published / latest entries.
         */
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            options: {
                gte: " "
            }
        };

        let records: DbItem<CmsEntry>[] = [];
        try {
            records = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all records.",
                ex.code || "LOAD_ALL_RECORDS_ERROR",
                {
                    error: ex,
                    id: entry.id
                }
            );
        }

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });

        /**
         * Let's pick the `restored` meta fields from the storage entry.
         */
        const updatedRestoredMetaFields = pickEntryMetaFields(
            storageEntry,
            isRestoredEntryMetaField
        );

        const items = records.map(record => {
            return entity.putBatch({
                ...record,
                ...updatedRestoredMetaFields,
                wbyDeleted: storageEntry.wbyDeleted,
                location: storageEntry.location,
                binOriginalFolderId: storageEntry.binOriginalFolderId
            });
        });
        /**
         * And finally write it...
         */
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });

            dataLoaders.clearAll({
                model
            });

            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not restore the entry from the bin.",
                ex.code || "RESTORE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
    };

    const deleteRevision: CmsEntryStorageOperations["deleteRevision"] = async (
        initialModel,
        params
    ) => {
        const { entry, latestEntry, latestStorageEntry: initialLatestStorageEntry } = params;

        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const items = [
            entity.deleteBatch({
                PK: partitionKey,
                SK: createRevisionSortKey(entry)
            })
        ];

        const publishedStorageEntry = await getPublishedRevisionByEntryId(model, entry);

        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry && entry.id === publishedStorageEntry.id) {
            items.push(
                entity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
        }

        if (initialLatestStorageEntry) {
            const latestStorageEntry = convertToStorageEntry({
                storageEntry: initialLatestStorageEntry,
                model
            });
            items.push(
                entity.putBatch({
                    ...latestStorageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(latestStorageEntry)
                })
            );

            // Do an update on the latest revision. We need to update the latest revision's
            // entry-level meta fields to match the previous revision's entry-level meta fields.
            items.push(
                entity.putBatch({
                    ...latestStorageEntry,
                    PK: partitionKey,
                    SK: createRevisionSortKey(initialLatestStorageEntry),
                    TYPE: createType(),
                    GSI1_PK: createGSIPartitionKey(model, "A"),
                    GSI1_SK: createGSISortKey(initialLatestStorageEntry)
                })
            );
        }
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entry,
                latestEntry
            });
        }
    };

    const deleteMultipleEntries: CmsEntryStorageOperations["deleteMultipleEntries"] = async (
        initialModel,
        params
    ) => {
        const { entries } = params;
        const model = getStorageOperationsModel(initialModel);
        /**
         * First we need all the revisions of the entries we want to delete.
         */
        const revisions = await dataLoaders.getAllEntryRevisions({
            model,
            ids: entries
        });
        /**
         * Then we need to construct the queries for all the revisions and entries.
         */
        const items: Record<string, WriteRequest>[] = [];
        for (const id of entries) {
            /**
             * Latest item.
             */
            items.push(
                entity.deleteBatch({
                    PK: createPartitionKey({
                        id,
                        locale: model.locale,
                        tenant: model.tenant
                    }),
                    SK: "L"
                })
            );
            /**
             * Published item.
             */
            items.push(
                entity.deleteBatch({
                    PK: createPartitionKey({
                        id,
                        locale: model.locale,
                        tenant: model.tenant
                    }),
                    SK: "P"
                })
            );
        }
        /**
         * Exact revisions of all the entries
         */
        for (const revision of revisions) {
            items.push(
                entity.deleteBatch({
                    PK: createPartitionKey({
                        id: revision.id,
                        locale: model.locale,
                        tenant: model.tenant
                    }),
                    SK: createRevisionSortKey({
                        version: revision.version
                    })
                })
            );
        }

        await batchWriteAll({
            table: entity.table,
            items
        });
    };

    const getLatestRevisionByEntryId: CmsEntryStorageOperations["getLatestRevisionByEntryId"] =
        async (initialModel, params) => {
            const model = getStorageOperationsModel(initialModel);

            const items = await dataLoaders.getLatestRevisionByEntryId({
                model,
                ids: [params.id]
            });
            const item = items.shift() || null;
            if (!item) {
                return null;
            }
            return convertFromStorageEntry({
                storageEntry: item,
                model
            });
        };
    const getPublishedRevisionByEntryId: CmsEntryStorageOperations["getPublishedRevisionByEntryId"] =
        async (initialModel, params) => {
            const model = getStorageOperationsModel(initialModel);

            const items = await dataLoaders.getPublishedRevisionByEntryId({
                model,
                ids: [params.id]
            });
            const item = items.shift() || null;
            if (!item) {
                return null;
            }
            return convertFromStorageEntry({
                storageEntry: item,
                model
            });
        };

    const getRevisionById: CmsEntryStorageOperations["getRevisionById"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const items = await dataLoaders.getRevisionById({
            model,
            ids: [params.id]
        });
        const item = items.shift() || null;
        if (!item) {
            return null;
        }
        return convertFromStorageEntry({
            storageEntry: item,
            model
        });
    };

    const getRevisions: CmsEntryStorageOperations["getRevisions"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const items = await dataLoaders.getAllEntryRevisions({
            model,
            ids: [params.id]
        });

        return items.map(item => {
            return convertFromStorageEntry({
                storageEntry: item,
                model
            });
        });
    };

    const getByIds: CmsEntryStorageOperations["getByIds"] = async (initialModel, params) => {
        const model = getStorageOperationsModel(initialModel);

        const items = await dataLoaders.getRevisionById({
            model,
            ids: params.ids
        });

        return items.map(item => {
            return convertFromStorageEntry({
                storageEntry: item,
                model
            });
        });
    };

    const getLatestByIds: CmsEntryStorageOperations["getLatestByIds"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const items = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: params.ids
        });

        return items.map(item => {
            return convertFromStorageEntry({
                storageEntry: item,
                model
            });
        });
    };

    const getPublishedByIds: CmsEntryStorageOperations["getPublishedByIds"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const items = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: params.ids
        });

        return items.map(item => {
            return convertFromStorageEntry({
                storageEntry: item,
                model
            });
        });
    };

    const getPreviousRevision: CmsEntryStorageOperations["getPreviousRevision"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const { entryId, version } = params;
        const queryParams: QueryOneParams = {
            entity,
            partitionKey: createPartitionKey({
                tenant: model.tenant,
                locale: model.locale,
                id: entryId
            }),
            options: {
                lt: `REV#${zeroPad(version)}`,
                /**
                 * We need to have extra checks because DynamoDB will return published or latest record if there is no REV# record.
                 */
                filters: [
                    {
                        attr: "TYPE",
                        eq: createType()
                    },
                    {
                        attr: "version",
                        lt: version
                    }
                ],
                reverse: true
            }
        };

        try {
            const result = await queryOne<CmsEntry>(queryParams);

            const storageEntry = cleanupItem(entity, result);
            if (!storageEntry) {
                return null;
            }
            return convertFromStorageEntry({
                storageEntry,
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get previous version of given entry.",
                ex.code || "GET_PREVIOUS_VERSION_ERROR",
                {
                    ...params,
                    error: ex,
                    partitionKey: queryParams.partitionKey,
                    options: queryParams.options,
                    model
                }
            );
        }
    };

    const list: CmsEntryStorageOperations["list"] = async (initialModel, params) => {
        const model = getStorageOperationsModel(initialModel);

        const {
            limit: initialLimit = 10,
            where: initialWhere,
            after,
            sort: sortBy,
            fields,
            search
        } = params;
        const limit =
            initialLimit <= 0 || initialLimit >= MAX_LIST_LIMIT ? MAX_LIST_LIMIT : initialLimit;

        const type = initialWhere.published ? "P" : "L";

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createGSIPartitionKey(model, type),
            options: {
                index: "GSI1",
                gte: " "
            }
        };
        let storageEntries: CmsStorageEntry[] = [];
        try {
            storageEntries = await queryAll<CmsStorageEntry>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(ex.message, "QUERY_ENTRIES_ERROR", {
                error: ex,
                partitionKey: queryAllParams.partitionKey,
                options: queryAllParams.options
            });
        }
        if (storageEntries.length === 0) {
            return {
                hasMoreItems: false,
                totalCount: 0,
                cursor: null,
                items: []
            };
        }
        const where: Partial<CmsEntryListWhere> = {
            ...initialWhere
        };
        delete where["published"];
        delete where["latest"];
        /**
         * We need an object containing field, transformers and paths.
         * Just build it here and pass on into other methods that require it to avoid mapping multiple times.
         */
        const modelFields = createFields({
            plugins,
            fields: model.fields
        });

        const fromStorage = createStorageTransformCallable(model);
        /**
         * Let's transform records from storage ones to regular ones, so we do not need to do it later.
         *
         * This is always being done, but at least its in parallel.
         */
        const records = await Promise.all(
            storageEntries.map(async storageEntry => {
                const entry = convertFromStorageEntry({
                    storageEntry,
                    model
                });

                for (const field of model.fields) {
                    entry.values[field.fieldId] = await fromStorage(
                        field,
                        entry.values[field.fieldId]
                    );
                }

                return entry as CmsEntry;
            })
        );
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredItems = filter({
            items: records,
            where,
            plugins,
            fields: modelFields,
            fullTextSearch: {
                term: search,
                fields: fields || []
            }
        });

        const totalCount = filteredItems.length;

        /**
         * Sorting is also done via the code.
         * It takes the sort input and sorts by it via the lodash sortBy method.
         */
        const sortedItems = sort({
            model,
            plugins,
            items: filteredItems,
            sort: sortBy,
            fields: modelFields
        });

        const start = parseInt((decodeCursor(after) as string) || "0") || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const slicedItems = sortedItems.slice(start, end);
        /**
         * Although we do not need a cursor here, we will use it as such to keep it standardized.
         * Number is simply encoded.
         */
        const cursor = encodeCursor(`${start + limit}`);
        return {
            hasMoreItems,
            totalCount,
            cursor,
            items: cleanupItems(entity, slicedItems)
        };
    };

    const get: CmsEntryStorageOperations["get"] = async (initialModel, params) => {
        const model = getStorageOperationsModel(initialModel);

        const { items } = await list(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    };

    const publish: CmsEntryStorageOperations["publish"] = async (initialModel, params) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        /**
         * We need the latest and published entries to see if something needs to be updated alongside the publishing one.
         */
        const initialLatestStorageEntry = await getLatestRevisionByEntryId(model, entry);
        if (!initialLatestStorageEntry) {
            throw new WebinyError(
                `Could not publish entry. Could not load latest ("L") record.`,
                "PUBLISH_ERROR",
                { entry }
            );
        }

        const initialPublishedStorageEntry = await getPublishedRevisionByEntryId(model, entry);

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });

        // 1. Update REV# and P records with new data.
        const items = [
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(entry)
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createPublishedSortKey(),
                TYPE: createPublishedType(),
                GSI1_PK: createGSIPartitionKey(model, "P"),
                GSI1_SK: createGSISortKey(entry)
            })
        ];

        // 2. When it comes to the latest record, we need to perform a couple of different
        // updates, based on whether the entry being published is the latest revision or not.
        const publishedRevisionId = initialPublishedStorageEntry?.id;
        const publishingLatestRevision = entry.id === initialLatestStorageEntry.id;

        if (publishingLatestRevision) {
            // 2.1 If we're publishing the latest revision, we first need to update the L record.
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(entry)
                })
            );

            // 2.2 Additionally, if we have a previously published entry, we need to mark it as unpublished.
            if (publishedRevisionId && publishedRevisionId !== entry.id) {
                const publishedStorageEntry = convertToStorageEntry({
                    storageEntry: initialPublishedStorageEntry,
                    model
                });

                items.push(
                    entity.putBatch({
                        ...publishedStorageEntry,
                        PK: partitionKey,
                        SK: createRevisionSortKey(publishedStorageEntry),
                        TYPE: createType(),
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED,
                        GSI1_PK: createGSIPartitionKey(model, "A"),
                        GSI1_SK: createGSISortKey(publishedStorageEntry)
                    })
                );
            }
        } else {
            // 2.3 If the published revision is not the latest one, the situation is a bit
            // more complex. We first need to update the L and REV# records with the new
            // values of *only entry-level* meta fields.
            const updatedEntryLevelMetaFields = pickEntryMetaFields(
                entry,
                isEntryLevelEntryMetaField
            );

            const latestStorageEntry = convertToStorageEntry({
                storageEntry: initialLatestStorageEntry,
                model
            });

            // 2.3.1 Update L record. Apart from updating the entry-level meta fields, we also need
            //    to change the status from "published" to "unpublished" (if the status is set to "published").
            let latestRevisionStatus = latestStorageEntry.status;
            if (latestRevisionStatus === CONTENT_ENTRY_STATUS.PUBLISHED) {
                latestRevisionStatus = CONTENT_ENTRY_STATUS.UNPUBLISHED;
            }

            const latestStorageEntryFields = {
                ...latestStorageEntry,
                ...updatedEntryLevelMetaFields,
                status: latestRevisionStatus
            };

            items.push(
                entity.putBatch({
                    ...latestStorageEntryFields,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(latestStorageEntry)
                })
            );

            // 2.3.2 Update REV# record.
            items.push(
                entity.putBatch({
                    ...latestStorageEntryFields,
                    PK: partitionKey,
                    SK: createRevisionSortKey(latestStorageEntry),
                    TYPE: createType(),
                    GSI1_PK: createGSIPartitionKey(model, "A"),
                    GSI1_SK: createGSISortKey(latestStorageEntry)
                })
            );

            // 2.3.3 Finally, if we got a published entry, but it wasn't the latest one, we need to take
            //    an extra step and mark it as unpublished.
            const publishedRevisionDifferentFromLatest =
                publishedRevisionId && publishedRevisionId !== latestStorageEntry.id;
            if (publishedRevisionDifferentFromLatest) {
                const publishedStorageEntry = convertToStorageEntry({
                    storageEntry: initialPublishedStorageEntry,
                    model
                });

                items.push(
                    entity.putBatch({
                        ...publishedStorageEntry,
                        PK: partitionKey,
                        SK: createRevisionSortKey(publishedStorageEntry),
                        TYPE: createType(),
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED,
                        GSI1_PK: createGSIPartitionKey(model, "A"),
                        GSI1_SK: createGSISortKey(publishedStorageEntry)
                    })
                );
            }
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute the publishing batch.",
                ex.code || "PUBLISH_ERROR",
                {
                    entry,
                    latestStorageEntry: initialLatestStorageEntry,
                    publishedStorageEntry: initialPublishedStorageEntry
                }
            );
        }
    };

    const unpublish: CmsEntryStorageOperations["unpublish"] = async (initialModel, params) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const storageEntry = convertToStorageEntry({
            storageEntry: initialStorageEntry,
            model
        });
        /**
         * We need to:
         *  - delete currently published entry
         *  - update current entry revision with new data
         *  - update the latest entry status - if entry being unpublished is latest
         */
        const items = [
            entity.deleteBatch({
                PK: partitionKey,
                SK: createPublishedSortKey()
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(entry)
            })
        ];

        /**
         * We need the latest entry to see if something needs to be updated alongside the unpublishing one.
         */
        const initialLatestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (initialLatestStorageEntry) {
            const unpublishingLatestRevision = entry.id === initialLatestStorageEntry.id;
            if (unpublishingLatestRevision) {
                items.push(
                    entity.putBatch({
                        ...storageEntry,
                        PK: partitionKey,
                        SK: createLatestSortKey(),
                        TYPE: createLatestType(),
                        GSI1_PK: createGSIPartitionKey(model, "L"),
                        GSI1_SK: createGSISortKey(entry)
                    })
                );
            } else {
                const latestStorageEntry = convertToStorageEntry({
                    storageEntry: initialLatestStorageEntry,
                    model
                });

                // If the unpublished revision is not the latest one, we still need to
                // update the latest record with the new values of entry-level meta fields.
                const updatedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                // 1. Update actual revision record.
                items.push(
                    entity.putBatch({
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields,
                        PK: partitionKey,
                        SK: createRevisionSortKey(latestStorageEntry),
                        TYPE: createType(),
                        GSI1_PK: createGSIPartitionKey(model, "A"),
                        GSI1_SK: createGSISortKey(latestStorageEntry)
                    })
                );

                // 2. Update latest record.
                items.push(
                    entity.putBatch({
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields,
                        PK: partitionKey,
                        SK: createLatestSortKey(),
                        TYPE: createLatestType(),
                        GSI1_PK: createGSIPartitionKey(model, "L"),
                        GSI1_SK: createGSISortKey(latestStorageEntry)
                    })
                );
            }
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
            return initialStorageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute unpublish batch.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
    };

    const getUniqueFieldValues: CmsEntryStorageOperations["getUniqueFieldValues"] = async (
        model,
        params
    ) => {
        const { where, fieldId } = params;

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            throw new WebinyError(
                `Could not find field with given "fieldId" value.`,
                "FIELD_NOT_FOUND",
                {
                    fieldId
                }
            );
        }

        const { items } = await list(model, {
            where,
            limit: MAX_LIST_LIMIT
        });

        const result: Record<string, CmsEntryUniqueValue> = {};
        for (const item of items) {
            const fieldValue = item.values[field.fieldId] as string[] | string | undefined;
            if (!fieldValue) {
                continue;
            }
            const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
            if (values.length === 0) {
                continue;
            }
            for (const value of values) {
                result[value] = {
                    value,
                    count: (result[value]?.count || 0) + 1
                };
            }
        }

        return Object.values(result)
            .sort((a, b) => (a.value > b.value ? 1 : b.value > a.value ? -1 : 0))
            .sort((a, b) => b.count - a.count);
    };

    return {
        create,
        createRevisionFrom,
        update,
        move,
        delete: deleteEntry,
        moveToBin,
        restoreFromBin,
        deleteRevision,
        deleteMultipleEntries,
        getPreviousRevision,
        getPublishedByIds,
        getLatestByIds,
        getByIds,
        getRevisionById,
        getPublishedRevisionByEntryId,
        getLatestRevisionByEntryId,
        get,
        getRevisions,
        publish,
        list,
        unpublish,
        dataLoaders,
        getUniqueFieldValues
    };
};
