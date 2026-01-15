import WebinyError from "@webiny/error";
import { DataLoadersHandler } from "./dataLoaders.js";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryStorageOperationsGetLatestByIdsParams,
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsEntryStorageOperationsGetRevisionParams,
    CmsEntryStorageOperationsGetRevisionsParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types/index.js";
import {
    createEntryLatestKeys,
    createEntryPublishedKeys,
    createEntryRevisionKeys,
    createGSIPartitionKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "~/operations/entry/keys.js";
import type { PluginsContainer } from "@webiny/plugins";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { StorageOperationsCmsModelPlugin, StorageTransformPlugin } from "@webiny/api-headless-cms";
import type { FilterItemFromStorage } from "./filtering/types.js";
import { createFields } from "~/operations/entry/filtering/createFields.js";
import { filter, sort } from "~/operations/entry/filtering/index.js";
import type { CmsEntryStorageOperations, IEntryEntity } from "~/types.js";
import {
    isDeletedEntryMetaField,
    isEntryLevelEntryMetaField,
    isRestoredEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

interface ConvertStorageEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    storageEntry: CmsStorageEntry<T>;
    model: StorageOperationsCmsModel<T>;
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

const convertFromStorageEntry = <T extends CmsEntryValues = CmsEntryValues>(
    params: ConvertStorageEntryParams<T>
): CmsStorageEntry<T> => {
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
    entity: IEntryEntity;
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

    const getStorageOperationsModel = <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): StorageOperationsCmsModel<T> => {
        const plugin = getStorageOperationsCmsModelPlugin();
        return plugin.getModel<T>(model);
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
            .reduce(
                (collection, plugin) => {
                    collection[plugin.fieldType] = plugin;
                    return collection;
                },
                {} as Record<string, StorageTransformPlugin>
            );

        return (field, value) => {
            const fieldType = getBaseFieldType(field);

            const plugin: StorageTransformPlugin = storageTransformPlugins[fieldType];
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

        const isPublished = entry.status === "published";

        const locked = isPublished ? true : entry.locked;

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });

        const storageEntryRevisionKeys = createEntryRevisionKeys(entry);
        const storageEntryLatestKeys = createEntryLatestKeys(entry);
        /**
         * We need to:
         *  - create new main entry item
         *  - create new or update the latest entry item
         */
        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...storageEntryRevisionKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                },
                {
                    ...storageEntryLatestKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                }
            ]
        });

        /**
         * We need to create published entry if
         */
        if (isPublished) {
            const storageEntryPublishedKeys = createEntryPublishedKeys(storageEntry);
            entityBatch.put({
                ...storageEntryPublishedKeys,
                data: {
                    ...storageEntry,
                    locked
                }
            });
        }

        try {
            await entityBatch.execute();
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
        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                },
                {
                    ...createEntryLatestKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                }
            ]
        });

        const isPublished = entry.status === "published";
        if (isPublished) {
            entityBatch.put({
                ...createEntryPublishedKeys(storageEntry),
                data: {
                    ...storageEntry
                }
            });

            // Unpublish previously published revision (if any).
            const [publishedRevisionStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId(
                {
                    model,
                    ids: [entry.id]
                }
            );

            if (publishedRevisionStorageEntry) {
                entityBatch.put({
                    ...createEntryRevisionKeys(publishedRevisionStorageEntry),
                    data: {
                        ...publishedRevisionStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    }
                });
            }
        }

        try {
            await entityBatch.execute();
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

        const isPublished = entry.status === "published";
        const locked = isPublished ? true : entry.locked;

        const storageEntry = convertToStorageEntry({
            model,
            storageEntry: initialStorageEntry
        });
        /**
         * We need to:
         *  - update the current entry
         *  - update the latest entry if the current entry is the latest one
         */

        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: {
                        ...storageEntry,
                        locked
                    }
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...createEntryPublishedKeys(storageEntry),
                data: {
                    ...storageEntry,
                    locked
                }
            });
        }

        /**
         * We need the latest entry to update it as well if necessary.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (latestStorageEntry) {
            const updatingLatestRevision = latestStorageEntry.id === entry.id;
            if (updatingLatestRevision) {
                entityBatch.put({
                    ...createEntryLatestKeys(storageEntry),
                    data: {
                        ...storageEntry,
                        locked
                    }
                });
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
                entityBatch.put({
                    ...createEntryRevisionKeys(latestStorageEntry),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });

                entityBatch.put({
                    ...createEntryLatestKeys(latestStorageEntry),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });
            }
        }

        try {
            await entityBatch.execute();
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
        const partitionKey = createPartitionKey({
            id,
            tenant: model.tenant
        });
        const records = await entity.queryAll({
            partitionKey,
            options: {
                gte: " "
            }
        });
        /**
         * Then create the batch writes for the DynamoDB, with the updated folderId.
         */
        const entityBatch = entity.createEntityWriter({
            put: records.map(item => {
                return {
                    ...item,
                    data: {
                        ...item.data,
                        location: {
                            ...item.data.location,
                            folderId
                        }
                    }
                };
            })
        });

        /**
         * And finally write it...
         */
        try {
            await entityBatch.execute();
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

    const moveToBin: CmsEntryStorageOperations["moveToBin"] = async (
        initialModel,
        params
    ): Promise<void> => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        /**
         * First we need to load all the revisions and published / latest entries.
         */

        let records: Awaited<ReturnType<typeof entity.queryAll>> = [];
        try {
            records = await entity.queryAll({
                partitionKey: createPartitionKey({
                    id: entry.id,
                    tenant: model.tenant
                }),
                options: {
                    gte: " "
                }
            });
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
        if (records.length === 0) {
            return;
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
        const entityBatch = entity.createEntityWriter({
            put: records.map(record => {
                return {
                    ...record,
                    data: {
                        ...record.data,
                        ...updatedDeletedMetaFields,
                        wbyDeleted: storageEntry.wbyDeleted,
                        location: storageEntry.location,
                        binOriginalFolderId: storageEntry.binOriginalFolderId
                    }
                };
            })
        });
        /**
         * And finally write it...
         */
        try {
            await entityBatch.execute();
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

        const partitionKey = createPartitionKey({
            id,
            tenant: model.tenant
        });

        let records: Awaited<ReturnType<typeof entity.queryAll>> = [];
        try {
            records = await entity.queryAll({
                partitionKey,
                options: {
                    gte: " "
                }
            });
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

        const entityBatch = entity.createEntityWriter({
            delete: records.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
        });

        try {
            await entityBatch.execute();
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete the entry.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    partitionKey,
                    id
                }
            );
        }
    };

    const restoreFromBin = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ): Promise<CmsStorageEntry<T>> => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        /**
         * First we need to load all the revisions and published / latest entries.
         */
        let records: Awaited<ReturnType<typeof entity.queryAll>> = [];
        try {
            records = await entity.queryAll({
                partitionKey: createPartitionKey({
                    id: entry.id,
                    tenant: model.tenant
                }),
                options: {
                    gte: " "
                }
            });
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
        if (records.length === 0) {
            return initialStorageEntry;
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

        const entityBatch = entity.createEntityWriter({
            put: records.map(record => {
                return {
                    ...record,
                    data: {
                        ...record.data,
                        ...updatedRestoredMetaFields,
                        wbyDeleted: storageEntry.wbyDeleted,
                        location: storageEntry.location,
                        binOriginalFolderId: storageEntry.binOriginalFolderId
                    }
                };
            })
        });

        /**
         * And finally write it...
         */
        try {
            await entityBatch.execute();

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
            tenant: model.tenant
        });

        const entityBatch = entity.createEntityWriter({
            delete: [
                {
                    PK: partitionKey,
                    SK: createRevisionSortKey(entry)
                }
            ]
        });

        const publishedStorageEntry = await getPublishedRevisionByEntryId(model, entry);

        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry && entry.id === publishedStorageEntry.id) {
            entityBatch.delete({
                PK: partitionKey,
                SK: createPublishedSortKey()
            });
        }

        if (initialLatestStorageEntry) {
            const latestStorageEntry = convertToStorageEntry({
                storageEntry: initialLatestStorageEntry,
                model
            });
            entityBatch.put({
                ...createEntryLatestKeys(latestStorageEntry),
                data: {
                    ...latestStorageEntry
                }
            });

            // Do an update on the latest revision. We need to update the latest revision's
            // entry-level meta fields to match the previous revision's entry-level meta fields.
            entityBatch.put({
                ...createEntryRevisionKeys(latestStorageEntry),
                data: {
                    ...latestStorageEntry
                }
            });
        }
        try {
            await entityBatch.execute();

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

        const entityBatch = entity.createEntityWriter();

        for (const id of entries) {
            const partitionKey = createPartitionKey({
                id,
                tenant: model.tenant
            });
            entityBatch.delete({
                PK: partitionKey,
                SK: "L"
            });
            entityBatch.delete({
                PK: partitionKey,
                SK: "P"
            });
        }
        /**
         * Exact revisions of all the entries
         */
        for (const revision of revisions) {
            entityBatch.delete({
                PK: createPartitionKey({
                    id: revision.id,
                    tenant: model.tenant
                }),
                SK: createRevisionSortKey({
                    version: revision.version
                })
            });
        }

        await entityBatch.execute();
    };

    const getLatestRevisionByEntryId = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const items = await dataLoaders.getLatestRevisionByEntryId<T>({
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
    const getPublishedRevisionByEntryId = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const items = await dataLoaders.getPublishedRevisionByEntryId<T>({
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

    const getRevisionById = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const items = await dataLoaders.getRevisionById<T>({
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

    const getRevisions = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const items = await dataLoaders.getAllEntryRevisions<T>({
            model,
            ids: [params.id]
        });

        return items.map(item => {
            return convertFromStorageEntry<T>({
                storageEntry: item,
                model
            });
        });
    };

    const getByIds = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const items = await dataLoaders.getRevisionById<T>({
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

    const getLatestByIds = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const items = await dataLoaders.getLatestRevisionByEntryId<T>({
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

    const getPublishedByIds = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const items = await dataLoaders.getPublishedRevisionByEntryId<T>({
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

    const getPreviousRevision = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const { entryId, version } = params;
        const partitionKey = createPartitionKey({
            tenant: model.tenant,
            id: entryId
        });

        const unfilteredRevisions = await entity.queryAll({
            partitionKey,
            options: {
                beginsWith: `REV#`,
                reverse: true
            }
        });
        const filteredRevisions = unfilteredRevisions.filter(item => {
            return item.data.version < version;
        });
        const storageEntry = filteredRevisions[0];
        if (!storageEntry) {
            return null;
        }

        try {
            return convertFromStorageEntry({
                storageEntry: storageEntry.data,
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get previous version of given entry.",
                ex.code || "GET_PREVIOUS_VERSION_ERROR",
                {
                    ...params,
                    error: ex,
                    partitionKey,
                    model
                }
            );
        }
    };

    const list = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => {
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

        const partitionKey = createGSIPartitionKey(model, type);
        const options = {
            index: "GSI1",
            gte: " "
        };

        let storageEntries: Awaited<ReturnType<typeof entity.queryAll>> = [];
        try {
            storageEntries = await entity.queryAll({
                partitionKey,
                options
            });
        } catch (ex) {
            throw new WebinyError(ex.message, "QUERY_ENTRIES_ERROR", {
                error: ex,
                partitionKey,
                options
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
                    storageEntry: storageEntry.data,
                    model
                });

                for (const field of model.fields) {
                    entry.values[field.fieldId] = await fromStorage(
                        field,
                        entry.values[field.fieldId]
                    );
                }

                return entry as CmsEntry<T>;
            })
        );
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredItems = filter<T>({
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
        const sortedItems = sort<T>({
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
            items: slicedItems
        };
    };

    const get = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const { items } = await list<T>(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    };

    const publish = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

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
        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                },
                {
                    ...createEntryPublishedKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                }
            ]
        });

        // 2. When it comes to the latest record, we need to perform a couple of different
        // updates, based on whether the entry being published is the latest revision or not.
        const publishedRevisionId = initialPublishedStorageEntry?.id;
        const publishingLatestRevision = entry.id === initialLatestStorageEntry.id;

        if (publishingLatestRevision) {
            // 2.1 If we're publishing the latest revision, we first need to update the L record.
            entityBatch.put({
                ...createEntryLatestKeys(storageEntry),
                data: {
                    ...storageEntry
                }
            });

            // 2.2 Additionally, if we have a previously published entry, we need to mark it as unpublished.
            if (publishedRevisionId && publishedRevisionId !== entry.id) {
                const publishedStorageEntry = convertToStorageEntry({
                    storageEntry: initialPublishedStorageEntry,
                    model
                });

                entityBatch.put({
                    ...createEntryRevisionKeys(publishedStorageEntry),
                    data: {
                        ...publishedStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    }
                });
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

            entityBatch.put({
                ...createEntryLatestKeys(latestStorageEntryFields),
                data: {
                    ...latestStorageEntryFields
                }
            });

            // 2.3.2 Update REV# record.
            entityBatch.put({
                ...createEntryRevisionKeys(latestStorageEntryFields),
                data: {
                    ...latestStorageEntryFields
                }
            });

            // 2.3.3 Finally, if we got a published entry, but it wasn't the latest one, we need to take
            //    an extra step and mark it as unpublished.
            const publishedRevisionDifferentFromLatest =
                publishedRevisionId && publishedRevisionId !== latestStorageEntry.id;
            if (publishedRevisionDifferentFromLatest) {
                const publishedStorageEntry = convertToStorageEntry({
                    storageEntry: initialPublishedStorageEntry,
                    model
                });

                entityBatch.put({
                    ...createEntryRevisionKeys(publishedStorageEntry),
                    data: {
                        ...publishedStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    }
                });
            }
        }

        try {
            await entityBatch.execute();
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

    const unpublish = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) => {
        const { entry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
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
        const entityBatch = entity.createEntityWriter({
            delete: [
                {
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                }
            ],
            put: [
                {
                    ...createEntryRevisionKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                }
            ]
        });

        /**
         * We need the latest entry to see if something needs to be updated alongside the unpublishing one.
         */
        const initialLatestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (initialLatestStorageEntry) {
            const unpublishingLatestRevision = entry.id === initialLatestStorageEntry.id;
            if (unpublishingLatestRevision) {
                entityBatch.put({
                    ...createEntryLatestKeys(storageEntry),
                    data: {
                        ...storageEntry
                    }
                });
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
                entityBatch.put({
                    ...createEntryRevisionKeys(latestStorageEntry),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });

                // 2. Update latest record.
                entityBatch.put({
                    ...createEntryLatestKeys(latestStorageEntry),
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
                });
            }
        }

        try {
            await entityBatch.execute();
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
