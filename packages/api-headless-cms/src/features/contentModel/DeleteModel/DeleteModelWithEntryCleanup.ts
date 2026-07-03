import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase } from "./abstractions.js";
import { CmsContext, HeadlessCms } from "~/features/shared/abstractions.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";
import {
    ModelCannotDeleteHasEntriesError,
    ModelCannotDeleteHasEntriesInTrashError,
    ModelPersistenceError,
    ModelValidationError
} from "~/domain/contentModel/errors.js";
import { CmsModel } from "~/types/model.js";

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
        private cmsContext: CmsContext.Interface,
        private decoratee: DeleteModelUseCase.Interface
    ) {}

    private get cms(): HeadlessCms.Interface {
        return this.cmsContext.container.resolve(HeadlessCms);
    }

    async execute(modelId: string): Promise<Result<void, DeleteModelUseCase.Error>> {
        // First, get the model through the decorated use case's flow (up to before deletion)
        // We need to perform validation before the actual deletion happens

        // Get the model from context to check entries
        const model = await this.cms.getModel(modelId);

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

    private async deleteSingletonEntries(model: any): Promise<void> {
        // Delete all latest entries
        const [latestEntries] = await this.cms.listLatestEntries(model, {
            limit: 10000
        });

        for (const item of latestEntries) {
            await this.cms.deleteEntry(model, item.id, {
                permanently: true
            });
        }

        // Delete all deleted entries (trash)
        const [deletedEntries] = await this.cms.listDeletedEntries(model, {
            limit: 10000
        });

        for (const item of deletedEntries) {
            await this.cms.deleteEntry(model, item.id, {
                permanently: true
            });
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
        try {
            // Check for latest entries
            const [latestEntries] = await this.cms.listLatestEntries(model, {
                limit: 1
            });

            if (latestEntries.length > 0) {
                return Result.fail(new ModelCannotDeleteHasEntriesError(model.modelId));
            }

            // Check for deleted entries (trash)
            const [deletedEntries] = await this.cms.listDeletedEntries(model, {
                limit: 1
            });

            if (deletedEntries.length > 0) {
                return Result.fail(new ModelCannotDeleteHasEntriesInTrashError(model.modelId));
            }
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error));
        }

        return Result.ok(true);
    }
}

export const DeleteModelWithEntryCleanup = DeleteModelUseCase.createDecorator({
    decorator: DeleteModelWithEntryCleanupImpl,
    dependencies: [CmsContext]
});
