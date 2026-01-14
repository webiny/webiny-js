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
    CreateFromCmsEntryInput,
    CreateRevisionCmsEntryOptionsInput,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import { ContentEntryTraverser } from "~/utils/contentEntryTraverser/ContentEntryTraverser.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";
import { ValidateEntryUseCase } from "~/features/contentEntry/ValidateEntry/abstractions.js";
import { MoveEntryUseCase } from "~/features/contentEntry/MoveEntry/abstractions.js";
import { RepublishEntryUseCase } from "~/features/contentEntry/RepublishEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/abstractions.js";
import {
    ListDeletedEntriesUseCase,
    ListLatestEntriesUseCase,
    ListPublishedEntriesUseCase
} from "~/features/contentEntry/ListEntries/index.js";
import { ListEntriesUseCase } from "~/features/contentEntry/ListEntries/abstractions.js";
import { GetEntriesByIdsUseCase } from "~/features/contentEntry/GetEntriesByIds/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntry/GetEntryById/index.js";
import { GetPublishedEntriesByIdsUseCase } from "~/features/contentEntry/GetPublishedEntriesByIds/index.js";
import { GetLatestEntriesByIdsUseCase } from "~/features/contentEntry/GetLatestEntriesByIds/index.js";
import { GetRevisionsByEntryIdUseCase } from "~/features/contentEntry/GetRevisionsByEntryId/index.js";
import { GetEntryUseCase } from "~/features/contentEntry/GetEntry/index.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/DeleteEntryRevision/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import { DeleteMultipleEntriesUseCase } from "~/features/contentEntry/DeleteMultipleEntries/abstractions.js";
import { RestoreEntryFromBinUseCase } from "~/features/contentEntry/RestoreEntryFromBin/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/UnpublishEntry/index.js";
import { GetUniqueFieldValuesUseCase } from "~/features/contentEntry/GetUniqueFieldValues/index.js";

interface CreateContentEntryCrudParams {
    context: CmsContext;
}

export const createContentEntryCrud = (params: CreateContentEntryCrudParams): CmsEntryContext => {
    const { context } = params;

    const createEntry: CmsEntryContext["createEntry"] = async <
        T extends CmsEntryValues = CmsEntryValues
    >(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> => {
        // Delegate to new CreateEntry use case
        const useCase = context.container.resolve(CreateEntryUseCase);
        const result = await useCase.execute<T>(model, rawInput, options);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not create content entry.",
                error.code || "CREATE_ENTRY_ERROR",
                error.data
            );
        }

        return result.value;
    };

    const createEntryRevisionFrom: CmsEntryContext["createEntryRevisionFrom"] = async <
        T extends CmsEntryValues = CmsEntryValues
    >(
        model: CmsModel,
        sourceId: string,
        rawInput: CreateFromCmsEntryInput<T>,
        options?: CreateRevisionCmsEntryOptionsInput
    ) => {
        // Delegate to new CreateEntryRevisionFrom use case
        const useCase = context.container.resolve(CreateEntryRevisionFromUseCase);
        const result = await useCase.execute<T>(model, sourceId, rawInput, options);

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

    const updateEntry: CmsEntryContext["updateEntry"] = async <
        T extends CmsEntryValues = CmsEntryValues
    >(
        model: CmsModel,
        id: string,
        rawInput: UpdateCmsEntryInput<T>,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> => {
        // Delegate to new UpdateEntry use case
        const useCase = context.container.resolve(UpdateEntryUseCase);
        const result = await useCase.execute<T>(model, id, rawInput, metaInput, options);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not update existing entry.",
                error.code || "UPDATE_ERROR"
            );
        }

        return result.value;
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

    const moveEntry = async <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        folderId: string
    ) => {
        // Delegate to new MoveEntry use case
        const useCase = context.container.resolve(MoveEntryUseCase);
        const result = await useCase.execute<T>(model, id, folderId);

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

    const republishEntry = async <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => {
        // Delegate to new RepublishEntry use case
        const useCase = context.container.resolve(RepublishEntryUseCase);
        const result = await useCase.execute<T>(model, id);

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
        const result = await useCase.execute<T>(model, id);

        if (result.isFail()) {
            // Convert Result error to WebinyError for backward compatibility
            throw new WebinyError(
                result.error.message || "Could not publish entry.",
                result.error.code || "PUBLISH_ERROR",
                result.error.data
            );
        }

        return result.value;
    };
    const unpublishEntry = async <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => {
        // Delegate to new UnpublishEntry use case
        const useCase = context.container.resolve(UnpublishEntryUseCase);
        const result = await useCase.execute<T>(model, id);

        if (result.isFail()) {
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not unpublish entry.",
                error.code || "UNPUBLISH_ERROR",
                error.data
            );
        }

        return result.value;
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
        /**
         * Get entries by exact revision IDs from the database.
         */
        async getEntriesByIds<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            ids: string[]
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntriesByIds",
                async () => {
                    const useCase = context.container.resolve(GetEntriesByIdsUseCase);
                    const result = await useCase.execute<T>(model, ids);

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
        async getPublishedEntriesByIds<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            ids: string[]
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getPublishedEntriesByIds",
                async () => {
                    const useCase = context.container.resolve(GetPublishedEntriesByIdsUseCase);
                    const result = await useCase.execute<T>(model, ids);

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
        async getLatestEntriesByIds<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            ids: string[]
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getLatestEntriesByIds",
                async () => {
                    const useCase = context.container.resolve(GetLatestEntriesByIdsUseCase);
                    const result = await useCase.execute<T>(model, ids);

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
        async getEntryRevisions<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            entryId: string
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntryRevisions",
                async () => {
                    const useCase = context.container.resolve(GetRevisionsByEntryIdUseCase);
                    const result = await useCase.execute<T>(model, entryId);

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

            const { entries, meta } = result.value;

            return [entries, meta];
        },
        async listLatestEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
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

            const { entries, meta } = result.value;

            return [entries, meta];
        },
        async listDeletedEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
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

            const { entries, meta } = result.value;

            return [entries, meta];
        },
        async listPublishedEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
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

            const { entries, meta } = result.value;
            return [entries, meta];
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
        async createEntryRevisionFrom<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            sourceId: string,
            input: CreateFromCmsEntryInput<T>,
            options?: CreateRevisionCmsEntryOptionsInput
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.createEntryRevisionFrom",
                async () => {
                    return createEntryRevisionFrom<T>(model, sourceId, input, options);
                }
            );
        },
        async updateEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            id: string,
            input: UpdateCmsEntryInput<T>,
            meta?: GenericRecord,
            options?: UpdateCmsEntryOptionsInput
        ) {
            return context.benchmark.measure("headlessCms.crud.entries.updateEntry", async () => {
                return updateEntry<T>(model, id, input, meta, options);
            });
        },
        async validateEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            id?: string,
            input?: UpdateCmsEntryInput<T>
        ) {
            return context.benchmark.measure("headlessCms.crud.entries.validateEntry", async () => {
                return validateEntry(model, id, input);
            });
        },
        async moveEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            id: string,
            folderId: string
        ) {
            return context.benchmark.measure("headlessCms.crud.entries.moveEntry", async () => {
                return moveEntry<T>(model, id, folderId);
            });
        },
        /**
         * Method used internally. Not documented and should not be used in users systems.
         * @internal
         */
        async republishEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            id: string
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.republishEntry",
                async () => {
                    return republishEntry<T>(model, id);
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
        async restoreEntryFromBin<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            entryId: string
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.restoreEntryFromBin",
                async () => {
                    const useCase = context.container.resolve(RestoreEntryFromBinUseCase);
                    const result = await useCase.execute<T>(model, entryId);
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
        async publishEntry<T extends CmsEntryValues = CmsEntryValues>(model: CmsModel, id: string) {
            return context.benchmark.measure("headlessCms.crud.entries.publishEntry", async () => {
                return publishEntry<T>(model, id);
            });
        },
        async unpublishEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            id: string
        ) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.unpublishEntry",
                async () => {
                    return unpublishEntry<T>(model, id);
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
