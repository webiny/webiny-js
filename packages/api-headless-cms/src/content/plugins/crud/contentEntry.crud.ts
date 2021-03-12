import mdbid from "mdbid";
import omit from "lodash/omit";
import cloneDeep from "lodash/cloneDeep";
import {ContextPlugin} from "@webiny/handler/types";
import {NotFoundError} from "@webiny/handler-graphql";
import {
    CmsContentEntryContext,
    CmsContentEntryPermission,
    CmsContentEntry,
    CmsContentModel,
    CmsContext, CmsContentEntryStorageOperationsProvider, CmsContentEntryListOptions
} from "../../../types";
import * as utils from "../../../utils";
import {validateModelEntryData} from "./contentEntry/entryDataValidation";
import {
    prepareEntryToIndex,
} from "./contentEntry/es";
import * as dataLoaders from "./contentEntry/dataLoaders";
import {createCmsPK} from "../../../utils";
import {
    afterCreateHook,
    afterDeleteHook,
    afterDeleteRevisionHook,
    afterPublishHook,
    afterRequestChangesHook,
    afterRequestReviewHook,
    afterUpdateHook,
    afterUnpublishHook,
    beforeCreateHook,
    beforeDeleteHook,
    beforeDeleteRevisionHook,
    beforePublishHook,
    beforeRequestChangesHook,
    beforeRequestReviewHook,
    beforeUpdateHook,
    beforeUnpublishHook,
    beforeCreateRevisionFromHook,
    afterCreateRevisionFromHook
} from "./contentEntry/hooks";
import WebinyError from "@webiny/error";
import {entryFromStorageTransform, entryToStorageTransform} from "../utils/entryStorage";

const TYPE_ENTRY = "cms.entry";
const TYPE_ENTRY_LATEST = TYPE_ENTRY + ".l";
const TYPE_ENTRY_PUBLISHED = TYPE_ENTRY + ".p";

const STATUS_DRAFT = "draft";
const STATUS_PUBLISHED = "published";
const STATUS_UNPUBLISHED = "unpublished";
const STATUS_CHANGES_REQUESTED = "changesRequested";
const STATUS_REVIEW_REQUESTED = "reviewRequested";

type DbItem<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};


const defaultListOptions: CmsContentEntryListOptions = {
    transform: false,
};


export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-entry",
    async apply(context) {
        const {db, security} = context;
        
        const pluginType = "cms-content-entry-storage-operations-provider";
        const providerPlugins = context.plugins.byType<CmsContentEntryStorageOperationsProvider>(
            pluginType
        );
        /**
         * Storage operations for the content entry.
         * Contains logic to save the data into the specific storage.
         */
        const providerPlugin = providerPlugins[providerPlugins.length - 1];
        if(!providerPlugin) {
            throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
                type: pluginType
            });
        }
        
        const storageOperations = await providerPlugin.provide({
            context
        });
        
        const PK_ENTRY = entryId => `${createCmsPK(context)}#CME#${entryId}`;
        const SK_REVISION = version => {
            return typeof version === "string" ? `REV#${version}` : `REV#${utils.zeroPad(version)}`;
        };
        const SK_LATEST = () => "L";
        const SK_PUBLISHED = () => "P";
        
        const loaders = {
            getAllEntryRevisions: dataLoaders.getAllEntryRevisions(context, {PK_ENTRY}),
            getRevisionById: dataLoaders.getRevisionById(context, {PK_ENTRY}),
            getPublishedRevisionByEntryId: dataLoaders.getPublishedRevisionByEntryId(context, {
                PK_ENTRY,
                SK_PUBLISHED
            }),
            getLatestRevisionByEntryId: dataLoaders.getLatestRevisionByEntryId(context, {
                PK_ENTRY,
                SK_LATEST
            })
        };
        
        const checkPermissions = (check: {
            rwd?: string;
            pw?: string;
        }): Promise<CmsContentEntryPermission> => {
            return utils.checkPermissions(context, "cms.contentEntry", check);
        };
        
        const entries: CmsContentEntryContext = {
            operations: storageOperations,
            /**
             * Get entries by exact revision IDs from the database.
             */
            getByIds: async (model: CmsContentModel, ids: string[]) => {
                const permission = await checkPermissions({rwd: "r"});
                utils.checkModelAccess(context, permission, model);
                
                const {getRevisionById} = loaders;
                
                const entries = (await getRevisionById.loadMany(ids)) as CmsContentEntry[];
                
                return entries.filter(entry => utils.validateOwnership(context, permission, entry));
            },
            /**
             * Get latest published revisions by entry IDs.
             */
            getPublishedByIds: async (model: CmsContentModel, ids: string[]) => {
                const permission = await checkPermissions({rwd: "r"});
                utils.checkModelAccess(context, permission, model);
                const {getPublishedRevisionByEntryId} = loaders;
                
                // We only need entry ID (not revision ID) to get published revision for that entry.
                const entryIds = ids.map(id => id.split("#")[0]);
                
                const entries = (await getPublishedRevisionByEntryId.loadMany(
                    entryIds
                )) as CmsContentEntry[];
                
                return entries.filter(entry => utils.validateOwnership(context, permission, entry));
            },
            /**
             * Get latest revisions by entry IDs.
             */
            getLatestByIds: async (model: CmsContentModel, ids: string[]) => {
                const permission = await checkPermissions({rwd: "r"});
                utils.checkModelAccess(context, permission, model);
                const {getLatestRevisionByEntryId} = loaders;
                
                // We only need entry ID (not revision ID) to get the latest revision for that entry.
                const entryIds = ids.map(id => id.split("#")[0]);
                
                const entries = (await getLatestRevisionByEntryId.loadMany(
                    entryIds
                )) as CmsContentEntry[];
                
                return entries.filter(entry => utils.validateOwnership(context, permission, entry));
            },
            getEntryRevisions: async entryId => {
                return loaders.getAllEntryRevisions.load(entryId);
            },
            get: async (model, args) => {
                await checkPermissions({rwd: "r"});
                
                const [items] = await context.cms.entries.list(model, {
                    ...args,
                    limit: 1,
                });
                
                if(items.length === 0) {
                    throw new NotFoundError(`Entry not found!`);
                }
                return items[0];
            },
            list: async (model: CmsContentModel, args, optionsInput) => {
                const options = {
                    ...defaultListOptions,
                    ...(optionsInput || {}),
                };
                const permission = await checkPermissions({rwd: "r"});
                utils.checkModelAccess(context, permission, model);
                
                const {where = {}} = args || {};
                // Possibly only get records which are owned by current user
                // Or if searching for the owner set that value - in the case that user can see other entries than their own
                const ownedBy = permission.own ? context.security.getIdentity().id : where.ownedBy;
                
                const {hasMoreItems, totalCount, cursor, items} = await storageOperations.list(model, {
                    ...args,
                    where: {
                        ...where,
                        ownedBy,
                    },
                });
                
                const meta = {
                    hasMoreItems,
                    totalCount,
                    cursor
                };
                if(!options.transform) {
                    return [
                        items,
                        meta,
                    ];
                }
                /**
                 * Transform items at the same time and wait for all to finish.
                 * TODO Determine if this is best approach as transform might call some outside service that will reject too much calls
                 */
                const transformed = await Promise.all(items.map(item => entryFromStorageTransform(context, model, item)));
                return [
                    transformed,
                    meta,
                ];
            },
            listLatest: async function(model, args= {}) {
                return context.cms.entries.list(
                    model,
                    {
                        sort: ["createdOn_DESC"],
                        ...args,
                        where: {
                            ...(args.where || {}),
                            latest: true,
                        }
                    }
                );
            },
            listPublished: async function(model, args= {}) {
                return context.cms.entries.list(
                    model,
                    {
                        sort: ["createdOn_DESC"],
                        ...args,
                        where: {
                            ...(args.where || {}),
                            published: true,
                        }
                    }
                );
            },
            create: async (model, rawInput) => {
                const permission = await checkPermissions({rwd: "w"});
                utils.checkModelAccess(context, permission, model);
                
                // Make sure we only work with fields that are defined in the model.
                const input = model.fields.reduce((acc, field) => {
                    if(field.fieldId in rawInput) {
                        acc[field.fieldId] = rawInput[field.fieldId];
                    }
                    
                    return acc;
                }, {});
                
                await validateModelEntryData(context, model, input);
                
                const identity = security.getIdentity();
                const locale = context.cms.getLocale();
                
                const owner = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };
                
                const data: CmsContentEntry = {
                    id: mdbid(),
                    modelId: model.modelId,
                    locale: locale.code,
                    createdOn: (new Date()).toISOString(),
                    savedOn: (new Date()).toISOString(),
                    createdBy: owner,
                    ownedBy: owner,
                    version: 1,
                    locked: false,
                    status: STATUS_DRAFT,
                    values: input
                };
                
                try {
                    await beforeCreateHook({model, input, data, context, storageOperations});
                    const entry = await storageOperations.create(model, {
                        input,
                        data,
                    });
                    await afterCreateHook({model, input, data, entry, context, storageOperations});
                    return entry;
                } catch(ex) {
                    throw new WebinyError(
                        ex.message || "Could not create content entry.",
                        ex.code || "CREATE_ENTRY_ERROR",
                        ex.data || {
                            error: ex,
                            input,
                            data,
                        }
                    )
                }
            },
            createRevisionFrom: async (model, sourceId, data = {}) => {
                const permission = await checkPermissions({rwd: "w"});
                utils.checkModelAccess(context, permission, model);
                
                
                // Entries are identified by a common parent ID + Revision number
                const [uniqueId, version] = sourceId.split("#");
                
                const [originalStorageEntry, latestEntry] = await storageOperations.getMultiple(model,
                    [
                        {
                            where: {
                                id: uniqueId,
                                version: parseInt(version),
                            }
                        },
                        {
                            where: {
                                id: uniqueId,
                                latest: true,
                            }
                        }
                    ]);
                // const [uniqueId, version] = sourceId.split("#");
                // const originalEntry = await context.cms.entries.get(model, {
                //     where: {
                //         id: sourceId
                //     }
                // });
                
                if(!originalStorageEntry) {
                    throw new NotFoundError(
                        `Entry "${sourceId}" of model "${model.modelId}" was not found.`
                    );
                }
    
                // We need to convert data from DB to its original form before constructing ES index data.
                const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);
                // const [latestEntryItems] = await context.cms.entries.listLatest(model, {
                //     where: {
                //         id: sourceId,
                //     }
                // });
                // const [latestEntry] = latestEntryItems;
                utils.checkOwnership(context, permission, originalEntry, "ownedBy");
                
                
                // const [[[entry]], [[latestEntry]]] = await db
                //     .batch()
                //     .read({
                //         ...utils.defaults.db(),
                //         query: {PK: PK_ENTRY(uniqueId), SK: SK_REVISION(version)}
                //     })
                //     .read({
                //         ...utils.defaults.db(),
                //         query: {PK: PK_ENTRY(uniqueId), SK: SK_LATEST()}
                //     })
                //     .execute();
                
                // We need to convert data from DB to its original form before constructing ES index data.
                // const originalEntryFromStorage = await entryFromStorageTransform(context, model, originalStorageEntry);
                
                
                const identity = security.getIdentity();
                const nextVersion = parseInt(latestEntry.version as any) + 1;
                const id = `${uniqueId}#${utils.zeroPad(nextVersion)}`;
                
                // const storageEntry = await entryToStorageTransform(context, model, ({
                //     values: data || {}
                // } as unknown) as CmsContentEntry);
                
                const entry: CmsContentEntry = {
                    ...originalEntry,
                    id,
                    version: nextVersion,
                    savedOn: (new Date()).toISOString(),
                    createdOn: (new Date()).toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    },
                    locked: false,
                    publishedOn: null,
                    status: STATUS_DRAFT,
                    values: {
                        ...originalEntry.values,
                        ...data,
                    }
                };
                
                try {
                    await beforeCreateRevisionFromHook({
                        context,
                        model,
                        data: entry,
                        originalEntry,
                        latestEntry,
                        storageOperations
                    });
                    const result = await storageOperations.createRevisionFrom(model, {
                        data: entry,
                        originalEntry,
                        latestEntry,
                    });
                    await afterCreateRevisionFromHook({
                        context,
                        model,
                        originalEntry,
                        latestEntry,
                        data: entry,
                        entry: result,
                        storageOperations
                    });
                    return result;
                } catch(ex) {
                    throw new WebinyError(
                        ex.message || "Could not create entry from existing one.",
                        ex.code || "CREATE_FROM_REVISION_ERROR",
                        {
                            error: ex,
                            entry,
                            originalEntry,
                            latestEntry,
                        }
                    );
                }
                
                /*
                const esEntry = prepareEntryToIndex({
                    context,
                    model,
                    originalEntry: cloneDeep(originalEntry),
                    storageEntry: cloneDeep(entry)
                });
                
                const {index: esIndex} = utils.defaults.es(context, model);
                
                await db
                    .batch()
                    // Create main entry item
                    .create({
                        ...utils.defaults.db(),
                        data: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_REVISION(utils.zeroPad(nextVersion)),
                            TYPE: TYPE_ENTRY,
                            ...entry
                        }
                    })
                    // Update "latest" entry item
                    .update({
                        ...utils.defaults.db(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST()
                        },
                        data: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST(),
                            TYPE: TYPE_ENTRY_LATEST,
                            ...entry
                        }
                    })
                    .update({
                        ...utils.defaults.esDb(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST()
                        },
                        data: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST(),
                            index: esIndex,
                            data: getESLatestEntryData(context, esEntry)
                        }
                    })
                    .execute();
                

                
                return entry;
                */
            },
            update: async (model, id, inputData) => {
                const permission = await checkPermissions({rwd: "w"});
                utils.checkModelAccess(context, permission, model);
                
                // Make sure we only work with fields that are defined in the model.
                const data = model.fields.reduce((acc, field) => {
                    acc[field.fieldId] = inputData[field.fieldId];
                    return acc;
                }, {});
                
                // Validate data early. We don't want to query DB if input data is invalid.
                await validateModelEntryData(context, model, data);
                
                // Now we know the data is valid, proceed with DB calls.
                const [uniqueId, version] = id.split("#");
                
                const [[[entry]], [[latestEntry]]] = await db
                    .batch()
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_REVISION(version)}
                    })
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_LATEST()}
                    })
                    .execute();
                
                if(!entry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }
                
                if(entry.locked) {
                    throw new WebinyError(
                        `Cannot update entry because it's locked.`,
                        "CONTENT_ENTRY_UPDATE_ERROR"
                    );
                }
                
                utils.checkOwnership(context, permission, entry, "ownedBy");
                
                const preparedForStorageEntry = await entryToStorageTransform(context, model, ({
                    values: data || {}
                } as unknown) as CmsContentEntry);
                
                // we need full entry because of "before/after save" hooks
                const updatedEntry: CmsContentEntry = {
                    ...entry,
                    savedOn: new Date().toISOString(),
                    values: {
                        // Values from DB
                        ...entry.values,
                        // New values
                        ...data
                    }
                };
                
                const updatedStorageEntry = {
                    ...updatedEntry,
                    values: {
                        ...updatedEntry.values,
                        // Transformed values
                        ...preparedForStorageEntry.values
                    }
                };
                
                await beforeUpdateHook({model, entry: updatedEntry, context, storageOperations});
                
                const batch = db.batch();
                batch.update({
                    ...utils.defaults.db(),
                    query: {PK: PK_ENTRY(uniqueId), SK: SK_REVISION(version)},
                    data: updatedStorageEntry
                });
                
                if(latestEntry.id === id) {
                    // We need to convert data from DB to its original form before constructing ES index data.
                    const originalEntry = await entryFromStorageTransform(context, model, entry);
                    // and then prepare the entry for indexing
                    const esEntry = prepareEntryToIndex({
                        context,
                        model,
                        originalEntry: cloneDeep(originalEntry),
                        storageEntry: cloneDeep(updatedStorageEntry)
                    });
                    const esDoc = {
                        ...esEntry,
                        savedOn: updatedStorageEntry.savedOn
                    };
                    
                    const {index: esIndex} = utils.defaults.es(context, model);
                    
                    batch.update({
                        ...utils.defaults.esDb(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST()
                        },
                        data: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST(),
                            index: esIndex,
                            data: omit(getESLatestEntryData(context, esDoc), ["PK", "SK", "TYPE"])
                        }
                    });
                }
                
                await batch.execute();
                
                await afterUpdateHook({model, entry: updatedEntry, context, storageOperations});
                
                return updatedStorageEntry;
            },
            deleteRevision: async (model, revisionId) => {
                const permission = await checkPermissions({rwd: "d"});
                utils.checkModelAccess(context, permission, model);
                
                const [uniqueId, version] = revisionId.split("#");
                
                const [entry, latestEntry, publishedEntry] = await storageOperations.getMultiple(model, [
                    {
                        where: {
                            id: uniqueId,
                            version: parseInt(version),
                        },
                    },
                    {
                        where: {
                            id: uniqueId,
                            latest: true,
                        }
                    },
                    {
                        where: {
                            id: uniqueId,
                            published: true,
                        }
                    }
                ]);
                
                // const [[[entry]], [[latestEntryData]], [[publishedEntryData]]] = await db
                //     .batch()
                //     .read({
                //         ...utils.defaults.db(),
                //         query: {
                //             PK: PK_ENTRY(uniqueId),
                //             SK: SK_REVISION(version)
                //         }
                //     })
                //     .read({
                //         ...utils.defaults.db(),
                //         query: {
                //             PK: PK_ENTRY(uniqueId),
                //             SK: SK_LATEST()
                //         }
                //     })
                //     .read({
                //         ...utils.defaults.db(),
                //         query: {
                //             PK: PK_ENTRY(uniqueId),
                //             SK: SK_PUBLISHED()
                //         }
                //     })
                //     .execute();
                
                if(!entry) {
                    throw new NotFoundError(`Entry "${revisionId}" was not found!`);
                }
                
                utils.checkOwnership(context, permission, entry, "ownedBy");
    
                const isLatest = latestEntry ? latestEntry.id === revisionId : false;
                const isPublished = publishedEntry ? publishedEntry.id === revisionId : false;
                
                // BATCH 1 delete revision from the database
                const deleteArgsList: any[] = [
                    {
                        where: {
                            id: uniqueId,
                            version,
                        },
                    },
                ];
                // BATCH 1 if published - delete published key
                if (isPublished) {
                    deleteArgsList.push({
                        where: {
                            id: uniqueId,
                            published: true,
                        }
                    })
                }
                // BATCH 1 execute?
                await storageOperations.deleteMultiple(model, deleteArgsList);
                
                // if is latest read previous entry
                const previousEntry = await storageOperations.get(model, {
                    where: {
                        id: uniqueId,
                        version_lt: parseInt(version),
                    },
                    sort: [
                        "createdOn_DESC",
                    ]
                });
                // if no previous entry, just call delete - no need for BATCH
                if (!previousEntry) {
                    return
                }
                
                // BATCH 2 insert new latest
                
                await beforeDeleteRevisionHook({
                    context,
                    model,
                    storageOperations,
                    publishedEntry,
                    latestEntry,
                    entry,
                });
                
                // Delete revision from DB
                const batch = db.batch().delete({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_ENTRY(uniqueId),
                        SK: SK_REVISION(version)
                    }
                });
                
                const es = utils.defaults.es(context, model);
                

                
                // If the entry is published, remove published data, both from DB and ES.
                if(isPublished) {
                    batch.delete(
                        {
                            ...utils.defaults.db(),
                            query: {
                                PK: PK_ENTRY(uniqueId),
                                SK: SK_PUBLISHED()
                            }
                        },
                        {
                            ...utils.defaults.esDb(),
                            query: {
                                PK: PK_ENTRY(uniqueId),
                                SK: SK_PUBLISHED()
                            }
                        }
                    );
                }
                
                // If the entry is "latest", set the previous entry as the new latest.
                // Updates must be made on both DB and ES side.
                if(isLatest) {
                    const [[prevLatestEntry]] = await db.read<DbItem<CmsContentEntry>>({
                        ...utils.defaults.db(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: {$lt: SK_REVISION(version)}
                        },
                        // Sorting in descending order will also make sure we only get items starting with REV#
                        sort: {SK: -1},
                        limit: 1
                    });
                    
                    if(!prevLatestEntry) {
                        // If we haven't found the previous revision, this must must be the last revision.
                        // We can safely call `deleteEntry` to remove the whole entry and all of the related data.
                        const result = entries.deleteEntry(model, uniqueId);
                        // need to call lifecycle hook because we are ending the execution of this fn here
                        await afterDeleteRevisionHook({
                            context,
                            model,
                            entry, storageOperations
                        });
                        //
                        return result;
                    }
                    
                    // Update latest entry data.
                    batch
                        .update({
                            ...utils.defaults.db(),
                            query: {
                                PK: PK_ENTRY(uniqueId),
                                SK: SK_LATEST()
                            },
                            data: {
                                ...latestEntry,
                                ...omit(prevLatestEntry, ["PK", "SK", "TYPE"])
                            }
                        })
                        .update({
                            ...utils.defaults.esDb(),
                            query: {
                                PK: PK_ENTRY(uniqueId),
                                SK: SK_LATEST()
                            },
                            data: {
                                PK: PK_ENTRY(uniqueId),
                                SK: SK_LATEST(),
                                index: es.index,
                                data: getESLatestEntryData(context, prevLatestEntry)
                            }
                        });
                }
                
                // Execute DB operations
                await batch.execute();
                
                await afterDeleteRevisionHook({
                    context,
                    model,
                    entry, storageOperations
                });
            },
            deleteEntry: async (model, entryId) => {
                const permission = await checkPermissions({rwd: "d"});
                utils.checkModelAccess(context, permission, model);
                
                const [dbItems] = await db.read<CmsContentEntry>({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_ENTRY(entryId),
                        SK: {$gte: " "}
                    }
                });
                
                if(!dbItems.length) {
                    throw new NotFoundError(`Entry "${entryId}" was not found!`);
                }
                
                utils.checkOwnership(context, permission, entries[0], "ownedBy");
                
                // need last entry from the items for hooks
                const entry = dbItems[dbItems.length - 1];
                
                await beforeDeleteHook({
                    context,
                    model,
                    entry, storageOperations
                });
                
                // Load ES entries to delete
                const [esDbItems] = await db.read({
                    ...utils.defaults.esDb(),
                    query: {
                        PK: PK_ENTRY(entryId),
                        SK: {$gte: " "}
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
                
                await afterDeleteHook({
                    context,
                    model,
                    entry, storageOperations
                });
            },
            publish: async (model, id) => {
                const permission = await checkPermissions({pw: "p"});
                utils.checkModelAccess(context, permission, model);
                
                const [uniqueId, version] = id.split("#");
                const ENTRY_PK = PK_ENTRY(uniqueId);
                const LATEST_SK = SK_LATEST();
                const PUBLISHED_SK = SK_PUBLISHED();
                
                const [
                    [[entry]],
                    [[latestEntryData]],
                    [[publishedEntryData]],
                    [[latestESData]],
                    [[publishedESData]]
                ] = await db
                    .batch()
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: ENTRY_PK, SK: SK_REVISION(version)}
                    })
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: ENTRY_PK, SK: LATEST_SK}
                    })
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: ENTRY_PK, SK: PUBLISHED_SK}
                    })
                    .read({
                        ...utils.defaults.esDb(),
                        query: {PK: ENTRY_PK, SK: LATEST_SK}
                    })
                    .read({
                        ...utils.defaults.esDb(),
                        query: {PK: ENTRY_PK, SK: PUBLISHED_SK}
                    })
                    .execute();
                
                if(!entry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }
                
                utils.checkOwnership(context, permission, entry, "ownedBy");
                
                // Change entry to "published"
                entry.status = STATUS_PUBLISHED;
                entry.locked = true;
                entry.publishedOn = new Date().toISOString();
                
                await beforePublishHook({
                    context,
                    model,
                    entry, storageOperations
                });
                
                const batch = db.batch();
                
                batch.update({
                    ...utils.defaults.db(),
                    query: {
                        PK: ENTRY_PK,
                        SK: SK_REVISION(version)
                    },
                    data: entry
                });
                
                const es = utils.defaults.es(context, model);
                
                if(publishedEntryData) {
                    // If there is a `published` entry already, we need to set it to `unpublished`. We need to
                    // execute two updates: update the previously published entry's status and the published
                    // entry record (PK_ENTRY_PUBLISHED()).
                    
                    // DynamoDB does not support `batchUpdate` - so here we load the previously published
                    // entry's data to update its status within a batch operation. If, hopefully,
                    // they introduce a true update batch operation, remove this `read` call.
                    
                    const [[previouslyPublishedEntry]] = await db.read<CmsContentEntry>({
                        ...utils.defaults.db(),
                        query: {
                            PK: ENTRY_PK,
                            SK: SK_REVISION(utils.zeroPad(publishedEntryData.version))
                        }
                    });
                    
                    previouslyPublishedEntry.status = STATUS_UNPUBLISHED;
                    
                    batch
                        .update({
                            // Update currently published entry (unpublish it)
                            ...utils.defaults.db(),
                            query: {
                                PK: ENTRY_PK,
                                SK: SK_REVISION(utils.zeroPad(publishedEntryData.version))
                            },
                            data: previouslyPublishedEntry
                        })
                        .update({
                            // Update the helper item in DB with the new published entry ID
                            ...utils.defaults.db(),
                            query: {
                                PK: ENTRY_PK,
                                SK: PUBLISHED_SK
                            },
                            data: {
                                PK: ENTRY_PK,
                                SK: PUBLISHED_SK,
                                ...publishedEntryData,
                                ...omit(entry, ["PK", "SK", "TYPE"])
                            }
                        });
                }
                else {
                    batch.create({
                        ...utils.defaults.db(),
                        data: {
                            PK: ENTRY_PK,
                            SK: PUBLISHED_SK,
                            TYPE: TYPE_ENTRY_PUBLISHED,
                            ...omit(entry, ["PK", "SK", "TYPE"])
                        }
                    });
                }
                
                // If we are publishing the latest revision, let's also update the latest revision's status in ES.
                if(latestEntryData && latestEntryData.id === id) {
                    batch.update({
                        ...utils.defaults.esDb(),
                        query: {
                            PK: ENTRY_PK,
                            SK: LATEST_SK
                        },
                        data: {
                            ...latestESData,
                            data: {
                                ...latestESData.data,
                                status: STATUS_PUBLISHED,
                                locked: true,
                                publishedOn: entry.publishedOn
                            }
                        }
                    });
                }
                const originalEntry = await entryFromStorageTransform(context, model, entry);
                const preparedEntry = prepareEntryToIndex({
                    context,
                    model,
                    originalEntry: cloneDeep(originalEntry),
                    storageEntry: cloneDeep(entry)
                });
                
                // Update the published revision entry in ES.
                const esData = {
                    PK: ENTRY_PK,
                    SK: PUBLISHED_SK,
                    index: es.index,
                    data: getESPublishedEntryData(context, preparedEntry)
                };
                
                if(publishedESData) {
                    batch.update({
                        ...utils.defaults.esDb(),
                        query: {
                            PK: ENTRY_PK,
                            SK: PUBLISHED_SK
                        },
                        data: esData
                    });
                }
                else {
                    batch.create({
                        ...utils.defaults.esDb(),
                        data: esData
                    });
                }
                
                // Finally, execute batch
                await batch.execute();
                
                // Clear DataLoader cache for this entry.
                loaders.getAllEntryRevisions.clear(uniqueId);
                
                await afterPublishHook({
                    context,
                    model,
                    entry, storageOperations
                });
                
                return entry;
            },
            requestChanges: async (model, id) => {
                const permission = await checkPermissions({pw: "c"});
                const [uniqueId, version] = id.split("#");
                
                const [[[entry]], [[latestEntryData]]] = await db
                    .batch<[[CmsContentEntry]], [[{id: string}]]>()
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_REVISION(version)}
                    })
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_LATEST()}
                    })
                    .execute();
                
                if(!entry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }
                
                if(entry.status !== STATUS_REVIEW_REQUESTED) {
                    throw new WebinyError(
                        "Cannot request changes on an entry that's not under review.",
                        "ENTRY_NOT_UNDER_REVIEW"
                    );
                }
                
                const identity = context.security.getIdentity();
                if(entry.ownedBy.id === identity.id) {
                    throw new WebinyError(
                        "You cannot request changes on your own entry.",
                        "CANNOT_REQUEST_CHANGES_ON_OWN_ENTRY"
                    );
                }
                
                utils.checkOwnership(context, permission, entry, "ownedBy");
                
                await beforeRequestChangesHook({
                    context,
                    model,
                    entry, storageOperations
                });
                
                const updatedEntry: CmsContentEntry = Object.assign(entry, {
                    status: STATUS_CHANGES_REQUESTED,
                    locked: false
                });
                
                const batch = db.batch().update({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_ENTRY(uniqueId),
                        SK: SK_REVISION(version)
                    },
                    data: updatedEntry
                });
                
                // If we updated the latest version, then make sure the changes are propagated to ES too.
                if(latestEntryData.id === id) {
                    // Index file in "Elastic Search"
                    const es = utils.defaults.es(context, model);
                    batch.update({
                        ...utils.defaults.esDb(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST()
                        },
                        data: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST(),
                            index: es.index,
                            data: getESLatestEntryData(context, updatedEntry)
                        }
                    });
                }
                
                await batch.execute();
                
                await afterRequestChangesHook({
                    context,
                    model,
                    entry: updatedEntry, storageOperations
                });
                
                return updatedEntry;
            },
            requestReview: async (model, id) => {
                const permission = await checkPermissions({pw: "r"});
                const [uniqueId, version] = id.split("#");
                
                const [[[entry]], [[latestEntryData]]] = await db
                    .batch<[[CmsContentEntry]], [[{id: string}]]>()
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_REVISION(version)}
                    })
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_LATEST()}
                    })
                    .execute();
                
                if(!entry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }
                
                const allowedStatuses = [STATUS_DRAFT, STATUS_CHANGES_REQUESTED];
                if(!allowedStatuses.includes(entry.status)) {
                    throw new Error(
                        "Cannot request review - entry is not a draft nor was a change request issued."
                    );
                }
                
                utils.checkOwnership(context, permission, entry, "ownedBy");
                
                // Change entry's status.
                const updatedEntry: CmsContentEntry = Object.assign(entry, {
                    status: STATUS_REVIEW_REQUESTED,
                    locked: true
                });
                
                await beforeRequestReviewHook({
                    context,
                    model,
                    entry, storageOperations
                });
                
                const batch = db.batch().update({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_ENTRY(uniqueId),
                        SK: SK_REVISION(version)
                    },
                    data: updatedEntry
                });
                
                await afterRequestReviewHook({
                    context,
                    model,
                    entry: updatedEntry, storageOperations
                });
                
                // If we updated the latest version, then make sure the changes are propagated to ES too.
                if(latestEntryData.id === id) {
                    // Index file in "Elastic Search"
                    const es = utils.defaults.es(context, model);
                    batch.update({
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST()
                        },
                        data: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST(),
                            index: es.index,
                            data: getESLatestEntryData(context, updatedEntry)
                        }
                    });
                }
                
                await batch.execute();
                
                return updatedEntry;
            },
            unpublish: async (model, id) => {
                const permission = await checkPermissions({pw: "u"});
                
                const [uniqueId, version] = id.split("#");
                
                const [[[entry]], [[latestEntryData]], [[publishedEntryData]]] = await db
                    .batch()
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_REVISION(version)}
                    })
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_LATEST()}
                    })
                    .read({
                        ...utils.defaults.db(),
                        query: {PK: PK_ENTRY(uniqueId), SK: SK_PUBLISHED()}
                    })
                    .execute();
                
                if(!entry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }
                
                utils.checkOwnership(context, permission, entry, "ownedBy");
                
                if(!publishedEntryData || publishedEntryData.id !== id) {
                    throw new Error(`Entry "${id}" is not published.`);
                }
                
                entry.status = STATUS_UNPUBLISHED;
                
                await beforeUnpublishHook({
                    context,
                    model,
                    entry, storageOperations
                });
                
                const batch = db
                    .batch()
                    .delete({
                        ...utils.defaults.db(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_PUBLISHED()
                        }
                    })
                    .delete({
                        ...utils.defaults.esDb(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_PUBLISHED()
                        }
                    })
                    .update({
                        ...utils.defaults.db(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_REVISION(version)
                        },
                        data: entry
                    });
                
                await afterUnpublishHook({
                    context,
                    model,
                    entry, storageOperations
                });
                
                // If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
                if(latestEntryData.id === id) {
                    const es = utils.defaults.es(context, model);
                    
                    batch.update({
                        ...utils.defaults.esDb(),
                        query: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST()
                        },
                        data: {
                            PK: PK_ENTRY(uniqueId),
                            SK: SK_LATEST(),
                            index: es.index,
                            data: getESLatestEntryData(context, entry)
                        }
                    });
                }
                
                await batch.execute();
                
                return entry;
            }
        };
        
        context.cms = {
            ...(context.cms || ({} as any)),
            entries
        };
    }
});
