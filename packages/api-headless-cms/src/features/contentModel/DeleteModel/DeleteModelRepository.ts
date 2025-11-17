import { Result } from "@webiny/feature/api";
import { DeleteModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { ModelValidationError } from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin.js";
import type { CmsModel } from "~/types/index.js";

/**
 * DeleteModelRepository - Validates and deletes a model from storage.
 *
 * Responsibilities:
 * - Validate model is not defined via plugin (core domain rule)
 * - Delete from storage
 * - Clear ModelCache after successful deletion
 *
 * Note: Entry validation and cleanup is handled by decorator
 */
class DeleteModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelCache: ModelCache.Interface,
        private storageOperations: StorageOperations.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Check if model is defined via plugin (core domain rule)
            const modelPlugin = this.cmsContext.plugins
                .byType<CmsModelPlugin>(CmsModelPlugin.type)
                .find(item => item.contentModel.modelId === model.modelId);

            if (modelPlugin) {
                return Result.fail(
                    new ModelValidationError(
                        "Content models defined via plugins cannot be deleted."
                    )
                );
            }

            // Delete from storage
            await this.storageOperations.models.delete({ model });

            // Clear cache
            this.modelCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }
}

export const DeleteModelRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteModelRepositoryImpl,
    dependencies: [ModelCache, StorageOperations, CmsContext]
});
