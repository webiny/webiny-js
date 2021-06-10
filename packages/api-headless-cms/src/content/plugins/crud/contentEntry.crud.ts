import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    CmsContentEntryContext,
    CmsContentEntryPermission,
    CmsContentEntry,
    CmsContentModel,
    CmsContext,
    CmsContentEntryStorageOperationsProvider
} from "../../../types";
import * as utils from "../../../utils";
import { validateModelEntryData } from "./contentEntry/entryDataValidation";
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
import { entryFromStorageTransform } from "../utils/entryStorage";

export const STATUS_DRAFT = "draft";
export const STATUS_PUBLISHED = "published";
export const STATUS_UNPUBLISHED = "unpublished";
export const STATUS_CHANGES_REQUESTED = "changesRequested";
export const STATUS_REVIEW_REQUESTED = "reviewRequested";

const cleanInputData = (
    model: CmsContentModel,
    inputData: Record<string, any>
): Record<string, any> => {
    return model.fields.reduce((acc, field) => {
        acc[field.fieldId] = inputData[field.fieldId];
        return acc;
    }, {});
};

interface EntryIdResult {
    /**
     * A generated id that will connect all the entry records.
     */
    entryId: string;
    /**
     * Version of the entry.
     */
    version: number;
    /**
     * Combination of entryId and version.
     */
    id: string;
}
const createEntryId = (version: number): EntryIdResult => {
    const entryId = mdbid();
    return {
        entryId,
        version,
        id: `${entryId}#${utils.zeroPad(version)}`
    };
};

const increaseEntryIdVersion = (id: string): EntryIdResult => {
    if (id.includes("#") === false) {
        throw new WebinyError(
            "Cannot increase version on the ID without the version part.",
            "WRONG_ID",
            {
                id
            }
        );
    }
    const [entryId, version] = id.split("#");
    const ver = parseInt(version) + 1;
    return {
        entryId,
        version: ver,
        id: `${entryId}#${utils.zeroPad(ver)}`
    };
};

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-entry",
    async apply(context) {
        const { security } = context;

        const pluginType = "cms-content-entry-storage-operations-provider";
        const providerPlugins = context.plugins.byType<CmsContentEntryStorageOperationsProvider>(
            pluginType
        );
        /**
         * Storage operations for the content entry.
         * Contains logic to save the data into the specific storage.
         */
        const providerPlugin = providerPlugins[providerPlugins.length - 1];
        if (!providerPlugin) {
            throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
                type: pluginType
            });
        }

        const storageOperations = await providerPlugin.provide({
            context
        });

        const checkEntryPermissions = (check: {
            rwd?: string;
            pw?: string;
        }): Promise<CmsContentEntryPermission> => {
            return utils.checkPermissions(context, "cms.contentEntry", check);
        };

        /**
         * A helper to delete the entire entry.
         */
        const deleteEntry = async (
            model: CmsContentModel,
            entry: CmsContentEntry
        ): Promise<void> => {
            try {
                await beforeDeleteHook({
                    context,
                    model,
                    entry,
                    storageOperations
                });
                await storageOperations.delete(model, {
                    entry
                });
                await afterDeleteHook({
                    context,
                    model,
                    entry,
                    storageOperations
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete entry.",
                    ex.code || "DELETE_ERROR",
                    {
                        entry
                    }
                );
            }
        };
        /**
         * A helper to get entries by revision IDs
         */
        const getEntriesByIds = async (model: CmsContentModel, ids: string[]) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await utils.checkModelAccess(context, model);

            const entries = await storageOperations.getByIds(model, ids);

            return entries.filter(entry => utils.validateOwnership(context, permission, entry));
        };

        const entries: CmsContentEntryContext = {
            operations: storageOperations,
            /**
             * Get entries by exact revision IDs from the database.
             */
            getByIds: getEntriesByIds,
            /**
             * Get a single entry by revision ID from the database.
             */
            getById: async (model, id) => {
                const [entry] = await getEntriesByIds(model, [id]);
                if (!entry) {
                    throw new NotFoundError(`Entry by ID "${id}" not found.`);
                }
                return entry;
            },
            /**
             * Get latest published revisions by entry IDs.
             */
            getPublishedByIds: async (model: CmsContentModel, ids: string[]) => {
                const permission = await checkEntryPermissions({ rwd: "r" });
                await utils.checkModelAccess(context, model);

                const entries = await storageOperations.getPublishedByIds(model, ids);

                return entries.filter(entry => utils.validateOwnership(context, permission, entry));
            },
            /**
             * Get latest revisions by entry IDs.
             */
            getLatestByIds: async (model: CmsContentModel, ids: string[]) => {
                const permission = await checkEntryPermissions({ rwd: "r" });
                await utils.checkModelAccess(context, model);

                const entries = await storageOperations.getLatestByIds(model, ids);

                return entries.filter(entry => utils.validateOwnership(context, permission, entry));
            },

            getEntryRevisions: async (model, entryId) => {
                return storageOperations.getRevisions(model, entryId);
            },
            get: async (model, args) => {
                await checkEntryPermissions({ rwd: "r" });

                const [items] = await context.cms.entries.list(model, {
                    ...args,
                    limit: 1
                });

                if (items.length === 0) {
                    throw new NotFoundError(`Entry not found!`);
                }
                return items[0];
            },
            list: async (model: CmsContentModel, args) => {
                const permission = await checkEntryPermissions({ rwd: "r" });
                await utils.checkModelAccess(context, model);

                const { where = {} } = args || {};
                // Possibly only get records which are owned by current user
                // Or if searching for the owner set that value - in the case that user can see other entries than their own
                const ownedBy = permission.own ? context.security.getIdentity().id : where.ownedBy;
                const listWhere = {
                    ...where
                };
                if (ownedBy !== undefined) {
                    listWhere.ownedBy = ownedBy;
                }

                const { hasMoreItems, totalCount, cursor, items } = await storageOperations.list(
                    model,
                    {
                        ...args,
                        where: listWhere
                    }
                );

                const meta = {
                    hasMoreItems,
                    totalCount,
                    /**
                     * Cursor should be null if there are no more items to load.
                     * Just make sure of that, disregarding what is returned from the storageOperations.list method.
                     */
                    cursor: hasMoreItems ? cursor : null
                };

                return [items, meta];
            },
            listLatest: async function(model, args = {}) {
                return context.cms.entries.list(model, {
                    sort: ["createdOn_DESC"],
                    ...args,
                    where: {
                        ...(args.where || {}),
                        latest: true
                    }
                });
            },
            listPublished: async function(model, args = {}) {
                return context.cms.entries.list(model, {
                    sort: ["createdOn_DESC"],
                    ...args,
                    where: {
                        ...(args.where || {}),
                        published: true
                    }
                });
            },
            create: async (model, inputData) => {
                await checkEntryPermissions({ rwd: "w" });
                await utils.checkModelAccess(context, model);

                // Make sure we only work with fields that are defined in the model.
                const input = cleanInputData(model, inputData);

                await validateModelEntryData(context, model, input);

                const identity = security.getIdentity();
                const locale = context.cms.getLocale();

                const owner = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };

                const { id, entryId, version } = createEntryId(1);

                const data: CmsContentEntry = {
                    webinyVersion: context.WEBINY_VERSION,
                    tenant: context.tenancy.getCurrentTenant().id,
                    entryId,
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
                    values: input
                };

                try {
                    await beforeCreateHook({ model, input, data, context, storageOperations });
                    const entryRevision = await storageOperations.create(model, {
                        input,
                        data
                    });
                    await afterCreateHook({
                        model,
                        input,
                        data,
                        entryRevision,
                        context,
                        storageOperations
                    });
                    return entryRevision;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create content entry.",
                        ex.code || "CREATE_ENTRY_ERROR",
                        ex.data || {
                            error: ex,
                            input,
                            data
                        }
                    );
                }
            },
            createRevisionFrom: async (model, sourceId, data = {}) => {
                const permission = await checkEntryPermissions({ rwd: "w" });
                await utils.checkModelAccess(context, model);

                // Entries are identified by a common parent ID + Revision number
                const [uniqueId] = sourceId.split("#");

                const originalStorageEntry = await storageOperations.getRevisionById(
                    model,
                    sourceId
                );
                const latestStorageEntry = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    uniqueId
                );

                if (!originalStorageEntry) {
                    throw new NotFoundError(
                        `Entry "${sourceId}" of model "${model.modelId}" was not found.`
                    );
                }

                // We need to convert data from DB to its original form before constructing ES index data.
                const originalEntryRevision = await entryFromStorageTransform(
                    context,
                    model,
                    originalStorageEntry
                );

                const latestEntryRevision = latestStorageEntry
                    ? await entryFromStorageTransform(context, model, latestStorageEntry)
                    : null;

                utils.checkOwnership(context, permission, originalEntryRevision, "ownedBy");

                const identity = security.getIdentity();
                // const nextVersion = parseInt(latestEntry.version as any) + 1;
                // const id = `${uniqueId}#${utils.zeroPad(nextVersion)}`;
                const { id, version: nextVersion } = increaseEntryIdVersion(
                    latestEntryRevision ? latestEntryRevision.id : sourceId
                );

                const entry: CmsContentEntry = {
                    ...originalEntryRevision,
                    id,
                    version: nextVersion,
                    savedOn: new Date().toISOString(),
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    },
                    locked: false,
                    publishedOn: null,
                    status: STATUS_DRAFT,
                    values: {
                        ...originalEntryRevision.values,
                        ...data
                    }
                };

                try {
                    await beforeCreateRevisionFromHook({
                        context,
                        model,
                        data: entry,
                        originalEntryRevision,
                        latestEntryRevision,
                        storageOperations
                    });
                    const result = await storageOperations.createRevisionFrom(model, {
                        data: entry,
                        originalEntryRevision,
                        latestEntryRevision
                    });
                    await afterCreateRevisionFromHook({
                        context,
                        model,
                        originalEntryRevision,
                        latestEntryRevision,
                        data: entry,
                        entry: result,
                        storageOperations
                    });
                    return result;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create entry from existing one.",
                        ex.code || "CREATE_FROM_REVISION_ERROR",
                        {
                            error: ex,
                            entry,
                            originalEntryRevision,
                            latestEntryRevision
                        }
                    );
                }
            },
            update: async (model, id, inputData) => {
                const permission = await checkEntryPermissions({ rwd: "w" });
                await utils.checkModelAccess(context, model);

                // Make sure we only work with fields that are defined in the model.
                const input = cleanInputData(model, inputData);

                // Validate data early. We don't want to query DB if input data is invalid.
                await validateModelEntryData(context, model, input);

                // Now we know the data is valid, proceed with DB calls.
                const [entryId] = id.split("#");

                const originalStorageEntry = await storageOperations.getRevisionById(model, id);
                const latestOriginalStorageEntry = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );

                const originalEntryRevision = await entryFromStorageTransform(
                    context,
                    model,
                    originalStorageEntry
                );
                const latestOriginalEntryRevision = latestOriginalStorageEntry
                    ? await entryFromStorageTransform(context, model, latestOriginalStorageEntry)
                    : null;

                if (!originalEntryRevision) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }

                if (originalEntryRevision.locked) {
                    throw new WebinyError(
                        `Cannot update entry because it's locked.`,
                        "CONTENT_ENTRY_UPDATE_ERROR"
                    );
                }

                utils.checkOwnership(context, permission, originalEntryRevision, "ownedBy");

                // we always send the full entry to the hooks and updater
                const updatedEntry: CmsContentEntry = {
                    ...originalEntryRevision,
                    savedOn: new Date().toISOString(),
                    values: {
                        // Values from DB
                        ...originalEntryRevision.values,
                        // New values
                        ...input
                    }
                };

                try {
                    await beforeUpdateHook({
                        context,
                        model,
                        input,
                        data: updatedEntry,
                        originalEntryRevision,
                        latestEntryRevision: latestOriginalEntryRevision,
                        storageOperations
                    });

                    const entry = await storageOperations.update(model, {
                        originalEntryRevision,
                        latestEntryRevision: latestOriginalEntryRevision,
                        data: updatedEntry,
                        input
                    });
                    await afterUpdateHook({
                        context,
                        model,
                        input,
                        data: updatedEntry,
                        entry,
                        originalEntryRevision,
                        latestEntryRevision: latestOriginalEntryRevision,
                        storageOperations
                    });
                    return entry;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update existing entry.",
                        ex.code || "UPDATE_ERROR",
                        {
                            error: ex,
                            data: updatedEntry,
                            originalEntryRevision,
                            latestEntry: latestOriginalEntryRevision,
                            input
                        }
                    );
                }
            },
            deleteRevision: async (model, revisionId) => {
                const permission = await checkEntryPermissions({ rwd: "d" });
                await utils.checkModelAccess(context, model);

                const [entryId, version] = revisionId.split("#");

                const entryRevisionToDelete = await storageOperations.getRevisionById(
                    model,
                    revisionId
                );
                const latestEntryRevision = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );
                const publishedEntryRevision = await storageOperations.getPublishedRevisionByEntryId(
                    model,
                    entryId
                );
                const previousEntryRevision = await storageOperations.getPreviousRevision(
                    model,
                    entryId,
                    parseInt(version)
                );

                if (!entryRevisionToDelete) {
                    throw new NotFoundError(`Entry "${revisionId}" was not found!`);
                }

                utils.checkOwnership(context, permission, entryRevisionToDelete, "ownedBy");

                const latestEntryRevisionId = latestEntryRevision ? latestEntryRevision.id : null;
                /**
                 * If targeted record is the latest entry record and there is no previous one, we need to run full delete with hooks.
                 * At this point deleteEntry hooks are not fired.
                 * TODO determine if not running the deleteRevision hooks is ok.
                 */
                if (entryRevisionToDelete.id === latestEntryRevisionId && !previousEntryRevision) {
                    return await deleteEntry(model, entryRevisionToDelete);
                }
                /**
                 * If targeted record is latest entry revision, set the previous one as the new latest
                 */
                const entryRevisionToSetAsLatest =
                    entryRevisionToDelete.id === latestEntryRevisionId
                        ? previousEntryRevision
                        : null;

                try {
                    await beforeDeleteRevisionHook({
                        context,
                        model,
                        storageOperations,
                        entryRevisionToDelete,
                        entryRevisionToSetAsLatest
                    });
                    await storageOperations.deleteRevision(model, {
                        entryRevisionToDelete,
                        entryRevisionToSetAsLatest,
                        publishedEntryRevision,
                        latestEntryRevision
                    });

                    await afterDeleteRevisionHook({
                        context,
                        model,
                        storageOperations,
                        deletedEntryRevision: entryRevisionToDelete,
                        latestEntryRevision: entryRevisionToSetAsLatest
                    });
                } catch (ex) {
                    throw new WebinyError(ex.message, ex.code || "DELETE_REVISION_ERROR", {
                        error: ex,
                        deletedEntryRevision: entryRevisionToDelete,
                        latestEntryRevision: entryRevisionToSetAsLatest
                    });
                }
            },
            deleteEntry: async (model, entryId) => {
                const permission = await checkEntryPermissions({ rwd: "d" });
                await utils.checkModelAccess(context, model);

                const entry = await storageOperations.getLatestRevisionByEntryId(model, entryId);

                if (!entry) {
                    throw new NotFoundError(`Entry "${entryId}" was not found!`);
                }

                utils.checkOwnership(context, permission, entry, "ownedBy");

                return await deleteEntry(model, entry);
            },
            publish: async (model, id) => {
                const permission = await checkEntryPermissions({ pw: "p" });
                await utils.checkModelAccess(context, model);

                const [uniqueId] = id.split("#");

                const originalEntryRevision = await storageOperations.getRevisionById(model, id);
                const latestEntryRevision = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    uniqueId
                );
                const publishedEntryRevision = await storageOperations.getPublishedRevisionByEntryId(
                    model,
                    uniqueId
                );

                if (!originalEntryRevision) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }

                utils.checkOwnership(context, permission, originalEntryRevision, "ownedBy");

                const currentDate = new Date().toISOString();
                const entry: CmsContentEntry = {
                    ...originalEntryRevision,
                    status: STATUS_PUBLISHED,
                    locked: true,
                    savedOn: currentDate,
                    publishedOn: currentDate
                };

                try {
                    await beforePublishHook({
                        context,
                        storageOperations,
                        model,
                        originalEntryRevision,
                        entry,
                        latestEntryRevision,
                        publishedEntryRevision
                    });
                    const newPublishedEntry = await storageOperations.publish(model, {
                        entry,
                        originalEntryRevision,
                        latestEntryRevision,
                        publishedEntryRevision
                    });
                    await afterPublishHook({
                        context,
                        storageOperations,
                        model,
                        originalEntryRevision,
                        entry: newPublishedEntry,
                        latestEntryRevision,
                        publishedEntryRevision
                    });
                    return newPublishedEntry;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not publish entry.",
                        ex.code || "PUBLISH_ERROR",
                        {
                            entry,
                            latestEntryRevision,
                            publishedEntryRevision
                        }
                    );
                }
            },
            requestChanges: async (model, id) => {
                const permission = await checkEntryPermissions({ pw: "c" });
                const [entryId] = id.split("#");

                const originalEntryRevision = await storageOperations.getRevisionById(model, id);
                const latestEntryRevision = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );

                if (!originalEntryRevision) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }

                if (originalEntryRevision.status !== STATUS_REVIEW_REQUESTED) {
                    throw new WebinyError(
                        "Cannot request changes on an entry that's not under review.",
                        "ENTRY_NOT_UNDER_REVIEW"
                    );
                }

                const identity = context.security.getIdentity();
                if (originalEntryRevision.ownedBy.id === identity.id) {
                    throw new WebinyError(
                        "You cannot request changes on your own entry.",
                        "CANNOT_REQUEST_CHANGES_ON_OWN_ENTRY"
                    );
                }

                utils.checkOwnership(context, permission, originalEntryRevision, "ownedBy");

                const entry: CmsContentEntry = {
                    ...originalEntryRevision,
                    status: STATUS_CHANGES_REQUESTED,
                    locked: false
                };

                try {
                    await beforeRequestChangesHook({
                        context,
                        model,
                        originalEntryRevision,
                        latestEntryRevision,
                        entry,
                        storageOperations
                    });
                    const updatedRequestChangesEntry = await storageOperations.requestChanges(
                        model,
                        {
                            originalEntryRevision,
                            latestEntryRevision,
                            entry
                        }
                    );
                    await afterRequestChangesHook({
                        context,
                        model,
                        originalEntryRevision,
                        latestEntryRevision,
                        entry: updatedRequestChangesEntry,
                        storageOperations
                    });
                    return updatedRequestChangesEntry;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not request changes for the entry.",
                        ex.code || "REQUEST_CHANGES_ERROR",
                        {
                            entry,
                            originalEntry: originalEntryRevision
                        }
                    );
                }
            },
            requestReview: async (model, id) => {
                const permission = await checkEntryPermissions({ pw: "r" });
                const [entryId] = id.split("#");

                const originalEntryRevision = await storageOperations.getRevisionById(model, id);
                const latestEntryRevision = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );

                if (!originalEntryRevision) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                } else if (!latestEntryRevision) {
                    throw new NotFoundError(`Entry "${id}" does not have latest record`);
                }

                const allowedStatuses = [STATUS_DRAFT, STATUS_CHANGES_REQUESTED];
                if (!allowedStatuses.includes(originalEntryRevision.status)) {
                    throw new WebinyError(
                        "Cannot request review - entry is not a draft nor was a change request issued.",
                        "REQUEST_REVIEW_ERROR",
                        {
                            entry: originalEntryRevision
                        }
                    );
                }

                utils.checkOwnership(context, permission, originalEntryRevision, "ownedBy");

                // Change entry's status.
                const entry: CmsContentEntry = {
                    ...originalEntryRevision,
                    status: STATUS_REVIEW_REQUESTED,
                    locked: true
                };

                try {
                    await beforeRequestReviewHook({
                        context,
                        model,
                        originalEntryRevision,
                        entry,
                        latestEntryRevision,
                        storageOperations
                    });
                    const updateRequestReviewEntry = await storageOperations.requestReview(model, {
                        originalEntryRevision,
                        latestEntryRevision,
                        entry
                    });
                    await afterRequestReviewHook({
                        context,
                        model,
                        originalEntryRevision,
                        entry: updateRequestReviewEntry,
                        latestEntryRevision,
                        storageOperations
                    });
                    return updateRequestReviewEntry;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not request review on the entry.",
                        ex.code || "REQUEST_REVIEW_ERROR",
                        {
                            originalEntry: originalEntryRevision,
                            latestEntry: latestEntryRevision,
                            entry
                        }
                    );
                }
            },
            unpublish: async (model, id) => {
                const permission = await checkEntryPermissions({ pw: "u" });

                const [entryId] = id.split("#");

                const originalEntryRevision = await storageOperations.getRevisionById(model, id);
                const latestEntryRevision = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );
                const publishedEntryRevision = await storageOperations.getPublishedRevisionByEntryId(
                    model,
                    entryId
                );

                if (!originalEntryRevision) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
                }

                utils.checkOwnership(context, permission, originalEntryRevision, "ownedBy");

                if (!publishedEntryRevision || publishedEntryRevision.id !== id) {
                    throw new WebinyError(`Entry is not published.`, "UNPUBLISH_ERROR", {
                        originalEntry: originalEntryRevision
                    });
                }

                const entry: CmsContentEntry = {
                    ...originalEntryRevision,
                    status: STATUS_UNPUBLISHED
                };

                try {
                    await beforeUnpublishHook({
                        context,
                        model,
                        originalEntryRevision,
                        entry,
                        latestEntryRevision,
                        publishedEntryRevision,
                        storageOperations
                    });
                    const newUnpublishedEntry = await storageOperations.unpublish(model, {
                        originalEntryRevision,
                        entry,
                        latestEntryRevision,
                        publishedEntryRevision
                    });
                    await afterUnpublishHook({
                        context,
                        model,
                        originalEntryRevision,
                        entry,
                        latestEntryRevision,
                        publishedEntryRevision,
                        storageOperations
                    });
                    return newUnpublishedEntry;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not unpublish entry.",
                        ex.code || "UNPUBLISH_ERROR",
                        {
                            entry,
                            originalEntry: originalEntryRevision,
                            latestEntry: latestEntryRevision,
                            publishedEntry: publishedEntryRevision
                        }
                    );
                }
            }
        };

        context.cms = {
            ...(context.cms || ({} as any)),
            entries
        };
    }
});
