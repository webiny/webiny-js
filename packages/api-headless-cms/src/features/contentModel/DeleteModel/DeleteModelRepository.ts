import { Result } from "@webiny/feature/api";
import { DeleteModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";

/**
 * DeleteModelRepository - Deletes a model from storage.
 *
 * Responsibilities:
 * - Delete from storage
 * - Clear ModelCache after successful deletion
 *
 * Note: Validation (checking for entries, plugin models) should be done in event handlers
 */
class DeleteModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelCache: ModelCache.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
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
    dependencies: [ModelCache, StorageOperations]
});
