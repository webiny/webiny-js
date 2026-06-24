import { Result } from "@webiny/feature/api";
import { UpdateModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache, ModelsFetcher } from "~/features/contentModel/shared/abstractions.js";
import {
    ModelCannotUpdateCodeModelError,
    ModelPersistenceError,
    ModelValidationError
} from "~/domain/contentModel/errors.js";
import { CmsContext, StorageOperations } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { validateEndingAllowed } from "~/crud/contentModel/validate/endingAllowed.js";
import { validateSingularApiName } from "~/domain/contentModel/validation/singularApiName.js";
import { validatePluralApiName } from "~/domain/contentModel/validation/pluralApiName.js";
import { validateModelFields } from "~/domain/contentModel/validation/modelFields.js";
import type { CmsModel } from "~/types/index.js";
import { ModelFieldCompression } from "~/features/contentModel/ModelFieldCompression/index.js";

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
        private readonly modelCache: ModelCache.Interface,
        private readonly modelsFetcher: ModelsFetcher.Interface,
        private readonly storageOperations: StorageOperations.Interface,
        private readonly cmsContext: CmsContext.Interface,
        private readonly modelFieldCompression: ModelFieldCompression.Interface,
        private readonly identityContext: IdentityContext.Interface
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
            const modelsResult = await this.identityContext.withoutAuthorization(async () => {
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

            const fields = await this.modelFieldCompression.compress(model.fields);

            // Persist to storage
            await this.storageOperations.models.update({
                model: {
                    ...model,
                    fields
                }
            });

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
    dependencies: [
        ModelCache,
        ModelsFetcher,
        StorageOperations,
        CmsContext,
        ModelFieldCompression,
        IdentityContext
    ]
});
