import { Result } from "@webiny/feature/api";
import { DeleteModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache, ModelsFetcher } from "~/features/contentModel/shared/abstractions.js";
import {
    ModelCannotDeleteCodeModelError,
    ModelPersistenceError
} from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
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
    public constructor(
        private modelCache: ModelCache.Interface,
        private modelsFetcher: ModelsFetcher.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Check if this is a plugin model
            const existingModelResult = await this.modelsFetcher.fetchById(model.modelId);
            if (existingModelResult.isFail()) {
                return Result.fail(new ModelPersistenceError(existingModelResult.error));
            }

            if (existingModelResult.value.isPlugin) {
                return Result.fail(new ModelCannotDeleteCodeModelError(model.modelId));
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
    dependencies: [ModelCache, ModelsFetcher, StorageOperations]
});
