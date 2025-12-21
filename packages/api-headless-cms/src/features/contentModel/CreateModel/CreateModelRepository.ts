import camelCase from "lodash/camelCase.js";
import { Result } from "@webiny/feature/api";
import { CreateModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
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
import type { CmsModel } from "~/types/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";
import { validateSingularApiName } from "~/domain/contentModel/validation/singularApiName.js";
import { validatePluralApiName } from "~/domain/contentModel/validation/pluralApiName.js";
import { validateModelFields } from "~/domain/contentModel/validation/modelFields.js";

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
        `There is no "modelId" or "name" passed into the create model method.`
    );
};

/**
 * CreateModelRepository - Validates domain rules and persists a new model.
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
class CreateModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelCache: ModelCache.Interface,
        private pluginModelsProvider: PluginModelsProvider.Interface,
        private listModelsUseCase: ListModelsUseCase.Interface,
        private storageOperations: StorageOperations.Interface,
        private tenantContext: TenantContext.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // TODO: this will eventually become part of the Model domain object.
            const modelId = getModelId(model);
            model.modelId = modelId;

            // Validate modelId is allowed (not in disallowed list)
            try {
                validateModelIdAllowed({ model });
            } catch (error) {
                return Result.fail(
                    new ModelValidationError({
                        message: error.message,
                        data: error.data
                    })
                );
            }

            // Validate API name endings
            try {
                validateEndingAllowed({ model });
            } catch (error) {
                return Result.fail(
                    new ModelValidationError({
                        message: error.message,
                        data: error.data
                    })
                );
            }

            // Check for plugin model conflicts
            const pluginModels = await this.pluginModelsProvider.list(tenant.id);
            const pluginModelConflict = pluginModels.find(pm => {
                return pm.modelId === model.modelId;
            });

            if (pluginModelConflict) {
                return Result.fail(
                    new ModelAlreadyExistsError({
                        modelId,
                        message: `Model "${modelId}" is already registered via a plugin.`
                    })
                );
            }

            // Get all models for further validation
            const modelsResult = await this.listModelsUseCase.execute();

            if (modelsResult.isFail()) {
                return Result.fail(new ModelPersistenceError(modelsResult.error));
            }

            const models = modelsResult.value;

            try {
                /**
                 * We need to check for the existence of:
                 * - modelId
                 * - singularApiName
                 * - pluralApiName
                 */
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

                await validateModelFields({
                    models,
                    model,
                    context: this.cmsContext
                });
            } catch (error) {
                return Result.fail(new ModelValidationError((error as Error).message));
            }

            // TODO: ideally, this will eventually be handled by the Model domain object
            model.tags = ensureTypeTag(model);

            // Persist to storage
            await this.storageOperations.models.create({ model });

            // Clear cache
            this.modelCache.clear();

            return Result.ok();
        } catch (error) {
            console.error(error, error.stack);
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }
}

export const CreateModelRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateModelRepositoryImpl,
    dependencies: [
        ModelCache,
        PluginModelsProvider,
        ListModelsUseCase,
        StorageOperations,
        TenantContext,
        CmsContext
    ]
});
