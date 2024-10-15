import { parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    CmsContext,
    CmsEntry,
    CmsEntryContext,
    CmsEntryGetParams,
    CmsEntryListParams,
    CmsEntryListWhere,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput,
    EntryBeforeListTopicParams,
    HeadlessCmsStorageOperations,
    OnEntryAfterCreateTopicParams,
    OnEntryAfterDeleteMultipleTopicParams,
    OnEntryAfterDeleteTopicParams,
    OnEntryAfterMoveTopicParams,
    OnEntryAfterPublishTopicParams,
    OnEntryAfterRepublishTopicParams,
    OnEntryAfterRestoreFromBinTopicParams,
    OnEntryAfterUnpublishTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryBeforeCreateTopicParams,
    OnEntryBeforeDeleteMultipleTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryBeforeGetTopicParams,
    OnEntryBeforeMoveTopicParams,
    OnEntryBeforePublishTopicParams,
    OnEntryBeforeRepublishTopicParams,
    OnEntryBeforeRestoreFromBinTopicParams,
    OnEntryBeforeUnpublishTopicParams,
    OnEntryBeforeUpdateTopicParams,
    OnEntryCreateErrorTopicParams,
    OnEntryCreateRevisionErrorTopicParams,
    OnEntryDeleteErrorTopicParams,
    OnEntryDeleteMultipleErrorTopicParams,
    OnEntryMoveErrorTopicParams,
    OnEntryPublishErrorTopicParams,
    OnEntryRepublishErrorTopicParams,
    OnEntryRestoreFromBinErrorTopicParams,
    OnEntryRevisionAfterCreateTopicParams,
    OnEntryRevisionAfterDeleteTopicParams,
    OnEntryRevisionBeforeCreateTopicParams,
    OnEntryRevisionBeforeDeleteTopicParams,
    OnEntryRevisionDeleteErrorTopicParams,
    OnEntryUnpublishErrorTopicParams,
    OnEntryUpdateErrorTopicParams
} from "~/types";
import { validateModelEntryData } from "./contentEntry/entryDataValidation";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeEntryCreate } from "./contentEntry/beforeCreate";
import { assignBeforeEntryUpdate } from "./contentEntry/beforeUpdate";
import { assignAfterEntryDelete } from "./contentEntry/afterDelete";
import { Tenant } from "@webiny/api-tenancy/types";
import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage";
import { getSearchableFields } from "./contentEntry/searchableFields";
import { I18NLocale } from "@webiny/api-i18n/types";
import { filterAsync } from "~/utils/filterAsync";
import { isEntryLevelEntryMetaField, pickEntryMetaFields } from "~/constants";
import {
    createEntryData,
    createEntryRevisionFromData,
    createPublishEntryData,
    createRepublishEntryData,
    createUnpublishEntryData,
    createUpdateEntryData,
    mapAndCleanUpdatedInputData
} from "./contentEntry/entryDataFactories";
import { AccessControl } from "./AccessControl/AccessControl";
import {
    getEntriesByIdsUseCases,
    listEntriesUseCases,
    getLatestEntriesByIdsUseCases,
    getPublishedEntriesByIdsUseCases,
    getRevisionsByEntryIdUseCases,
    getRevisionByIdUseCases,
    getLatestRevisionByEntryIdUseCases,
    getPreviousRevisionByEntryIdUseCases,
    getPublishedRevisionByEntryIdUseCases,
    deleteEntryUseCases,
    restoreEntryFromBinUseCases
} from "~/crud/contentEntry/useCases";
import { ContentEntryTraverser } from "~/utils/contentEntryTraverser/ContentEntryTraverser";

interface CreateContentEntryCrudParams {
    storageOperations: HeadlessCmsStorageOperations;
    accessControl: AccessControl;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

export const createContentEntryCrud = (params: CreateContentEntryCrudParams): CmsEntryContext => {
    const {
        storageOperations,
        accessControl,
        context,
        getIdentity: getSecurityIdentity,
        getTenant,
        getLocale
    } = params;

    /**
     * Create
     */
    const onEntryBeforeCreate =
        createTopic<OnEntryBeforeCreateTopicParams>("cms.onEntryBeforeCreate");
    const onEntryAfterCreate = createTopic<OnEntryAfterCreateTopicParams>("cms.onEntryAfterCreate");
    const onEntryCreateError = createTopic<OnEntryCreateErrorTopicParams>("cms.onEntryCreateError");

    /**
     * Create new revision
     */
    const onEntryBeforeCreateRevision = createTopic<OnEntryRevisionBeforeCreateTopicParams>(
        "cms.onEntryBeforeCreateRevision"
    );
    const onEntryRevisionAfterCreate = createTopic<OnEntryRevisionAfterCreateTopicParams>(
        "cms.onEntryRevisionAfterCreate"
    );
    const onEntryCreateRevisionError = createTopic<OnEntryCreateRevisionErrorTopicParams>(
        "cms.onEntryCreateRevisionError"
    );

    /**
     * Update
     */
    const onEntryBeforeUpdate =
        createTopic<OnEntryBeforeUpdateTopicParams>("cms.onEntryBeforeUpdate");
    const onEntryAfterUpdate = createTopic<OnEntryAfterUpdateTopicParams>("cms.onEntryAfterUpdate");
    const onEntryUpdateError = createTopic<OnEntryUpdateErrorTopicParams>("cms.onEntryUpdateError");

    /**
     * Move
     */
    const onEntryBeforeMove = createTopic<OnEntryBeforeMoveTopicParams>("cms.onEntryBeforeMove");
    const onEntryAfterMove = createTopic<OnEntryAfterMoveTopicParams>("cms.onEntryAfterMove");
    const onEntryMoveError = createTopic<OnEntryMoveErrorTopicParams>("cms.onEntryMoveError");

    /**
     * Publish
     */
    const onEntryBeforePublish = createTopic<OnEntryBeforePublishTopicParams>(
        "cms.onEntryBeforePublish"
    );
    const onEntryAfterPublish =
        createTopic<OnEntryAfterPublishTopicParams>("cms.onEntryAfterPublish");

    const onEntryPublishError =
        createTopic<OnEntryPublishErrorTopicParams>("cms.onEntryPublishError");

    /**
     * Republish
     */
    const onEntryBeforeRepublish = createTopic<OnEntryBeforeRepublishTopicParams>(
        "cms.onEntryBeforeRepublish"
    );
    const onEntryAfterRepublish = createTopic<OnEntryAfterRepublishTopicParams>(
        "cms.onEntryAfterRepublish"
    );

    const onEntryRepublishError = createTopic<OnEntryRepublishErrorTopicParams>(
        "cms.onEntryRepublishError"
    );

    /**
     * Unpublish
     */
    const onEntryBeforeUnpublish = createTopic<OnEntryBeforeUnpublishTopicParams>(
        "cms.onEntryBeforeUnpublish"
    );
    const onEntryAfterUnpublish = createTopic<OnEntryAfterUnpublishTopicParams>(
        "cms.onEntryAfterUnpublish"
    );
    const onEntryUnpublishError = createTopic<OnEntryUnpublishErrorTopicParams>(
        "cms.onEntryUnpublishError"
    );

    /**
     * Delete
     */
    const onEntryBeforeDelete =
        createTopic<OnEntryBeforeDeleteTopicParams>("cms.onEntryBeforeDelete");
    const onEntryAfterDelete = createTopic<OnEntryAfterDeleteTopicParams>("cms.onEntryAfterDelete");
    const onEntryDeleteError = createTopic<OnEntryDeleteErrorTopicParams>("cms.onEntryDeleteError");

    /**
     * Restore from bin
     */
    const onEntryBeforeRestoreFromBin = createTopic<OnEntryBeforeRestoreFromBinTopicParams>(
        "cms.onEntryBeforeRestoreFromBin"
    );
    const onEntryAfterRestoreFromBin = createTopic<OnEntryAfterRestoreFromBinTopicParams>(
        "cms.onEntryAfterRestoreFromBin"
    );
    const onEntryRestoreFromBinError = createTopic<OnEntryRestoreFromBinErrorTopicParams>(
        "cms.onEntryRestoreFromBinError"
    );

    /**
     * Delete revision
     */
    const onEntryRevisionBeforeDelete = createTopic<OnEntryRevisionBeforeDeleteTopicParams>(
        "cms.onEntryRevisionBeforeDelete"
    );
    const onEntryRevisionAfterDelete = createTopic<OnEntryRevisionAfterDeleteTopicParams>(
        "cms.onEntryRevisionAfterDelete"
    );
    const onEntryRevisionDeleteError = createTopic<OnEntryRevisionDeleteErrorTopicParams>(
        "cms.onEntryRevisionDeleteError"
    );
    /**
     * Delete multiple entries
     */
    const onEntryBeforeDeleteMultiple = createTopic<OnEntryBeforeDeleteMultipleTopicParams>(
        "cms.onEntryBeforeDeleteMultiple"
    );
    const onEntryAfterDeleteMultiple = createTopic<OnEntryAfterDeleteMultipleTopicParams>(
        "cms.onEntryAfterDeleteMultiple"
    );
    const onEntryDeleteMultipleError = createTopic<OnEntryDeleteMultipleErrorTopicParams>(
        "cms.onEntryDeleteMultipleError"
    );

    /**
     * Get entry
     */
    const onEntryBeforeGet = createTopic<OnEntryBeforeGetTopicParams>("cms.onEntryBeforeGet");

    /**
     * List entries
     */
    const onEntryBeforeList = createTopic<EntryBeforeListTopicParams>("cms.onEntryBeforeList");

    /**
     * We need to assign some default behaviors.
     */
    assignBeforeEntryCreate({
        context,
        onEntryBeforeCreate
    });
    assignBeforeEntryUpdate({
        context,
        onEntryBeforeUpdate
    });
    assignAfterEntryDelete({
        context,
        onEntryAfterDelete
    });

    /**
     * List entries
     */
    const {
        listEntriesUseCase,
        listLatestUseCase,
        listDeletedUseCase,
        listPublishedUseCase,
        getEntryUseCase
    } = listEntriesUseCases({
        operation: storageOperations.entries["list"],
        accessControl,
        topics: { onEntryBeforeList },
        context,
        getIdentity: getSecurityIdentity
    });

    /**
     * Get entries by ids
     */
    const { getEntriesByIdsUseCase } = getEntriesByIdsUseCases({
        operation: storageOperations.entries.getByIds,
        accessControl
    });

    /**
     * Get latest entries by ids
     */
    const { getLatestEntriesByIdsUseCase } = getLatestEntriesByIdsUseCases({
        operation: storageOperations.entries.getLatestByIds,
        accessControl
    });

    /**
     * Get published entries by ids
     */
    const { getPublishedEntriesByIdsUseCase } = getPublishedEntriesByIdsUseCases({
        operation: storageOperations.entries.getPublishedByIds,
        accessControl
    });

    /**
     * Get revisions by entryId
     */
    const { getRevisionsByEntryIdUseCase } = getRevisionsByEntryIdUseCases({
        operation: storageOperations.entries.getRevisions,
        accessControl
    });

    /**
     * Get revision by id
     */
    const { getRevisionByIdUseCase } = getRevisionByIdUseCases({
        operation: storageOperations.entries.getRevisionById
    });

    /**
     * Get latest revision by entryId
     */
    const {
        getLatestRevisionByEntryIdUseCase,
        getLatestRevisionByEntryIdWithDeletedUseCase,
        getLatestRevisionByEntryIdDeletedUseCase
    } = getLatestRevisionByEntryIdUseCases({
        operation: storageOperations.entries.getLatestRevisionByEntryId
    });

    /**
     * Get previous revision by entryId
     */
    const { getPreviousRevisionByEntryIdUseCase } = getPreviousRevisionByEntryIdUseCases({
        operation: storageOperations.entries.getPreviousRevision
    });

    /**
     * Get published revision by entryId
     */
    const { getPublishedRevisionByEntryIdUseCase } = getPublishedRevisionByEntryIdUseCases({
        operation: storageOperations.entries.getPublishedRevisionByEntryId
    });

    /**
     * Delete entry
     */
    const { deleteEntryUseCase, moveEntryToBinUseCase, deleteEntryOperation } = deleteEntryUseCases(
        {
            deleteOperation: storageOperations.entries.delete,
            moveToBinOperation: storageOperations.entries.moveToBin,
            getEntry: getLatestRevisionByEntryIdUseCase,
            getEntryWithDeleted: getLatestRevisionByEntryIdWithDeletedUseCase,
            getIdentity: getSecurityIdentity,
            topics: { onEntryBeforeDelete, onEntryAfterDelete, onEntryDeleteError },
            accessControl,
            context
        }
    );

    /**
     * Restore entry from bin
     */
    const { restoreEntryFromBinUseCase } = restoreEntryFromBinUseCases({
        restoreOperation: storageOperations.entries.restoreFromBin,
        getEntry: getLatestRevisionByEntryIdDeletedUseCase,
        getIdentity: getSecurityIdentity,
        topics: {
            onEntryBeforeRestoreFromBin,
            onEntryAfterRestoreFromBin,
            onEntryRestoreFromBinError
        },
        accessControl,
        context
    });

    const getEntryById: CmsEntryContext["getEntryById"] = async (model, id) => {
        const where: CmsEntryListWhere = {
            id
        };
        await onEntryBeforeGet.publish({
            where,
            model
        });
        const [entry] = await getEntriesByIdsUseCase.execute(model, { ids: [id] });
        if (!entry) {
            throw new NotFoundError(`Entry by ID "${id}" not found.`);
        }
        return entry;
    };
    const createEntry: CmsEntryContext["createEntry"] = async <T = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        const { entry, input } = await createEntryData({
            context,
            model,
            options,
            rawInput,
            getLocale,
            getTenant,
            getIdentity: getSecurityIdentity,
            accessControl
        });

        await accessControl.ensureCanAccessEntry({ model, entry, rwd: "w" });

        let storageEntry: CmsStorageEntry | null = null;
        try {
            await onEntryBeforeCreate.publish({
                entry,
                input,
                model
            });

            storageEntry = await entryToStorageTransform(context, model, entry);

            const result = await storageOperations.entries.create(model, {
                entry,
                storageEntry
            });

            await onEntryAfterCreate.publish({
                entry,
                storageEntry: result,
                model,
                input
            });

            return entry as CmsEntry<T>;
        } catch (ex) {
            await onEntryCreateError.publish({
                error: ex,
                entry,
                model,
                input
            });
            throw new WebinyError(
                ex.message || "Could not create content entry.",
                ex.code || "CREATE_ENTRY_ERROR",
                ex.data || {
                    error: ex,
                    input,
                    entry,
                    storageEntry
                }
            );
        }
    };
    const createEntryRevisionFrom: CmsEntryContext["createEntryRevisionFrom"] = async (
        model,
        sourceId,
        rawInput,
        options
    ) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        /**
         * Entries are identified by a common parent ID + Revision number.
         */
        const { id: uniqueId } = parseIdentifier(sourceId);

        const originalStorageEntry = await getRevisionByIdUseCase.execute(model, {
            id: sourceId
        });
        const latestStorageEntry = await getLatestRevisionByEntryIdUseCase.execute(model, {
            id: uniqueId
        });

        if (!originalStorageEntry) {
            throw new NotFoundError(
                `Entry "${sourceId}" of model "${model.modelId}" was not found.`
            );
        }

        if (!latestStorageEntry) {
            throw new NotFoundError(
                `Latest entry "${uniqueId}" of model "${model.modelId}" was not found.`
            );
        }

        /**
         * We need to convert data from DB to its original form before using it further.
         */
        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        const { entry, input } = await createEntryRevisionFromData({
            sourceId,
            model,
            rawInput,
            options,
            context,
            getIdentity: getSecurityIdentity,
            getTenant,
            getLocale,
            originalEntry,
            latestStorageEntry,
            accessControl
        });

        await accessControl.ensureCanAccessEntry({ model, entry, rwd: "w" });

        let storageEntry: CmsStorageEntry | null = null;

        try {
            await onEntryBeforeCreateRevision.publish({
                input,
                entry,
                original: originalEntry,
                model
            });

            storageEntry = await entryToStorageTransform(context, model, entry);

            const result = await storageOperations.entries.createRevisionFrom(model, {
                entry,
                storageEntry
            });

            await onEntryRevisionAfterCreate.publish({
                input,
                entry,
                model,
                original: originalEntry,
                storageEntry: result
            });
            return entry;
        } catch (ex) {
            await onEntryCreateRevisionError.publish({
                entry,
                original: originalEntry,
                model,
                input,
                error: ex
            });
            throw new WebinyError(
                ex.message || "Could not create entry from existing one.",
                ex.code || "CREATE_FROM_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry,
                    originalEntry,
                    originalStorageEntry
                }
            );
        }
    };
    const updateEntry: CmsEntryContext["updateEntry"] = async (
        model,
        id,
        rawInput,
        metaInput,
        options
    ) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        /**
         * The entry we are going to update.
         */
        const originalStorageEntry = await getRevisionByIdUseCase.execute(model, { id });

        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
        }

        if (originalStorageEntry.locked) {
            throw new WebinyError(
                `Cannot update entry because it's locked.`,
                "CONTENT_ENTRY_UPDATE_ERROR"
            );
        }

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        const { entry, input } = await createUpdateEntryData({
            model,
            rawInput,
            options,
            context,
            getIdentity: getSecurityIdentity,
            getTenant,
            getLocale,
            originalEntry,
            metaInput
        });

        await accessControl.ensureCanAccessEntry({ model, entry, rwd: "w" });

        let storageEntry: CmsStorageEntry | null = null;

        try {
            await onEntryBeforeUpdate.publish({
                entry,
                model,
                input,
                original: originalEntry
            });

            storageEntry = await entryToStorageTransform(context, model, entry);

            const result = await storageOperations.entries.update(model, {
                entry,
                storageEntry
            });

            await onEntryAfterUpdate.publish({
                entry,
                storageEntry: result,
                model,
                input,
                original: originalEntry
            });

            return entry;
        } catch (ex) {
            await onEntryUpdateError.publish({
                entry,
                model,
                input,
                error: ex
            });
            throw new WebinyError(
                ex.message || "Could not update existing entry.",
                ex.code || "UPDATE_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry,
                    originalEntry,
                    input
                }
            );
        }
    };

    const validateEntry: CmsEntryContext["validateEntry"] = async (model, id, inputData) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        const input = mapAndCleanUpdatedInputData(model, inputData || {});
        let originalEntry: CmsEntry | undefined;
        if (id) {
            /**
             * The entry we are going to update.
             */
            const originalStorageEntry = await getRevisionByIdUseCase.execute(model, { id });

            if (!originalStorageEntry) {
                throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
            }
            originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);
        }

        await accessControl.ensureCanAccessEntry({ model, entry: originalEntry, rwd: "w" });

        const result = await validateModelEntryData({
            context,
            model,
            data: input,
            entry: originalEntry
        });
        return result.length > 0 ? result : [];
    };

    const moveEntry: CmsEntryContext["moveEntry"] = async (model, id, folderId) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        /**
         * The entry we are going to move to another folder.
         */
        const originalStorageEntry = await getRevisionByIdUseCase.execute(model, { id });

        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
        }

        const entry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await accessControl.ensureCanAccessEntry({ model, entry, rwd: "w" });

        /**
         * No need to continue if the entry is already in the requested folder.
         */
        if (entry.location?.folderId === folderId) {
            return entry;
        }

        try {
            await onEntryBeforeMove.publish({
                entry,
                model,
                folderId
            });
            await storageOperations.entries.move(model, id, folderId);
            await onEntryAfterMove.publish({
                entry,
                model,
                folderId
            });
            return entry;
        } catch (ex) {
            await onEntryMoveError.publish({
                entry,
                model,
                folderId,
                error: ex
            });
            throw WebinyError.from(ex, {
                message: `Could not move entry "${id}" of model "${model.modelId}".`,
                code: "MOVE_ENTRY_ERROR"
            });
        }
    };

    const republishEntry: CmsEntryContext["republishEntry"] = async (model, id) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w", pw: "p" });

        /**
         * Fetch the entry from the storage.
         */
        const originalStorageEntry = await getRevisionByIdUseCase.execute(model, { id });
        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" was not found!`);
        }

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await accessControl.ensureCanAccessEntry({
            model,
            entry: originalEntry,
            rwd: "w",
            pw: "p"
        });

        const { entry } = await createRepublishEntryData({
            context,
            model,
            originalEntry,
            getIdentity: getSecurityIdentity
        });

        const storageEntry = await entryToStorageTransform(context, model, entry);
        /**
         * First we need to update existing entry.
         */
        try {
            await storageOperations.entries.update(model, {
                entry,
                storageEntry
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not update existing entry with new data while re-publishing.",
                "REPUBLISH_UPDATE_ERROR",
                {
                    entry
                }
            );
        }
        /**
         * Then we move onto publishing it again.
         */
        try {
            await onEntryBeforeRepublish.publish({
                entry,
                model
            });

            const result = await storageOperations.entries.publish(model, {
                entry,
                storageEntry
            });

            await onEntryAfterRepublish.publish({
                entry,
                model,
                storageEntry: result
            });
            return entry;
        } catch (ex) {
            await onEntryRepublishError.publish({
                entry,
                model,
                error: ex
            });
            throw new WebinyError(
                "Could not publish existing entry while re-publishing.",
                "REPUBLISH_PUBLISH_ERROR",
                {
                    entry
                }
            );
        }
    };
    const deleteEntryRevision: CmsEntryContext["deleteEntryRevision"] = async (
        model,
        revisionId
    ) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "d" });

        const { id: entryId, version } = parseIdentifier(revisionId);

        const storageEntryToDelete = await getRevisionByIdUseCase.execute(model, {
            id: revisionId
        });
        const latestStorageEntry = await getLatestRevisionByEntryIdUseCase.execute(model, {
            id: entryId
        });
        const storagePreviousEntry = await getPreviousRevisionByEntryIdUseCase.execute(model, {
            entryId,
            version: version as number
        });

        if (!storageEntryToDelete) {
            throw new NotFoundError(`Entry "${revisionId}" was not found!`);
        }

        const latestEntryRevisionId = latestStorageEntry ? latestStorageEntry.id : null;

        const entryToDelete = await entryFromStorageTransform(context, model, storageEntryToDelete);

        await accessControl.ensureCanAccessEntry({ model, entry: entryToDelete, rwd: "d" });

        /**
         * If targeted record is the latest entry record and there is no previous one, we need
         * to run full delete with hooks. In this case, `deleteRevision` hooks are not fired.
         */
        if (entryToDelete.id === latestEntryRevisionId && !storagePreviousEntry) {
            return await deleteEntryOperation.execute(model, { entry: entryToDelete });
        }
        /**
         * If targeted record is the latest entry revision, set the previous one as the new latest.
         */
        let entryToSetAsLatest: CmsEntry | null = null;
        let storageEntryToSetAsLatest: CmsStorageEntry | null = null;
        let updatedEntryToSetAsLatest: CmsEntry | null = null;
        let storageUpdatedEntryToSetAsLatest: CmsStorageEntry | null = null;

        if (entryToDelete.id === latestEntryRevisionId && storagePreviousEntry) {
            entryToSetAsLatest = await entryFromStorageTransform(
                context,
                model,
                storagePreviousEntry
            );
            storageEntryToSetAsLatest = storagePreviousEntry;

            /**
             * Since we're setting a different revision as the latest, we need to update entry-level meta
             * fields. The values are taken from the latest revision we're about to delete. The update of the
             * new latest revision is performed within storage operations.
             */
            const pickedEntryLevelMetaFields = pickEntryMetaFields(
                entryToDelete,
                isEntryLevelEntryMetaField
            );

            updatedEntryToSetAsLatest = {
                ...entryToSetAsLatest,
                ...pickedEntryLevelMetaFields
            };

            storageUpdatedEntryToSetAsLatest = {
                ...storageEntryToSetAsLatest,
                ...pickedEntryLevelMetaFields
            };
        }

        try {
            await onEntryRevisionBeforeDelete.publish({
                entry: entryToDelete,
                model
            });

            await storageOperations.entries.deleteRevision(model, {
                entry: entryToDelete,
                storageEntry: storageEntryToDelete,
                latestEntry: updatedEntryToSetAsLatest,
                latestStorageEntry: storageUpdatedEntryToSetAsLatest
            });

            await onEntryRevisionAfterDelete.publish({
                entry: entryToDelete,
                model
            });
        } catch (ex) {
            await onEntryRevisionDeleteError.publish({
                entry: entryToDelete,
                model,
                error: ex
            });
            throw new WebinyError(ex.message, ex.code || "DELETE_REVISION_ERROR", {
                error: ex,
                entry: entryToDelete,
                storageEntry: storageEntryToDelete,
                latestEntry: updatedEntryToSetAsLatest,
                latestStorageEntry: storageUpdatedEntryToSetAsLatest
            });
        }
    };
    const deleteMultipleEntries: CmsEntryContext["deleteMultipleEntries"] = async (
        model,
        params
    ) => {
        const { entries: input } = params;
        const maxDeletableEntries = 50;

        const entryIdList = new Set<string>();
        for (const id of input) {
            const { id: entryId } = parseIdentifier(id);
            entryIdList.add(entryId);
        }
        const ids = Array.from(entryIdList);

        if (ids.length > maxDeletableEntries) {
            throw new WebinyError(
                "Cannot delete more than 50 entries at once.",
                "DELETE_ENTRIES_MAX",
                {
                    entries: ids
                }
            );
        }

        await accessControl.ensureCanAccessEntry({ model, rwd: "d" });

        const { items: entries } = await storageOperations.entries.list(model, {
            where: {
                latest: true,
                entryId_in: ids
            },
            limit: maxDeletableEntries + 1
        });
        /**
         * We do not want to allow deleting entries that user does not own or cannot access.
         */
        const items = (
            await filterAsync(entries, async entry => {
                return accessControl.canAccessEntry({ model, entry: entry });
            })
        ).map(entry => entry.id);

        try {
            await onEntryBeforeDeleteMultiple.publish({
                entries,
                ids,
                model
            });
            await storageOperations.entries.deleteMultipleEntries(model, {
                entries: items
            });
            await onEntryAfterDeleteMultiple.publish({
                entries,
                ids,
                model
            });
            return items.map(id => {
                return {
                    id
                };
            });
        } catch (ex) {
            await onEntryDeleteMultipleError.publish({
                entries,
                ids,
                model,
                error: ex
            });
            throw new WebinyError(ex.message, ex.code || "DELETE_ENTRIES_MULTIPLE_ERROR", {
                error: ex,
                entries
            });
        }
    };

    const deleteEntry: CmsEntryContext["deleteEntry"] = async (model, id, options = {}) => {
        const { permanently = true } = options;

        /**
         * If the 'permanently' flag is set to false, the entry must be moved to the bin; otherwise, deleted.
         */
        if (!permanently) {
            return await moveEntryToBinUseCase.execute(model, id, options);
        }

        return await deleteEntryUseCase.execute(model, id, options);
    };
    const publishEntry: CmsEntryContext["publishEntry"] = async (model, id) => {
        await accessControl.ensureCanAccessEntry({ model, pw: "p" });

        const originalStorageEntry = await getRevisionByIdUseCase.execute(model, { id });

        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" in the model "${model.modelId}" was not found.`);
        }

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await accessControl.ensureCanAccessEntry({ model, entry: originalEntry, pw: "p" });

        // We need the latest entry to get the latest entry-level meta fields.
        const latestStorageEntry = await getLatestRevisionByEntryIdUseCase.execute(model, {
            id: originalEntry.entryId
        });

        if (!latestStorageEntry) {
            throw new NotFoundError(`Entry "${id}" in the model "${model.modelId}" was not found.`);
        }

        const latestEntry = await entryFromStorageTransform(context, model, latestStorageEntry);

        const { entry } = await createPublishEntryData({
            context,
            model,
            originalEntry,
            latestEntry,
            getIdentity: getSecurityIdentity
        });

        let storageEntry: CmsStorageEntry | null = null;

        try {
            await onEntryBeforePublish.publish({
                original: originalEntry,
                entry,
                model
            });

            storageEntry = await entryToStorageTransform(context, model, entry);
            const result = await storageOperations.entries.publish(model, {
                entry,
                storageEntry
            });

            await onEntryAfterPublish.publish({
                original: originalEntry,
                entry,
                storageEntry: result,
                model
            });
            return entry;
        } catch (ex) {
            await onEntryPublishError.publish({
                original: originalEntry,
                entry,
                model,
                error: ex
            });
            throw new WebinyError(
                ex.message || "Could not publish entry.",
                ex.code || "PUBLISH_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry,
                    originalEntry,
                    originalStorageEntry
                }
            );
        }
    };
    const unpublishEntry: CmsEntryContext["unpublishEntry"] = async (model, id) => {
        await accessControl.ensureCanAccessEntry({ model, pw: "u" });

        const { id: entryId } = parseIdentifier(id);

        const originalStorageEntry = await getPublishedRevisionByEntryIdUseCase.execute(model, {
            id: entryId
        });

        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
        }

        if (originalStorageEntry.id !== id) {
            throw new WebinyError(`Entry is not published.`, "UNPUBLISH_ERROR", {
                entry: originalStorageEntry
            });
        }

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await accessControl.ensureCanAccessEntry({ model, entry: originalEntry, pw: "u" });

        const { entry } = await createUnpublishEntryData({
            context,
            model,
            originalEntry,
            getIdentity: getSecurityIdentity
        });

        let storageEntry: CmsStorageEntry | null = null;

        try {
            await onEntryBeforeUnpublish.publish({
                entry,
                model
            });

            storageEntry = await entryToStorageTransform(context, model, entry);

            const result = await storageOperations.entries.unpublish(model, {
                entry,
                storageEntry
            });

            await onEntryAfterUnpublish.publish({
                entry,
                storageEntry: result,
                model
            });

            return entry;
        } catch (ex) {
            await onEntryUnpublishError.publish({
                entry,
                model,
                error: ex
            });
            throw new WebinyError(
                ex.message || "Could not unpublish entry.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    originalEntry,
                    originalStorageEntry,
                    entry,
                    storageEntry
                }
            );
        }
    };

    const getUniqueFieldValues: CmsEntryContext["getUniqueFieldValues"] = async (model, params) => {
        await accessControl.ensureCanAccessEntry({ model });

        const { where: initialWhere, fieldId } = params;

        const where = {
            ...initialWhere
        };
        /**
         * Possibly only get records which are owned by current user.
         * Or if searching for the owner set that value - in the case that user can see other entries than their own.
         */
        if (await accessControl.canAccessOnlyOwnedEntries({ model })) {
            where.createdBy = getSecurityIdentity().id;
        }

        /**
         * Where must contain either latest or published keys.
         * We cannot list entries without one of those
         */
        if (where.latest && where.published) {
            throw new WebinyError(
                "Cannot list entries that are both published and latest.",
                "LIST_ENTRIES_ERROR",
                {
                    where
                }
            );
        } else if (!where.latest && !where.published) {
            throw new WebinyError(
                "Cannot list entries if we do not have latest or published defined.",
                "LIST_ENTRIES_ERROR",
                {
                    where
                }
            );
        }
        /**
         * We need to verify that the field in question is searchable.
         */
        const fields = getSearchableFields({
            fields: model.fields,
            plugins: context.plugins,
            input: []
        });

        if (!fields.includes(fieldId)) {
            throw new WebinyError(
                "Cannot list unique entry field values if the field is not searchable.",
                "LIST_UNIQUE_ENTRY_VALUES_ERROR",
                {
                    fieldId
                }
            );
        }

        try {
            return await storageOperations.entries.getUniqueFieldValues(model, {
                where,
                fieldId
            });
        } catch (ex) {
            throw new WebinyError(
                "Error while fetching unique entry values from storage.",
                "LIST_UNIQUE_ENTRY_VALUES_ERROR",
                {
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    },
                    model,
                    where,
                    fieldId
                }
            );
        }
    };

    const getEntryTraverser = async (modelId: string) => {
        const modelAstConverter = context.cms.getModelToAstConverter();
        const model = await context.cms.getModel(modelId);
        if (!model) {
            throw new Error(`Missing "${modelId}" model!`);
        }

        const modelAst = modelAstConverter.toAst(model);
        return new ContentEntryTraverser(modelAst);
    };

    return {
        getEntryTraverser,
        onEntryBeforeCreate,
        onEntryAfterCreate,
        onEntryCreateError,

        onEntryRevisionBeforeCreate: onEntryBeforeCreateRevision,
        onEntryRevisionAfterCreate,
        onEntryRevisionCreateError: onEntryCreateRevisionError,

        onEntryBeforeUpdate,
        onEntryAfterUpdate,
        onEntryUpdateError,

        onEntryBeforeMove,
        onEntryAfterMove,
        onEntryMoveError,

        onEntryBeforeDelete,
        onEntryAfterDelete,
        onEntryDeleteError,

        onEntryBeforeRestoreFromBin,
        onEntryAfterRestoreFromBin,
        onEntryRestoreFromBinError,

        onEntryRevisionBeforeDelete,
        onEntryRevisionAfterDelete,
        onEntryRevisionDeleteError,

        onEntryBeforePublish,
        onEntryAfterPublish,
        onEntryPublishError,

        onEntryBeforeRepublish,
        onEntryAfterRepublish,
        onEntryRepublishError,

        onEntryBeforeUnpublish,
        onEntryAfterUnpublish,
        onEntryUnpublishError,

        onEntryBeforeGet,
        onEntryBeforeList,
        /**
         * Get entries by exact revision IDs from the database.
         */
        async getEntriesByIds(model, ids) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntriesByIds",
                async () => {
                    return getEntriesByIdsUseCase.execute(model, { ids });
                }
            );
        },
        /**
         * Get a single entry by revision ID from the database.
         */
        async getEntryById(model, id) {
            return context.benchmark.measure("headlessCms.crud.entries.getEntryById", async () => {
                return getEntryById(model, id);
            });
        },
        /**
         * Get published revisions by entry IDs.
         */
        async getPublishedEntriesByIds(model: CmsModel, ids: string[]) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getPublishedEntriesByIds",
                async () => {
                    return getPublishedEntriesByIdsUseCase.execute(model, { ids });
                }
            );
        },
        /**
         * Get the latest revisions by entry IDs.
         */
        async getLatestEntriesByIds(model: CmsModel, ids: string[]) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getLatestEntriesByIds",
                async () => {
                    return getLatestEntriesByIdsUseCase.execute(model, { ids });
                }
            );
        },
        async getEntryRevisions(model, entryId) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntryRevisions",
                async () => {
                    return getRevisionsByEntryIdUseCase.execute(model, { id: entryId });
                }
            );
        },
        /**
         * @internal
         */
        async getEntry<T = CmsEntryValues>(
            model: CmsModel,
            params: CmsEntryGetParams
        ): Promise<CmsEntry<T>> {
            return context.benchmark.measure("headlessCms.crud.entries.getEntry", async () => {
                return (await getEntryUseCase.execute(model, params)) as CmsEntry<T>;
            });
        },
        /**
         * @description Should not be used directly. Internal use only!
         *
         * @internal
         */
        async listEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure("headlessCms.crud.entries.listEntries", async () => {
                return await listEntriesUseCase.execute<T>(model, params);
            });
        },
        async listLatestEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure(
                "headlessCms.crud.entries.listLatestEntries",
                async () => {
                    return await listLatestUseCase.execute<T>(model, params);
                }
            );
        },
        async listDeletedEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure(
                "headlessCms.crud.entries.listDeletedEntries",
                async () => {
                    return await listDeletedUseCase.execute<T>(model, params);
                }
            );
        },
        async listPublishedEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure(
                "headlessCms.crud.entries.listPublishedEntries",
                async () => {
                    return await listPublishedUseCase.execute<T>(model, params);
                }
            );
        },
        async createEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            input: CreateCmsEntryInput<T>,
            options?: CreateCmsEntryOptionsInput
        ): Promise<CmsEntry<T>> {
            return context.benchmark.measure("headlessCms.crud.entries.createEntry", async () => {
                return createEntry(model, input, options);
            });
        },
        async createEntryRevisionFrom(model, sourceId, input, options) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.createEntryRevisionFrom",
                async () => {
                    return createEntryRevisionFrom(model, sourceId, input, options);
                }
            );
        },
        async updateEntry(model, id, input, meta, options) {
            return context.benchmark.measure("headlessCms.crud.entries.updateEntry", async () => {
                return updateEntry(model, id, input, meta, options);
            });
        },
        async validateEntry(model, id, input) {
            return context.benchmark.measure("headlessCms.crud.entries.validateEntry", async () => {
                return validateEntry(model, id, input);
            });
        },
        async moveEntry(model, id, folderId) {
            return context.benchmark.measure("headlessCms.crud.entries.moveEntry", async () => {
                return moveEntry(model, id, folderId);
            });
        },
        /**
         * Method used internally. Not documented and should not be used in users systems.
         * @internal
         */
        async republishEntry(model, id) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.republishEntry",
                async () => {
                    return republishEntry(model, id);
                }
            );
        },
        async deleteEntryRevision(model, id) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.deleteEntryRevision",
                async () => {
                    return deleteEntryRevision(model, id);
                }
            );
        },
        async deleteEntry(model, entryId, options) {
            return context.benchmark.measure("headlessCms.crud.entries.deleteEntry", async () => {
                return deleteEntry(model, entryId, options);
            });
        },
        async restoreEntryFromBin(model, entryId) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.restoreEntryFromBin",
                async () => {
                    return await restoreEntryFromBinUseCase.execute(model, entryId);
                }
            );
        },
        async deleteMultipleEntries(model, ids) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.deleteMultipleEntries",
                async () => {
                    return deleteMultipleEntries(model, ids);
                }
            );
        },
        async publishEntry(model, id) {
            return context.benchmark.measure("headlessCms.crud.entries.publishEntry", async () => {
                return publishEntry(model, id);
            });
        },
        async unpublishEntry(model, id) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.unpublishEntry",
                async () => {
                    return unpublishEntry(model, id);
                }
            );
        },
        async getUniqueFieldValues(model, params) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getUniqueFieldValues",
                async () => {
                    return getUniqueFieldValues(model, params);
                }
            );
        }
    };
};
