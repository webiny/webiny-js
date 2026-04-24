import { Result } from "@webiny/feature/api";
import { UpdateModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { ModelsFetcher } from "~/features/contentModel/shared/abstractions.js";
import { ModelCannotUpdateCodeModelError } from "~/domain/contentModel/errors.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { ModelValidationError } from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { validateEndingAllowed } from "~/crud/contentModel/validate/endingAllowed.js";
import { validateSingularApiName } from "~/domain/contentModel/validation/singularApiName.js";
import { validatePluralApiName } from "~/domain/contentModel/validation/pluralApiName.js";
import { validateModelFields } from "~/domain/contentModel/validation/modelFields.js";
import type { CmsModel } from "~/types/index.js";

/**
 * UpdateModelRepository - Validates domain rules and persists model updates.
 *
 * Responsibilities:
 * - Validate API name endings
 * - Validate singularApiName uniqueness (excluding current model)
 * - Validate pluralApiName uniqueness (excluding current model)
 * - Validate model fields
 * - Persist to storage
 * - Clear ModelCache after successful update
 */
class UpdateModelRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private modelCache: ModelCache.Interface,
        private modelsFetcher: ModelsFetcher.Interface,
        private storageOperations: StorageOperations.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(
        model: CmsModel,
        original: CmsModel
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Validate API name endings
            try {
                validateEndingAllowed({ model });
            } catch (error) {
                return Result.fail(
                    new ModelValidationError({ message: error.message, data: error.data })
                );
            }

            // Get all models for validation (excluding the current model)
            const modelsResult = await this.cmsContext.security.withoutAuthorization(async () => {
                return await this.modelsFetcher.fetchAll();
            });

            if (modelsResult.isFail()) {
                return Result.fail(new ModelPersistenceError(modelsResult.error));
            }

            const allModels = modelsResult.value;
            const models = allModels.filter(m => m.modelId !== model.modelId);

            // Check if this is a plugin model
            const existingModelResult = await this.modelsFetcher.fetchById(model.modelId);
            if (existingModelResult.isFail()) {
                return Result.fail(new ModelPersistenceError(existingModelResult.error));
            }

            if (existingModelResult.value.isPlugin) {
                return Result.fail(new ModelCannotUpdateCodeModelError(model.modelId));
            }

            // Validate uniqueness
            try {
                for (const existingModel of models) {
                    validateSingularApiName({
                        existingModel,
                        model
                    });
                    validatePluralApiName({
                        existingModel,
                        model
                    });
                }

                // Validate model fields
                await validateModelFields({
                    models,
                    model,
                    original,
                    context: this.cmsContext
                });
            } catch (error) {
                return Result.fail(
                    new ModelValidationError({ message: error.message, data: error.data })
                );
            }

            // Persist to storage
            await this.storageOperations.models.update({ model });

            // Clear cache
            this.modelCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }
}

export const UpdateModelRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateModelRepositoryImpl,
    dependencies: [ModelCache, ModelsFetcher, StorageOperations, CmsContext]
});
