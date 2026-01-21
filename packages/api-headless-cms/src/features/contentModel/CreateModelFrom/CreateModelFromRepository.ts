import camelCase from "lodash/camelCase.js";
import { Result } from "@webiny/feature/api";
import { CreateModelFromRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { ModelsFetcher } from "~/features/contentModel/shared/abstractions.js";
import { ModelAlreadyExistsError } from "~/domain/contentModel/errors.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { ModelValidationError } from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { CmsContext } from "~/features/shared/abstractions.js";
import {
    validateExistingModelId,
    validateModelIdAllowed
} from "~/crud/contentModel/validate/modelId.js";
import { validateEndingAllowed } from "~/crud/contentModel/validate/endingAllowed.js";
import { validateSingularApiName } from "~/domain/contentModel/validation/singularApiName.js";
import { validatePluralApiName } from "~/domain/contentModel/validation/pluralApiName.js";
import { validateModelFields } from "~/domain/contentModel/validation/modelFields.js";
import type { CmsModel } from "~/types/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";

/**
 * Generate modelId from model following the exact logic from beforeCreate.ts
 */
const getModelId = (model: { modelId?: string; name?: string }): string => {
    const { modelId, name } = model;
    const value = modelId ? modelId.trim() : null;
    if (value) {
        const isModelIdValid = camelCase(value).toLowerCase() === value.toLowerCase();
        if (isModelIdValid) {
            return value;
        }
        return camelCase(value);
    } else if (name) {
        return camelCase(name.trim());
    }
    throw new ModelValidationError(
        `There is no "modelId" or "name" passed into the create model from method.`
    );
};

/**
 * CreateModelFromRepository - Validates domain rules and persists cloned model.
 *
 * Responsibilities:
 * - Generate modelId from input
 * - Validate modelId is allowed (not in disallowed list)
 * - Validate API name endings
 * - Validate modelId uniqueness (database + plugins)
 * - Validate API name uniqueness (database + plugins)
 * - Validate plugin conflicts
 * - Validate model fields
 * - Persist to storage
 * - Clear ModelCache after successful create
 */
class CreateModelFromRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private modelCache: ModelCache.Interface,
        private pluginModelsProvider: PluginModelsProvider.Interface,
        private modelsFetcher: ModelsFetcher.Interface,
        private storageOperations: StorageOperations.Interface,
        private tenantContext: TenantContext.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Generate modelId using the exact logic from beforeCreate.ts
            const modelId = getModelId(model);
            model.modelId = modelId;

            // Validate modelId is allowed (not in disallowed list)
            try {
                validateModelIdAllowed({ model });
            } catch (error) {
                return Result.fail(new ModelValidationError((error as Error).message));
            }

            // Validate API name endings
            try {
                validateEndingAllowed({ model });
            } catch (error) {
                return Result.fail(new ModelValidationError((error as Error).message));
            }

            // Validate modelId uniqueness (database)
            const modelsResult = await this.modelsFetcher.fetchAll();
            if (modelsResult.isFail()) {
                return Result.fail(new ModelPersistenceError(modelsResult.error));
            }

            const existingModel = modelsResult.value.find(m => m.modelId === modelId);
            if (existingModel) {
                return Result.fail(new ModelAlreadyExistsError({ modelId }));
            }

            // Check for plugin model conflicts
            const pluginModels = await this.pluginModelsProvider.list(tenant.id);
            const pluginModelConflict = pluginModels.find(pm => {
                return (
                    pm.modelId === model.modelId ||
                    pm.singularApiName === model.singularApiName ||
                    pm.pluralApiName === model.pluralApiName
                );
            });

            if (pluginModelConflict) {
                return Result.fail(
                    new ModelAlreadyExistsError({
                        modelId,
                        message: `Model "${modelId}" is already registered via a plugin.`
                    })
                );
            }

            const models = modelsResult.value;

            try {
                // Validate uniqueness
                for (const existingModel of models) {
                    validateExistingModelId({
                        existingModel,
                        model
                    });
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
                    context: this.cmsContext
                });
            } catch (error) {
                return Result.fail(new ModelValidationError((error as Error).message));
            }

            // Ensure type tags
            model.tags = ensureTypeTag(model);

            // Persist to storage
            await this.storageOperations.models.create({ model });

            // Clear cache
            this.modelCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }
}

export const CreateModelFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateModelFromRepositoryImpl,
    dependencies: [
        ModelCache,
        PluginModelsProvider,
        ModelsFetcher,
        StorageOperations,
        TenantContext,
        CmsContext
    ]
});
