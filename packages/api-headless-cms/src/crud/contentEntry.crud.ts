import WebinyError from "@webiny/error";
import type {
    CmsContext,
    CmsEntry,
    CmsEntryContext,
    CmsEntryGetParams,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput,
    EntryBeforeListTopicParams,
    OnEntryAfterCreateTopicParams,
    OnEntryAfterDeleteTopicParams,
    OnEntryAfterMoveTopicParams,
    OnEntryAfterPublishTopicParams,
    OnEntryAfterRepublishTopicParams,
    OnEntryAfterRestoreFromBinTopicParams,
    OnEntryAfterUnpublishTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryBeforeCreateTopicParams,
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
    OnEntryUpdateErrorTopicParams,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeEntryCreate } from "./contentEntry/beforeCreate.js";
import { assignBeforeEntryUpdate } from "./contentEntry/beforeUpdate.js";
import { assignAfterEntryDelete } from "./contentEntry/afterDelete.js";
import { ContentEntryTraverser } from "~/utils/contentEntryTraverser/ContentEntryTraverser.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { CreateEntryUseCase } from "~/features/contentEntries/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntries/CreateEntryRevisionFrom/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntries/UpdateEntry/index.js";
import { ValidateEntryUseCase } from "~/features/contentEntries/ValidateEntry/abstractions.js";
import { MoveEntryUseCase } from "~/features/contentEntries/MoveEntry/abstractions.js";
import { RepublishEntryUseCase } from "~/features/contentEntries/RepublishEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntries/PublishEntry/abstractions.js";
import {
    ListLatestEntriesUseCase,
    ListPublishedEntriesUseCase,
    ListDeletedEntriesUseCase
} from "~/features/contentEntries/ListEntries/index.js";
import { ListEntriesUseCase } from "~/features/contentEntries/ListEntries/abstractions.js";
import { GetEntriesByIdsUseCase } from "~/features/contentEntries/GetEntriesByIds/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntries/GetEntryById/index.js";
import { GetPublishedEntriesByIdsUseCase } from "~/features/contentEntries/GetPublishedEntriesByIds/index.js";
import { GetLatestEntriesByIdsUseCase } from "~/features/contentEntries/GetLatestEntriesByIds/index.js";
import { GetRevisionsByEntryIdUseCase } from "~/features/contentEntries/GetRevisionsByEntryId/index.js";
import { GetEntryUseCase } from "~/features/contentEntries/GetEntry/index.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntries/DeleteEntryRevision/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntries/DeleteEntry/index.js";
import { DeleteMultipleEntriesUseCase } from "~/features/contentEntries/DeleteMultipleEntries/abstractions.js";
import { RestoreEntryFromBinUseCase } from "~/features/contentEntries/RestoreEntryFromBin/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntries/UnpublishEntry/index.js";
import { GetUniqueFieldValuesUseCase } from "~/features/contentEntries/GetUniqueFieldValues/index.js";

interface CreateContentEntryCrudParams {
    context: CmsContext;
}

export const createContentEntryCrud = (params: CreateContentEntryCrudParams): CmsEntryContext => {
    const { context } = params;

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
     * Get entry
     */
    const onEntryBeforeGet = createTopic<OnEntryBeforeGetTopicParams>("cms.onEntryBeforeGet");

    /**
     * List entries
     */
    const onEntryBeforeList = createTopic<EntryBeforeListTopicParams>("cms.onEntryBeforeList");

    /**
     * We need to assign some default behaviors.
     * TODO: move this to a separate feature with multiple event handlers and field locking.
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

    const createEntry: CmsEntryContext["createEntry"] = async <T = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> => {
        // Delegate to new CreateEntry use case
        const useCase = context.container.resolve(CreateEntryUseCase);
        const result = await useCase.execute(model, rawInput, options);

        if (result.isFail()) {
            // Publish error event for backward compatibility
            await onEntryCreateError.publish({
                error: result.error,
                entry: null as any,
                model,
                input: rawInput
            });

            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not create content entry.",
                error.code || "CREATE_ENTRY_ERROR",
                error.data
            );
        }

        return result.value as CmsEntry<T>;
    };

    const createEntryRevisionFrom: CmsEntryContext["createEntryRevisionFrom"] = async (
        model,
        sourceId,
        rawInput,
        options
    ) => {
        // Delegate to new CreateEntryRevisionFrom use case
        const useCase = context.container.resolve(CreateEntryRevisionFromUseCase);
        const result = await useCase.execute(model, sourceId, rawInput, options);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not create entry from existing one.",
                error.code || "CREATE_FROM_REVISION_ERROR",
                error.data
            );
        }

        return result.value;
    };

    const updateEntry: CmsEntryContext["updateEntry"] = async <T = CmsEntryValues>(
        model: CmsModel,
        id: string,
        rawInput: UpdateCmsEntryInput,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> => {
        // Delegate to new UpdateEntry use case
        const useCase = context.container.resolve(UpdateEntryUseCase);
        const result = await useCase.execute(model, id, rawInput, metaInput, options);

        if (result.isFail()) {
            // Publish error event for backward compatibility
            await onEntryUpdateError.publish({
                error: result.error,
                entry: null as any,
                model,
                input: rawInput
            });

            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not update existing entry.",
                error.code || "UPDATE_ERROR"
            );
        }

        return result.value as CmsEntry<T>;
    };

    const validateEntry: CmsEntryContext["validateEntry"] = async (model, id, inputData) => {
        // Delegate to new ValidateEntry use case
        const useCase = context.container.resolve(ValidateEntryUseCase);
        const result = await useCase.execute(model, id || null, inputData || {});

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not validate entry.",
                error.code || "VALIDATION_ERROR",
                error.data
            );
        }

        return result.value;
    };

    const moveEntry: CmsEntryContext["moveEntry"] = async (model, id, folderId) => {
        // Delegate to new MoveEntry use case
        const useCase = context.container.resolve(MoveEntryUseCase);
        const result = await useCase.execute(model, id, folderId);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || `Could not move entry "${id}" of model "${model.modelId}".`,
                error.code || "MOVE_ENTRY_ERROR",
                error.data
            );
        }

        return result.value;
    };

    const republishEntry: CmsEntryContext["republishEntry"] = async (model, id) => {
        // Delegate to new RepublishEntry use case
        const useCase = context.container.resolve(RepublishEntryUseCase);
        const result = await useCase.execute(model, id);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not republish entry.",
                error.code || "REPUBLISH_ERROR",
                error.data
            );
        }

        return result.value;
    };

    const deleteEntryRevision: CmsEntryContext["deleteEntryRevision"] = async (
        model,
        revisionId
    ) => {
        const useCase = context.container.resolve(DeleteEntryRevisionUseCase);
        const result = await useCase.execute(model, revisionId);

        if (result.isFail()) {
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
        }
    };
    const deleteMultipleEntries: CmsEntryContext["deleteMultipleEntries"] = async (
        model,
        params
    ) => {
        // Delegate to new DeleteMultipleEntries use case
        const useCase = context.container.resolve(DeleteMultipleEntriesUseCase);
        const result = await useCase.execute(model, params);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not delete multiple entries.",
                error.code || "DELETE_ENTRIES_MULTIPLE_ERROR",
                error.data
            );
        }

        return result.value;
    };

    const publishEntry = async <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => {
        // Delegate to new PublishEntry use case
        const useCase = context.container.resolve(PublishEntryUseCase);
        const result = await useCase.execute(model, id);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not publish entry.",
                error.code || "PUBLISH_ERROR",
                error.data
            );
        }

        return result.value as CmsEntry<T>;
    };
    const unpublishEntry = async <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => {
        // Delegate to new UnpublishEntry use case
        const useCase = context.container.resolve(UnpublishEntryUseCase);
        const result = await useCase.execute(model, id);

        if (result.isFail()) {
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not unpublish entry.",
                error.code || "UNPUBLISH_ERROR",
                error.data
            );
        }

        return result.value as CmsEntry<T>;
    };

    const getUniqueFieldValues: CmsEntryContext["getUniqueFieldValues"] = async (model, params) => {
        const useCase = context.container.resolve(GetUniqueFieldValuesUseCase);
        const result = await useCase.execute(model, params);

        if (result.isFail()) {
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
        }

        return result.value;
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
                    const useCase = context.container.resolve(GetEntriesByIdsUseCase);
                    const result = await useCase.execute(model, ids);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get entries by IDs.",
                            error.code || "GET_ENTRIES_BY_IDS_ERROR",
                            {
                                error,
                                ids,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        /**
         * Get a single entry by revision ID from the database.
         */
        async getEntryById<T extends CmsEntryValues = CmsEntryValues>(model: CmsModel, id: string) {
            return context.benchmark.measure("headlessCms.crud.entries.getEntryById", async () => {
                const useCase = context.container.resolve(GetEntryByIdUseCase);
                const result = await useCase.execute<T>(model, id);

                if (result.isFail()) {
                    const error = result.error;
                    throw new WebinyError(
                        error.message || `Entry by ID "${id}" not found.`,
                        error.code || "GET_ENTRY_BY_ID_ERROR",
                        error.data
                    );
                }

                return result.value;
            });
        },
        /**
         * Get published revisions by entry IDs.
         */
        async getPublishedEntriesByIds(model: CmsModel, ids: string[]) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getPublishedEntriesByIds",
                async () => {
                    const useCase = context.container.resolve(GetPublishedEntriesByIdsUseCase);
                    const result = await useCase.execute(model, ids);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get published entries by IDs.",
                            error.code || "GET_PUBLISHED_ENTRIES_BY_IDS_ERROR",
                            {
                                error,
                                ids,
                                model
                            }
                        );
                    }

                    return result.value;
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
                    const useCase = context.container.resolve(GetLatestEntriesByIdsUseCase);
                    const result = await useCase.execute(model, ids);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get latest entries by IDs.",
                            error.code || "GET_LATEST_ENTRIES_BY_IDS_ERROR",
                            {
                                error,
                                ids,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        async getEntryRevisions(model, entryId) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntryRevisions",
                async () => {
                    const useCase = context.container.resolve(GetRevisionsByEntryIdUseCase);
                    const result = await useCase.execute(model, entryId);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get entry revisions.",
                            error.code || "GET_ENTRY_REVISIONS_ERROR",
                            {
                                error,
                                entryId,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        /**
         * @internal
         */
        async getEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params: CmsEntryGetParams
        ): Promise<CmsEntry<T>> {
            return context.benchmark.measure("headlessCms.crud.entries.getEntry", async () => {
                const useCase = context.container.resolve(GetEntryUseCase);
                const result = await useCase.execute<T>(model, params);

                if (result.isFail()) {
                    const error = result.error;
                    throw new WebinyError(
                        error.message || "Entry not found!",
                        error.code || "GET_ENTRY_ERROR",
                        {
                            error,
                            params,
                            model
                        }
                    );
                }

                return result.value;
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
                const useCase = context.container.resolve(ListEntriesUseCase);
                const result = await useCase.execute<T>(model, params);

                if (result.isFail()) {
                    const error = result.error;
                    throw new WebinyError(
                        error.message || "Could not list entries.",
                        error.code || "LIST_ENTRIES_ERROR",
                        {
                            error,
                            params,
                            model
                        }
                    );
                }

                return result.value;
            });
        },
        async listLatestEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure(
                "headlessCms.crud.entries.listLatestEntries",
                async () => {
                    const useCase = context.container.resolve(ListLatestEntriesUseCase);
                    const result = await useCase.execute<T>(model, params);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not list latest entries.",
                            error.code || "LIST_LATEST_ENTRIES_ERROR",
                            {
                                error,
                                params,
                                model
                            }
                        );
                    }

                    return result.value;
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
                    const useCase = context.container.resolve(ListDeletedEntriesUseCase);
                    const result = await useCase.execute<T>(model, params);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not list deleted entries.",
                            error.code || "LIST_DELETED_ENTRIES_ERROR",
                            {
                                error,
                                params,
                                model
                            }
                        );
                    }

                    return result.value;
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
                    const useCase = context.container.resolve(ListPublishedEntriesUseCase);
                    const result = await useCase.execute<T>(model, params);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not list published entries.",
                            error.code || "LIST_PUBLISHED_ENTRIES_ERROR",
                            {
                                error,
                                params,
                                model
                            }
                        );
                    }

                    return result.value;
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
            const deleteEntryUseCase = context.container.resolve(DeleteEntryUseCase);
            return context.benchmark.measure("headlessCms.crud.entries.deleteEntry", async () => {
                const result = await deleteEntryUseCase.execute(model, entryId, options ?? {});

                if (result.isFail()) {
                    throw new WebinyError(
                        result.error.message,
                        result.error.code,
                        result.error.data
                    );
                }
            });
        },
        async restoreEntryFromBin(model, entryId) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.restoreEntryFromBin",
                async () => {
                    const useCase = context.container.resolve(RestoreEntryFromBinUseCase);
                    const result = await useCase.execute(model, entryId);
                    if (result.isFail()) {
                        throw new WebinyError(
                            result.error.message,
                            result.error.code,
                            result.error.data
                        );
                    }
                    return result.value;
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
