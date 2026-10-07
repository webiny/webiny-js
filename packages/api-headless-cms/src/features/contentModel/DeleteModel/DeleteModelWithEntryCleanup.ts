import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase } from "./abstractions.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import {
    ListDeletedEntriesUseCase,
    ListLatestEntriesUseCase
} from "~/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";
import {
    ModelCannotDeleteHasEntriesError,
    ModelCannotDeleteHasEntriesInTrashError,
    ModelPersistenceError,
    ModelValidationError
} from "~/domain/contentModel/errors.js";
import type { CmsModel } from "~/types/model.js";
import type { CmsEntry } from "~/types/index.js";

/**
 * DeleteModelWithEntryCleanup - Decorator that handles entry cleanup/validation before deletion.
 *
 * Responsibilities:
 * 1. For singleton models: Delete all entries (latest + deleted)
 * 2. For regular models: Check if there are any entries - if yes, throw error
 * 3. Only proceed to the base use case if validations pass
 */
class DeleteModelWithEntryCleanupImpl implements DeleteModelUseCase.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private listDeletedEntries: ListDeletedEntriesUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
        private decoratee: DeleteModelUseCase.Interface
    ) {}

    async execute(modelId: string): Promise<Result<void, DeleteModelUseCase.Error>> {
        // First, get the model through the decorated use case's flow (up to before deletion)
        // We need to perform validation before the actual deletion happens

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            return Result.fail(modelResult.error);
        }
        const model = modelResult.value;

        const tags = Array.isArray(model.tags) ? model.tags : [];

        // Handle singleton models: delete all entries
        if (tags.includes(CMS_MODEL_SINGLETON_TAG)) {
            try {
                await this.deleteSingletonEntries(model);
            } catch (error) {
                return Result.fail(
                    new ModelValidationError(
                        `Failed to delete singleton entries: ${(error as Error).message}`
                    )
                );
            }

            // Proceed with the actual deletion
            return this.decoratee.execute(modelId);
        }

        // Regular models
        const canDelete = await this.canDelete(model);
        if (canDelete.isFail()) {
            return Result.fail(canDelete.error);
        }

        // Proceed with the actual deletion
        return this.decoratee.execute(modelId);
    }

    private async deleteSingletonEntries(model: CmsModel): Promise<void> {
        // Delete all latest entries
        const latestEntries = await this.listLatestEntries.execute(model, { limit: 10000 });
        if (latestEntries.isFail()) {
            throw latestEntries.error;
        }
        await this.deleteEntries(model, latestEntries.value.entries);

        // Delete all deleted entries (trash)
        const deletedEntries = await this.listDeletedEntries.execute(model, { limit: 10000 });
        if (deletedEntries.isFail()) {
            throw deletedEntries.error;
        }
        await this.deleteEntries(model, deletedEntries.value.entries);
    }

    private async deleteEntries(model: CmsModel, entries: CmsEntry[]): Promise<void> {
        for (const entry of entries) {
            const result = await this.deleteEntry.execute(model, entry.id, { permanently: true });
            if (result.isFail()) {
                throw result.error;
            }
        }
    }

    private async canDelete(
        model: CmsModel
    ): Promise<
        Result<
            boolean,
            | ModelCannotDeleteHasEntriesError
            | ModelCannotDeleteHasEntriesInTrashError
            | ModelPersistenceError
        >
    > {
        // The list use cases can also throw (a failed group lookup in access control does), so both
        // failure paths end up as a persistence error.
        try {
            // Check for latest entries
            const latestEntries = await this.listLatestEntries.execute(model, { limit: 1 });
            if (latestEntries.isFail()) {
                return Result.fail(new ModelPersistenceError(latestEntries.error));
            }
            if (latestEntries.value.entries.length > 0) {
                return Result.fail(new ModelCannotDeleteHasEntriesError(model.modelId));
            }

            // Check for deleted entries (trash)
            const deletedEntries = await this.listDeletedEntries.execute(model, { limit: 1 });
            if (deletedEntries.isFail()) {
                return Result.fail(new ModelPersistenceError(deletedEntries.error));
            }
            if (deletedEntries.value.entries.length > 0) {
                return Result.fail(new ModelCannotDeleteHasEntriesInTrashError(model.modelId));
            }

            return Result.ok(true);
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error));
        }
    }
}

export const DeleteModelWithEntryCleanup = DeleteModelUseCase.createDecorator({
    decorator: DeleteModelWithEntryCleanupImpl,
    dependencies: [
        GetModelUseCase,
        ListLatestEntriesUseCase,
        ListDeletedEntriesUseCase,
        DeleteEntryUseCase
    ]
});
